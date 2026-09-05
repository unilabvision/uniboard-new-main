import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import {
  MENTORSHIP_MODULE_KEY,
  hasMentorshipAccess,
  hasMentorshipCapability,
  type MentorshipCapability,
} from '@/app/lib/mentorship/permissions';
import {
  loadUserAccessRows,
  resolveMembershipFromRows,
  type PanelMembership,
} from '@/app/lib/moduleAccess/rbac';

export function getMentorshipSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function capsFromMembership(
  membership: PanelMembership | null
): MentorshipCapability[] | null {
  if (!membership) return null;
  const caps = membership.capabilities;
  if (!caps) return null;
  return caps.filter((c): c is MentorshipCapability =>
    ['edit', 'applications', 'access'].includes(c)
  );
}

async function loadAccess(userId: string) {
  const supabase = getMentorshipSupabase();
  let rows: Awaited<ReturnType<typeof loadUserAccessRows>>;
  try {
    rows = await loadUserAccessRows(supabase, userId);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Error',
      status: 500 as const,
      userId: null as string | null,
      supabase: null,
      isSuperAdmin: false,
      moduleKeys: [] as string[],
      capabilities: null as MentorshipCapability[] | null,
      membership: null as PanelMembership | null,
    };
  }

  const resolved = resolveMembershipFromRows(rows, MENTORSHIP_MODULE_KEY);
  const capabilities = capsFromMembership(resolved.membership);

  return {
    error: null,
    status: 200 as const,
    userId,
    supabase,
    isSuperAdmin: resolved.isSuperAdmin,
    moduleKeys: resolved.moduleKeys,
    capabilities,
    membership: resolved.membership,
  };
}

export async function requireMentorshipModuleUser() {
  const { userId } = await auth();
  if (!userId) {
    return {
      error: 'Unauthorized',
      status: 401 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      capabilities: null as MentorshipCapability[] | null,
      membership: null as PanelMembership | null,
    };
  }

  const access = await loadAccess(userId);
  if (access.error || !access.supabase) {
    return {
      error: access.error || 'Forbidden',
      status: access.status,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      capabilities: null,
      membership: null,
    };
  }

  if (!hasMentorshipAccess(access.moduleKeys, access.isSuperAdmin)) {
    return {
      error: 'Forbidden',
      status: 403 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      capabilities: null,
      membership: null,
    };
  }

  return access;
}

export async function requireMentorshipCapability(
  required: MentorshipCapability
) {
  const access = await requireMentorshipModuleUser();
  if (access.error || !access.supabase) return access;

  if (
    !hasMentorshipCapability(access.capabilities, required, access.isSuperAdmin)
  ) {
    return {
      error: 'Forbidden',
      status: 403 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      capabilities: null,
      membership: null,
    };
  }

  return access;
}
