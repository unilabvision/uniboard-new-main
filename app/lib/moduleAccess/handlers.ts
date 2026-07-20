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
  buildModuleAccessLinks,
  requireModuleAccessManager,
  searchClerkUsers,
  clerkErrorMessage,
  isClerkIdentifierExistsError,
} from '@/app/lib/moduleAccess/helpers';
import {
  createModuleGrantToken,
  withGrantToken,
} from '@/app/lib/moduleAccess/grantToken';

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

  const { panelUrl, loginUrl, signUpUrl } = buildModuleAccessLinks(
    locale,
    def.dashboardPath
  );
  // Davet mailindeki CTA: kayıtlı kullanıcı → giriş+panel; yeni → kayıt+panel
  // Asla Vercel preview URL kullanma (vercel.com login’e düşer)

  const attachGrant = (url: string, email: string) => {
    const token = createModuleGrantToken(email, def.primaryModuleKey);
    try {
      const u = new URL(url);
      const redirect = u.searchParams.get('redirect');
      if (redirect) {
        // grant, login sonrası panele taşınsın
        const redirectUrl = new URL(redirect, u.origin);
        redirectUrl.searchParams.set('grant', token);
        u.searchParams.set(
          'redirect',
          `${redirectUrl.pathname}${redirectUrl.search}`
        );
        return u.toString();
      }
    } catch {
      /* fall through */
    }
    return withGrantToken(url, token);
  };
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

    // Clerk daveti opsiyonel: kullanıcı zaten varsa / pending invitation varsa hata vermesin
    const clerk = await clerkClient();
    try {
      await clerk.invitations.createInvitation({
        emailAddress: targetEmail,
        redirectUrl: attachGrant(signUpUrl, targetEmail),
        publicMetadata: { pendingModule: def.primaryModuleKey },
        notify: false,
      });
    } catch (inviteErr) {
      console.warn('Clerk invitation skipped/failed:', clerkErrorMessage(inviteErr));

      // Kullanıcı aslında kayıtlıysa → erişim ver + giriş maili
      if (isClerkIdentifierExistsError(inviteErr)) {
        const existing = await findClerkUserByEmail(targetEmail);
        if (existing) {
          targetUserId = existing.id;
          targetEmail =
            existing.emailAddresses[0]?.emailAddress || targetEmail;
          targetName = targetName || displayClerkName(existing);
        }
      }
      // invitation already exists / redirect hatası → kendi mailimizi yine göndeririz
    }
  }

  // Yeni kullanıcı: panel kayıt daveti (Clerk invitation başarısız olsa bile)
  // Erişim satırı henüz yok → grant token ile kayıt sonrası claim edilir
  if (!targetUserId) {
    await sendModuleAccessEmail({
      to: targetEmail,
      name: targetName || targetEmail,
      locale,
      dashboardUrl: attachGrant(signUpUrl, targetEmail),
      moduleNameTr: def.nameTr,
      moduleNameEn: def.nameEn,
      invited: true,
    });

    return NextResponse.json({
      success: true,
      invited: true,
      message:
        locale === 'tr'
          ? 'Panel daveti e-postası gönderildi. Kullanıcı kayıt/giriş sonrası panele yönlendirilir.'
          : 'Panel invitation email sent. After sign-up/sign-in the user is redirected to the panel.',
    });
  }

  const clerk = await clerkClient();
  let clerkUser: Awaited<
    ReturnType<typeof findClerkUserByEmail>
  > =
    (
      await clerk.users.getUserList({
        userId: [targetUserId],
        limit: 1,
      })
    ).data[0] ?? null;

  if (!clerkUser && targetEmail) {
    clerkUser = await findClerkUserByEmail(targetEmail);
  }
  if (!clerkUser) {
    return NextResponse.json({ error: 'Clerk kullanıcısı bulunamadı.' }, { status: 404 });
  }

  targetUserId = clerkUser.id;
  targetEmail = targetEmail || clerkUser.emailAddresses[0]?.emailAddress || '';
  targetName = targetName || displayClerkName(clerkUser);

  await grantModuleAccess(authResult.supabase, targetUserId, def.primaryModuleKey);

  if (def.primaryModuleKey === 'internship' && addAsReviewer) {
    await upsertInternshipReviewer(authResult.supabase, targetUserId, targetEmail, targetName);
  }

  const extraNoteTr =
    def.primaryModuleKey === 'internship' && addAsReviewer
      ? 'Değerlendirici yetkileri de tanımlandı.'
      : def.primaryModuleKey === 'influencer'
        ? 'Panelde Kodlarım bölümünden kendi indirim kodlarınızı oluşturabilir ve kullanan e-postaları görebilirsiniz.'
        : '';
  const extraNoteEn =
    def.primaryModuleKey === 'internship' && addAsReviewer
      ? 'Reviewer permissions were also granted.'
      : def.primaryModuleKey === 'influencer'
        ? 'Use My Codes in the panel to create discount codes and see which emails used them.'
        : '';

  // Mevcut kullanıcıda da token ekle (yeniden login / cache sorunlarında claim fallback)
  await sendModuleAccessEmail({
    to: targetEmail,
    name: targetName,
    locale,
    dashboardUrl: attachGrant(loginUrl, targetEmail),
    moduleNameTr: def.nameTr,
    moduleNameEn: def.nameEn,
    invited: false,
    extraNoteTr,
    extraNoteEn,
  });

  return NextResponse.json({
    success: true,
    invited: false,
    panelUrl,
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

  const data = await searchClerkUsers(q, 15);
  const users = await Promise.all(data.map((u) => clerkUserToResult(u)));

  return NextResponse.json({ users, query: q });
}
