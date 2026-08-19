import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import {
  SITE_APPLICATIONS_MODULE_KEY,
  hasSiteApplicationsAccess,
} from '@/app/lib/siteApplications/permissions';
import {
  EVENTS_MODULE_KEY,
  hasEventsAccess,
  type EventsCapability,
} from '@/app/lib/events/permissions';
import {
  hasFeature,
  loadUserAccessRows,
  resolveMembershipFromRows,
  type PanelMembership,
} from '@/app/lib/moduleAccess/rbac';

export const SITE_APPS_MODULE_KEYS = [SITE_APPLICATIONS_MODULE_KEY];

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function requireSiteApplicationsModuleUser() {
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
      isSuperAdmin: false,
      membership: null,
    };
  }

  const resolved = resolveMembershipFromRows(rows, SITE_APPLICATIONS_MODULE_KEY);
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

  return {
    error: null,
    status: 200 as const,
    userId,
    supabase,
    isSuperAdmin: resolved.isSuperAdmin,
    membership: resolved.membership,
  };
}

export async function requireSiteApplicationsCapability(required: string) {
  const base = await requireSiteApplicationsModuleUser();
  if (base.error || !base.supabase) return base;
  if (!hasFeature(base.membership, required, base.isSuperAdmin)) {
    return {
      error: 'Forbidden',
      status: 403 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null as PanelMembership | null,
    };
  }
  return base;
}

/**
 * Site-applications OR events module (optional capability).
 */
