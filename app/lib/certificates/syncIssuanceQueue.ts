import { clerkClient } from '@clerk/nextjs/server';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { syncCertificatePaymentsFromOrders } from '@/app/lib/siteApplications/syncPayments';
import {
  computeCertificateEligibleAt,
  normalizePackageSettings,
} from '@/app/lib/siteApplications/packages';
import { loadEventCertificateSettings } from '@/app/lib/events/certificateSettings';
import {
  CERTIFICATE_ISSUANCE_TABLE,
  getCertificatesServiceSupabase,
  type CertificateIssuanceKind,
  type CertificateIssuanceStatus,
} from '@/app/lib/certificates/issuance';

export type LatestEventInfo = {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
};

type UpsertRow = {
  kind: CertificateIssuanceKind;
  status: CertificateIssuanceStatus;
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

function readSubmission(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

/** Sertifika paketi: ödeme yapılmış veya ücretsiz (0₺) paket */
function isCertificateEligible(sub: Record<string, unknown>): boolean {
  if (sub.registration_tier !== 'certificate') return false;
  if (sub.payment_status === 'paid') return true;
  const price = Number(sub.package_price);
  return Number.isFinite(price) && price <= 0;
}

/**
 * Operasyon için “en son etkinlik”:
 * 1) Başlamış etkinlikler içinde en yeni start_date
 * 2) Yoksa yaklaşan en yakın etkinlik
 */
export async function resolveLatestEventForIssuance(
  supabase = getCertificatesServiceSupabase()
): Promise<LatestEventInfo | null> {
  const { data, error } = await supabase
    .from('myuni_events')
    .select('id, title, start_date, end_date')
    .order('start_date', { ascending: false })
    .limit(50);

  if (error) {
    console.error('resolveLatestEventForIssuance:', error.message);
    return null;
  }

  const list = data || [];
  if (list.length === 0) return null;

  const now = Date.now();
  const started = list.find((ev) => {
    const start = ev.start_date ? new Date(ev.start_date).getTime() : NaN;
    return Number.isFinite(start) && start <= now;
  });
  if (started) {
    return {
      id: started.id,
      title: started.title,
      start_date: started.start_date,
      end_date: started.end_date || null,
    };
  }

  const upcoming = [...list].reverse().find((ev) => Boolean(ev.start_date));
  const pick = upcoming || list[0];
  return {
    id: pick.id,
    title: pick.title,
    start_date: pick.start_date,
    end_date: pick.end_date || null,
  };
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
        const name =
          [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
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

/**
 * Sertifika paketi açık olan / otomatik gönderimi açık olan etkinlikleri
 * (ve son 90 günde bitmiş etkinlikleri) senkronize eder.
 */
async function resolveEventsForParticipationSync(
  supabase: ReturnType<typeof getCertificatesServiceSupabase>
): Promise<LatestEventInfo[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const { data: events, error } = await supabase
    .from('myuni_events')
    .select('id, title, start_date, end_date')
    .or(`end_date.gte.${cutoff.toISOString()},end_date.is.null`)
    .order('start_date', { ascending: false })
    .limit(200);

  if (error) {
    console.error('resolveEventsForParticipationSync:', error.message);
    return [];
  }

  const list = (events || []).map((ev) => ({
    id: String(ev.id),
    title: String(ev.title || 'Etkinlik'),
    start_date: String(ev.start_date || ''),
    end_date: ev.end_date ? String(ev.end_date) : null,
  }));

  // Ayrıca package_settings'te sertifika açık formların event_id'lerini ekle
  const { data: forms } = await supabase
    .from(siteApplicationsDb.forms)
    .select('event_id, package_settings')
    .not('event_id', 'is', null)
    .limit(500);

  const wantedIds = new Set(
    (forms || [])
      .filter((form) => {
        const settings = normalizePackageSettings(form.package_settings);
        return settings.certificate_enabled || settings.certificate_auto_issue;
      })
      .map((form) => String(form.event_id))
  );

  const byId = new Map(list.map((ev) => [ev.id, ev]));

  // Eksik event'leri tek tek çek
  for (const eventId of wantedIds) {
    if (byId.has(eventId)) continue;
    const { data: missing } = await supabase
      .from('myuni_events')
      .select('id, title, start_date, end_date')
      .eq('id', eventId)
      .maybeSingle();
    if (missing) {
      byId.set(eventId, {
        id: String(missing.id),
        title: String(missing.title || 'Etkinlik'),
        start_date: String(missing.start_date || ''),
        end_date: missing.end_date ? String(missing.end_date) : null,
      });
    }
  }

  // En azından “latest” her zaman listede olsun
  const latest = await resolveLatestEventForIssuance(supabase);
  if (latest) byId.set(latest.id, latest);

  return [...byId.values()];
}

async function syncOneEventParticipation(
  event: LatestEventInfo,
  supabase: ReturnType<typeof getCertificatesServiceSupabase>
): Promise<{ scanned: number; upserted: number }> {
  const settings = await loadEventCertificateSettings(supabase, event.id);
  const delayMinutes = settings.certificate_delay_minutes;
  const eligibleAt = computeCertificateEligibleAt(
    event.end_date,
    delayMinutes,
    event.start_date
  );
  const nowIso = new Date().toISOString();
  const isDue = new Date(eligibleAt).getTime() <= Date.now();
  // Otomatik gönderim açıksa süre dolana kadar pending; kapalıysa ready (manuel panel)
  const status: CertificateIssuanceStatus =
    settings.certificate_auto_issue && !isDue ? 'pending' : 'ready';

  const { data: apps, error } = await supabase
    .from(siteApplicationsDb.applications)
    .select(
      'id, first_name, last_name, email, event_id, event_name, locale, submission_data, source'
    )
    .eq('event_id', event.id)
    .limit(3000);

  if (error) {
    console.error('Event issuance sync apps error:', event.id, error.message);
    return { scanned: 0, upserted: 0 };
  }

  const paidCertApps = (apps || []).filter((app) => {
    const sub = readSubmission(app.submission_data);
    return (
      isCertificateEligible(sub) &&
      typeof app.email === 'string' &&
      app.email.trim().length > 0
    );
  });

  if (paidCertApps.length === 0) {
    return { scanned: 0, upserted: 0 };
  }

  const rows: UpsertRow[] = paidCertApps.map((app) => {
    const sub = readSubmission(app.submission_data);
    const recipientName =
      [app.first_name, app.last_name].filter(Boolean).join(' ').trim() ||
      app.email;

    return {
      kind: 'event_participation',
      status,
      eligible_at: eligibleAt,
      recipient_name: recipientName,
      recipient_email: String(app.email).trim().toLowerCase(),
      source_type: 'site_application',
      source_id: app.id,
      event_id: event.id,
      event_name: event.title || app.event_name || 'Etkinlik',
      course_id: null,
      course_name: null,
      order_id: typeof sub.order_id === 'string' ? sub.order_id : null,
      certificate_title: 'Katılım Sertifikası',
      locale: app.locale === 'en' ? 'en' : 'tr',
      updated_at: nowIso,
    };
  });

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

  // Zaten issued olmayan satırları güncelle; pending→ready geçişini de sağlar
  const { error: upsertError } = await supabase
    .from(CERTIFICATE_ISSUANCE_TABLE)
    .upsert(toUpsert, {
      onConflict: 'source_type,source_id,kind',
      ignoreDuplicates: false,
    });

  if (upsertError) {
    console.error('Event issuance upsert error:', event.id, upsertError.message);
    return { scanned: paidCertApps.length, upserted: 0 };
  }

  return { scanned: paidCertApps.length, upserted: toUpsert.length };
}

async function syncEventParticipationCandidates(): Promise<{
  scanned: number;
  upserted: number;
  eventsSynced: number;
  latestEvent: LatestEventInfo | null;
}> {
  const supabase = getCertificatesServiceSupabase();
  await syncCertificatePaymentsFromOrders(supabase);

  const events = await resolveEventsForParticipationSync(supabase);
  const latestEvent = await resolveLatestEventForIssuance(supabase);

  let scanned = 0;
  let upserted = 0;
  for (const event of events) {
    const result = await syncOneEventParticipation(event, supabase);
    scanned += result.scanned;
    upserted += result.upserted;
  }

  return {
    scanned,
    upserted,
    eventsSynced: events.length,
    latestEvent,
  };
}

async function syncCourseAchievementCandidates(): Promise<{
  scanned: number;
  upserted: number;
}> {
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

    const courseName =
      courseTitle.get(enr.course_id) || `Kurs ${String(enr.course_id).slice(0, 8)}`;
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

  const { error: upsertError } = await supabase
    .from(CERTIFICATE_ISSUANCE_TABLE)
    .upsert(toUpsert, {
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
  events: {
    scanned: number;
    upserted: number;
    eventsSynced: number;
    latestEvent: LatestEventInfo | null;
  };
  courses: { scanned: number; upserted: number };
}> {
  const events = await syncEventParticipationCandidates();
  const courses = await syncCourseAchievementCandidates();
  return { events, courses };
}
