import type { SupabaseClient } from '@supabase/supabase-js';
import { eventsDb } from '@/app/lib/events/config';

export type LinkedEventSummary = {
  id: string;
  slug: string;
  title: string;
};

type EventRow = {
  id: string;
  slug: string;
  title?: string | null;
};

export function normalizeEventRow(row: EventRow): LinkedEventSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title?.trim() || row.slug,
  };
}

export async function fetchActiveEvents(
  supabase: SupabaseClient
): Promise<{ events: LinkedEventSummary[]; error: string | null }> {
  const { data, error } = await supabase
    .from(eventsDb.events)
    .select('id, slug, title, start_date, status, is_active')
    .eq('is_active', true)
    .order('start_date', { ascending: false });

  if (error) {
    return { events: [], error: error.message };
  }

  return {
    events: (data ?? []).map((row) => normalizeEventRow(row as EventRow)),
    error: null,
  };
}

export async function attachLinkedEventsToForms<
  T extends { event_id?: string | null },
>(supabase: SupabaseClient, forms: T[]) {
  const eventIds = [
    ...new Set(forms.map((f) => f.event_id).filter((id): id is string => !!id)),
  ];

  if (eventIds.length === 0) {
    return forms.map((form) => ({ ...form, myuni_events: null }));
  }

  const { data: events, error } = await supabase
    .from(eventsDb.events)
    .select('id, slug, title')
    .in('id', eventIds);

  if (error) {
    console.error('attachLinkedEventsToForms:', error.message);
    return forms.map((form) => ({ ...form, myuni_events: null }));
  }

  const byId = new Map(
    (events ?? []).map((row) => [row.id, normalizeEventRow(row as EventRow)])
  );

  return forms.map((form) => ({
    ...form,
    myuni_events: form.event_id ? byId.get(form.event_id) ?? null : null,
  }));
}

export async function fetchEventBySlug(
  supabase: SupabaseClient,
  eventSlug: string
): Promise<{ event: LinkedEventSummary | null; error: string | null }> {
  const { data, error } = await supabase
    .from(eventsDb.events)
    .select('id, slug, title')
    .eq('slug', eventSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    return { event: null, error: error.message };
  }

  if (!data) {
    return { event: null, error: null };
  }

  return { event: normalizeEventRow(data as EventRow), error: null };
}
