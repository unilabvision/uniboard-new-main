import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import {
  eventsDb,
  getPublicEventPath,
  getPublicEventApplicationPath,
} from '@/app/lib/events/config';
import {
  PUBLIC_CACHE_CONTROL,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from '@/app/lib/http/publicCache';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Supabase configuration missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const loadPublicEvents = unstable_cache(
  async (featuredOnly: boolean) => {
    const supabase = getSupabase();
    let query = supabase
      .from(eventsDb.events)
      .select(
        'id, slug, title, description, event_type, category, tags, start_date, end_date, timezone, duration_minutes, is_online, location_name, is_paid, price, max_attendees, current_attendees, thumbnail_url, banner_url, status, is_featured, is_registration_open, organizer_name'
      )
      .eq('is_active', true)
      .order('start_date', { ascending: true });

    if (featuredOnly) query = query.eq('is_featured', true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ['public-events'],
  { revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS, tags: ['public-events'] }
);

/** myunilab.net — /tr/etkinlik listesi için public API */
export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const featuredOnly = request.nextUrl.searchParams.get('featured') === 'true';
    const data = await loadPublicEvents(featuredOnly);
    const events = data.map((event) => ({
      ...event,
      url: getPublicEventPath(locale, event.slug),
      application_url: getPublicEventApplicationPath(locale, event.slug),
    }));

    return NextResponse.json(
      { locale, events },
      { headers: { 'Cache-Control': PUBLIC_CACHE_CONTROL } }
    );
  } catch (err) {
    console.error('Public events list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
