import { NextRequest, NextResponse } from 'next/server';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { inferFormType } from '@/app/lib/siteApplications/formTypes';
import { fetchEventById } from '@/app/lib/siteApplications/events';
import {
  requireSiteApplicationsOrEventsUser,
  requireEventFormsWriteUser,
} from '@/app/api/site-applications/access/_helpers';
import type { SiteApplicationFormInput } from '@/app/types/siteApplicationForms';
import {
  normalizePackageSettings,
  validatePackageSettings,
} from '@/app/lib/siteApplications/packages';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsOrEventsUser('forms');
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { data: form, error } = await authResult.supabase!
    .from(siteApplicationsDb.forms)
    .select('*')
    .eq('id', id)
    .single();

  if (error || !form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }

  const { data: fields } = await authResult.supabase!
    .from(siteApplicationsDb.formFields)
    .select('*')
    .eq('form_id', id)
    .order('order_index', { ascending: true });

  let linkedEvent = null;
  if (form.event_id) {
    const { event } = await fetchEventById(authResult.supabase!, form.event_id);
    linkedEvent = event;
  }

  return NextResponse.json({
    form: {
      ...form,
      fields: fields ?? [],
      form_type: inferFormType(form),
      linked_event: linkedEvent,
    },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireEventFormsWriteUser();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = (await request.json()) as Partial<SiteApplicationFormInput>;
  const updates: Record<string, unknown> = {};

  if (body.slug_tr !== undefined) updates.slug_tr = body.slug_tr.trim();
  if (body.slug_en !== undefined) updates.slug_en = body.slug_en.trim();
  if (body.title_tr !== undefined) updates.title_tr = body.title_tr.trim();
  if (body.title_en !== undefined) updates.title_en = body.title_en.trim();
  if (body.subtitle_tr !== undefined) updates.subtitle_tr = body.subtitle_tr?.trim() || null;
  if (body.subtitle_en !== undefined) updates.subtitle_en = body.subtitle_en?.trim() || null;
  if (body.success_message_tr !== undefined) {
    updates.success_message_tr = body.success_message_tr?.trim() || null;
  }
  if (body.success_message_en !== undefined) {
    updates.success_message_en = body.success_message_en?.trim() || null;
  }
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.show_on_website !== undefined) updates.show_on_website = body.show_on_website;
  if (body.allows_attachment !== undefined) updates.allows_attachment = body.allows_attachment;
  if (body.event_id !== undefined) updates.event_id = body.event_id || null;
  if (body.form_type === 'team' || body.form_type === 'event') {
    updates.form_type = body.form_type;
  }

  if (body.package_settings !== undefined) {
    const normalized = normalizePackageSettings(body.package_settings);
    const formType =
      body.form_type ??
      (updates.event_id || body.event_id ? 'event' : undefined);
    const packageError = validatePackageSettings(normalized, {
      requireEvent: formType === 'event' || Boolean(updates.event_id ?? body.event_id),
    });
    if (packageError) {
      return NextResponse.json({ error: packageError }, { status: 400 });
    }
    updates.package_settings = normalized;
  }

  // One active event → one form: release this event_id from any other forms
  // so /etkinlik/{slug}/basvuru always resolves to this form (packages + fields).
  const nextEventId =
    typeof updates.event_id === 'string' && updates.event_id
      ? updates.event_id
      : null;
  if (nextEventId) {
    await authResult.supabase!
      .from(siteApplicationsDb.forms)
      .update({ event_id: null })
      .eq('event_id', nextEventId)
      .neq('id', id);
  }

  let { data, error } = await authResult.supabase!
    .from(siteApplicationsDb.forms)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error && updates.form_type !== undefined) {
    const retryWithoutType = { ...updates };
    delete retryWithoutType.form_type;
    const retry = await authResult.supabase!
      .from(siteApplicationsDb.forms)
      .update(retryWithoutType)
      .eq('id', id)
      .select('*')
      .single();
    if (!retry.error) {
      data = retry.data;
      error = null;
    }
  }

  if (error && updates.package_settings !== undefined) {
    const retryUpdates = { ...updates };
    delete retryUpdates.package_settings;
    delete retryUpdates.form_type;
    const retry = await authResult.supabase!
      .from(siteApplicationsDb.forms)
      .update(retryUpdates)
      .eq('id', id)
      .select('*')
      .single();
    data = retry.data;
    error = retry.error;
    if (!error) {
      return NextResponse.json({
        form: data,
        warning:
          'package_settings column missing — run scripts/migrations/add-site-application-form-field-types.sql in Supabase',
      });
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Team forms: only one form per public slug should be on the website menu
  if (
    data &&
    !data.event_id &&
    data.show_on_website &&
    (data.slug_tr || data.slug_en)
  ) {
    const slugFilters = [data.slug_tr, data.slug_en]
      .filter(Boolean)
      .map((s) => `slug_tr.eq.${s},slug_en.eq.${s}`)
      .join(',');
    if (slugFilters) {
      await authResult.supabase!
        .from(siteApplicationsDb.forms)
        .update({ show_on_website: false })
        .or(slugFilters)
        .neq('id', id)
        .is('event_id', null);
    }
  }

  return NextResponse.json({ form: data });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireEventFormsWriteUser();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { error } = await authResult.supabase!
    .from(siteApplicationsDb.forms)
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
