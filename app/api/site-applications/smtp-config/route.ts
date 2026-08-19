import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import {
  requireSiteApplicationsCapability,
  resolveSiteApplicationsPanelOrganizationScope,
  getServiceSupabase,
} from '@/app/api/site-applications/access/_helpers';
import { encryptSmtpPassword } from '@/app/_services/smtpEncryption';

async function resolveOrgId(supabase: ReturnType<typeof getServiceSupabase>, userId: string) {
  const scope = await resolveSiteApplicationsPanelOrganizationScope(supabase, userId);
  if (scope.mode === 'none') return null;
  if (scope.mode === 'scoped') return scope.panelOrganizationIds[0] ?? null;
  // Super admin: look up their own panel_organization_id from user_module_access
  const { data: row } = await supabase
    .from('user_module_access')
    .select('panel_organization_id')
    .eq('clerk_user_id', userId)
    .eq('is_enabled', true)
    .not('panel_organization_id', 'is', null)
    .limit(1)
    .single();
  return row?.panel_organization_id ?? null;
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
    return NextResponse.json({ error: 'No organization found' }, { status: 400 });
  }

  const { data } = await authResult.supabase
    .from('org_smtp_configs')
    .select('id, panel_organization_id, smtp_host, smtp_port, smtp_secure, smtp_user, from_name, is_verified, updated_at')
    .eq('panel_organization_id', orgId)
    .single();

  return NextResponse.json({ config: data || null });
}

export async function POST(request: NextRequest) {
  const authResult = await requireSiteApplicationsCapability('forms');
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json();
  const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, from_name, orgId } = body;

  if (!smtp_host || !smtp_user || !smtp_password) {
    return NextResponse.json({ error: 'smtp_host, smtp_user, smtp_password required' }, { status: 400 });
  }

  const panelOrgId =
    orgId || (await resolveOrgId(authResult.supabase, authResult.userId));

  if (!panelOrgId) {
    return NextResponse.json({ error: 'No organization found' }, { status: 400 });
  }

  // Verify SMTP connection
  let isVerified = false;
  try {
    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: smtp_port || 587,
      secure: smtp_secure || false,
      auth: { user: smtp_user, pass: smtp_password },
      tls: { rejectUnauthorized: false },
    });
    await transporter.verify();
    isVerified = true;
    transporter.close();
  } catch {
    // Connection failed but we still save the config
  }

  const encrypted = encryptSmtpPassword(smtp_password);

  const { data, error } = await authResult.supabase
    .from('org_smtp_configs')
    .upsert(
      {
        panel_organization_id: panelOrgId,
        smtp_host,
        smtp_port: smtp_port || 587,
        smtp_secure: smtp_secure || false,
        smtp_user,
        smtp_password_encrypted: encrypted,
        from_name: from_name || '',
        is_verified: isVerified,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'panel_organization_id' }
    )
    .select('id, panel_organization_id, smtp_host, smtp_port, smtp_secure, smtp_user, from_name, is_verified')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data, verified: isVerified });
}
