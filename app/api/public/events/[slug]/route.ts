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

function loadPublicEvent(slug: string) {
  return unstable_cache(
    async () => {
      const { data, error } = await getSupabase()
        .from(eventsDb.events)
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    ['public-event', slug],
    { revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS, tags: ['public-events'] }
  )();
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const data = await loadPublicEvent(slug);
    if (!data) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        locale,
        event: {
          ...data,
          url: getPublicEventPath(locale, data.slug),
          application_url: getPublicEventApplicationPath(locale, data.slug),
        },
      },
      { headers: { 'Cache-Control': PUBLIC_CACHE_CONTROL } }
    );
  } catch (err) {
    console.error('Public event detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
