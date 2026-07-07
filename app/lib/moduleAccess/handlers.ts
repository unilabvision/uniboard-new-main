import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendModuleAccessEmail } from '@/app/_services/moduleAccessEmail';
import { internshipDb } from '@/app/lib/internship/config';
import {
  isEmailQuery,
  isValidAccessSearchQuery,
  normalizeEmail,
  displayClerkName,
} from '@/app/lib/internship/accessQuery';
import type { ModuleAccessDefinition } from '@/app/lib/moduleAccess/registry';
import {
  clerkUserToResult,
  findClerkUserByEmail,
  getAppBaseUrl,
  requireModuleAccessManager,
} from '@/app/lib/moduleAccess/helpers';

async function grantModuleAccess(
  supabase: SupabaseClient,
  clerkUserId: string,
  primaryModuleKey: string
) {
  const { data: existing } = await supabase
    .from('user_module_access')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .eq('module_key', primaryModuleKey)
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
      module_key: primaryModuleKey,
      is_enabled: true,
      is_super_admin: false,
      granted_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

async function upsertInternshipReviewer(
  supabase: SupabaseClient,
  clerkUserId: string,
  email: string,
  name: string
) {
  const { data: existing } = await supabase
    .from(internshipDb.reviewers)
    .select('id')
    .eq('clerk_id', clerkUserId)
    .maybeSingle();

  const row = {
    clerk_id: clerkUserId,
    email,
    name,
    role: 'hr_reviewer',
    is_active: true,
    can_vote: true,
    can_change_status: true,
    can_add_notes: true,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await supabase.from(internshipDb.reviewers).update(row).eq('id', existing.id);
  } else {
    await supabase.from(internshipDb.reviewers).insert(row);
  }
}

export async function listModuleAccessMembers(def: ModuleAccessDefinition) {
  const authResult = await requireModuleAccessManager(def);
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { data: accessRows, error } = await authResult.supabase
    .from('user_module_access')
    .select('id, clerk_user_id, module_key, is_enabled, is_super_admin, granted_at')
    .in('module_key', def.moduleKeys)
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
  const userMap: Record<string, { name: string; email: string; imageUrl: string | null }> =
    {};

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
}

export async function grantModuleAccessMember(
  def: ModuleAccessDefinition,
  request: NextRequest
) {
  const authResult = await requireModuleAccessManager(def);
  if (authResult.error || !authResult.supabase || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json();
  const {
    clerkUserId,
    email: rawEmail,
    name: rawName,
    addAsReviewer = false,
    locale = 'tr',
  } = body as {
    clerkUserId?: string;
    email?: string;
    name?: string;
    addAsReviewer?: boolean;
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

  const appUrl = getAppBaseUrl();
  const dashboardUrl = `${appUrl}/${locale}/${def.dashboardPath}`;

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
      publicMetadata: { pendingModule: def.primaryModuleKey },
    });

    await sendModuleAccessEmail({
      to: targetEmail,
      name: targetName || targetEmail,
      locale,
      dashboardUrl,
      moduleNameTr: def.nameTr,
      moduleNameEn: def.nameEn,
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

  await grantModuleAccess(authResult.supabase, targetUserId, def.primaryModuleKey);

  if (def.primaryModuleKey === 'internship' && addAsReviewer) {
    await upsertInternshipReviewer(authResult.supabase, targetUserId, targetEmail, targetName);
  }

  const extraNoteTr =
    def.primaryModuleKey === 'internship' && addAsReviewer
      ? 'Değerlendirici yetkileri de tanımlandı.'
      : '';
  const extraNoteEn =
    def.primaryModuleKey === 'internship' && addAsReviewer
      ? 'Reviewer permissions were also granted.'
      : '';

  await sendModuleAccessEmail({
    to: targetEmail,
    name: targetName,
    locale,
    dashboardUrl,
    moduleNameTr: def.nameTr,
    moduleNameEn: def.nameEn,
    invited: false,
    extraNoteTr,
    extraNoteEn,
  });

  return NextResponse.json({
    success: true,
    invited: false,
    user: await clerkUserToResult(clerkUser),
    addAsReviewer: def.primaryModuleKey === 'internship' ? addAsReviewer : undefined,
  });
}

export async function revokeModuleAccessMember(
  def: ModuleAccessDefinition,
  request: NextRequest
) {
  const authResult = await requireModuleAccessManager(def);
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const clerkUserId = request.nextUrl.searchParams.get('clerkUserId');
  if (!clerkUserId) {
    return NextResponse.json({ error: 'clerkUserId required' }, { status: 400 });
  }

  const { error } = await authResult.supabase
    .from('user_module_access')
    .update({ is_enabled: false })
    .eq('clerk_user_id', clerkUserId)
    .in('module_key', def.moduleKeys);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function searchModuleAccessUsers(
  def: ModuleAccessDefinition,
  request: NextRequest
) {
  const authResult = await requireModuleAccessManager(def);
  if (authResult.error || !authResult.userId) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const q = (request.nextUrl.searchParams.get('q') || '').trim();
  if (!isValidAccessSearchQuery(q)) {
    return NextResponse.json(
      {
        error: 'Geçersiz arama. Yalnızca isim veya e-posta girin (en az 2 karakter).',
      },
      { status: 400 }
    );
  }

  const clerk = await clerkClient();
  const { data } = isEmailQuery(q)
    ? await clerk.users.getUserList({ emailAddress: [q.toLowerCase()], limit: 10 })
    : await clerk.users.getUserList({ query: q, limit: 10 });

  const users = await Promise.all(data.map((u) => clerkUserToResult(u)));

  return NextResponse.json({ users, query: q });
}
