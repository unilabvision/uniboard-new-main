import type { SupabaseClient } from '@supabase/supabase-js';
import { siteApplicationsDb } from './config';
import { fetchEventBySlug } from './events';
import { buildCourseFormSlugs } from './formTypes';
import type { SiteApplicationForm } from '@/app/types/siteApplicationForms';

export type ResolvedPublicForm = {
  form: SiteApplicationForm;
  locale: 'tr' | 'en';
  event?: { id: string; slug: string; title: string };
  course?: { id: string; slug: string; title: string };
};

export async function resolveActiveForm(
  supabase: SupabaseClient,
  options: {
    locale: 'tr' | 'en';
    formSlug?: string;
    eventSlug?: string;
    courseSlug?: string;
  }
): Promise<ResolvedPublicForm | null> {
  const { locale, formSlug, eventSlug, courseSlug } = options;

  if (courseSlug?.trim()) {
    const slug = courseSlug.trim();
    const { data: course, error: courseError } = await supabase
      .from('myuni_courses')
      .select('id, slug, title')
      .eq('slug', slug)
      .maybeSingle();
    if (courseError || !course) return null;

    const courseMeta = {
      id: String(course.id),
      slug: String(course.slug),
      title: String(course.title),
    };

    const byCourse = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .eq('course_id', course.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!byCourse.error && byCourse.data?.[0]) {
      return {
        form: byCourse.data[0] as SiteApplicationForm,
        locale,
        course: courseMeta,
      };
    }

    const slugs = buildCourseFormSlugs(slug);
    const bySlug = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .or(`slug_tr.eq.${slugs.slug_tr},slug_en.eq.${slugs.slug_en}`)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (bySlug.error || !bySlug.data?.length) return null;
    return {
      form: bySlug.data[0] as SiteApplicationForm,
      locale,
      course: courseMeta,
    };
  }

  if (eventSlug?.trim()) {
    const { event, error: eventError } = await fetchEventBySlug(supabase, eventSlug.trim());
    if (eventError || !event) return null;

    const { data: forms, error } = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .eq('event_id', event.id)
      .eq('is_active', true)
      .eq('show_on_website', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !forms?.length) {
      // Fallback: older rows may only set is_active
      const { data: fallback, error: fallbackError } = await supabase
        .from(siteApplicationsDb.forms)
        .select('*')
        .eq('event_id', event.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (fallbackError || !fallback?.length) return null;
      return { form: fallback[0] as SiteApplicationForm, locale, event };
    }
    return { form: forms[0] as SiteApplicationForm, locale, event };
  }

  const slug = formSlug?.trim();
  if (!slug) return null;

  const slugColumn = locale === 'en' ? 'slug_en' : 'slug_tr';
  const { data: form, error } = await supabase
    .from(siteApplicationsDb.forms)
    .select('*')
    .eq(slugColumn, slug)
    .eq('is_active', true)
    .single();

  if (error || !form) return null;
  return { form: form as SiteApplicationForm, locale };
}

export function getApplicationTypeSlug(
  form: SiteApplicationForm,
  locale: 'tr' | 'en',
  event?: { slug: string },
  course?: { slug: string }
): string {
  const slug = (locale === 'en' ? form.slug_en : form.slug_tr)?.trim();
  if (slug) return slug;
  if (course?.slug) {
    return locale === 'en' ? `course-${course.slug}` : `kurs-${course.slug}`;
  }
  if (event?.slug) {
    return locale === 'en' ? `event-${event.slug}` : `etkinlik-${event.slug}`;
  }
  return form.id;
}
