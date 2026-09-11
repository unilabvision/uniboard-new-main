import type { SupabaseClient } from '@supabase/supabase-js';
import { syncCertificatePaymentsFromOrders } from '@/app/lib/siteApplications/syncPayments';

const SYNC_TTL_MS = 60_000;
const lastSyncAtByEventId = new Map<string, number>();

function readSubmission(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function isOpenUnpaid(status: unknown): boolean {
  return status === 'pending' || status === 'failed';
}

/**
 * Refresh certificate payment status for the visible list page without a full-table sync.
 * - Collects distinct event_ids from unpaid certificate rows on the page
 * - Runs at most one sync per event_id per TTL window
 * Returns true if any sync ran (caller should re-read those rows).
 */
export async function syncPaymentsForVisibleApplications(
  supabase: SupabaseClient,
  rows: Array<{
    id?: string;
    event_id?: string | null;
    submission_data?: unknown;
  }>,
  options?: {
    /** Prefer syncing this event even if page rows are already paid */
    eventId?: string | null;
    /** When payment/tier filters are active, sync is more important */
    paymentFilterActive?: boolean;
  }
): Promise<{ syncedEventIds: string[] }> {
  const now = Date.now();
  const eventIds = new Set<string>();

  if (options?.eventId) {
    eventIds.add(options.eventId);
  }

  for (const row of rows) {
    const sub = readSubmission(row.submission_data);
    if (sub.registration_tier !== 'certificate') continue;
    if (!isOpenUnpaid(sub.payment_status) && !options?.paymentFilterActive) continue;
    const eventId = typeof row.event_id === 'string' ? row.event_id.trim() : '';
    if (eventId) eventIds.add(eventId);
  }

  const syncedEventIds: string[] = [];

  for (const eventId of eventIds) {
    const last = lastSyncAtByEventId.get(eventId) || 0;
    if (now - last < SYNC_TTL_MS && !options?.paymentFilterActive) continue;
    // Payment-filter path: still respect a shorter floor to avoid hammering
    if (options?.paymentFilterActive && now - last < 15_000) continue;

    try {
      await syncCertificatePaymentsFromOrders(supabase, { eventId });
      lastSyncAtByEventId.set(eventId, Date.now());
      syncedEventIds.push(eventId);
    } catch (err) {
      console.error('Visible-page payment sync failed:', eventId, err);
    }
  }

  // Cap map growth
  if (lastSyncAtByEventId.size > 200) {
    const cutoff = Date.now() - SYNC_TTL_MS * 5;
    for (const [key, ts] of lastSyncAtByEventId) {
      if (ts < cutoff) lastSyncAtByEventId.delete(key);
    }
  }

  return { syncedEventIds };
}

/** Test helper — clears throttle state. */
export function _resetPaymentSyncThrottleForTests() {
  lastSyncAtByEventId.clear();
}
