import { auth } from '@clerk/nextjs/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  hasFeature,
  loadUserAccessRows,
  resolveMembershipFromRows,
  type PanelMembership,
} from '@/app/lib/moduleAccess/rbac';

export function getInfluencerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_LEARNING_URL;
  const key = process.env.SUPABASE_LEARNING_SECRET_KEY;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getModuleAccessSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_IDENTITY_URL;
  const key = process.env.SUPABASE_IDENTITY_SECRET_KEY;
  if (!url || !key) throw new Error('Identity database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Influencer modülü (veya süper admin) zorunlu. */
export async function requireInfluencerUser(requiredCapability?: string) {
  const { userId } = await auth();
  if (!userId) {
    return {
      error: 'Unauthorized',
      status: 401 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null as PanelMembership | null,
    };
  }

  const supabase = getInfluencerSupabase();
  const accessSupabase = getModuleAccessSupabase();
  let rows: Awaited<ReturnType<typeof loadUserAccessRows>>;
  try {
    rows = await loadUserAccessRows(accessSupabase, userId);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Error',
      status: 500 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null,
    };
  }

  const resolved = resolveMembershipFromRows(rows, 'influencer');
  const hasModule = resolved.isSuperAdmin || Boolean(resolved.membership);

  if (!hasModule) {
    return {
      error: 'Forbidden',
      status: 403 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null,
    };
  }

  if (
    requiredCapability &&
    !hasFeature(resolved.membership, requiredCapability, resolved.isSuperAdmin)
  ) {
    return {
      error: 'Forbidden',
      status: 403 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null,
    };
  }

  return {
    error: null,
    status: 200 as const,
    userId,
    supabase,
    isSuperAdmin: resolved.isSuperAdmin,
    membership: resolved.membership,
  };
}
