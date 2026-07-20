import type { SupabaseClient } from '@supabase/supabase-js';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';

export type EventRegistrantRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  status: string | null;
  locale: string | null;
  event_name: string | null;
  created_at: string;
  registration_tier: string;
  payment_status: string;
  package_price: number | null;
  package_currency: string | null;
  order_id: string | null;
};

function readSubmission(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

/** Etkinliğe bağlı tüm site başvuruları (ücretsiz + sertifika). */
export async function fetchEventRegistrants(
  supabase: SupabaseClient,
  eventId: string
): Promise<EventRegistrantRow[]> {
  const pageSize = 1000;
  const rows: EventRegistrantRow[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from(siteApplicationsDb.applications)
      .select(
        'id, email, first_name, last_name, phone, status, locale, event_name, created_at, submission_data'
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);

    const batch = data || [];
    for (const app of batch) {
      const s = readSubmission(app.submission_data);
      const priceRaw = s.package_price;
      const price =
        priceRaw === null || priceRaw === undefined || priceRaw === ''
          ? null
          : Number(priceRaw);

      rows.push({
        id: app.id,
        email: String(app.email || '').trim(),
        first_name: app.first_name,
        last_name: app.last_name,
        phone: app.phone,
        status: app.status,
        locale: app.locale,
        event_name: app.event_name,
        created_at: app.created_at,
        registration_tier: String(s.registration_tier || 'free'),
        payment_status: String(s.payment_status || 'none'),
        package_price: Number.isFinite(price as number) ? (price as number) : null,
        package_currency:
          typeof s.package_currency === 'string' ? s.package_currency : 'TRY',
        order_id: typeof s.order_id === 'string' ? s.order_id : null,
      });
    }

    if (batch.length < pageSize) break;
    from += pageSize;
    if (from > 20000) break;
  }

  return rows;
}

/**
 * Hatırlatma için e-posta başına tek kayıt.
 * Öncelik: paid certificate > pending certificate > free / diğer.
 */
export function dedupeRegistrantsForReminder(
  rows: EventRegistrantRow[]
): EventRegistrantRow[] {
  const rank = (row: EventRegistrantRow) => {
    if (row.registration_tier === 'certificate' && row.payment_status === 'paid') return 3;
    if (row.registration_tier === 'certificate' && row.payment_status === 'pending')
      return 2;
    if (row.registration_tier === 'certificate' && row.payment_status === 'superseded')
      return 1;
    return 0;
  };

  const byEmail = new Map<string, EventRegistrantRow>();
  for (const row of rows) {
    const key = row.email.toLowerCase();
    if (!key) continue;
    // Mükerrer pending'i mail listesine alma — paid sibling varsa o seçilir
    if (row.payment_status === 'superseded') continue;
    const existing = byEmail.get(key);
    if (!existing || rank(row) > rank(existing)) {
      byEmail.set(key, row);
    }
  }
  return [...byEmail.values()];
}
