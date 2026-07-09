import { NextRequest, NextResponse } from 'next/server';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { inferFormType } from '@/app/lib/siteApplications/formTypes';
import {
  requireSiteApplicationsModuleUser,
  requireSiteApplicationsSuperAdmin,
} from '@/app/api/site-applications/access/_helpers';
import type { SiteApplicationFormInput } from '@/app/types/siteApplicationForms';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsModuleUser();
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

  return NextResponse.json({
    form: { ...form, fields: fields ?? [], form_type: inferFormType(form) },
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsSuperAdmin();
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

  const { data, error } = await authResult.supabase!
    .from(siteApplicationsDb.forms)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ form: data });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsSuperAdmin();
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
