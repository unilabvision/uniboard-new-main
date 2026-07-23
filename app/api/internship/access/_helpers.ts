import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { INTERNSHIP_PLATFORM_MODULE_KEYS } from '@/app/types/internship';
import {
  hasFeature,
  loadUserAccessRows,
  resolveMembershipFromRows,
} from '@/app/lib/moduleAccess/rbac';

export const INTERNSHIP_MODULE_KEYS = [...INTERNSHIP_PLATFORM_MODULE_KEYS] as string[];

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function requireInternshipAccessManager() {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized', status: 401 as const, userId: null, supabase: null };
  }

  const supabase = getServiceSupabase();
  let rows: Awaited<ReturnType<typeof loadUserAccessRows>>;
  try {
    rows = await loadUserAccessRows(supabase, userId);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Error',
      status: 500 as const,
      userId: null,
      supabase: null,
    };
  }

  const resolved = resolveMembershipFromRows(rows, 'internship');
  const canManage =
    resolved.isSuperAdmin ||
    hasFeature(resolved.membership, 'access', false) ||
    (resolved.membership?.accessLevel == null &&
      resolved.membership?.capabilities == null &&
      Boolean(resolved.membership)) ||
    rows.some(
      (r) => r.is_enabled && INTERNSHIP_MODULE_KEYS.includes(r.module_key)
    );

  if (!canManage) {
    return { error: 'Forbidden', status: 403 as const, userId: null, supabase: null };
  }

  return { error: null, status: 200 as const, userId, supabase };
}

export async function requireInternshipCapability(required: string) {
  const { userId } = await auth();
  if (!userId) {
    return {
      error: 'Unauthorized',
      status: 401 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  const supabase = getServiceSupabase();
  const rows = await loadUserAccessRows(supabase, userId);
  const resolved = resolveMembershipFromRows(rows, 'internship');
  const hasModule =
    resolved.isSuperAdmin ||
    Boolean(resolved.membership) ||
    rows.some((r) => INTERNSHIP_MODULE_KEYS.includes(r.module_key));

  if (!hasModule) {
    return {
      error: 'Forbidden',
      status: 403 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  if (!hasFeature(resolved.membership, required, resolved.isSuperAdmin)) {
    return {
      error: 'Forbidden',
      status: 403 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  return {
    error: null,
    status: 200 as const,
    userId,
    supabase,
    isSuperAdmin: resolved.isSuperAdmin,
  };
}

export async function clerkUserToResult(user: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  imageUrl: string;
}) {
  const email = user.emailAddresses[0]?.emailAddress || '';
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.username ||
    email;
  return {
    clerkUserId: user.id,
    email,
    name,
    imageUrl: user.imageUrl,
  };
}

export async function findClerkUserByEmail(email: string) {
  const clerk = await clerkClient();
  const { data } = await clerk.users.getUserList({
    emailAddress: [email],
    limit: 1,
  });
  return data[0] ?? null;
}
