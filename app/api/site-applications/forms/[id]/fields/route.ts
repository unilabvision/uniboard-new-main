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

type FieldBackupRow = {
  form_id: string;
  field_key: string;
  field_type: string;
  label_tr: string;
  label_en: string;
  placeholder_tr: string | null;
  placeholder_en: string | null;
  required: boolean;
  order_index: number;
  options: unknown;
  is_contact: boolean;
};

function toInsertRow(
  field: {
    field_key: string;
    field_type: string;
    label_tr: string;
    label_en: string;
    placeholder_tr?: string | null;
    placeholder_en?: string | null;
    required?: boolean;
    order_index?: number;
    options?: unknown;
    is_contact?: boolean;
  },
  formId: string,
  index: number
) {
  return {
    form_id: formId,
    field_key: field.field_key,
    field_type: field.field_type,
    label_tr: field.label_tr,
    label_en: field.label_en,
    placeholder_tr: field.placeholder_tr?.trim?.() || field.placeholder_tr || null,
    placeholder_en: field.placeholder_en?.trim?.() || field.placeholder_en || null,
    required: field.required ?? false,
    order_index: field.order_index ?? index,
    options: normalizeFieldOptions(field.options),
    is_contact: field.is_contact ?? false,
  };
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: formId } = await context.params;
  const authResult = await requireEventFormsWriteUser();
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json();
  const rawFields = (body.fields || []) as SiteApplicationFormFieldInput[];

  // Panel often fills TR only — mirror to EN so DB + myunilab stay in sync
  const fields = rawFields.map((field) => {
    const labelTr = field.label_tr?.trim() || '';
    const labelEn = field.label_en?.trim() || labelTr;
    return {
      ...field,
      label_tr: labelTr,
      label_en: labelEn,
      field_key: field.field_key?.trim() || '',
    };
  });

  if (!Array.isArray(fields) || fields.length === 0) {
    return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
  }

  const keys = new Set<string>();
  for (const field of fields) {
    const key = field.field_key;
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
    if (!field.label_tr || !field.label_en) {
      return NextResponse.json(
        { error: 'Her sorunun TR (ve mümkünse EN) metni gerekli' },
        { status: 400 }
      );
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

  const { data: formRow, error: formLookupError } = await supabase
    .from(siteApplicationsDb.forms)
    .select('id')
    .eq('id', formId)
    .maybeSingle();

  if (formLookupError) {
    return NextResponse.json({ error: formLookupError.message }, { status: 500 });
  }
  if (!formRow) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }

  // Backup full rows first. Unique(form_id, field_key) means we must delete
  // before insert — if insert fails we restore the backup.
  const { data: existing, error: existingError } = await supabase
    .from(siteApplicationsDb.formFields)
    .select(
      'form_id, field_key, field_type, label_tr, label_en, placeholder_tr, placeholder_en, required, order_index, options, is_contact'
    )
    .eq('form_id', formId)
    .order('order_index', { ascending: true });

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const backup: FieldBackupRow[] = (existing ?? []).map((row, index) =>
    toInsertRow(row as FieldBackupRow, formId, index)
  );

  const { error: deleteError } = await supabase
    .from(siteApplicationsDb.formFields)
    .delete()
    .eq('form_id', formId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const rows = fields.map((field, index) => toInsertRow(field, formId, index));

  const { data, error } = await supabase
    .from(siteApplicationsDb.formFields)
    .insert(rows)
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    if (backup.length > 0) {
      const { error: restoreError } = await supabase
        .from(siteApplicationsDb.formFields)
        .insert(backup);
      if (restoreError) {
        console.error('Form fields restore failed:', restoreError.message);
      }
    }

    const hint = /field_type|check constraint|invalid input|enum/i.test(error.message)
      ? ' — DB field_type enum may be outdated; run scripts/migrations/add-site-application-form-field-types.sql'
      : '';
    return NextResponse.json({ error: `${error.message}${hint}` }, { status: 500 });
  }

  // Touch parent form so SQL updated_at + public "latest form" queries stay in sync
  const { error: touchError } = await supabase
    .from(siteApplicationsDb.forms)
    .update({ updated_at: new Date().toISOString() })
    .eq('id', formId);

  if (touchError) {
    console.error('Form updated_at touch failed:', touchError.message);
  }

  return NextResponse.json({
    form_id: formId,
    fields: data ?? [],
    synced: true,
    field_count: (data ?? []).length,
  });
}
