import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import {
  buildCourseFormSlugs,
  getDefaultFieldsForFormType,
  getAbsoluteCourseApplicationPath,
} from '@/app/lib/siteApplications/formTypes';
import { normalizeFieldOptions } from '@/app/lib/siteApplications/forms';
import type { SiteApplicationFormFieldInput } from '@/app/types/siteApplicationForms';

type RouteContext = { params: Promise<{ id: string }> };

function isMissingCourseIdColumn(error: { message?: string; code?: string } | null): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('course_id') && (msg.includes('column') || msg.includes('schema') || error.code === '42703');
}

function isFormTypeCheckViolation(error: { message?: string; code?: string } | null): boolean {
  if (!error?.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('form_type_check') ||
    (msg.includes('form_type') && msg.includes('check constraint'))
  );
}

async function findCourseForm(
  supabase: SupabaseClient,
  courseId: string,
  courseSlug: string
): Promise<{ form: Record<string, unknown> | null; missingCourseId: boolean }> {
  const slugs = buildCourseFormSlugs(courseSlug);

  const byCourse = await supabase
    .from(siteApplicationsDb.forms)
    .select('*')
    .eq('course_id', courseId)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (!byCourse.error && byCourse.data?.[0]) {
    return { form: byCourse.data[0] as Record<string, unknown>, missingCourseId: false };
  }

  if (isMissingCourseIdColumn(byCourse.error)) {
    const bySlug = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .or(`slug_tr.eq.${slugs.slug_tr},slug_en.eq.${slugs.slug_en}`)
      .eq('form_type', 'course')
      .order('updated_at', { ascending: false })
      .limit(1);
    return {
      form: (bySlug.data?.[0] as Record<string, unknown>) || null,
      missingCourseId: true,
    };
  }

  const bySlug = await supabase
    .from(siteApplicationsDb.forms)
    .select('*')
    .or(`slug_tr.eq.${slugs.slug_tr},slug_en.eq.${slugs.slug_en}`)
    .order('updated_at', { ascending: false })
    .limit(1);

  return {
    form: (bySlug.data?.[0] as Record<string, unknown>) || null,
    missingCourseId: false,
  };
}

