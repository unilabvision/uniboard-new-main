import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  eventsDb,
  getPublicEventPath,
  getPublicEventApplicationPath,
} from '@/app/lib/events/config';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Supabase configuration missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from(eventsDb.events)
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({
      locale,
      event: {
        ...data,
        url: getPublicEventPath(locale, data.slug),
        application_url: getPublicEventApplicationPath(locale, data.slug),
      },
    });
  } catch (err) {
    console.error('Public event detail error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
