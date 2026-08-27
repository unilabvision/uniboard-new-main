import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import {
  requireSiteApplicationsCapability,
  resolveSiteApplicationsPanelOrganizationScope,
} from '@/app/api/site-applications/access/_helpers';
import {
  decryptSmtpPassword,
  normalizeSmtpPassword,
} from '@/app/_services/smtpEncryption';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSiteApplicationsCapability('forms');
    if (authResult.error || !authResult.supabase || !authResult.userId) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json().catch(() => ({}));
    const { orgId, test_email } = body as { orgId?: string; test_email?: string };

    const scope = await resolveSiteApplicationsPanelOrganizationScope(
      authResult.supabase,
      authResult.userId
    );

    let panelOrgId = typeof orgId === 'string' && orgId.trim() ? orgId.trim() : null;
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
          .maybeSingle();
        panelOrgId = row?.panel_organization_id ?? null;
      }
    }

    if (!panelOrgId) {
      return NextResponse.json(
        {
          error:
            'Organizasyon bulunamadı. Hesabınıza panel organizasyonu atanmış olmalı.',
        },
        { status: 400 }
      );
    }

    const { data: config, error: configError } = await authResult.supabase
      .from('org_smtp_configs')
      .select('*')
      .eq('panel_organization_id', panelOrgId)
      .maybeSingle();

    if (configError) {
      return NextResponse.json({ error: configError.message }, { status: 500 });
    }
    if (!config) {
      return NextResponse.json(
        { error: 'SMTP ayarları henüz kaydedilmemiş. Önce Kaydet’e basın.' },
        { status: 404 }
      );
    }

    let password: string;
    try {
      password = normalizeSmtpPassword(decryptSmtpPassword(config.smtp_password_encrypted));
    } catch (err: unknown) {
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : 'Kayıtlı şifre çözülemedi. Lütfen şifreyi yeniden kaydedin.',
        },
        { status: 500 }
      );
    }

    const port = Number(config.smtp_port) || 587;
    const secure = Boolean(config.smtp_secure) || port === 465;
    const transporter = nodemailer.createTransport({
      host: String(config.smtp_host || '').trim(),
      port,
      secure,
      auth: {
        user: String(config.smtp_user || '').trim(),
        pass: password,
      },
      requireTLS: !secure && port === 587,
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });

    const recipient =
      (typeof test_email === 'string' && test_email.trim()) || String(config.smtp_user);
    const from = config.from_name
      ? `"${String(config.from_name).replace(/"/g, '')}" <${config.smtp_user}>`
      : config.smtp_user;

    await transporter.sendMail({
      from,
      to: recipient,
      subject: 'SMTP Test - MyUNI',
      text: 'Bu bir test e-postasıdır. SMTP yapılandırmanız başarılı!',
      html: '<p>Bu bir test e-postasıdır. <strong>SMTP yapılandırmanız başarılı!</strong></p>',
    });

    transporter.close();

    await authResult.supabase
      .from('org_smtp_configs')
      .update({ is_verified: true, updated_at: new Date().toISOString() })
      .eq('panel_organization_id', panelOrgId);

    return NextResponse.json({ success: true, sent_to: recipient });
  } catch (err: unknown) {
    console.error('SMTP test error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