export async function requireSiteApplicationsOrEventsUser(
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

  const supabase = getServiceSupabase();
  let rows: Awaited<ReturnType<typeof loadUserAccessRows>>;
  try {
    rows = await loadUserAccessRows(supabase, userId);
  } catch {
    return {
      error: 'Forbidden',
      status: 500 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  const siteResolved = resolveMembershipFromRows(rows, SITE_APPLICATIONS_MODULE_KEY);
  const eventsResolved = resolveMembershipFromRows(rows, EVENTS_MODULE_KEY);
  const isSuperAdmin = siteResolved.isSuperAdmin || eventsResolved.isSuperAdmin;
  const moduleKeys = rows.map((r) => r.module_key);

  const siteOk = hasSiteApplicationsAccess(moduleKeys, isSuperAdmin);
  const eventsOk =
    hasEventsAccess(moduleKeys, isSuperAdmin) &&
    (!capability ||
      hasFeature(eventsResolved.membership, capability, isSuperAdmin));

  if (!siteOk && !eventsOk) {
    return {
      error: 'Forbidden',
      status: 403 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  return { error: null, status: 200 as const, userId, supabase, isSuperAdmin };
}

type SiteAppsTenantScope =
  | { mode: 'all' }
  | { mode: 'none' }
  | { mode: 'scoped'; allowedValues: string[] };

/**
 * External kurum/kişi paneli için tenant-scoping:
 * - user_module_access.panel_organization_id -> panel_organizations (slug/name)
 * - myuni_site_applications.organization alanına filtre uygular.
 *
 * Not: `organization` değeri formdan geldiği için hem `slug` hem `name` match listesine
 * eklenir (değer hangi şekilde saklanıyorsa yakalamak için).
 */
export async function resolveSiteApplicationsTenantScope(
  supabase: ReturnType<typeof getServiceSupabase>,
  userId: string
): Promise<SiteAppsTenantScope> {
  const rows = await loadUserAccessRows(supabase, userId);
  const resolved = resolveMembershipFromRows(rows, SITE_APPLICATIONS_MODULE_KEY);

  if (resolved.isSuperAdmin) return { mode: 'all' };

  // Org-scoped tenant:
  // - panel_organization_id = null ise kullanıcı modüle global erişimde demektir (tüm başvurular)
  // - panel_organization_id atanmışsa o org'larla kısıtlı başvurular görünmeli
  const hasUnscopedMembership = resolved.memberships.some(
    (m) => m.panelOrganizationId == null
  );
  if (hasUnscopedMembership) return { mode: 'all' };

  const orgIds = Array.from(
    new Set(
      resolved.memberships
        .map((m) => m.panelOrganizationId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  );

  if (orgIds.length === 0) return { mode: 'none' };

  const { data, error } = await supabase
    .from('panel_organizations')
    .select('slug, name')
    .in('id', orgIds)
    .eq('is_active', true);

  if (error) return { mode: 'none' };

  const allowedValues = Array.from(
    new Set(
      (data ?? [])
        .flatMap((o) => [o.slug, o.name])
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean)
    )
  );

  return { mode: allowedValues.length > 0 ? 'scoped' : 'none', allowedValues };
}

type SiteAppsPanelOrganizationScope =
  | { mode: 'all' }
  | { mode: 'none' }
  | { mode: 'scoped'; panelOrganizationIds: string[] };

/**
 * Form sahipliği/tenant-scoping için:
 * - Formlar `myuni_site_application_forms.created_by` (clerk user id) ile kim tarafından oluşturulduğu bilgisine sahip.
 * - Bu helper, kullanıcının bağlı olduğu `panel_organization_id` (uuid) listesini çıkarır.
 *
 * Eşleştirme mantığı:
 * - Ulaşılabilen tenant = panel_organization_id seti.
 * - Form, ancak `created_by` olan kullanıcının da aynı panel_organization_id içinde olması durumunda görünür/düzenlenir.
 */
export async function resolveSiteApplicationsPanelOrganizationScope(
  supabase: ReturnType<typeof getServiceSupabase>,
  userId: string
): Promise<SiteAppsPanelOrganizationScope> {
  const rows = await loadUserAccessRows(supabase, userId);
  const siteResolved = resolveMembershipFromRows(rows, SITE_APPLICATIONS_MODULE_KEY);
  const eventsResolved = resolveMembershipFromRows(rows, EVENTS_MODULE_KEY);

  if (siteResolved.isSuperAdmin || eventsResolved.isSuperAdmin) return { mode: 'all' };

  const memberships = [...siteResolved.memberships, ...eventsResolved.memberships];

  const hasUnscopedMembership = memberships.some((m) => m.panelOrganizationId == null);
  if (hasUnscopedMembership) return { mode: 'all' };

  const panelOrganizationIds = Array.from(
    new Set(
      memberships
        .map((m) => m.panelOrganizationId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )
  );

  if (panelOrganizationIds.length === 0) return { mode: 'none' };
  return { mode: 'scoped', panelOrganizationIds };
}

/** Write access for form settings/fields: Events forms OR Site-applications forms OR super-admin. */
export async function requireEventFormsWriteUser() {
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
  let rows: Awaited<ReturnType<typeof loadUserAccessRows>>;
  try {
    rows = await loadUserAccessRows(supabase, userId);
  } catch {
    return {
      error: 'Forbidden',
      status: 500 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  const eventsResolved = resolveMembershipFromRows(rows, EVENTS_MODULE_KEY);
  const siteResolved = resolveMembershipFromRows(rows, SITE_APPLICATIONS_MODULE_KEY);
  const isSuperAdmin = eventsResolved.isSuperAdmin || siteResolved.isSuperAdmin;
  if (isSuperAdmin) {
    return {
      error: null,
      status: 200 as const,
      userId,
      supabase,
      isSuperAdmin: true,
    };
  }

  const moduleKeys = rows.map((r) => r.module_key);
  const eventsFormsOk =
    hasEventsAccess(moduleKeys, false) &&
    hasFeature(eventsResolved.membership, 'forms', false);
  const siteFormsOk =
    hasSiteApplicationsAccess(moduleKeys, false) &&
    hasFeature(siteResolved.membership, 'forms', false);

  if (!eventsFormsOk && !siteFormsOk) {
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
    isSuperAdmin: false,
  };
}

export async function requireSiteApplicationsSuperAdmin() {
  const base = await requireSiteApplicationsModuleUser();
  if (base.error) return base;
  if (!base.isSuperAdmin) {
    return {
      error: 'Forbidden',
      status: 403 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null as PanelMembership | null,
    };
  }
  return base;
}

export async function requireSiteApplicationsAccessManager() {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized', status: 401 as const, userId: null, supabase: null };
  }

  const supabase = getServiceSupabase();
  const rows = await loadUserAccessRows(supabase, userId);
  const resolved = resolveMembershipFromRows(rows, SITE_APPLICATIONS_MODULE_KEY);
  const canManage =
    resolved.isSuperAdmin ||
    hasFeature(resolved.membership, 'access', false) ||
    (resolved.membership?.accessLevel == null &&
      resolved.membership?.capabilities == null &&
      Boolean(resolved.membership));

  if (!canManage && !resolved.isSuperAdmin) {
    // legacy module holder
    const hasModule = rows.some((r) => r.module_key === SITE_APPLICATIONS_MODULE_KEY);
    if (!hasModule) {
      return { error: 'Forbidden', status: 403 as const, userId: null, supabase: null };
    }
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
