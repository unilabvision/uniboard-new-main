import { NextResponse } from 'next/server';
import { siteApplicationsDb, eventApplicationOrFilter } from '@/app/lib/siteApplications/config';
import { requireSiteApplicationsModuleUser } from '@/app/api/site-applications/access/_helpers';
import { fetchActiveEvents } from '@/app/lib/siteApplications/events';
import { backfillPendingEventApplications } from '@/app/lib/siteApplications/eventAutoAccept';
import { syncCertificatePaymentsFromOrders } from '@/app/lib/siteApplications/syncPayments';

type SubmissionData = Record<string, unknown>;

export type EventApplicationStats = {
  event_id: string | null;
  event_key: string;
  event_name: string;
  event_slug: string | null;
  total: number;
  accepted: number;
  pending: number;
  rejected: number;
  free: number;
  certificate: number;
  certificate_paid: number;
  certificate_pending: number;
  certificate_revenue: number;
  currency: string;
};

function readSubmission(app: { submission_data?: unknown }): SubmissionData {
  if (app.submission_data && typeof app.submission_data === 'object') {
    return app.submission_data as SubmissionData;
  }
  return {};
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Etkinlik bazlı başvuru / sertifika özeti.
 * Kaynak: source=event_website veya event_id / event_name dolu kayıtlar.
 */
export async function GET() {
  const authResult = await requireSiteApplicationsModuleUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = authResult.supabase;

  await backfillPendingEventApplications(supabase);
  await syncCertificatePaymentsFromOrders(supabase);

  const [{ data: apps, error }, eventsResult] = await Promise.all([
    supabase
      .from(siteApplicationsDb.applications)
      .select(
        'id, event_id, event_name, status, source, submission_data, created_at'
      )
      .or(eventApplicationOrFilter)
      .order('created_at', { ascending: false }),
    fetchActiveEvents(supabase),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const eventsById = new Map(eventsResult.events.map((e) => [e.id, e]));
  const byKey = new Map<string, EventApplicationStats>();

  for (const app of apps || []) {
    const submission = readSubmission(app);
    const eventId = (app.event_id as string | null) || null;
    const linked = eventId ? eventsById.get(eventId) : undefined;
    const eventName =
      linked?.title ||
      (typeof app.event_name === 'string' && app.event_name.trim()
        ? app.event_name.trim()
        : null) ||
      (typeof submission.event_title === 'string' ? submission.event_title : null) ||
      'İsimsiz Etkinlik';

    const eventKey = eventId || `name:${eventName.toLocaleLowerCase('tr')}`;
    const tier = String(submission.registration_tier || 'free');
    const paymentStatus = String(submission.payment_status || 'none');
    const packagePrice = toNumber(submission.package_price);
    const currency =
      String(submission.package_currency || 'TRY').trim() || 'TRY';

    let row = byKey.get(eventKey);
    if (!row) {
      row = {
        event_id: eventId,
        event_key: eventKey,
        event_name: eventName,
        event_slug: linked?.slug || (typeof submission.event_slug === 'string' ? submission.event_slug : null),
        total: 0,
        accepted: 0,
        pending: 0,
        rejected: 0,
        free: 0,
        certificate: 0,
        certificate_paid: 0,
        certificate_pending: 0,
        certificate_revenue: 0,
        currency,
      };
      byKey.set(eventKey, row);
    }

    row.total += 1;
    if (app.status === 'accepted') row.accepted += 1;
    else if (app.status === 'pending') row.pending += 1;
    else if (app.status === 'rejected') row.rejected += 1;

    if (tier === 'certificate') {
      row.certificate += 1;
      if (paymentStatus === 'paid') {
        row.certificate_paid += 1;
        row.certificate_revenue += packagePrice;
      } else if (paymentStatus === 'pending') {
        row.certificate_pending += 1;
      }
    } else {
      row.free += 1;
    }
  }

  // Include active events with zero applications so the board is complete
  for (const event of eventsResult.events) {
    if (!byKey.has(event.id)) {
      byKey.set(event.id, {
        event_id: event.id,
        event_key: event.id,
        event_name: event.title,
        event_slug: event.slug,
        total: 0,
        accepted: 0,
        pending: 0,
        rejected: 0,
        free: 0,
        certificate: 0,
        certificate_paid: 0,
        certificate_pending: 0,
        certificate_revenue: 0,
        currency: 'TRY',
      });
    }
  }

  const events = [...byKey.values()].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.event_name.localeCompare(b.event_name, 'tr');
  });

  const totals = events.reduce(
    (acc, e) => {
      acc.events += 1;
      acc.applications += e.total;
      acc.certificate += e.certificate;
      acc.certificate_paid += e.certificate_paid;
      acc.certificate_pending += e.certificate_pending;
      acc.certificate_revenue += e.certificate_revenue;
      acc.free += e.free;
      return acc;
    },
    {
      events: 0,
      applications: 0,
      free: 0,
      certificate: 0,
      certificate_paid: 0,
      certificate_pending: 0,
      certificate_revenue: 0,
    }
  );

  return NextResponse.json({ events, totals });
}
