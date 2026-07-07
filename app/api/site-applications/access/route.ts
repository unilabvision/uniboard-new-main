import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isEmailQuery,
  isValidAccessSearchQuery,
  normalizeEmail,
  displayClerkName,
} from '@/app/lib/internship/accessQuery';
import { sendSiteApplicationsAccessInviteEmail } from '@/app/_services/siteApplicationsAccessEmail';
import {
  SITE_APPS_MODULE_KEYS,
  clerkUserToResult,
  findClerkUserByEmail,
  requireSiteApplicationsAccessManager,
} from './_helpers';

async function grantModuleAccess(supabase: SupabaseClient, clerkUserId: string) {
  const { data: existing } = await supabase
    .from('user_module_access')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .eq('module_key', 'site-applications')
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from('user_module_access')
      .update({ is_enabled: true, granted_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('user_module_access').insert({
      clerk_user_id: clerkUserId,
      module_key: 'site-applications',
      is_enabled: true,
      is_super_admin: false,
      granted_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

export async function GET() {
  try {
    const authResult = await requireSiteApplicationsAccessManager();
    if (authResult.error || !authResult.supabase) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { data: accessRows, error } = await authResult.supabase
      .from('user_module_access')
      .select('id, clerk_user_id, module_key, is_enabled, is_super_admin, granted_at')
      .in('module_key', SITE_APPS_MODULE_KEYS)
      .eq('is_enabled', true)
      .order('granted_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const seen = new Set<string>();
    const uniqueRows = (accessRows ?? []).filter((row) => {
      if (seen.has(row.clerk_user_id)) return false;
      seen.add(row.clerk_user_id);
      return true;
    });

    const clerkIds = uniqueRows.map((r) => r.clerk_user_id);
    const clerk = await clerkClient();
    const userMap: Record<
      string,
      { name: string; email: string; imageUrl: string | null }
    > = {};

    for (let i = 0; i < clerkIds.length; i += 100) {
      const chunk = clerkIds.slice(i, i + 100);
      const { data: users } = await clerk.users.getUserList({
        userId: chunk,
        limit: 100,
      });
      for (const u of users) {
        userMap[u.id] = {
          name: displayClerkName(u),
          email: u.emailAddresses[0]?.emailAddress || '',
          imageUrl: u.imageUrl,
        };
      }
    }

    const members = uniqueRows.map((row) => ({
      ...row,
      ...(userMap[row.clerk_user_id] || { name: '—', email: '—', imageUrl: null }),
    }));

    return NextResponse.json({ members });
  } catch (err) {
    console.error('Site applications access list error:', err);
    return NextResponse.json({ error: 'Failed to list access' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSiteApplicationsAccessManager();
    if (authResult.error || !authResult.supabase || !authResult.userId) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const {
      clerkUserId,
      email: rawEmail,
      name: rawName,
      locale = 'tr',
    } = body as {
      clerkUserId?: string;
      email?: string;
      name?: string;
      locale?: string;
    };

    let targetUserId = clerkUserId?.trim();
    let targetEmail = rawEmail ? normalizeEmail(rawEmail) : '';
    let targetName = typeof rawName === 'string' ? rawName.trim() : '';

    if (!targetUserId && targetEmail) {
      if (!isEmailQuery(targetEmail)) {
        return NextResponse.json({ error: 'Geçerli bir e-posta girin.' }, { status: 400 });
      }
      const found = await findClerkUserByEmail(targetEmail);
      if (found) {
        targetUserId = found.id;
        targetEmail = found.emailAddresses[0]?.emailAddress || targetEmail;
        targetName = targetName || displayClerkName(found);
      }
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? process.env.VERCEL_URL.startsWith('http')
          ? process.env.VERCEL_URL
          : `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000');

    const dashboardUrl = `${appUrl}/${locale}/site-applications`;

    if (!targetUserId) {
      const query = targetEmail || targetName;
      if (!query || !isValidAccessSearchQuery(query)) {
        return NextResponse.json(
          { error: 'Kullanıcı seçin veya geçerli e-posta/isim girin.' },
          { status: 400 }
        );
      }

      if (!isEmailQuery(targetEmail)) {
        return NextResponse.json(
          {
            error:
              "Bu kullanıcı Clerk'te bulunamadı. Davet için tam e-posta adresi girin.",
          },
          { status: 404 }
        );
      }

      const clerk = await clerkClient();
      await clerk.invitations.createInvitation({
        emailAddress: targetEmail,
        redirectUrl: dashboardUrl,
        publicMetadata: { pendingModule: 'site-applications' },
      });

      await sendSiteApplicationsAccessInviteEmail({
        to: targetEmail,
        name: targetName || targetEmail,
        locale,
        dashboardUrl,
        invited: true,
      });

      return NextResponse.json({
        success: true,
        invited: true,
        message:
          locale === 'tr'
            ? 'Clerk davet e-postası gönderildi. Kullanıcı kayıt olduktan sonra erişimi tekrar onaylayın.'
            : 'Clerk invitation sent. Grant access again after the user registers.',
      });
    }

    const clerk = await clerkClient();
    const { data: clerkUsers } = await clerk.users.getUserList({
      userId: [targetUserId],
      limit: 1,
    });
    const clerkUser = clerkUsers[0];
    if (!clerkUser) {
      return NextResponse.json({ error: 'Clerk kullanıcısı bulunamadı.' }, { status: 404 });
    }

    targetEmail = targetEmail || clerkUser.emailAddresses[0]?.emailAddress || '';
    targetName = targetName || displayClerkName(clerkUser);

    await grantModuleAccess(authResult.supabase, targetUserId);

    await sendSiteApplicationsAccessInviteEmail({
      to: targetEmail,
      name: targetName,
      locale,
      dashboardUrl,
      invited: false,
    });

    return NextResponse.json({
      success: true,
      invited: false,
      user: await clerkUserToResult(clerkUser),
    });
  } catch (err) {
    console.error('Site applications access grant error:', err);
    return NextResponse.json({ error: 'Grant failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireSiteApplicationsAccessManager();
    if (authResult.error || !authResult.supabase) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const clerkUserId = request.nextUrl.searchParams.get('clerkUserId');
    if (!clerkUserId) {
      return NextResponse.json({ error: 'clerkUserId required' }, { status: 400 });
    }

    const { error } = await authResult.supabase
      .from('user_module_access')
      .update({ is_enabled: false })
      .eq('clerk_user_id', clerkUserId)
      .in('module_key', SITE_APPS_MODULE_KEYS);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Site applications access revoke error:', err);
    return NextResponse.json({ error: 'Revoke failed' }, { status: 500 });
  }
}
