import type { SupabaseClient } from '@supabase/supabase-js';
import { siteApplicationsDb, isEventSiteApplication } from '@/app/lib/siteApplications/config';

/**
 * Eski etkinlik kayıtlarının source alanını event_website yapar.
 * (source=website kalan etkinlikler Ekip sekmesine sızıyordu)
 */
export async function backfillEventApplicationSources(
  supabase: SupabaseClient
): Promise<number> {
  let fixed = 0;

  const byEventId = await supabase
    .from(siteApplicationsDb.applications)
    .update({
      source: 'event_website',
      updated_at: new Date().toISOString(),
    })
    .neq('source', 'event_website')
    .not('event_id', 'is', null)
    .select('id');

  if (byEventId.error) {
    console.error('Event source backfill (event_id) failed:', byEventId.error.message);
  } else {
    fixed += byEventId.data?.length ?? 0;
  }

  const byEventName = await supabase
    .from(siteApplicationsDb.applications)
    .update({
      source: 'event_website',
      updated_at: new Date().toISOString(),
    })
    .eq('source', 'website')
    .not('event_name', 'is', null)
    .neq('event_name', '')
    .select('id');

  if (byEventName.error) {
    console.error('Event source backfill (event_name) failed:', byEventName.error.message);
  } else {
    fixed += byEventName.data?.length ?? 0;
  }

  // 3) Paket seçimi yapılmış (sertifika/ücretsiz etkinlik kaydı) ama source yanlış
  const { data: maybeEvents, error: maybeErr } = await supabase
    .from(siteApplicationsDb.applications)
    .select('id, submission_data')
    .eq('source', 'website')
    .limit(500);

  if (!maybeErr && maybeEvents?.length) {
    const ids = maybeEvents
      .filter((row) => {
        const tier = (row.submission_data as Record<string, unknown> | null)?.registration_tier;
        return tier === 'free' || tier === 'certificate';
      })
      .map((row) => row.id);

    if (ids.length) {
      const byTier = await supabase
        .from(siteApplicationsDb.applications)
        .update({
          source: 'event_website',
          updated_at: new Date().toISOString(),
        })
        .in('id', ids)
        .select('id');
      if (!byTier.error) fixed += byTier.data?.length ?? 0;
    }
  }

  return fixed;
}

/**
 * Eski etkinlik kayıtlarını (pending / under_review) otomatik kabul eder.
 * E-posta göndermez (çift mail riski).
 */
export async function backfillPendingEventApplications(
  supabase: SupabaseClient
): Promise<number> {
  await backfillEventApplicationSources(supabase);

  const { data, error } = await supabase
    .from(siteApplicationsDb.applications)
    .update({
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .in('status', ['pending', 'under_review'])
    .or('source.eq.event_website,event_id.not.is.null,event_name.not.is.null')
    .select('id');

  if (error) {
    console.error('Event status backfill failed:', error.message);
    return 0;
  }

  return data?.length ?? 0;
}

/** Tek kayıt: etkinlik + henüz accepted değilse accepted yap. */
export async function ensureEventApplicationAccepted<
  T extends {
    id: string;
    status: string;
    source?: string | null;
    event_id?: string | null;
    event_name?: string | null;
    submission_data?: Record<string, unknown> | null;
  },
>(
  supabase: SupabaseClient,
  application: T
): Promise<T> {
  if (!isEventSiteApplication(application)) return application;

  let current = application;

  if (application.source !== 'event_website') {
    const { data: sourced } = await supabase
      .from(siteApplicationsDb.applications)
      .update({
        source: 'event_website',
        updated_at: new Date().toISOString(),
      })
      .eq('id', application.id)
      .select('*')
      .single();
    if (sourced) current = sourced as T;
  }

  if (current.status === 'accepted' || current.status === 'rejected') {
    return current;
  }

  const { data, error } = await supabase
    .from(siteApplicationsDb.applications)
    .update({
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id)
    .select('*')
    .single();

  if (error || !data) {
    console.error('ensureEventApplicationAccepted failed:', error?.message);
    return current;
  }

  await supabase.from(siteApplicationsDb.statusHistory).insert({
    application_id: current.id,
    old_status: current.status,
    new_status: 'accepted',
    changed_by: null,
    changed_by_email: 'system:event-legacy-auto-accept',
  });

  return data as T;
}
