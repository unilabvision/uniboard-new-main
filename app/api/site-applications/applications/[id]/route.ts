import { NextRequest, NextResponse } from 'next/server';
import {
  siteApplicationsDb,
  isEventSiteApplication,
  type SiteApplicationStatus,
} from '@/app/lib/siteApplications/config';
import {
  requireSiteApplicationsOrEventsUser,
  resolveSiteApplicationsTenantScope,
} from '@/app/api/site-applications/access/_helpers';
import { normalizeFieldOptions } from '@/app/lib/siteApplications/forms';
import { getSiteApplicationAttachmentUrl } from '@/app/lib/siteApplications/attachmentDownload';
import { parseSubmissionFileMeta } from '@/app/lib/siteApplications/files';
import { sendSiteApplicationApprovalEmail } from '@/app/_services/siteApplicationApprovalEmail';
import { ensureEventApplicationAccepted } from '@/app/lib/siteApplications/eventAutoAccept';
import { syncSingleApplicationPayment } from '@/app/lib/siteApplications/syncPayments';
import { deleteSiteApplication } from '@/app/lib/siteApplications/deleteApplication';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsOrEventsUser('registrations');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const tenantScope = await resolveSiteApplicationsTenantScope(
    authResult.supabase,
    authResult.userId || ''
  );

  // Side-effect (payment sync) işlemlerinden önce tenant scope doğrulaması.
  let verifyQuery = authResult.supabase
    .from(siteApplicationsDb.applications)
    .select('*')
    .eq('id', id);
  if (tenantScope.mode === 'none') {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }
  if (tenantScope.mode === 'scoped') {
    verifyQuery = verifyQuery.in('organization', tenantScope.allowedValues);
  }

  const { data: verified, error: verifyError } = await verifyQuery.maybeSingle();
  if (verifyError || !verified) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  await syncSingleApplicationPayment(authResult.supabase, id);

  let loadedQuery = authResult.supabase
    .from(siteApplicationsDb.applications)
    .select('*')
    .eq('id', id);
  if (tenantScope.mode === 'scoped') {
    loadedQuery = loadedQuery.in('organization', tenantScope.allowedValues);
  }

  const { data: loaded, error } = await loadedQuery.single();

  if (error || !loaded) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const application = await ensureEventApplicationAccepted(authResult.supabase, loaded);

  const { data: history } = await authResult.supabase
    .from(siteApplicationsDb.statusHistory)
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: false });

  let attachment_url: string | null = null;
  if (application.attachment_storage_path) {
    try {
      attachment_url = await getSiteApplicationAttachmentUrl(
        authResult.supabase,
        application.attachment_storage_path
      );
    } catch {
      attachment_url = null;
    }
  }

  const submission =
    application.submission_data && typeof application.submission_data === 'object'
      ? (application.submission_data as Record<string, unknown>)
      : {};

  const field_attachments: Array<{
    field_key: string;
    file_name: string;
    file_size?: number;
    mime_type?: string;
    storage_path: string;
    url: string | null;
  }> = [];

  for (const [fieldKey, raw] of Object.entries(submission)) {
    const meta = parseSubmissionFileMeta(raw);
    if (!meta) continue;
    let url: string | null = null;
    try {
      url = await getSiteApplicationAttachmentUrl(authResult.supabase, meta.storagePath);
    } catch {
      url = null;
    }
    field_attachments.push({
      field_key: fieldKey,
      file_name: meta.fileName,
      file_size: meta.fileSize,
      mime_type: meta.mimeType,
      storage_path: meta.storagePath,
      url,
    });
  }

  let form_fields: Array<{
    field_key: string;
    label_tr: string;
    label_en: string;
    order_index: number;
    field_type: string;
    options: unknown;
  }> = [];

  if (application.form_id) {
    const { data: fields } = await authResult.supabase!
      .from(siteApplicationsDb.formFields)
      .select('field_key, label_tr, label_en, order_index, field_type, options')
      .eq('form_id', application.form_id)
      .order('order_index', { ascending: true });
    form_fields = (fields ?? []).map((f) => ({
      ...f,
      options: normalizeFieldOptions(f.options),
    })) as typeof form_fields;
  }

  return NextResponse.json({
    application,
    history: history ?? [],
    attachment_url,
    field_attachments,
    form_fields,
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsOrEventsUser('registrations');
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json();
  const supabase = authResult.supabase;

  const tenantScope = await resolveSiteApplicationsTenantScope(
    supabase,
    authResult.userId || ''
  );

  if (tenantScope.mode === 'none') {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  let existingQuery = supabase
    .from(siteApplicationsDb.applications)
    .select('*')
    .eq('id', id);
  if (tenantScope.mode === 'scoped') {
    existingQuery = existingQuery.in('organization', tenantScope.allowedValues);
  }

  const { data: existing, error: loadError } = await existingQuery.single();

  if (loadError || !existing) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (body.admin_notes !== undefined) {
    updates.admin_notes = typeof body.admin_notes === 'string' ? body.admin_notes : null;
  }

  if (body.status !== undefined && body.status !== existing.status) {
    if (isEventSiteApplication(existing)) {
      return NextResponse.json(
        {
          error:
            'Etkinlik kayıtları otomatik onaylanır; durum admin tarafından değiştirilemez. Ödeme durumu paket bölümünden takip edilir.',
        },
        { status: 400 }
      );
    }

    const nextStatus = body.status as SiteApplicationStatus;

    updates.status = nextStatus;
    updates.reviewed_by = authResult.userId;
    updates.reviewed_by_email = body.reviewed_by_email || null;
    updates.reviewed_at = new Date().toISOString();

    const { error: historyError } = await supabase
      .from(siteApplicationsDb.statusHistory)
      .insert({
        application_id: id,
        old_status: existing.status,
        new_status: nextStatus,
        changed_by: authResult.userId,
        changed_by_email: body.reviewed_by_email || null,
      });

    if (historyError) {
      return NextResponse.json({ error: historyError.message }, { status: 500 });
    }
  }

  if (Object.keys(updates).length === 0) {
    const { data: history } = await supabase
      .from(siteApplicationsDb.statusHistory)
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ application: existing, history: history ?? [] });
  }

  let updateQuery = supabase
    .from(siteApplicationsDb.applications)
    .update(updates)
    .eq('id', id);
  if (tenantScope.mode === 'scoped') {
    updateQuery = updateQuery.in(
      'organization',
      tenantScope.allowedValues
    );
  }

  const { data, error } = await updateQuery.select('*').single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: history } = await supabase
    .from(siteApplicationsDb.statusHistory)
    .select('*')
    .eq('application_id', id)
    .order('created_at', { ascending: false });

  let approvalEmail: { success: boolean; error?: string } | null = null;
  if (
    body.status !== undefined &&
    body.status !== existing.status &&
    body.status === 'accepted' &&
    existing.status !== 'accepted'
  ) {
    approvalEmail = await sendSiteApplicationApprovalEmail({
      to: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      locale: data.locale === 'en' ? 'en' : 'tr',
      eventName: data.event_name,
      isEvent: isEventSiteApplication(data),
    });
  }

  return NextResponse.json({
    application: data,
    history: history ?? [],
    approval_email: approvalEmail,
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsOrEventsUser('registrations');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const tenantScope = await resolveSiteApplicationsTenantScope(
    authResult.supabase,
    authResult.userId || ''
  );

  // Tenant scope doğrulaması olmadan silme yapma.
  let verifyQuery = authResult.supabase
    .from(siteApplicationsDb.applications)
    .select('id, organization')
    .eq('id', id);
  if (tenantScope.mode === 'none') {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }
  if (tenantScope.mode === 'scoped') {
    verifyQuery = verifyQuery.in('organization', tenantScope.allowedValues);
  }

  const { data: existing, error: loadError } = await verifyQuery.maybeSingle();
  if (loadError || !existing) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const result = await deleteSiteApplication(authResult.supabase, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, id });
}
