import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  siteApplicationsDb,
  getEventApplicationPath,
} from '@/app/lib/siteApplications/config';
import { attachLinkedEventsToForms } from '@/app/lib/siteApplications/events';
import { getTeamFormPublicPath } from '@/app/lib/siteApplications/formTypes';
import {
  parsePackageSettingsFromForm,
  toPublicPackages,
} from '@/app/lib/siteApplications/packages';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Supabase configuration missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** myunilab.net — standalone forms + event-linked application URLs */
export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from(siteApplicationsDb.forms)
      .select(
        'id, slug_tr, slug_en, title_tr, title_en, subtitle_tr, subtitle_en, event_id, package_settings, is_active, show_on_website'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formsWithEvents = await attachLinkedEventsToForms(supabase, data ?? []);

    const standaloneForms = formsWithEvents
      .filter((form) => !form.event_id && form.show_on_website)
      .map((form) => {
        const slug = locale === 'en' ? form.slug_en : form.slug_tr;
        return {
          id: form.id,
          slug,
          title: locale === 'en' ? form.title_en : form.title_tr,
          subtitle: locale === 'en' ? form.subtitle_en : form.subtitle_tr,
          url: getTeamFormPublicPath(locale, slug),
        };
      });

    const eventApplications = formsWithEvents
      .filter((form) => form.event_id && form.myuni_events)
      .map((form) => {
        const event = form.myuni_events!;
        const packageSettings = parsePackageSettingsFromForm(form);
        const packages = toPublicPackages(packageSettings, locale);
        return {
          form_id: form.id,
          event_id: form.event_id,
          event_slug: event.slug,
          event_title: event.title,
          form_title: locale === 'en' ? form.title_en : form.title_tr,
          application_url: getEventApplicationPath(locale, event.slug),
          packages,
          has_certificate_package: packageSettings.certificate_enabled,
        };
      });

    return NextResponse.json({
      locale,
      forms: standaloneForms,
      eventApplications,
    });
  } catch (err) {
    console.error('Public forms list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
