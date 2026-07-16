import { auth } from '@clerk/nextjs/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getInfluencerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Influencer modülü (veya süper admin) zorunlu. */
export async function requireInfluencerUser() {
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

  const supabase = getInfluencerSupabase();
  const { data: rows, error } = await supabase
    .from('user_module_access')
    .select('module_key, is_enabled, is_super_admin')
    .eq('clerk_user_id', userId)
    .eq('is_enabled', true);

  if (error) {
    return {
      error: error.message,
      status: 500 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  const isSuperAdmin = (rows ?? []).some((r) => r.is_super_admin === true);
  const hasModule =
    isSuperAdmin ||
    (rows ?? []).some((r) => r.module_key === 'influencer' && r.is_enabled);

  if (!hasModule) {
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
    isSuperAdmin,
  };
}
