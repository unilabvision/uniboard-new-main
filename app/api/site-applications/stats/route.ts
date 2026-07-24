import { NextResponse } from 'next/server';
import {
  siteApplicationsDb,
  applyTeamApplicationsFilter,
} from '@/app/lib/siteApplications/config';
import { requireSiteApplicationsModuleUser } from '@/app/api/site-applications/access/_helpers';

/** Site Başvuruları dashboard — yalnızca ekip başvuruları */
export async function GET() {
  const authResult = await requireSiteApplicationsModuleUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = authResult.supabase;

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

  const [
    { count: total },
    { count: pending },
    { count: accepted },
    { count: forms },
    { data: recent },
  ] = await Promise.all([
    totalQ,
    pendingQ,
    acceptedQ,
    supabase
      .from(siteApplicationsDb.forms)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('event_id', null),
    recentQ,
  ]);

  return NextResponse.json({
    stats: {
      total: total || 0,
      pending: pending || 0,
      accepted: accepted || 0,
      forms: forms || 0,
    },
    recent: recent ?? [],
  });
}
