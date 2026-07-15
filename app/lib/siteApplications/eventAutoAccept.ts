import type { SupabaseClient } from '@supabase/supabase-js';
import { siteApplicationsDb, isEventSiteApplication } from '@/app/lib/siteApplications/config';

/**
 * Eski etkinlik kayıtlarını (pending / under_review) otomatik kabul eder.
 * Yeni akışta zaten accepted gelir; bu sadece legacy satırlar içindir.
 * E-posta göndermez (çift mail riski).
 */
export async function backfillPendingEventApplications(
  supabase: SupabaseClient
): Promise<number> {
  const { data, error } = await supabase
    .from(siteApplicationsDb.applications)
    .update({
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .in('status', ['pending', 'under_review'])
    .or('source.eq.event_website,event_id.not.is.null')
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
  },
>(
  supabase: SupabaseClient,
  application: T
): Promise<T> {
  if (!isEventSiteApplication(application)) return application;
  if (application.status === 'accepted' || application.status === 'rejected') {
    return application;
  }

  const { data, error } = await supabase
    .from(siteApplicationsDb.applications)
    .update({
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', application.id)
    .select('*')
    .single();

  if (error || !data) {
    console.error('ensureEventApplicationAccepted failed:', error?.message);
    return application;
  }

  await supabase.from(siteApplicationsDb.statusHistory).insert({
    application_id: application.id,
    old_status: application.status,
    new_status: 'accepted',
    changed_by: null,
    changed_by_email: 'system:event-legacy-auto-accept',
  });

  return data as T;
}
