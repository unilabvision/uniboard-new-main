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

/** myunilab.net — mentörlük detay */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const { slug } = await context.params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from(mentorshipDb.mentorships)
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      locale,
      mentorship: {
        ...data,
        title_localized: getLocalizedJson(data.title, locale),
        summary_localized: getLocalizedJson(data.summary, locale),
        description_localized: getLocalizedJson(data.description, locale),
        mentor_bio_localized: getLocalizedJson(data.mentor_bio, locale),
        url: getPublicMentorshipPath(locale, data.slug),
        application_url: getPublicMentorshipApplicationPath(locale, data.slug),
      },
    });
  } catch (err) {
    console.error('Public mentorship detail error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
