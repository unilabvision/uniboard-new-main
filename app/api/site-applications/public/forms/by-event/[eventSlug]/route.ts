import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { siteApplicationsDb, getEventApplicationPath } from '@/app/lib/siteApplications/config';
import { fetchEventBySlug } from '@/app/lib/siteApplications/events';
import { toPublicForm } from '@/app/lib/siteApplications/forms';
import type { SiteApplicationForm, SiteApplicationFormField } from '@/app/types/siteApplicationForms';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Supabase configuration missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Public form for /tr/etkinlik/{eventSlug}/basvuru (myunilab.net site) */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventSlug: string }> }
) {
  try {
    const { eventSlug } = await context.params;
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const supabase = getSupabase();

    const { event, error: eventError } = await fetchEventBySlug(supabase, eventSlug);
    if (eventError) {
      return NextResponse.json({ error: eventError }, { status: 500 });
    }
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { data: form, error } = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .eq('event_id', event.id)
      .eq('is_active', true)
      .eq('show_on_website', true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!form) {
      return NextResponse.json({ error: 'Application form not found for this event' }, { status: 404 });
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
      form as SiteApplicationForm,
      (fields ?? []) as SiteApplicationFormField[],
      locale
    );

    return NextResponse.json({
      form: {
        ...publicForm,
        event_slug: event.slug,
        event_title: event.title,
        application_url: getEventApplicationPath(locale, event.slug),
      },
      locale,
      event,
    });
  } catch (err) {
    console.error('Public event form fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
