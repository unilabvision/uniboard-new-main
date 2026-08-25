import { NextRequest, NextResponse } from 'next/server';
import {
  siteApplicationsDb,
  applyTeamApplicationsFilter,
  applyEventApplicationsFilter,
} from '@/app/lib/siteApplications/config';
import {
  requireSiteApplicationsOrEventsUser,
  resolveSiteApplicationsTenantScope,
} from '@/app/api/site-applications/access/_helpers';
import { backfillPendingEventApplications } from '@/app/lib/siteApplications/eventAutoAccept';
import { syncCertificatePaymentsFromOrders } from '@/app/lib/siteApplications/syncPayments';
import {
  deleteSiteApplicationsBulk,
  getMaxBulkDelete,
} from '@/app/lib/siteApplications/deleteApplication';

export async function GET(request: NextRequest) {
  const authResult = await requireSiteApplicationsOrEventsUser('registrations');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const tenantScope = await resolveSiteApplicationsTenantScope(
    authResult.supabase,
    authResult.userId || ''
  );

  // Eski pending etkinlik kayıtlarını accepted yap + source düzelt + ödeme senkron
  await backfillPendingEventApplications(authResult.supabase);
  await syncCertificatePaymentsFromOrders(authResult.supabase);

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const perPage = Math.min(50, Math.max(1, Number(searchParams.get('perPage') || '20')));
  const search = searchParams.get('search')?.trim() || '';
  const formFilter = searchParams.get('form') || 'all';
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const eventId = searchParams.get('eventId')?.trim() || '';
  const eventName = searchParams.get('eventName')?.trim() || '';
  const registrationTier = searchParams.get('registrationTier')?.trim() || '';
  const paymentStatus = searchParams.get('paymentStatus')?.trim() || '';

  let query = authResult.supabase
    .from(siteApplicationsDb.applications)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (category === 'event') {
    query = applyEventApplicationsFilter(query);
  } else if (category === 'team') {
    query = applyTeamApplicationsFilter(query);
  }

  // Tenant scoping: external kurum/kişinin sadece kendi başvurularını görmesi
  if (tenantScope.mode === 'none') {
    query = query.eq('id', '__no_access__');
  } else if (tenantScope.mode === 'scoped') {
    query = query.in('organization', tenantScope.allowedValues);
  }

  if (eventId) {
    query = query.eq('event_id', eventId);
  } else if (eventName) {
    query = query.ilike('event_name', eventName);
  }

  if (formFilter !== 'all') {
    query = query.eq('application_type', formFilter);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    const q = `%${search}%`;
    query = query.or(`first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`);
  }

  if (registrationTier === 'free' || registrationTier === 'certificate') {
    query = query.eq('submission_data->>registration_tier', registrationTier);
  }
  if (
    paymentStatus === 'paid' ||
    paymentStatus === 'pending' ||
    paymentStatus === 'failed' ||
    paymentStatus === 'none' ||
    paymentStatus === 'superseded'
  ) {
    query = query.eq('submission_data->>payment_status', paymentStatus);
  }

  const from = (page - 1) * perPage;
  const { data, error, count } = await query.range(from, from + perPage - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    applications: data ?? [],
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

  // Tenant scoping check: sadece izinli organization'a ait olanları sil.
  let deletableIds = ids;
  const forbidden: Array<{ id: string; error: string }> = [];

  if (tenantScope.mode === 'none') {
    deletableIds = [];
    for (const id of ids) forbidden.push({ id, error: 'Forbidden by tenant scope' });
  } else if (tenantScope.mode === 'scoped') {
    const { data: existingRows } = await authResult.supabase
      .from(siteApplicationsDb.applications)
      .select('id, organization')
      .in('id', ids);

    const byId = new Map<string, string | null>(
      (existingRows ?? []).map((r) => [String(r.id), (r.organization as string | null) ?? null])
    );

    const allowedSet = new Set(tenantScope.allowedValues);
    deletableIds = ids.filter((id) => {
      const org = byId.get(id) ?? null;
      return org != null && allowedSet.has(org);
    });

    for (const id of ids) {
      const org = byId.get(id) ?? null;
      if (org == null) continue; // not found => bulk delete will handle as failed
      if (!allowedSet.has(org)) {
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
