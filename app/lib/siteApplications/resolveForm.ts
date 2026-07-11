import type { SupabaseClient } from '@supabase/supabase-js';
import { siteApplicationsDb } from './config';
import { fetchEventBySlug } from './events';
import type { SiteApplicationForm } from '@/app/types/siteApplicationForms';

export type ResolvedPublicForm = {
  form: SiteApplicationForm;
  locale: 'tr' | 'en';
  event?: { id: string; slug: string; title: string };
};

export async function resolveActiveForm(
  supabase: SupabaseClient,
  options: {
    locale: 'tr' | 'en';
    formSlug?: string;
    eventSlug?: string;
  }
): Promise<ResolvedPublicForm | null> {
  const { locale, formSlug, eventSlug } = options;

  if (eventSlug?.trim()) {
    const { event, error: eventError } = await fetchEventBySlug(supabase, eventSlug.trim());
    if (eventError || !event) return null;

    const { data: form, error } = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .eq('event_id', event.id)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !form) return null;
    return { form: form as SiteApplicationForm, locale, event };
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
  event?: { slug: string }
): string {
  const slug = (locale === 'en' ? form.slug_en : form.slug_tr)?.trim();
  if (slug) return slug;
  if (event?.slug) {
    return locale === 'en' ? `event-${event.slug}` : `etkinlik-${event.slug}`;
  }
  return form.id;
}
