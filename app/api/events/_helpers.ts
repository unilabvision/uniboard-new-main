import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import {
  EVENTS_MODULE_KEY,
  hasEventsAccess,
  type EventsCapability,
} from '@/app/lib/events/permissions';
import { hasSiteApplicationsAccess } from '@/app/lib/siteApplications/permissions';
import {
  decodeCapabilitiesFromRow,
  hasFeature,
  loadUserAccessRows,
  resolveMembershipFromRows,
  type PanelMembership,
} from '@/app/lib/moduleAccess/rbac';

export function getEventsSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function eventsCapsFromMembership(
  membership: PanelMembership | null
): EventsCapability[] | null {
  if (!membership) return null;
  const caps = membership.capabilities;
  if (!caps) return null;
  return caps.filter((c): c is EventsCapability =>
    ['edit', 'registrations', 'forms', 'ops'].includes(c)
  );
}

async function loadAccess(userId: string) {
  const supabase = getEventsSupabase();
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
      capabilities: null as EventsCapability[] | null,
      membership: null as PanelMembership | null,
    };
  }

  const resolved = resolveMembershipFromRows(rows, EVENTS_MODULE_KEY);
  const capabilities = eventsCapsFromMembership(resolved.membership);

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

export async function requireEventsModuleUser() {
  const { userId } = await auth();
  if (!userId) {
    return {
      error: 'Unauthorized',
      status: 401 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      capabilities: null as EventsCapability[] | null,
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

  if (!hasEventsAccess(access.moduleKeys, access.isSuperAdmin)) {
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

  return {
    error: null,
    status: 200 as const,
    userId,
    supabase: access.supabase,
    isSuperAdmin: access.isSuperAdmin,
    capabilities: access.capabilities,
    membership: access.membership,
  };
}

export async function requireEventsCapability(required: EventsCapability) {
  const base = await requireEventsModuleUser();
  if (base.error || !base.supabase) return base;

  if (!hasFeature(base.membership, required, base.isSuperAdmin)) {
    return {
      error: 'Forbidden',
      status: 403 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      capabilities: null as EventsCapability[] | null,
      membership: null as PanelMembership | null,
    };
  }

  return base;
}

/** Etkinlik kayıtları / hatırlatma / excel — events(+ops) VEYA site-applications */
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

  const hasEvents =
    hasEventsAccess(access.moduleKeys, access.isSuperAdmin) &&
    hasFeature(access.membership, 'ops', access.isSuperAdmin);
  const hasSiteApps = hasSiteApplicationsAccess(
    access.moduleKeys,
    access.isSuperAdmin
  );

  if (!hasEvents && !hasSiteApps) {
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

/** Event özeti / kayıt listesi — events(+registrations) veya site-applications */
export async function requireEventsOrSiteAppsUser(
  capability?: EventsCapability
) {
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

  const eventsOk =
    hasEventsAccess(access.moduleKeys, access.isSuperAdmin) &&
    (!capability ||
      hasFeature(access.membership, capability, access.isSuperAdmin));
  const siteAppsOk = hasSiteApplicationsAccess(
    access.moduleKeys,
    access.isSuperAdmin
  );

  if (!eventsOk && !siteAppsOk) {
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

// re-export for any notes decoding callers
export { decodeCapabilitiesFromRow };
