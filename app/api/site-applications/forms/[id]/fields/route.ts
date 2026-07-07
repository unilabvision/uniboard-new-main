import { NextRequest, NextResponse } from 'next/server';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { requireSiteApplicationsSuperAdmin } from '@/app/api/site-applications/access/_helpers';
import type { SiteApplicationFormFieldInput } from '@/app/types/siteApplicationForms';

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_TYPES = new Set([
  'text',
  'email',
  'tel',
  'textarea',
  'number',
  'date',
  'url',
  'select',
]);

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: formId } = await context.params;
  const authResult = await requireSiteApplicationsSuperAdmin();
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
  }

  const hasEmail = fields.some((f) => f.field_type === 'email');
  if (!hasEmail) {
    return NextResponse.json({ error: 'At least one email field is required' }, { status: 400 });
  }

  const supabase = authResult.supabase!;
  const { error: deleteError } = await supabase
    .from(siteApplicationsDb.formFields)
    .delete()
    .eq('form_id', formId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
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
    options: field.options ?? [],
    is_contact: field.is_contact ?? false,
  }));

  const { data, error } = await supabase
    .from(siteApplicationsDb.formFields)
    .insert(rows)
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ fields: data ?? [] });
}
