import { NextRequest, NextResponse } from 'next/server';
import { requireSiteApplicationsOrEventsUser } from '@/app/api/site-applications/access/_helpers';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { syncCertificatePaymentsFromOrders } from '@/app/lib/siteApplications/syncPayments';
import { sendCertificatePaymentReminderEmail } from '@/app/_services/certificatePaymentReminderEmail';
import { buildEventCertificateCheckoutUrl } from '@/app/lib/siteApplications/publicUrls';

function readSubmission(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

type RemindTarget = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  locale: string | null;
  event_name: string | null;
  event_id: string | null;
  submission_data: unknown;
};

/**
 * POST /api/site-applications/payments/remind
 * body:
 *  - applicationId?: string  → tek kayıt
 *  - eventId?: string        → etkinlikteki pending (+ isteğe bağlı superseded)
 *  - includeSuperseded?: boolean (default false)
 *  - locale?: 'tr' | 'en'
 *
 * Göndermeden önce orders sync çalışır; ödeme alınmışsa mail gitmez.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireSiteApplicationsOrEventsUser('ops');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const supabase = authResult.supabase;
  const body = await request.json().catch(() => ({}));
  const applicationId =
    typeof body.applicationId === 'string' ? body.applicationId.trim() : '';
  const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : '';
  const includeSuperseded = Boolean(body.includeSuperseded);
  const forceLocale = body.locale === 'en' ? 'en' : body.locale === 'tr' ? 'tr' : null;

  if (!applicationId && !eventId) {
    return NextResponse.json(
      { error: 'applicationId or eventId required' },
      { status: 400 }
    );
  }

  await syncCertificatePaymentsFromOrders(supabase, {
    eventId: eventId || null,
  });

  let targets: RemindTarget[] = [];

  if (applicationId) {
    const { data, error } = await supabase
      .from(siteApplicationsDb.applications)
      .select(
        'id, email, first_name, last_name, locale, event_name, event_id, submission_data'
      )
      .eq('id', applicationId)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    targets = [data as RemindTarget];
  } else {
    const { data, error } = await supabase
      .from(siteApplicationsDb.applications)
      .select(
        'id, email, first_name, last_name, locale, event_name, event_id, submission_data'
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    targets = ((data || []) as RemindTarget[]).filter((row) => {
      const s = readSubmission(row.submission_data);
      if (s.registration_tier !== 'certificate') return false;
      if (s.payment_status === 'pending') return true;
      if (includeSuperseded && s.payment_status === 'superseded') return true;
      return false;
    });
  }

  const results: Array<{
    applicationId: string;
    email: string | null;
    status: 'sent' | 'skipped' | 'failed';
    reason?: string;
  }> = [];

  for (const app of targets) {
    const submission = readSubmission(app.submission_data);
    const paymentStatus = String(submission.payment_status || 'none');
    const email = app.email;

    if (paymentStatus === 'paid') {
      results.push({
        applicationId: app.id,
        email,
        status: 'skipped',
        reason: 'already_paid',
      });
      continue;
    }

    if (paymentStatus !== 'pending' && paymentStatus !== 'superseded') {
      results.push({
        applicationId: app.id,
        email,
        status: 'skipped',
        reason: `status_${paymentStatus}`,
      });
      continue;
    }

    if (!email?.trim()) {
      results.push({
        applicationId: app.id,
        email,
        status: 'failed',
        reason: 'missing_email',
      });
      continue;
    }

    const locale =
      forceLocale || (app.locale === 'en' ? 'en' : 'tr');
    const eventSlug =
      typeof submission.event_slug === 'string' ? submission.event_slug : null;

    // event slug yoksa events tablosundan çek
    let slug = eventSlug;
    if (!slug && app.event_id) {
      const { data: ev } = await supabase
        .from('myuni_events')
        .select('slug')
        .eq('id', app.event_id)
        .maybeSingle();
      slug = ev?.slug || null;
    }

    const kind = paymentStatus === 'superseded' ? 'superseded' : 'pending';
    const checkoutUrl =
      kind === 'pending'
        ? buildEventCertificateCheckoutUrl(locale, app.id, slug)
        : null;

    const mail = await sendCertificatePaymentReminderEmail({
      to: email,
      firstName: app.first_name || undefined,
      lastName: app.last_name || undefined,
      locale,
      eventName: app.event_name || undefined,
      checkoutUrl: checkoutUrl || undefined,
      kind,
    });

    if (!mail.success) {
      results.push({
        applicationId: app.id,
        email,
        status: 'failed',
        reason: mail.error || 'email_failed',
      });
      continue;
    }

    const prevCount = Number(submission.payment_reminder_count) || 0;
    const nextSubmission = {
      ...submission,
      payment_reminder_sent_at: new Date().toISOString(),
      payment_reminder_count: prevCount + 1,
      payment_reminder_kind: kind,
    };

    await supabase
      .from(siteApplicationsDb.applications)
      .update({
        submission_data: nextSubmission,
        updated_at: new Date().toISOString(),
      })
      .eq('id', app.id);

    results.push({
      applicationId: app.id,
      email,
      status: 'sent',
      reason: kind,
    });
  }

  return NextResponse.json({
    success: true,
    sent: results.filter((r) => r.status === 'sent').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  });
}
