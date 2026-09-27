import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { BLOG_MODULE_KEY } from '@/app/lib/blog/config';
import { isBlogCapability, type BlogCapability } from '@/app/lib/blog/permissions';
import {
  hasFeature,
  loadUserAccessRows,
  resolveMembershipFromRows,
  type PanelMembership,
} from '@/app/lib/moduleAccess/rbac';

function getBlogSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getBlogCapabilities(membership: PanelMembership | null) {
  if (!membership?.capabilities) return null;
  return membership.capabilities.filter(isBlogCapability);
}

export async function requireBlogModuleUser() {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized', status: 401 as const, supabase: null, membership: null, isSuperAdmin: false };
  }

  try {
    const supabase = getBlogSupabase();
    const rows = await loadUserAccessRows(supabase, userId);
    const resolved = resolveMembershipFromRows(rows, BLOG_MODULE_KEY);
    const hasAccess = resolved.isSuperAdmin || resolved.moduleKeys.includes(BLOG_MODULE_KEY);
    if (!hasAccess) {
      return { error: 'Forbidden', status: 403 as const, supabase: null, membership: null, isSuperAdmin: false };
    }
    return {
      error: null,
      status: 200 as const,
      supabase,
      membership: resolved.membership,
      isSuperAdmin: resolved.isSuperAdmin,
      capabilities: getBlogCapabilities(resolved.membership),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500 as const,
      supabase: null,
      membership: null,
      isSuperAdmin: false,
    };
  }
}

export async function requireBlogCapability(required: BlogCapability) {
  const access = await requireBlogModuleUser();
  if (access.error || !access.supabase) return access;
  if (!hasFeature(access.membership, required, access.isSuperAdmin)) {
    return { error: 'Forbidden', status: 403 as const, supabase: null, membership: null, isSuperAdmin: false };
  }
  return access;
}
