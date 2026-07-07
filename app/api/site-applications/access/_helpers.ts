import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { SITE_APPLICATIONS_MODULE_KEY } from '@/app/lib/siteApplications/permissions';

export const SITE_APPS_MODULE_KEYS = [SITE_APPLICATIONS_MODULE_KEY];

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getAccessRows(userId: string) {
  const supabase = getServiceSupabase();
  const { data: rows, error } = await supabase
    .from('user_module_access')
    .select('module_key, is_enabled, is_super_admin')
    .eq('clerk_user_id', userId)
    .eq('is_enabled', true);

  if (error) throw new Error(error.message);
  return rows ?? [];
}

export async function requireSiteApplicationsModuleUser() {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized', status: 401 as const, userId: null, supabase: null, isSuperAdmin: false };
  }

  const supabase = getServiceSupabase();
  const rows = await getAccessRows(userId);
  const isSuperAdmin = rows.some((r) => r.is_super_admin === true);
  const hasModule =
    isSuperAdmin ||
    rows.some((r) => r.module_key === SITE_APPLICATIONS_MODULE_KEY);

  if (!hasModule) {
    return { error: 'Forbidden', status: 403 as const, userId: null, supabase: null, isSuperAdmin: false };
  }

  return { error: null, status: 200 as const, userId, supabase, isSuperAdmin };
}

/** Form yapılandırması yalnızca süper admin */
export async function requireSiteApplicationsSuperAdmin() {
  const base = await requireSiteApplicationsModuleUser();
  if (base.error) return base;
  if (!base.isSuperAdmin) {
    return { error: 'Forbidden', status: 403 as const, userId: null, supabase: null, isSuperAdmin: false };
  }
  return base;
}

/** Yetkilendirme sayfası — modül sahibi veya süper admin */
export async function requireSiteApplicationsAccessManager() {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized', status: 401 as const, userId: null, supabase: null };
  }

  const supabase = getServiceSupabase();
  const rows = await getAccessRows(userId);
  const isSuperAdmin = rows.some((r) => r.is_super_admin === true);
  const hasModule = rows.some((r) => r.module_key === SITE_APPLICATIONS_MODULE_KEY);

  const canManage = isSuperAdmin || hasModule;
  if (!canManage) {
    return { error: 'Forbidden', status: 403 as const, userId: null, supabase: null };
  }

  return { error: null, status: 200 as const, userId, supabase };
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
