import { NextRequest, NextResponse } from 'next/server';
import { requireEventsRegistrantToolsUser } from '@/app/api/events/_helpers';
import { eventsDb, getPublicEventUrl } from '@/app/lib/events/config';
import {
  dedupeRegistrantsForReminder,
  fetchEventRegistrants,
} from '@/app/lib/events/registrants';
import { sendEventReminderEmail } from '@/app/_services/eventReminderEmail';

type RouteContext = { params: Promise<{ id: string }> };

function formatEventDate(iso: string | null | undefined, locale: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(locale === 'en' ? 'en-GB' : 'tr-TR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Istanbul',
  });
}

/**
 * POST /api/events/[id]/remind
 * Etkinliğe kayıtlı katılımcılara hatırlatma maili (e-posta başına 1).
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await requireEventsRegistrantToolsUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;
  const supabase = authResult.supabase;

  let forceLocale: 'tr' | 'en' | null = null;
  try {
    const body = await request.json();
    if (body?.locale === 'en' || body?.locale === 'tr') forceLocale = body.locale;
  } catch {
    /* empty ok */
  }

  const { data: event, error: eventError } = await supabase
    .from(eventsDb.events)
    .select(
      'id, slug, title, start_date, is_online, location_name, location_address, meeting_url'
    )
    .eq('id', id)
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const registrants = await fetchEventRegistrants(supabase, id);
  const targets = dedupeRegistrantsForReminder(registrants);

  const results: Array<{
    email: string;
    applicationId: string;
    status: 'sent' | 'failed' | 'skipped';
    reason?: string;
  }> = [];

  for (const row of targets) {
    if (!row.email) {
      results.push({
        email: '',
        applicationId: row.id,
        status: 'skipped',
        reason: 'missing_email',
      });
      continue;
    }

    const locale = forceLocale || (row.locale === 'en' ? 'en' : 'tr');
    const eventUrl = getPublicEventUrl(locale, event.slug);
    const eventDateLabel = formatEventDate(event.start_date, locale);
    const locationLabel =
      [event.location_name, event.location_address].filter(Boolean).join(' — ') ||
      (event.is_online ? null : null);

    const mail = await sendEventReminderEmail({
      to: row.email,
      firstName: row.first_name || undefined,
      lastName: row.last_name || undefined,
      locale,
      eventName: event.title,
      eventDateLabel: eventDateLabel || undefined,
      eventUrl,
      isOnline: event.is_online,
      locationLabel: locationLabel || undefined,
    });

    if (!mail.success) {
      results.push({
        email: row.email,
        applicationId: row.id,
        status: 'failed',
        reason: mail.error || 'email_failed',
      });
      continue;
    }

    results.push({
      email: row.email,
      applicationId: row.id,
      status: 'sent',
    });
  }

  return NextResponse.json({
    success: true,
    eventId: id,
    eventTitle: event.title,
    totalRegistrants: registrants.length,
    uniqueEmails: targets.length,
    sent: results.filter((r) => r.status === 'sent').length,
    failed: results.filter((r) => r.status === 'failed').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    results,
  });
}
