import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import {
  requireSiteApplicationsCapability,
  resolveSiteApplicationsPanelOrganizationScope,
} from '@/app/api/site-applications/access/_helpers';
import { decryptSmtpPassword } from '@/app/_services/smtpEncryption';

export async function POST(request: NextRequest) {
  const authResult = await requireSiteApplicationsCapability('forms');
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json();
  const { orgId, test_email } = body;

  const scope = await resolveSiteApplicationsPanelOrganizationScope(
    authResult.supabase,
    authResult.userId
  );

  let panelOrgId = orgId;
  if (!panelOrgId) {
    if (scope.mode === 'scoped' && scope.panelOrganizationIds.length > 0) {
      panelOrgId = scope.panelOrganizationIds[0];
    } else if (scope.mode === 'all') {
      const { data: row } = await authResult.supabase
        .from('user_module_access')
        .select('panel_organization_id')
        .eq('clerk_user_id', authResult.userId)
        .eq('is_enabled', true)
        .not('panel_organization_id', 'is', null)
        .limit(1)
        .single();
      panelOrgId = row?.panel_organization_id ?? null;
    }
  }

  if (!panelOrgId) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 });
  }

  const { data: config } = await authResult.supabase
    .from('org_smtp_configs')
    .select('*')
    .eq('panel_organization_id', panelOrgId)
    .single();

  if (!config) {
    return NextResponse.json({ error: 'SMTP not configured' }, { status: 404 });
  }

  try {
    const password = decryptSmtpPassword(config.smtp_password_encrypted);
    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure,
      auth: { user: config.smtp_user, pass: password },
      tls: { rejectUnauthorized: false },
    });

    const recipient = test_email || config.smtp_user;
    await transporter.sendMail({
      from: config.from_name
        ? `"${config.from_name}" <${config.smtp_user}>`
        : config.smtp_user,
      to: recipient,
      subject: 'SMTP Test - MyUNI',
      text: 'Bu bir test e-postasıdır. SMTP yapılandırmanız başarılı!',
      html: '<p>Bu bir test e-postasıdır. <strong>SMTP yapılandırmanız başarılı!</strong></p>',
    });

    transporter.close();

    // Mark as verified
    await authResult.supabase
      .from('org_smtp_configs')
      .update({ is_verified: true, updated_at: new Date().toISOString() })
      .eq('panel_organization_id', panelOrgId);

    return NextResponse.json({ success: true, sent_to: recipient });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
