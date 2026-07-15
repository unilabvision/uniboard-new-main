import { NextRequest, NextResponse } from 'next/server';
import {
  siteApplicationsDb,
  isEventSiteApplication,
  type SiteApplicationStatus,
} from '@/app/lib/siteApplications/config';
import { requireSiteApplicationsModuleUser } from '@/app/api/site-applications/access/_helpers';
import { getSiteApplicationAttachmentUrl } from '@/app/lib/siteApplications/attachmentDownload';
import { sendSiteApplicationApprovalEmail } from '@/app/_services/siteApplicationApprovalEmail';
import { ensureEventApplicationAccepted } from '@/app/lib/siteApplications/eventAutoAccept';
import { syncSingleApplicationPayment } from '@/app/lib/siteApplications/syncPayments';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsModuleUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  await syncSingleApplicationPayment(authResult.supabase, id);

  const { data: loaded, error } = await authResult.supabase
    .from(siteApplicationsDb.applications)
    .select('*')
    .eq('id', id)
    .single();

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

  return NextResponse.json({
    application,
    history: history ?? [],
    attachment_url,
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsModuleUser();
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json();
  const supabase = authResult.supabase;

  const { data: existing, error: loadError } = await supabase
    .from(siteApplicationsDb.applications)
    .select('*')
    .eq('id', id)
    .single();

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

  const { data, error } = await supabase
    .from(siteApplicationsDb.applications)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

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
