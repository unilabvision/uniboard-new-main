import { NextResponse } from 'next/server';
import {
  siteApplicationsDb,
  applyTeamApplicationsFilter,
} from '@/app/lib/siteApplications/config';
import {
  requireSiteApplicationsModuleUser,
  resolveSiteApplicationsTenantScope,
  resolveSiteApplicationsPanelOrganizationScope,
} from '@/app/api/site-applications/access/_helpers';

/** Site Başvuruları dashboard — yalnızca ekip başvuruları */
export async function GET() {
  const authResult = await requireSiteApplicationsModuleUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = authResult.supabase;

  const tenantScope = await resolveSiteApplicationsTenantScope(
    supabase,
    authResult.userId || ''
  );

  let totalQ = supabase
    .from(siteApplicationsDb.applications)
    .select('*', { count: 'exact', head: true });
  totalQ = applyTeamApplicationsFilter(totalQ);

  let pendingQ = supabase
    .from(siteApplicationsDb.applications)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  pendingQ = applyTeamApplicationsFilter(pendingQ);

  let acceptedQ = supabase
    .from(siteApplicationsDb.applications)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted');
  acceptedQ = applyTeamApplicationsFilter(acceptedQ);

  let recentQ = supabase
    .from(siteApplicationsDb.applications)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  recentQ = applyTeamApplicationsFilter(recentQ);

  if (tenantScope.mode === 'none') {
    totalQ = totalQ.eq('id', '__no_access__');
    pendingQ = pendingQ.eq('id', '__no_access__');
    acceptedQ = acceptedQ.eq('id', '__no_access__');
    recentQ = recentQ.eq('id', '__no_access__');
  } else if (tenantScope.mode === 'scoped') {
    totalQ = totalQ.in('organization', tenantScope.allowedValues);
    pendingQ = pendingQ.in('organization', tenantScope.allowedValues);
    acceptedQ = acceptedQ.in('organization', tenantScope.allowedValues);
    recentQ = recentQ.in('organization', tenantScope.allowedValues);
  }

  const [
    { count: total },
    { count: pending },
    { count: accepted },
    formsRes,
    { data: recent },
  ] = await Promise.all([
    totalQ,
    pendingQ,
    acceptedQ,
    supabase
      .from(siteApplicationsDb.forms)
      .select('id, event_id, form_type, slug_tr, slug_en, title_tr, title_en, created_by')
      .eq('is_active', true)
      .is('event_id', null),
    recentQ,
  ]);

  const { inferFormType } = await import('@/app/lib/siteApplications/formTypes');
  let teamForms = (formsRes.data ?? []).filter(
    (form) => inferFormType(form) === 'team'
  );

  const panelScope = await resolveSiteApplicationsPanelOrganizationScope(
    supabase,
    authResult.userId || ''
  );

  if (panelScope.mode === 'none') {
    teamForms = [];
  } else if (panelScope.mode === 'scoped') {
    const creatorIds = [
      ...new Set(
        teamForms
          .map((f) => f.created_by)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      ),
    ];
    if (creatorIds.length > 0) {
      const { data: accessRows } = await supabase
        .from('user_module_access')
        .select('clerk_user_id')
        .eq('is_enabled', true)
        .in('module_key', [
          'site-applications',
          'site_basvurular',
          'site-basvurular',
          'basvurular',
          'events',
          'event',
          'etkinlik',
          'etkinlikler',
        ])
        .in('clerk_user_id', creatorIds)
        .in('panel_organization_id', panelScope.panelOrganizationIds);

      const allowedCreators = new Set(
        (accessRows ?? []).map((r: { clerk_user_id: string }) => r.clerk_user_id)
      );
      teamForms = teamForms.filter(
        (f) => typeof f.created_by === 'string' && allowedCreators.has(f.created_by)
      );
    } else {
      teamForms = [];
    }
  }

  const teamFormsCount = teamForms.length;

  return NextResponse.json({
    stats: {
      total: total || 0,
      pending: pending || 0,
      accepted: accepted || 0,
      forms: teamFormsCount,
    },
    recent: recent ?? [],
  });
}
