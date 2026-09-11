import { NextRequest, NextResponse } from 'next/server';
import {
  siteApplicationsDb,
  applyTeamApplicationsFilter,
  applyEventApplicationsFilter,
} from '@/app/lib/siteApplications/config';
import {
  requireSiteApplicationsOrEventsUser,
  resolveSiteApplicationsTenantScope,
  applySiteApplicationsTenantScope,
  isApplicationInTenantScope,
} from '@/app/api/site-applications/access/_helpers';
import {
  deleteSiteApplicationsBulk,
  getMaxBulkDelete,
} from '@/app/lib/siteApplications/deleteApplication';
import {
  APPLICATION_LIST_COLUMNS,
  applyApplicationListFilters,
  parseApplicationListFilters,
  submissionFromProjectedListRow,
  LIST_SUBMISSION_KEYS,
} from '@/app/lib/siteApplications/listQuery';
import { syncPaymentsForVisibleApplications } from '@/app/lib/siteApplications/paymentSyncThrottle';

export async function GET(request: NextRequest) {
  const authResult = await requireSiteApplicationsOrEventsUser('registrations');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const tenantScope = await resolveSiteApplicationsTenantScope(
    authResult.supabase,
    authResult.userId || ''
  );

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get('perPage') || '20')));
  const filters = parseApplicationListFilters(searchParams);

  if (tenantScope.mode === 'none') {
    return NextResponse.json({
      applications: [],
      total: 0,
      page,
      perPage,
    });
  }

  const buildQuery = () => {
    let query = authResult.supabase!
      .from(siteApplicationsDb.applications)
      .select(APPLICATION_LIST_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.category === 'event') {
      query = applyEventApplicationsFilter(query);
    } else if (filters.category === 'team') {
      query = applyTeamApplicationsFilter(query);
    }

    query = applySiteApplicationsTenantScope(query, tenantScope);
    query = applyApplicationListFilters(query, filters);
    return query;
  };

  const from = (page - 1) * perPage;
  const firstPage = await buildQuery().range(from, from + perPage - 1);

  if (firstPage.error) {
    return NextResponse.json({ error: firstPage.error.message }, { status: 500 });
  }

  let data = firstPage.data;
  let count = firstPage.count;
  let rows = (data ?? []) as unknown as Array<Record<string, unknown>>;

  const paymentFilterActive = Boolean(
    filters.paymentStatus || filters.registrationTier === 'certificate'
  );
  const shouldRefreshPayments =
    filters.category === 'event' || paymentFilterActive || Boolean(filters.eventId);

  if (shouldRefreshPayments && rows.length > 0) {
    const { syncedEventIds } = await syncPaymentsForVisibleApplications(
      authResult.supabase,
      rows.map((r) => ({
        id: typeof r.id === 'string' ? r.id : undefined,
        event_id: (r.event_id as string | null) ?? null,
        submission_data:
          r.submission_data && typeof r.submission_data === 'object'
            ? r.submission_data
            : {
                registration_tier: r.registration_tier,
                payment_status: r.payment_status,
              },
      })),
      {
        eventId: filters.eventId || null,
        paymentFilterActive,
      }
    );

    if (syncedEventIds.length > 0) {
      const refreshed = await buildQuery().range(from, from + perPage - 1);
      if (!refreshed.error) {
        data = refreshed.data;
        count = refreshed.count;
        rows = (refreshed.data ?? []) as unknown as Array<Record<string, unknown>>;
      }
    }
  }

  const applications = rows.map((row) => {
    const submission_data = submissionFromProjectedListRow(row);
    const cleaned: Record<string, unknown> = { ...row, submission_data };
    for (const key of LIST_SUBMISSION_KEYS) {
      delete cleaned[key];
    }
    return cleaned;
  });

  return NextResponse.json({
    applications,
    total: count ?? 0,
    page,
    perPage,
  });
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireSiteApplicationsOrEventsUser('registrations');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const tenantScope = await resolveSiteApplicationsTenantScope(
    authResult.supabase,
    authResult.userId || ''
  );

  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawIds = Array.isArray(body.ids) ? body.ids : [];
  const ids = rawIds.map((id) => String(id).trim()).filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ error: 'No application ids provided' }, { status: 400 });
  }

  if (ids.length > getMaxBulkDelete()) {
    return NextResponse.json(
      { error: `At most ${getMaxBulkDelete()} applications can be deleted at once` },
      { status: 400 }
    );
  }

  let deletableIds = ids;
  const forbidden: Array<{ id: string; error: string }> = [];

  if (tenantScope.mode === 'none') {
    deletableIds = [];
    for (const id of ids) forbidden.push({ id, error: 'Forbidden by tenant scope' });
  } else if (tenantScope.mode === 'scoped') {
    const { data: existingRows } = await authResult.supabase
      .from(siteApplicationsDb.applications)
      .select('id, form_id')
      .in('id', ids);

    const byId = new Map<string, string | null>(
      (existingRows ?? []).map((r) => [
        String(r.id),
        (r.form_id as string | null) ?? null,
      ])
    );

    deletableIds = ids.filter((id) =>
      isApplicationInTenantScope(byId.get(id) ?? null, tenantScope)
    );

    for (const id of ids) {
      const formId = byId.get(id) ?? null;
      if (formId == null && !byId.has(id)) continue;
      if (!isApplicationInTenantScope(formId, tenantScope)) {
        forbidden.push({ id, error: 'Forbidden by tenant scope' });
      }
    }
  }

  const { deleted, failed } = await deleteSiteApplicationsBulk(authResult.supabase, deletableIds);
  const failedCombined = [...forbidden, ...failed];

  return NextResponse.json({
    success: failedCombined.length === 0,
    deleted,
    failed: failedCombined,
    deletedCount: deleted.length,
  });
}