/**
 * GET – Load (or create draft) course application form + fields for LMS editor.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id: courseId } = await context.params;
  const { data: course, error: courseError } = await authResult.supabase
    .from('myuni_courses')
    .select('id, title, slug')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) {
    return NextResponse.json({ error: courseError.message }, { status: 500 });
  }
  if (!course) {
    return NextResponse.json({ error: 'Kurs bulunamadı' }, { status: 404 });
  }

  const found = await findCourseForm(authResult.supabase, courseId, course.slug);
  let form = found.form;
  let missingCourseId = found.missingCourseId;

  if (!form) {
    const slugs = buildCourseFormSlugs(course.slug);
    const insertBase = {
      title_tr: `${course.title} Başvurusu`,
      title_en: `${course.title} Application`,
      subtitle_tr: 'Kursa katılmak için formu doldurun.',
      subtitle_en: 'Fill out the form to apply for this course.',
      slug_tr: slugs.slug_tr,
      slug_en: slugs.slug_en,
      success_message_tr: 'Başvurunuz alındı. En kısa sürede sizinle iletişime geçilecektir.',
      success_message_en: 'Your application has been received. We will contact you soon.',
      is_active: false,
      show_on_website: true,
      allows_attachment: false,
      form_type: 'course',
      event_id: null,
      created_by: authResult.userId,
    };

    const insertRow: Record<string, unknown> = { ...insertBase, course_id: courseId };
    let { data: created, error: createError } = await authResult.supabase
      .from(siteApplicationsDb.forms)
      .insert([insertRow])
      .select('*')
      .single();

    // DB check may only allow team|event until migration runs — omit form_type; slug kurş-* still identifies course forms
    if (createError && isFormTypeCheckViolation(createError)) {
      const withoutType = { ...insertRow };
      delete withoutType.form_type;
      const retry = await authResult.supabase
        .from(siteApplicationsDb.forms)
        .insert([withoutType])
        .select('*')
        .single();
      created = retry.data;
      createError = retry.error;
    }

    if (createError && isMissingCourseIdColumn(createError)) {
      const lean = { ...(insertBase as Record<string, unknown>) };
      delete lean.course_id;
      delete lean.form_type;
      const retry = await authResult.supabase
        .from(siteApplicationsDb.forms)
        .insert([lean])
        .select('*')
        .single();
      created = retry.data;
      createError = retry.error;
      missingCourseId = true;
    }

    // Last resort: team type + kurs- slug (inferFormType still returns course via slug)
    if (createError && isFormTypeCheckViolation(createError)) {
      const fallback = {
        ...insertBase,
        form_type: 'team',
        course_id: missingCourseId ? undefined : courseId,
      };
      if (missingCourseId) delete (fallback as { course_id?: string }).course_id;
      const retry = await authResult.supabase
        .from(siteApplicationsDb.forms)
        .insert([fallback])
        .select('*')
        .single();
      created = retry.data;
      createError = retry.error;
    }

    if (createError || !created) {
      console.error('Course application form create error:', createError);
      return NextResponse.json(
        { error: createError?.message || 'Başvuru formu oluşturulamadı' },
        { status: 500 }
      );
    }

    form = created as Record<string, unknown>;

    // Seed default fields
    const defaults = getDefaultFieldsForFormType('course');
    const fieldRows = defaults.map((field, index) => ({
      form_id: String(form!.id),
      field_key: field.field_key,
      field_type: field.field_type,
      label_tr: field.label_tr,
      label_en: field.label_en,
      placeholder_tr: field.placeholder_tr || null,
      placeholder_en: field.placeholder_en || null,
      required: Boolean(field.required),
      order_index: field.order_index ?? index,
      options: normalizeFieldOptions(field.options),
      is_contact: Boolean(field.is_contact),
    }));

    const { error: fieldsError } = await authResult.supabase
      .from(siteApplicationsDb.formFields)
      .insert(fieldRows);
    if (fieldsError) {
      console.warn('Course form default fields seed:', fieldsError.message);
    }
  }

  const { data: fields, error: fieldsError } = await authResult.supabase
    .from(siteApplicationsDb.formFields)
    .select('*')
    .eq('form_id', String(form.id))
    .order('order_index', { ascending: true });

  if (fieldsError) {
    return NextResponse.json({ error: fieldsError.message }, { status: 500 });
  }

  const publicUrlTr = getAbsoluteCourseApplicationPath('tr', course.slug);
  const publicUrlEn = getAbsoluteCourseApplicationPath('en', course.slug);

  return NextResponse.json({
    success: true,
    form: { ...form, form_type: 'course', course_id: form.course_id || courseId },
    fields: fields || [],
    course: { id: course.id, title: course.title, slug: course.slug },
    publicUrls: { tr: publicUrlTr, en: publicUrlEn },
    migrationHint: missingCourseId
      ? 'course_id kolonu yok — scripts/migrations/add-course-application-forms.sql çalıştırın'
      : null,
  });
}

/**
 * PATCH – Update course application form settings (publish flags, titles, etc.).
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id: courseId } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { data: course, error: courseError } = await authResult.supabase
    .from('myuni_courses')
    .select('id, title, slug')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError || !course) {
    return NextResponse.json({ error: courseError?.message || 'Kurs bulunamadı' }, { status: 404 });
  }

  const found = await findCourseForm(authResult.supabase, courseId, course.slug);
  if (!found.form) {
    return NextResponse.json({ error: 'Başvuru formu bulunamadı — önce GET ile oluşturun' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Prefer form_type=course when DB allows it; otherwise leave type alone (kurs-* slug identifies course)
  updates.form_type = 'course';

  if (body.title_tr !== undefined) updates.title_tr = String(body.title_tr).trim();
  if (body.title_en !== undefined) updates.title_en = String(body.title_en).trim();
  if (body.subtitle_tr !== undefined) updates.subtitle_tr = String(body.subtitle_tr || '').trim() || null;
  if (body.subtitle_en !== undefined) updates.subtitle_en = String(body.subtitle_en || '').trim() || null;
  if (body.success_message_tr !== undefined) {
    updates.success_message_tr = String(body.success_message_tr || '').trim() || null;
  }
  if (body.success_message_en !== undefined) {
    updates.success_message_en = String(body.success_message_en || '').trim() || null;
  }
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
  if (body.show_on_website !== undefined) updates.show_on_website = Boolean(body.show_on_website);
  if (body.allows_attachment !== undefined) updates.allows_attachment = Boolean(body.allows_attachment);

  // Publishing course form → always list on site path
  if (updates.is_active === true) {
    updates.show_on_website = true;
  }

  if (!found.missingCourseId) {
    updates.course_id = courseId;
    updates.event_id = null;
  }

  // Keep slugs aligned with course slug
  const slugs = buildCourseFormSlugs(course.slug);
  updates.slug_tr = slugs.slug_tr;
  updates.slug_en = slugs.slug_en;

  let { data, error } = await authResult.supabase
    .from(siteApplicationsDb.forms)
    .update(updates)
    .eq('id', String(found.form.id))
    .select('*')
    .single();

  if (error && isFormTypeCheckViolation(error)) {
    const lean = { ...updates };
    delete lean.form_type;
    const retry = await authResult.supabase
      .from(siteApplicationsDb.forms)
      .update(lean)
      .eq('id', String(found.form.id))
      .select('*')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error && isMissingCourseIdColumn(error)) {
    const lean = { ...updates };
    delete lean.course_id;
    delete lean.form_type;
    const retry = await authResult.supabase
      .from(siteApplicationsDb.forms)
      .update(lean)
      .eq('id', String(found.form.id))
      .select('*')
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    form: data,
    publicUrls: {
      tr: getAbsoluteCourseApplicationPath('tr', course.slug),
      en: getAbsoluteCourseApplicationPath('en', course.slug),
    },
  });
}

/**
 * PUT – Replace course application form fields (questions).
 * Body: { fields: SiteApplicationFormFieldInput[] }
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id: courseId } = await context.params;
  let body: { fields?: SiteApplicationFormFieldInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const fields = Array.isArray(body.fields) ? body.fields : [];
  if (fields.length === 0) {
    return NextResponse.json({ error: 'En az bir soru gerekli' }, { status: 400 });
  }

  const { data: course } = await authResult.supabase
    .from('myuni_courses')
    .select('id, slug')
    .eq('id', courseId)
    .maybeSingle();
  if (!course) {
    return NextResponse.json({ error: 'Kurs bulunamadı' }, { status: 404 });
  }

  const found = await findCourseForm(authResult.supabase, courseId, course.slug);
  if (!found.form) {
    return NextResponse.json({ error: 'Başvuru formu bulunamadı' }, { status: 404 });
  }

  const formId = String(found.form.id);

  // Backup then replace (same pattern as site-applications fields route)
  const { data: existing } = await authResult.supabase
    .from(siteApplicationsDb.formFields)
    .select('*')
    .eq('form_id', formId);

  const { error: deleteError } = await authResult.supabase
    .from(siteApplicationsDb.formFields)
    .delete()
    .eq('form_id', formId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const rows = fields.map((field, index) => ({
    form_id: formId,
    field_key: String(field.field_key || `field_${index + 1}`).trim(),
    field_type: field.field_type,
    label_tr: String(field.label_tr || '').trim(),
    label_en: String(field.label_en || field.label_tr || '').trim(),
    placeholder_tr: field.placeholder_tr?.trim() || null,
    placeholder_en: field.placeholder_en?.trim() || null,
    required: Boolean(field.required),
    order_index: field.order_index ?? index,
    options: normalizeFieldOptions(field.options),
    is_contact: Boolean(field.is_contact),
  }));

  const missingLabel = rows.find((r) => !r.label_tr);
  if (missingLabel) {
    // Restore backup
    if (existing?.length) {
      await authResult.supabase.from(siteApplicationsDb.formFields).insert(
        existing.map((row) => ({
          form_id: row.form_id,
          field_key: row.field_key,
          field_type: row.field_type,
          label_tr: row.label_tr,
          label_en: row.label_en,
          placeholder_tr: row.placeholder_tr,
          placeholder_en: row.placeholder_en,
          required: row.required,
          order_index: row.order_index,
          options: row.options,
          is_contact: row.is_contact,
        }))
      );
    }
    return NextResponse.json({ error: 'Her sorunun TR metni dolu olmalı' }, { status: 400 });
  }

  const { data: inserted, error: insertError } = await authResult.supabase
    .from(siteApplicationsDb.formFields)
    .insert(rows)
    .select('*');

  if (insertError) {
    if (existing?.length) {
      await authResult.supabase.from(siteApplicationsDb.formFields).insert(
        existing.map((row) => ({
          form_id: row.form_id,
          field_key: row.field_key,
          field_type: row.field_type,
          label_tr: row.label_tr,
          label_en: row.label_en,
          placeholder_tr: row.placeholder_tr,
          placeholder_en: row.placeholder_en,
          required: row.required,
          order_index: row.order_index,
          options: row.options,
          is_contact: row.is_contact,
        }))
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, fields: inserted || [] });
}
