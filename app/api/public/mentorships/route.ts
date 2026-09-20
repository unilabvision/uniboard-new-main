import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import {
  mentorshipDb,
  getPublicMentorshipPath,
  getPublicMentorshipApplicationPath,
  getLocalizedJson,
} from '@/app/lib/mentorship/config';
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

const loadPublicMentorships = unstable_cache(
  async (featuredOnly: boolean) => {
    const supabase = getSupabase();
    let query = supabase
      .from(mentorshipDb.mentorships)
      .select(
        'id, slug, title, summary, description, mentor_name, mentor_title, mentor_image_url, mentorship_type, mode, location_name, application_deadline, start_date, end_date, max_mentees, current_mentees, is_application_open, thumbnail_url, banner_url, tags, is_featured, order_index'
      )
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });
    if (featuredOnly) query = query.eq('is_featured', true);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ['public-mentorships'],
  { revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS, tags: ['public-mentorships'] }
);

/** myunilab.net — mentörlük listesi */
export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const featuredOnly = request.nextUrl.searchParams.get('featured') === 'true';
    const data = await loadPublicMentorships(featuredOnly);
    const mentorships = data.map((row) => ({
      ...row,
      title_localized: getLocalizedJson(row.title, locale),
      summary_localized: getLocalizedJson(row.summary, locale),
      url: getPublicMentorshipPath(locale, row.slug),
      application_url: getPublicMentorshipApplicationPath(locale, row.slug),
    }));

    return NextResponse.json(
      { success: true, locale, mentorships, count: mentorships.length },
      { headers: { 'Cache-Control': PUBLIC_CACHE_CONTROL } }
    );
  } catch (err) {
    console.error('Public mentorships list error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error', mentorships: [] },
      { status: 500 }
    );
  }
}
