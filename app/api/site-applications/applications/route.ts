import { NextRequest, NextResponse } from 'next/server';
import {
  siteApplicationsDb,
  applyTeamApplicationsFilter,
  applyEventApplicationsFilter,
} from '@/app/lib/siteApplications/config';
import { requireSiteApplicationsOrEventsUser } from '@/app/api/site-applications/access/_helpers';
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

  const { deleted, failed } = await deleteSiteApplicationsBulk(authResult.supabase, ids);

  return NextResponse.json({
    success: failed.length === 0,
    deleted,
    failed,
    deletedCount: deleted.length,
  });
}
