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
  localizeMentorshipQuestions,
  normalizeMentorshipQuestions,
} from '@/app/lib/mentorship/questions';
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

function loadPublicMentorship(slug: string) {
  return unstable_cache(
    async () => {
      const { data, error } = await getSupabase()
        .from(mentorshipDb.mentorships)
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    ['public-mentorship', slug],
    { revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS, tags: ['public-mentorships'] }
  )();
}

/** myunilab.net — mentörlük detay */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const { slug } = await context.params;
    const data = await loadPublicMentorship(slug);
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const questions = normalizeMentorshipQuestions(data.application_questions);

    return NextResponse.json(
      {
        success: true,
        locale,
        mentorship: {
          ...data,
          application_questions: questions,
          application_questions_localized: localizeMentorshipQuestions(questions, locale),
          title_localized: getLocalizedJson(data.title, locale),
          summary_localized: getLocalizedJson(data.summary, locale),
          description_localized: getLocalizedJson(data.description, locale),
          mentor_bio_localized: getLocalizedJson(data.mentor_bio, locale),
          url: getPublicMentorshipPath(locale, data.slug),
          application_url: getPublicMentorshipApplicationPath(locale, data.slug),
        },
      },
      { headers: { 'Cache-Control': PUBLIC_CACHE_CONTROL } }
    );
  } catch (err) {
    console.error('Public mentorship detail error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
