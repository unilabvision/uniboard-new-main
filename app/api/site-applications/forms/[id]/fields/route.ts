import { NextRequest, NextResponse } from 'next/server';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { requireEventFormsWriteUser } from '@/app/api/site-applications/access/_helpers';
import type { SiteApplicationFormFieldInput } from '@/app/types/siteApplicationForms';
import { normalizeFieldOptions } from '@/app/lib/siteApplications/forms';

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_TYPES = new Set([
  'text',
  'email',
  'tel',
  'textarea',
  'number',
  'date',
  'time',
  'url',
  'select',
  'checkbox',
  'dropdown',
  'linear_scale',
  'rating',
  'file',
]);

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: formId } = await context.params;
  const authResult = await requireEventFormsWriteUser();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json();
  const fields = (body.fields || []) as SiteApplicationFormFieldInput[];

  if (!Array.isArray(fields) || fields.length === 0) {
    return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
  }

  const keys = new Set<string>();
  for (const field of fields) {
    const key = field.field_key?.trim();
    if (!key) {
      return NextResponse.json({ error: 'Field key is required' }, { status: 400 });
    }
    if (keys.has(key)) {
      return NextResponse.json({ error: `Duplicate field key: ${key}` }, { status: 400 });
    }
    keys.add(key);
    if (!ALLOWED_TYPES.has(field.field_type)) {
      return NextResponse.json({ error: `Invalid field type: ${field.field_type}` }, { status: 400 });
    }
    if (!field.label_tr?.trim() || !field.label_en?.trim()) {
      return NextResponse.json({ error: 'Field labels are required' }, { status: 400 });
    }
    if (
      field.field_type === 'select' ||
      field.field_type === 'checkbox' ||
      field.field_type === 'dropdown' ||
      field.field_type === 'linear_scale' ||
      field.field_type === 'rating'
    ) {
      const options = normalizeFieldOptions(field.options);
      if (options.length === 0) {
        return NextResponse.json(
          { error: `Field "${key}" requires at least one option` },
          { status: 400 }
        );
      }
    }
  }

  const hasEmail = fields.some((f) => f.field_type === 'email');
  if (!hasEmail) {
    return NextResponse.json({ error: 'At least one email field is required' }, { status: 400 });
  }

  const supabase = authResult.supabase!;

  // Insert first, then delete old rows — never wipe questions if insert fails
  // (e.g. missing DB enum values for field_type).
  const { data: existing, error: existingError } = await supabase
    .from(siteApplicationsDb.formFields)
    .select('id')
    .eq('form_id', formId);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const rows = fields.map((field, index) => ({
    form_id: formId,
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
  }));

  const { data, error } = await supabase
    .from(siteApplicationsDb.formFields)
    .insert(rows)
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    const hint = /field_type|check constraint|invalid input|enum/i.test(error.message)
      ? ' — DB field_type enum may be outdated; run scripts/migrations/add-site-application-form-field-types.sql'
      : '';
    return NextResponse.json({ error: `${error.message}${hint}` }, { status: 500 });
  }

  const existingIds = (existing ?? []).map((row) => row.id).filter(Boolean);
  if (existingIds.length > 0) {
    const { error: deleteError } = await supabase
      .from(siteApplicationsDb.formFields)
      .delete()
      .in('id', existingIds);

    if (deleteError) {
      // New rows are live; old duplicates may remain until next save.
      console.error('Form fields cleanup failed:', deleteError.message);
    }
  }

  return NextResponse.json({ fields: data ?? [] });
}
