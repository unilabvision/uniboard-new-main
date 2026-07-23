import { auth } from '@clerk/nextjs/server';
import { getServiceSupabase } from '@/app/lib/moduleAccess/helpers';
import {
  hasFeature,
  loadUserAccessRows,
  resolveMembershipFromRows,
  type PanelMembership,
} from '@/app/lib/moduleAccess/rbac';
import { getModuleAccessDefinition } from '@/app/lib/moduleAccess/registry';

export type ModuleAuthResult = {
  error: string | null;
  status: 200 | 401 | 403 | 500;
  userId: string | null;
  supabase: ReturnType<typeof getServiceSupabase> | null;
  isSuperAdmin: boolean;
  membership: PanelMembership | null;
};

/**
 * Modül erişimi (+ isteğe bağlı özellik) zorunlu.
 */
export async function requireModuleFeature(
  moduleSlug: string,
  requiredCapability?: string
): Promise<ModuleAuthResult> {
  const { userId } = await auth();
  if (!userId) {
    return {
      error: 'Unauthorized',
      status: 401,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null,
    };
  }

  const def = getModuleAccessDefinition(moduleSlug);
  if (!def) {
    return {
      error: 'Unknown module',
      status: 403,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null,
    };
  }

  const supabase = getServiceSupabase();
  let rows: Awaited<ReturnType<typeof loadUserAccessRows>>;
  try {
    rows = await loadUserAccessRows(supabase, userId);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Database error',
      status: 500,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null,
    };
  }

  const resolved = resolveMembershipFromRows(rows, def.primaryModuleKey);
  if (!resolved.isSuperAdmin && !resolved.membership) {
    return {
      error: 'Forbidden',
      status: 403,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null,
    };
  }

  if (
    requiredCapability &&
    !hasFeature(
      resolved.membership,
      requiredCapability,
      resolved.isSuperAdmin
    )
  ) {
    return {
      error: 'Forbidden',
      status: 403,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null,
    };
  }

  return {
    error: null,
    status: 200,
    userId,
    supabase,
    isSuperAdmin: resolved.isSuperAdmin,
    membership: resolved.membership,
  };
}

export function filterSidebarItemsByMembership<
  T extends { capability?: string },
>(
  items: T[],
  membership: PanelMembership | null,
  isSuperAdmin: boolean
): T[] {
  if (isSuperAdmin) return items;
  return items.filter((item) => {
    if (!item.capability) return true;
    return hasFeature(membership, item.capability, false);
  });
}
