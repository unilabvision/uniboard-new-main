import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { attachLinkedEventsToForms } from '@/app/lib/siteApplications/events';
import {
  buildEventFormSlugs,
  getDefaultFieldsForFormType,
  inferFormType,
} from '@/app/lib/siteApplications/formTypes';
import { normalizeFieldOptions } from '@/app/lib/siteApplications/forms';
import {
  requireSiteApplicationsSuperAdmin,
  requireEventFormsWriteUser,
  requireSiteApplicationsOrEventsUser,
} from '@/app/api/site-applications/access/_helpers';
import type { SiteApplicationFormInput } from '@/app/types/siteApplicationForms';

export async function GET() {
  const authResult = await requireSiteApplicationsOrEventsUser('forms');
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { data, error } = await authResult.supabase!
    .from(siteApplicationsDb.forms)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const forms = (await attachLinkedEventsToForms(authResult.supabase!, data ?? [])).map(
    (form) => ({
      ...form,
      form_type: inferFormType(form),
    })
  );

  return NextResponse.json({ forms });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SiteApplicationFormInput;
  const formType = body.form_type ?? (body.event_id ? 'event' : 'team');
  const authResult =
    formType === 'event'
      ? await requireEventFormsWriteUser()
      : await requireSiteApplicationsSuperAdmin();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const titleTr = body.title_tr?.trim();
  const titleEn = body.title_en?.trim();

  if (!titleTr || !titleEn) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (formType === 'event' && !body.event_id) {
    return NextResponse.json({ error: 'Etkinlik formları için bir etkinlik seçilmelidir.' }, { status: 400 });
  }
  const eventId = formType === 'team' ? null : body.event_id || null;

  let slugTr = body.slug_tr?.trim() || '';
  let slugEn = body.slug_en?.trim() || '';

  if (formType === 'event' && eventId) {
    const { data: eventRow } = await authResult.supabase!
      .from('myuni_events')
      .select('slug')
      .eq('id', eventId)
      .maybeSingle();

    if (eventRow?.slug) {
      const autoSlugs = buildEventFormSlugs(eventRow.slug);
      if (!slugTr) slugTr = autoSlugs.slug_tr;
      if (!slugEn) slugEn = autoSlugs.slug_en;
    }
  }

  if (!slugTr || !slugEn) {
    return NextResponse.json({ error: 'Form adresi (slug) gerekli' }, { status: 400 });
  }

  let createdByEmail: string | null = null;
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(authResult.userId!);
    createdByEmail = user.emailAddresses[0]?.emailAddress ?? null;
  } catch {
    createdByEmail = null;
  }

  const insertPayload: Record<string, unknown> = {
    slug_tr: slugTr,
    slug_en: slugEn,
    title_tr: titleTr,
    title_en: titleEn,
    subtitle_tr: body.subtitle_tr?.trim() || null,
    subtitle_en: body.subtitle_en?.trim() || null,
    success_message_tr: body.success_message_tr?.trim() || null,
    success_message_en: body.success_message_en?.trim() || null,
    is_active: body.is_active ?? false,
    show_on_website: body.show_on_website ?? (formType === 'event'),
    allows_attachment: body.allows_attachment ?? (formType === 'team'),
    event_id: eventId,
    created_by: authResult.userId,
    created_by_email: createdByEmail,
    form_type: formType,
  };

  if (eventId) {
    await authResult.supabase!
      .from(siteApplicationsDb.forms)
      .update({ event_id: null })
      .eq('event_id', eventId);
  }

  const { data, error } = await authResult.supabase!
    .from(siteApplicationsDb.forms)
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    if (error.message?.includes('form_type')) {
      delete insertPayload.form_type;
      const retry = await authResult.supabase!
        .from(siteApplicationsDb.forms)
        .insert(insertPayload)
        .select('*')
        .single();
      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      const defaultFields = getDefaultFieldsForFormType(formType);
      await authResult.supabase!.from(siteApplicationsDb.formFields).insert(
        defaultFields.map((field, index) => ({
          form_id: retry.data!.id,
          field_key: field.field_key.trim(),
          field_type: field.field_type,
          label_tr: field.label_tr.trim(),
          label_en: field.label_en.trim(),
          placeholder_tr: field.placeholder_tr?.trim() || null,
          placeholder_en: field.placeholder_en?.trim() || null,
          required: field.required ?? false,
          order_index: field.order_index ?? index,
          options: normalizeFieldOptions(field.options),
          is_contact: field.is_contact ?? false,
        }))
      );
      return NextResponse.json({ form: retry.data }, { status: 201 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const defaultFields = getDefaultFieldsForFormType(formType);
  await authResult.supabase!.from(siteApplicationsDb.formFields).insert(
    defaultFields.map((field, index) => ({
      form_id: data.id,
      field_key: field.field_key.trim(),
      field_type: field.field_type,
      label_tr: field.label_tr.trim(),
      label_en: field.label_en.trim(),
      placeholder_tr: field.placeholder_tr?.trim() || null,
      placeholder_en: field.placeholder_en?.trim() || null,
      required: field.required ?? false,
      order_index: field.order_index ?? index,
      options: normalizeFieldOptions(field.options),
      is_contact: field.is_contact ?? false,
    }))
  );

  return NextResponse.json({ form: data }, { status: 201 });
}
