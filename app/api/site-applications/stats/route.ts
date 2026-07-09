import { NextResponse } from 'next/server';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { requireSiteApplicationsModuleUser } from '@/app/api/site-applications/access/_helpers';

export async function GET() {
  const authResult = await requireSiteApplicationsModuleUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = authResult.supabase;
  const [
    { count: total },
    { count: pending },
    { count: accepted },
    { count: forms },
    { data: recent },
  ] = await Promise.all([
    supabase.from(siteApplicationsDb.applications).select('*', { count: 'exact', head: true }),
    supabase
      .from(siteApplicationsDb.applications)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from(siteApplicationsDb.applications)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted'),
    supabase
      .from(siteApplicationsDb.forms)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase
      .from(siteApplicationsDb.applications)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
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
