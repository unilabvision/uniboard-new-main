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
  assertCanGrantToOrg,
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
import {
  clampCapabilitiesToLevel,
  decodeCapabilitiesFromRow,
  encodeCapabilitiesNotes,
  parseAccessLevelInput,
  type AccessLevel,
} from '@/app/lib/moduleAccess/rbac';

async function grantModuleAccess(
  supabase: SupabaseClient,
  clerkUserId: string,
  primaryModuleKey: string,
  options: {
    capabilities?: string[] | null;
    accessLevel?: AccessLevel | null;
    panelOrganizationId?: string | null;
  }
) {
  const { capabilities, accessLevel, panelOrganizationId } = options;

  let query = supabase
    .from('user_module_access')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .eq('module_key', primaryModuleKey);

  if (panelOrganizationId) {
    query = query.eq('panel_organization_id', panelOrganizationId);
  } else {
    query = query.is('panel_organization_id', null);
  }

  const { data: existing } = await query.maybeSingle();

  const payload: Record<string, unknown> = {
    is_enabled: true,
    granted_at: new Date().toISOString(),
  };

  if (accessLevel !== undefined) {
    payload.access_level = accessLevel;
  }
  if (panelOrganizationId !== undefined) {
    payload.panel_organization_id = panelOrganizationId;
  }

  if (capabilities !== undefined) {
    payload.notes =
      capabilities == null ? null : encodeCapabilitiesNotes(capabilities);
    // Prefer jsonb column when present; ignore error via dual-write attempt
    payload.capabilities = capabilities ?? null;
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('user_module_access')
      .update(payload)
      .eq('id', existing.id);
    if (error) {
      // capabilities column may not exist yet — retry without it
      if (error.message?.includes('capabilities') && 'capabilities' in payload) {
        delete payload.capabilities;
        const { error: retryErr } = await supabase
          .from('user_module_access')
          .update(payload)
          .eq('id', existing.id);
        if (retryErr) throw retryErr;
      } else if (
        error.message?.includes('panel_organization_id') ||
        error.message?.includes('access_level')
      ) {
        const legacy: Record<string, unknown> = {
          is_enabled: true,
          granted_at: payload.granted_at,
        };
        if (capabilities !== undefined) {
          legacy.notes =
            capabilities == null ? null : encodeCapabilitiesNotes(capabilities);
        }
        const { error: legacyErr } = await supabase
          .from('user_module_access')
          .update(legacy)
          .eq('id', existing.id);
        if (legacyErr) throw legacyErr;
      } else {
        throw error;
      }
    }
  } else {
    const insertRow: Record<string, unknown> = {
      clerk_user_id: clerkUserId,
      module_key: primaryModuleKey,
      is_enabled: true,
      is_super_admin: false,
      granted_at: new Date().toISOString(),
      ...(accessLevel !== undefined ? { access_level: accessLevel } : {}),
      ...(panelOrganizationId !== undefined
        ? { panel_organization_id: panelOrganizationId }
        : {}),
      ...(capabilities !== undefined
        ? {
            notes:
              capabilities == null
                ? null
                : encodeCapabilitiesNotes(capabilities),
            capabilities: capabilities ?? null,
          }
        : {}),
    };

    const { error } = await supabase.from('user_module_access').insert(insertRow);
    if (error) {
      if (
        error.message?.includes('capabilities') ||
        error.message?.includes('panel_organization_id') ||
        error.message?.includes('access_level')
      ) {
        const legacyInsert: Record<string, unknown> = {
          clerk_user_id: clerkUserId,
          module_key: primaryModuleKey,
          is_enabled: true,
          is_super_admin: false,
          granted_at: new Date().toISOString(),
        };
        if (capabilities !== undefined) {
          legacyInsert.notes =
            capabilities == null ? null : encodeCapabilitiesNotes(capabilities);
        }
        const { error: legacyErr } = await supabase
          .from('user_module_access')
          .insert(legacyInsert);
        if (legacyErr) throw legacyErr;
      } else {
        throw error;
      }
    }
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

  let query = authResult.supabase
    .from('user_module_access')
    .select(
      'id, clerk_user_id, module_key, is_enabled, is_super_admin, granted_at, notes, panel_organization_id, access_level, capabilities'
    )
    .in('module_key', def.moduleKeys)
    .eq('is_enabled', true)
    .order('granted_at', { ascending: false });

  if (authResult.managedOrgIds !== 'all') {
    if (authResult.managedOrgIds.length === 0) {
      return NextResponse.json({ members: [], managedOrgIds: [] });
    }
    query = query.in('panel_organization_id', authResult.managedOrgIds);
  }

  const { data: accessRows, error } = await query;

  if (error) {
    // Column missing — fall back to legacy select
    if (
      error.message?.includes('panel_organization_id') ||
      error.message?.includes('access_level') ||
      error.message?.includes('capabilities')
    ) {
      const { data: legacyRows, error: legacyErr } = await authResult.supabase
        .from('user_module_access')
        .select(
          'id, clerk_user_id, module_key, is_enabled, is_super_admin, granted_at, notes'
        )
        .in('module_key', def.moduleKeys)
        .eq('is_enabled', true)
        .order('granted_at', { ascending: false });
      if (legacyErr) {
        return NextResponse.json({ error: legacyErr.message }, { status: 500 });
      }
      return await enrichMembers(legacyRows ?? []);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return await enrichMembers(accessRows ?? [], authResult.managedOrgIds);
}

async function enrichMembers(
  accessRows: Array<Record<string, unknown>>,
  managedOrgIds?: string[] | 'all'
) {
  const seen = new Set<string>();
  const uniqueRows = accessRows.filter((row) => {
    const key = `${row.clerk_user_id}:${row.panel_organization_id ?? 'null'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const clerkIds = [
    ...new Set(uniqueRows.map((r) => String(r.clerk_user_id))),
  ];
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

  const orgIds = [
    ...new Set(
      uniqueRows
        .map((r) => r.panel_organization_id)
        .filter((id): id is string => typeof id === 'string' && Boolean(id))
    ),
  ];
  const orgMap: Record<string, { id: string; name: string; slug: string }> = {};
  if (orgIds.length > 0) {
    const { getServiceSupabase } = await import('@/app/lib/moduleAccess/helpers');
    const supabase = getServiceSupabase();
    const { data: orgs } = await supabase
      .from('panel_organizations')
      .select('id, name, slug')
      .in('id', orgIds);
    for (const o of orgs ?? []) {
      orgMap[o.id] = o;
    }
  }

  const members = uniqueRows.map((row) => ({
    ...row,
    capabilities: decodeCapabilitiesFromRow(row),
    access_level: row.access_level ?? null,
    panel_organization_id: row.panel_organization_id ?? null,
    organization: row.panel_organization_id
      ? orgMap[String(row.panel_organization_id)] ?? null
      : null,
    ...(userMap[String(row.clerk_user_id)] || {
      name: '—',
      email: '—',
      imageUrl: null,
    }),
  }));

  return NextResponse.json({
    members,
    managedOrgIds: managedOrgIds ?? 'all',
  });
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
    capabilities: rawCapabilities,
    accessLevel: rawAccessLevel,
    panelOrganizationId: rawOrgId,
  } = body as {
    clerkUserId?: string;
    email?: string;
    name?: string;
    addAsReviewer?: boolean;
    locale?: string;
    capabilities?: string[];
    accessLevel?: string;
    panelOrganizationId?: string | null;
  };

  const accessLevel = parseAccessLevelInput(rawAccessLevel);
  let panelOrganizationId =
    typeof rawOrgId === 'string' && rawOrgId.trim()
      ? rawOrgId.trim()
      : null;

  // Non-super admin must use one of their managed orgs
  if (!authResult.isSuperAdmin && authResult.managedOrgIds !== 'all') {
    if (!panelOrganizationId && authResult.managedOrgIds.length === 1) {
      panelOrganizationId = authResult.managedOrgIds[0];
    }
  }

  const orgErr = assertCanGrantToOrg(authResult, panelOrganizationId);
  if (orgErr && (panelOrganizationId || authResult.managedOrgIds !== 'all')) {
    // Super admin / legacy can grant without org; org admin cannot
    if (!authResult.isSuperAdmin && authResult.managedOrgIds !== 'all') {
      return NextResponse.json({ error: orgErr }, { status: 403 });
    }
  }
  if (
    !authResult.isSuperAdmin &&
    authResult.managedOrgIds !== 'all' &&
    !panelOrganizationId
  ) {
    return NextResponse.json(
      { error: 'Kurum seçimi zorunlu.' },
      { status: 400 }
    );
  }

  // Org admin cannot grant above admin to make super_admin — already blocked
  // Org admin cannot grant access_level admin to other orgs — blocked by assert

  const moduleCapabilities = clampCapabilitiesToLevel(
    def.primaryModuleKey,
    accessLevel,
    rawCapabilities
  );

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

  const attachGrant = (url: string, email: string) => {
    const token = createModuleGrantToken(email, def.primaryModuleKey);
    try {
      const u = new URL(url);
      const redirect = u.searchParams.get('redirect');
      if (redirect) {
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

    const clerk = await clerkClient();
    try {
      await clerk.invitations.createInvitation({
        emailAddress: targetEmail,
        redirectUrl: attachGrant(signUpUrl, targetEmail),
        publicMetadata: {
          pendingModule: def.primaryModuleKey,
          pendingAccessLevel: accessLevel,
          pendingCapabilities: moduleCapabilities,
          pendingPanelOrganizationId: panelOrganizationId,
        },
        notify: false,
      });
    } catch (inviteErr) {
      console.warn('Clerk invitation skipped/failed:', clerkErrorMessage(inviteErr));

      if (isClerkIdentifierExistsError(inviteErr)) {
        const existing = await findClerkUserByEmail(targetEmail);
        if (existing) {
          targetUserId = existing.id;
          targetEmail =
            existing.emailAddresses[0]?.emailAddress || targetEmail;
          targetName = targetName || displayClerkName(existing);
        }
      }
    }
  }

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
      accessLevel,
      capabilities: moduleCapabilities,
      panelOrganizationId,
    });
  }

  const clerk = await clerkClient();
  let clerkUser: Awaited<ReturnType<typeof findClerkUserByEmail>> =
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

  await grantModuleAccess(authResult.supabase, targetUserId, def.primaryModuleKey, {
    capabilities: moduleCapabilities,
    accessLevel,
    panelOrganizationId,
  });

  if (def.primaryModuleKey === 'internship' && addAsReviewer) {
    await upsertInternshipReviewer(
      authResult.supabase,
      targetUserId,
      targetEmail,
      targetName
    );
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
    addAsReviewer:
      def.primaryModuleKey === 'internship' ? addAsReviewer : undefined,
    capabilities: moduleCapabilities,
    accessLevel,
    panelOrganizationId,
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
  const panelOrganizationId = request.nextUrl.searchParams.get(
    'panelOrganizationId'
  );
  if (!clerkUserId) {
    return NextResponse.json({ error: 'clerkUserId required' }, { status: 400 });
  }

  if (
    !authResult.isSuperAdmin &&
    authResult.managedOrgIds !== 'all' &&
    panelOrganizationId &&
    !authResult.managedOrgIds.includes(panelOrganizationId)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let query = authResult.supabase
    .from('user_module_access')
    .update({ is_enabled: false })
    .eq('clerk_user_id', clerkUserId)
    .in('module_key', def.moduleKeys);

  if (panelOrganizationId) {
    query = query.eq('panel_organization_id', panelOrganizationId);
  } else if (authResult.managedOrgIds !== 'all') {
    query = query.in('panel_organization_id', authResult.managedOrgIds);
  }

  const { error } = await query;

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
