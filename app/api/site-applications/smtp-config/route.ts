import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import {
  requireSiteApplicationsCapability,
  resolvePanelOrganizationIdForWrite,
  getServiceSupabase,
} from '@/app/api/site-applications/access/_helpers';
import {
  encryptSmtpPasswordWithOrgKey,
  decryptSmtpPassword,
  hasStoredOrgProtectionKey,
  normalizeSmtpPassword,
  unwrapOrgProtectionKey,
  isOrgSmtpBlob,
} from '@/app/_services/smtpEncryption';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveOrgId(supabase: ReturnType<typeof getServiceSupabase>, userId: string) {
  return resolvePanelOrganizationIdForWrite(supabase, userId);
}

function buildTransporter(opts: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}) {
  const port = opts.port || 587;
  const secure = opts.secure || port === 465;
  return nodemailer.createTransport({
    host: opts.host.trim(),
    port,
    secure,
    auth: {
      user: opts.user.trim(),
      pass: opts.pass,
    },
    requireTLS: !secure && port === 587,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

export async function GET(request: NextRequest) {
  const authResult = await requireSiteApplicationsCapability('forms');
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const orgId =
    request.nextUrl.searchParams.get('orgId') ||
    (await resolveOrgId(authResult.supabase, authResult.userId));

  if (!orgId) {
    return NextResponse.json(
      {
        error:
          'Organizasyon bulunamadı. Hesabınıza panel organizasyonu atanmış olmalı (Yetkilendirme).',
      },
      { status: 400 }
    );
  }

  const { data } = await authResult.supabase
    .from('org_smtp_configs')
    .select(
      'id, panel_organization_id, smtp_host, smtp_port, smtp_secure, smtp_user, from_name, is_verified, updated_at, smtp_password_encrypted'
    )
    .eq('panel_organization_id', orgId)
    .maybeSingle();

  const hasProtectionKey = hasStoredOrgProtectionKey(data?.smtp_password_encrypted);
  const legacyEncryption = Boolean(data?.smtp_password_encrypted) && !hasProtectionKey;

  return NextResponse.json({
    config: data
      ? {
          id: data.id,
          panel_organization_id: data.panel_organization_id,
          smtp_host: data.smtp_host,
          smtp_port: data.smtp_port,
          smtp_secure: data.smtp_secure,
          smtp_user: data.smtp_user,
          from_name: data.from_name,
          is_verified: data.is_verified,
          updated_at: data.updated_at,
        }
      : null,
    has_password: Boolean(data?.smtp_password_encrypted),
    has_protection_key: hasProtectionKey,
    needs_protection_key_reentry: legacyEncryption,
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSiteApplicationsCapability('forms');
    if (authResult.error || !authResult.supabase || !authResult.userId) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    const {
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_user,
      smtp_password,
      from_name,
      protection_key,
      orgId,
    } = body;

    const host = String(smtp_host || '').trim();
    const user = String(smtp_user || '').trim();
    const fromName = String(from_name || '').trim();
    const portNum = Number.parseInt(String(smtp_port ?? 587), 10) || 587;
    const secureFlag = Boolean(smtp_secure) || portNum === 465;
    const passwordRaw = typeof smtp_password === 'string' ? smtp_password : '';
    const password = normalizeSmtpPassword(passwordRaw);
    const protectionKeyInput =
      typeof protection_key === 'string' ? protection_key.trim() : '';

    if (!host || !user) {
      return NextResponse.json(
        { error: 'SMTP sunucu (host) ve gönderen e-posta zorunludur.' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user)) {
      return NextResponse.json(
        { error: 'Gönderen e-posta adresi geçersiz görünüyor.' },
        { status: 400 }
      );
    }

    const panelOrgId =
      (typeof orgId === 'string' && orgId.trim()) ||
      (await resolveOrgId(authResult.supabase, authResult.userId));

    if (!panelOrgId) {
      return NextResponse.json(
        {
          error:
            'Organizasyon bulunamadı. Hesabınıza panel organizasyonu atanmış olmalı (Yetkilendirme).',
        },
        { status: 400 }
      );
    }

    if (!UUID_RE.test(String(panelOrgId))) {
      return NextResponse.json(
        {
          error:
            'Organizasyon kimliği geçersiz. Yetkilendirme kaydındaki panel_organization_id UUID olmalı.',
        },
        { status: 400 }
      );
    }

    const { data: existing } = await authResult.supabase
      .from('org_smtp_configs')
      .select('smtp_password_encrypted, is_verified')
      .eq('panel_organization_id', panelOrgId)
      .maybeSingle();

    const existingBlob = existing?.smtp_password_encrypted
      ? String(existing.smtp_password_encrypted)
      : '';

    // Resolve protection key: new input, or unwrap from existing orgv1 blob
    let protectionKey = protectionKeyInput;
    if (!protectionKey) {
      if (isOrgSmtpBlob(existingBlob)) {
        try {
          protectionKey = unwrapOrgProtectionKey(existingBlob, panelOrgId);
        } catch {
          return NextResponse.json(
            {
              error:
                'Kayıtlı veri koruma anahtarı okunamadı. Lütfen “Veri koruma anahtarı” alanını tekrar girin.',
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error:
              'Veri koruma anahtarı zorunlu. Kurumunuza özel bir anahtar belirleyin (en az 8 karakter). MyUNI sunucu anahtarından bağımsızdır.',
          },
          { status: 400 }
        );
      }
    }

    if (protectionKey.length < 8) {
      return NextResponse.json(
        { error: 'Veri koruma anahtarı en az 8 karakter olmalı.' },
        { status: 400 }
      );
    }

    // Resolve SMTP password plaintext
    let passwordToStore = password;
    if (!passwordToStore) {
      if (!existingBlob) {
        return NextResponse.json(
          { error: 'Şifre / uygulama parolası zorunludur.' },
          { status: 400 }
        );
      }
      try {
        passwordToStore = normalizeSmtpPassword(
          decryptSmtpPassword(existingBlob, panelOrgId)
        );
      } catch {
        return NextResponse.json(
          {
            error:
              'Kayıtlı SMTP şifresi çözülemedi. App Password’ü ve veri koruma anahtarını yeniden girin.',
          },
          { status: 400 }
        );
      }
    }

    let isVerified = false;
    let verifyError: string | null = null;
    try {
      const transporter = buildTransporter({
        host,
        port: portNum,
        secure: secureFlag,
        user,
        pass: passwordToStore,
      });
      await transporter.verify();
      isVerified = true;
      transporter.close();
    } catch (err: unknown) {
      verifyError = err instanceof Error ? err.message : 'SMTP bağlantısı doğrulanamadı';
      isVerified = false;
    }

    let encrypted: string;
    try {
      encrypted = encryptSmtpPasswordWithOrgKey(
        passwordToStore,
        protectionKey,
        panelOrgId
      );
    } catch (err: unknown) {
      return NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : 'SMTP şifresi şifrelenemedi.',
        },
        { status: 500 }
      );
    }

    const { data, error } = await authResult.supabase
      .from('org_smtp_configs')
      .upsert(
        {
          panel_organization_id: panelOrgId,
          smtp_host: host,
          smtp_port: portNum,
          smtp_secure: secureFlag,
          smtp_user: user,
          smtp_password_encrypted: encrypted,
          from_name: fromName,
          is_verified: isVerified,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'panel_organization_id' }
      )
      .select(
        'id, panel_organization_id, smtp_host, smtp_port, smtp_secure, smtp_user, from_name, is_verified'
      )
      .single();

    if (error) {
      console.error('org_smtp_configs upsert error:', error);
      return NextResponse.json(
        { error: error.message || 'SMTP ayarları kaydedilemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      config: data,
      verified: isVerified,
      verifyError,
      has_protection_key: true,
    });
  } catch (err: unknown) {
    console.error('SMTP config POST error:', err);
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
