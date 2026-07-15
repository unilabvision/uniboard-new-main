import { NextRequest, NextResponse } from 'next/server';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { requireSiteApplicationsModuleUser } from '@/app/api/site-applications/access/_helpers';

export async function GET(request: NextRequest) {
  const authResult = await requireSiteApplicationsModuleUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

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
    query = query.or('source.eq.event_website,event_id.not.is.null');
  } else if (category === 'team') {
    query = query.eq('source', 'website');
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

  // JSON filters for package/payment (PostgREST)
  if (registrationTier === 'free' || registrationTier === 'certificate') {
    query = query.eq('submission_data->>registration_tier', registrationTier);
  }
  if (paymentStatus === 'paid' || paymentStatus === 'pending' || paymentStatus === 'none') {
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
