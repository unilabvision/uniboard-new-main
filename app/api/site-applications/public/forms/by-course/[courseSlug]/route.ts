import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { toPublicForm } from '@/app/lib/siteApplications/forms';
import { buildCourseFormSlugs, getAbsoluteCourseApplicationPath } from '@/app/lib/siteApplications/formTypes';
import type { SiteApplicationForm, SiteApplicationFormField } from '@/app/types/siteApplicationForms';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Supabase configuration missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Public form for /tr/kurs/{courseSlug}/basvuru (myunilab.net) */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseSlug: string }> }
) {
  try {
    const { courseSlug } = await context.params;
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const supabase = getSupabase();
    const slugs = buildCourseFormSlugs(courseSlug);

    const { data: course, error: courseError } = await supabase
      .from('myuni_courses')
      .select('id, slug, title, is_active')
      .eq('slug', courseSlug)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    let form: Record<string, unknown> | null = null;

    const byCourse = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .eq('course_id', course.id)
      .eq('is_active', true)
      .eq('show_on_website', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!byCourse.error && byCourse.data?.[0]) {
      form = byCourse.data[0];
    } else {
      // Fallback: slug match (works before course_id migration)
      const bySlug = await supabase
        .from(siteApplicationsDb.forms)
        .select('*')
        .or(`slug_tr.eq.${slugs.slug_tr},slug_en.eq.${slugs.slug_en}`)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (bySlug.error) {
        return NextResponse.json({ error: bySlug.error.message }, { status: 500 });
      }
      form = bySlug.data?.[0] || null;
    }

    if (!form) {
      return NextResponse.json(
        { error: 'Application form not found for this course' },
        { status: 404 }
      );
    }

    const { data: fields, error: fieldsError } = await supabase
      .from(siteApplicationsDb.formFields)
      .select('*')
      .eq('form_id', form.id)
      .order('order_index', { ascending: true });

    if (fieldsError) {
      return NextResponse.json({ error: fieldsError.message }, { status: 500 });
    }

    const publicForm = toPublicForm(
      { ...(form as unknown as SiteApplicationForm), form_type: 'course' },
      (fields ?? []) as SiteApplicationFormField[],
      locale
    );

    return NextResponse.json({
      form: {
        ...publicForm,
        course_slug: course.slug,
        course_title: course.title,
        application_url: getAbsoluteCourseApplicationPath(locale, course.slug),
      },
      locale,
      course: { id: course.id, slug: course.slug, title: course.title },
    });
  } catch (err) {
    console.error('Public course form fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
