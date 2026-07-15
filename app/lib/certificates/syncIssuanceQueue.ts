import { clerkClient } from '@clerk/nextjs/server';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { syncCertificatePaymentsFromOrders } from '@/app/lib/siteApplications/syncPayments';
import {
  CERTIFICATE_ISSUANCE_TABLE,
  addDaysIso,
  getCertificatesServiceSupabase,
  type CertificateIssuanceKind,
} from '@/app/lib/certificates/issuance';

type UpsertRow = {
  kind: CertificateIssuanceKind;
  status: 'ready';
  eligible_at: string;
  recipient_name: string;
  recipient_email: string;
  source_type: 'site_application' | 'enrollment';
  source_id: string;
  event_id: string | null;
  event_name: string | null;
  course_id: string | null;
  course_name: string | null;
  order_id: string | null;
  certificate_title: string;
  locale: string;
  updated_at: string;
};

const EVENT_DELAY_DAYS = 2;

function readSubmission(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

async function fetchClerkEmails(
  userIds: string[]
): Promise<Map<string, { email: string; name: string }>> {
  const map = new Map<string, { email: string; name: string }>();
  if (userIds.length === 0) return map;

  const clerk = await clerkClient();
  for (let i = 0; i < userIds.length; i += 100) {
    const chunk = userIds.slice(i, i + 100);
    try {
      const { data } = await clerk.users.getUserList({ userId: chunk, limit: 100 });
      for (const user of data) {
        const email =
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
            ?.emailAddress ||
          user.emailAddresses[0]?.emailAddress ||
          '';
        if (!email) continue;
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
          user.username ||
          email;
        map.set(user.id, { email, name });
      }
    } catch (err) {
      console.error('Certificate issuance sync: Clerk batch failed', err);
    }
  }
  return map;
}

async function syncEventParticipationCandidates(): Promise<{ scanned: number; upserted: number }> {
  const supabase = getCertificatesServiceSupabase();
  await syncCertificatePaymentsFromOrders(supabase);

  const now = Date.now();

  const { data: apps, error } = await supabase
    .from(siteApplicationsDb.applications)
    .select(
      'id, first_name, last_name, email, event_id, event_name, locale, submission_data, source'
    )
    .or('source.eq.event_website,event_id.not.is.null,event_name.not.is.null')
    .limit(2000);

  if (error) {
    console.error('Event issuance sync apps error:', error.message);
    return { scanned: 0, upserted: 0 };
  }

  const paidCertApps = (apps || []).filter((app) => {
    const sub = readSubmission(app.submission_data);
    return (
      sub.registration_tier === 'certificate' &&
      sub.payment_status === 'paid' &&
      typeof app.email === 'string' &&
      app.email.trim().length > 0
    );
  });

  const eventIds = [
    ...new Set(
      paidCertApps
        .map((a) => a.event_id as string | null)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const eventsById = new Map<
    string,
    { id: string; title: string; start_date: string; end_date: string | null }
  >();

  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from('myuni_events')
      .select('id, title, start_date, end_date')
      .in('id', eventIds);
    for (const ev of events || []) {
      eventsById.set(ev.id, ev);
    }
  }

  const rows: UpsertRow[] = [];
  const nowIso = new Date().toISOString();

  for (const app of paidCertApps) {
    const event = app.event_id ? eventsById.get(app.event_id) : undefined;
    const endOrStart =
      event?.end_date ||
      event?.start_date ||
      null;

    // Etkinlik tarihi yoksa şimdilik kuyruğa alma (manuel değil, cron kuralı end+2)
    if (!endOrStart) continue;

    const eligibleAt = addDaysIso(endOrStart, EVENT_DELAY_DAYS);
    if (new Date(eligibleAt).getTime() > now) continue;

    const sub = readSubmission(app.submission_data);
    const eventName =
      event?.title ||
      app.event_name ||
      (typeof sub.event_title === 'string' ? sub.event_title : null) ||
      'Etkinlik';
    const recipientName =
      [app.first_name, app.last_name].filter(Boolean).join(' ').trim() || app.email;

    rows.push({
      kind: 'event_participation',
      status: 'ready',
      eligible_at: eligibleAt,
      recipient_name: recipientName,
      recipient_email: String(app.email).trim().toLowerCase(),
      source_type: 'site_application',
      source_id: app.id,
      event_id: app.event_id || event?.id || null,
      event_name: eventName,
      course_id: null,
      course_name: null,
      order_id: typeof sub.order_id === 'string' ? sub.order_id : null,
      certificate_title: 'Katılım Sertifikası',
      locale: app.locale === 'en' ? 'en' : 'tr',
      updated_at: nowIso,
    });
  }

  if (rows.length === 0) {
    return { scanned: paidCertApps.length, upserted: 0 };
  }

  // Sadece henüz issued olmayanları güncelle (ignoreDuplicates değil — onConflict update ama status issued koru)
  const { data: existing } = await supabase
    .from(CERTIFICATE_ISSUANCE_TABLE)
    .select('source_id, status')
    .eq('kind', 'event_participation')
    .in(
      'source_id',
      rows.map((r) => r.source_id)
    );

  const issuedIds = new Set(
    (existing || []).filter((e) => e.status === 'issued').map((e) => e.source_id)
  );
  const toUpsert = rows.filter((r) => !issuedIds.has(r.source_id));

  if (toUpsert.length === 0) {
    return { scanned: paidCertApps.length, upserted: 0 };
  }

  const { error: upsertError } = await supabase.from(CERTIFICATE_ISSUANCE_TABLE).upsert(toUpsert, {
    onConflict: 'source_type,source_id,kind',
    ignoreDuplicates: false,
  });

  if (upsertError) {
    console.error('Event issuance upsert error:', upsertError.message);
    return { scanned: paidCertApps.length, upserted: 0 };
  }

  return { scanned: paidCertApps.length, upserted: toUpsert.length };
}

async function syncCourseAchievementCandidates(): Promise<{ scanned: number; upserted: number }> {
  const supabase = getCertificatesServiceSupabase();
  const nowIso = new Date().toISOString();

  const { data: enrollments, error } = await supabase
    .from('myuni_enrollments')
    .select('id, user_id, course_id, progress_percentage, enrolled_at, updated_at, is_active')
    .eq('is_active', true)
    .gte('progress_percentage', 100)
    .limit(2000);

  if (error) {
    console.error('LMS issuance sync enrollments error:', error.message);
    return { scanned: 0, upserted: 0 };
  }

  const list = enrollments || [];
  if (list.length === 0) return { scanned: 0, upserted: 0 };

  const courseIds = [...new Set(list.map((e) => e.course_id).filter(Boolean))];
  const { data: courses } = await supabase
    .from('myuni_courses')
    .select('id, title')
    .in('id', courseIds);
  const courseTitle = new Map((courses || []).map((c) => [c.id, c.title as string]));

  const userIds = [...new Set(list.map((e) => e.user_id).filter(Boolean))];
  const clerkMap = await fetchClerkEmails(userIds);

  const rows: UpsertRow[] = [];
  for (const enr of list) {
    const person = clerkMap.get(enr.user_id);
    if (!person?.email) continue;

    const courseName = courseTitle.get(enr.course_id) || `Kurs ${String(enr.course_id).slice(0, 8)}`;
    const eligibleAt = enr.updated_at || enr.enrolled_at || nowIso;

    rows.push({
      kind: 'course_achievement',
      status: 'ready',
      eligible_at: eligibleAt,
      recipient_name: person.name,
      recipient_email: person.email.trim().toLowerCase(),
      source_type: 'enrollment',
      source_id: String(enr.id),
      event_id: null,
      event_name: null,
      course_id: enr.course_id,
      course_name: courseName,
      order_id: null,
      certificate_title: 'Başarı Sertifikası',
      locale: 'tr',
      updated_at: nowIso,
    });
  }

  if (rows.length === 0) {
    return { scanned: list.length, upserted: 0 };
  }

  const { data: existing } = await supabase
    .from(CERTIFICATE_ISSUANCE_TABLE)
    .select('source_id, status')
    .eq('kind', 'course_achievement')
    .in(
      'source_id',
      rows.map((r) => r.source_id)
    );

  const issuedIds = new Set(
    (existing || []).filter((e) => e.status === 'issued').map((e) => e.source_id)
  );
  const toUpsert = rows.filter((r) => !issuedIds.has(r.source_id));

  if (toUpsert.length === 0) {
    return { scanned: list.length, upserted: 0 };
  }

  const { error: upsertError } = await supabase.from(CERTIFICATE_ISSUANCE_TABLE).upsert(toUpsert, {
    onConflict: 'source_type,source_id,kind',
    ignoreDuplicates: false,
  });

  if (upsertError) {
    console.error('LMS issuance upsert error:', upsertError.message);
    return { scanned: list.length, upserted: 0 };
  }

  return { scanned: list.length, upserted: toUpsert.length };
}

export async function syncCertificateIssuanceQueue(): Promise<{
  events: { scanned: number; upserted: number };
  courses: { scanned: number; upserted: number };
}> {
  const events = await syncEventParticipationCandidates();
  const courses = await syncCourseAchievementCandidates();
  return { events, courses };
}
