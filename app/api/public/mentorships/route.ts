import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  mentorshipDb,
  getPublicMentorshipPath,
  getPublicMentorshipApplicationPath,
  getLocalizedJson,
} from '@/app/lib/mentorship/config';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Supabase configuration missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** myunilab.net — mentörlük listesi */
export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const featuredOnly = request.nextUrl.searchParams.get('featured') === 'true';
    const supabase = getSupabase();

    let query = supabase
      .from(mentorshipDb.mentorships)
      .select(
        'id, slug, title, summary, description, mentor_name, mentor_title, mentor_image_url, mentorship_type, mode, location_name, application_deadline, start_date, end_date, max_mentees, current_mentees, is_application_open, thumbnail_url, banner_url, tags, is_featured, order_index'
      )
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false });

    if (featuredOnly) {
      query = query.eq('is_featured', true);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mentorships = (data ?? []).map((row) => ({
      ...row,
      title_localized: getLocalizedJson(row.title, locale),
      summary_localized: getLocalizedJson(row.summary, locale),
      url: getPublicMentorshipPath(locale, row.slug),
      application_url: getPublicMentorshipApplicationPath(locale, row.slug),
    }));

    return NextResponse.json({
      success: true,
      locale,
      mentorships,
      count: mentorships.length,
    });
  } catch (err) {
    console.error('Public mentorships list error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error', mentorships: [] },
      { status: 500 }
    );
  }
}
