import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const slugColumn = locale === 'en' ? 'slug_en' : 'slug_tr';

    const supabase = getSupabase();
    const { data: form, error } = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .eq(slugColumn, slug)
      .eq('is_active', true)
      .single();

    if (error || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
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

    return NextResponse.json({ form: publicForm, locale });
  } catch (err) {
    console.error('Public form fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
