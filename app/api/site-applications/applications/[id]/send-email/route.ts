import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import {
  requireSiteApplicationsOrEventsUser,
  resolveSiteApplicationsPanelOrganizationScope,
} from '@/app/api/site-applications/access/_helpers';
import {
  decryptSmtpPassword,
  normalizeSmtpPassword,
} from '@/app/_services/smtpEncryption';
import {
  assertEmailSendAllowed,
  auditApplicantEmail,
} from '@/app/lib/siteApplications/emailSendGuard';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireSiteApplicationsOrEventsUser('registrations');
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const rate = assertEmailSendAllowed({
    userId: authResult.userId,
    applicationId: id,
  });
  if (!rate.ok) {
    return NextResponse.json({ error: rate.error }, { status: rate.status });
  }

  const supabase = authResult.supabase;
  const body = await request.json();
  const { subject, body_text, body_html } = body;

  if (!subject || (!body_text && !body_html)) {
    return NextResponse.json({ error: 'subject and body required' }, { status: 400 });
  }

  if (typeof subject !== 'string' || subject.length > 200) {
    return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
  }
  const textLen = typeof body_text === 'string' ? body_text.length : 0;
  const htmlLen = typeof body_html === 'string' ? body_html.length : 0;
  if (textLen > 20_000 || htmlLen > 40_000) {
    return NextResponse.json({ error: 'Email body too large' }, { status: 400 });
  }

  // Get the application
  const { data: application } = await supabase
    .from(siteApplicationsDb.applications)
    .select('id, email, first_name, last_name, form_id, organization')
    .eq('id', id)
    .single();

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  if (!application.email) {
    return NextResponse.json({ error: 'Recipient has no email' }, { status: 400 });
  }

  // Resolve the user's panel org to find SMTP config
  const scope = await resolveSiteApplicationsPanelOrganizationScope(supabase, authResult.userId);
  let orgIds: string[] = [];
  if (scope.mode === 'all') {
    // Super admin: try to find org from the form's creator
    if (application.form_id) {
      const { data: form } = await supabase
        .from(siteApplicationsDb.forms)
        .select('created_by')
        .eq('id', application.form_id)
        .single();
      if (form?.created_by) {
        const { data: access } = await supabase
          .from('user_module_access')
          .select('panel_organization_id')
          .eq('clerk_user_id', form.created_by)
          .eq('is_enabled', true)
          .not('panel_organization_id', 'is', null)
          .limit(1);
        if (access?.[0]?.panel_organization_id) {
          orgIds = [access[0].panel_organization_id];
        }
      }
    }
  } else if (scope.mode === 'scoped') {
    orgIds = scope.panelOrganizationIds;
  }

  if (orgIds.length === 0) {
    return NextResponse.json({ error: 'No SMTP configuration found for your organization' }, { status: 400 });
  }

  // Get SMTP config
  const { data: config } = await supabase
    .from('org_smtp_configs')
    .select('*')
    .in('panel_organization_id', orgIds)
    .limit(1)
    .single();

  if (!config) {
    return NextResponse.json(
      { error: 'SMTP not configured. Please configure email settings first.' },
      { status: 404 }
    );
  }

  try {
    const password = normalizeSmtpPassword(
      decryptSmtpPassword(config.smtp_password_encrypted, config.panel_organization_id)
    );
    const port = Number(config.smtp_port) || 587;
    const secure = Boolean(config.smtp_secure) || port === 465;
    const transporter = nodemailer.createTransport({
      host: String(config.smtp_host || '').trim(),
      port,
      secure,
      auth: { user: String(config.smtp_user || '').trim(), pass: password },
      requireTLS: !secure && port === 587,
      tls: { rejectUnauthorized: false },
    });

    const from = config.from_name
      ? `"${String(config.from_name).replace(/"/g, '')}" <${config.smtp_user}>`
      : config.smtp_user;

    await transporter.sendMail({
      from,
      to: application.email,
      subject,
      text: body_text || undefined,
      html: body_html || undefined,
    });

    transporter.close();

    auditApplicantEmail({
      userId: authResult.userId,
      applicationId: id,
      to: application.email,
      subject: String(subject),
      success: true,
    });

    return NextResponse.json({ success: true, sent_to: application.email });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Mail sending failed';
    auditApplicantEmail({
      userId: authResult.userId,
      applicationId: id,
      to: application.email,
      subject: String(subject),
      success: false,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
