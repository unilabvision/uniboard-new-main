import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { hasEventsAccess } from '@/app/lib/events/permissions';
import { hasSiteApplicationsAccess } from '@/app/lib/siteApplications/permissions';

export function getEventsSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function loadAccess(userId: string) {
  const supabase = getEventsSupabase();
  const { data: rows, error } = await supabase
    .from('user_module_access')
    .select('module_key, is_enabled, is_super_admin')
    .eq('clerk_user_id', userId)
    .eq('is_enabled', true);

  if (error) {
    return {
      error: error.message,
      status: 500 as const,
      userId: null as string | null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  const isSuperAdmin = (rows ?? []).some((r) => r.is_super_admin === true);
  const moduleKeys = (rows ?? []).map((r) => r.module_key);

  return { error: null, status: 200 as const, userId, supabase, isSuperAdmin, moduleKeys };
}

export async function requireEventsModuleUser() {
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

  const access = await loadAccess(userId);
  if (access.error || !access.supabase) {
    return {
      error: access.error || 'Forbidden',
      status: access.status,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  if (!hasEventsAccess(access.moduleKeys, access.isSuperAdmin)) {
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
    supabase: access.supabase,
    isSuperAdmin: access.isSuperAdmin,
  };
}

/** Etkinlik kayıtları / hatırlatma / excel — events VEYA site-applications yetkisi */
export async function requireEventsRegistrantToolsUser() {
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

  const access = await loadAccess(userId);
  if (access.error || !access.supabase) {
    return {
      error: access.error || 'Forbidden',
      status: access.status,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  const allowed =
    hasEventsAccess(access.moduleKeys, access.isSuperAdmin) ||
    hasSiteApplicationsAccess(access.moduleKeys, access.isSuperAdmin);

  if (!allowed) {
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
    supabase: access.supabase,
    isSuperAdmin: access.isSuperAdmin,
  };
}
