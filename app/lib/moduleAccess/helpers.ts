import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/backend';
import { createClient } from '@supabase/supabase-js';
import type { ModuleAccessDefinition } from '@/app/lib/moduleAccess/registry';
import { isEmailQuery } from '@/app/lib/internship/accessQuery';
import {
  canManageAccess,
  loadUserAccessRows,
  managedOrganizationIds,
  resolveMembershipFromRows,
  type ResolvedMembership,
} from '@/app/lib/moduleAccess/rbac';

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type ModuleAccessManagerContext = {
  error: string | null;
  status: 200 | 401 | 403 | 500;
  userId: string | null;
  supabase: ReturnType<typeof getServiceSupabase> | null;
  isSuperAdmin: boolean;
  resolved: ResolvedMembership | null;
  managedOrgIds: string[] | 'all';
};

export async function requireModuleAccessManager(
  def: ModuleAccessDefinition
): Promise<ModuleAccessManagerContext> {
  const { userId } = await auth();
  if (!userId) {
    return {
      error: 'Unauthorized',
      status: 401,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      resolved: null,
      managedOrgIds: [],
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
      resolved: null,
      managedOrgIds: [],
    };
  }

  const resolved = resolveMembershipFromRows(rows, def.primaryModuleKey);
  const isSuperAdmin = resolved.isSuperAdmin;

  if (def.managePolicy === 'superAdminOnly') {
    if (!isSuperAdmin) {
      return {
        error: 'Forbidden',
        status: 403,
        userId: null,
        supabase: null,
        isSuperAdmin: false,
        resolved: null,
        managedOrgIds: [],
      };
    }
    return {
      error: null,
      status: 200,
      userId,
      supabase,
      isSuperAdmin: true,
      resolved,
      managedOrgIds: 'all',
    };
  }

  const orgIds = managedOrganizationIds(resolved);
  const legacyManager = resolved.memberships.some(
    (m) => m.accessLevel == null && m.capabilities == null
  );
  const canManage =
    isSuperAdmin ||
    orgIds === 'all' ||
    (Array.isArray(orgIds) && orgIds.length > 0) ||
    legacyManager;

  if (!canManage) {
    return {
      error: 'Forbidden',
      status: 403,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      resolved: null,
      managedOrgIds: [],
    };
  }

  return {
    error: null,
    status: 200,
    userId,
    supabase,
    isSuperAdmin,
    resolved,
    managedOrgIds: orgIds === 'all' || legacyManager ? 'all' : orgIds,
  };
}

export function assertCanGrantToOrg(
  ctx: ModuleAccessManagerContext,
  panelOrganizationId: string | null
): string | null {
  if (ctx.isSuperAdmin || ctx.managedOrgIds === 'all') return null;
  if (!panelOrganizationId) return 'Kurum seçimi zorunlu.';
  if (!ctx.resolved || !canManageAccess(ctx.resolved, panelOrganizationId)) {
    return 'Bu kurum için yetkilendirme yapamazsınız.';
  }
  return null;
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

/**
 * Optional secret key for a separate Clerk instance holding the public site's
 * users. Unset by default: CLERK_SECRET_KEY is the instance used everywhere.
 */
export function getSiteClerkSecretKey(): string {
  const key = (
    process.env.CLERK_SECRET_KEY_LIVE ||
    process.env.CLERK_LOOKUP_SECRET_KEY ||
    ''
  ).trim();
  if (!key || key === process.env.CLERK_SECRET_KEY) return '';
  return key;
}

let cachedSiteClerk: ReturnType<typeof createClerkClient> | null = null;

/** Dedicated site Clerk client, or null to use the CLERK_SECRET_KEY instance. */
export function getSiteClerkClient() {
  const key = getSiteClerkSecretKey();
  if (!key) return null;
  if (!cachedSiteClerk) cachedSiteClerk = createClerkClient({ secretKey: key });
  return cachedSiteClerk;
}

type ClerkUserLike = {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
};

type ClerkUserListClient<U extends ClerkUserLike> = {
  users: {
    getUserList: (args: {
      emailAddress?: string[];
      query?: string;
      limit?: number;
    }) => Promise<{ data: U[] }>;
  };
};

async function searchClerkUserByEmail<U extends ClerkUserLike>(
  clerk: ClerkUserListClient<U>,
  email: string
): Promise<U | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const exact = await clerk.users.getUserList({
    emailAddress: [normalized],
    limit: 10,
  });
  const exactHit =
    exact.data.find((u) =>
      u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === normalized)
    ) ?? exact.data[0];
  if (exactHit) return exactHit;

  const fuzzy = await clerk.users.getUserList({
    query: normalized,
    limit: 25,
  });
  const fuzzyHit = fuzzy.data.find((u) =>
    u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === normalized)
  );
  if (fuzzyHit) return fuzzyHit;

  if (email.trim() !== normalized) {
    const cased = await clerk.users.getUserList({
      emailAddress: [email.trim()],
      limit: 10,
    });
    if (cased.data[0]) return cased.data[0];
  }

  return null;
}

export async function findClerkUserByEmail(email: string) {
  const clerk = await clerkClient();
  return searchClerkUserByEmail(clerk, email);
}

/**
 * Resolves an email for enrollment writes. Uses the CLERK_SECRET_KEY instance
 * unless a dedicated site key is configured.
 */
export async function findSiteClerkUserByEmail(email: string) {
  const siteClerk = getSiteClerkClient();
  if (siteClerk) return searchClerkUserByEmail(siteClerk, email);
  return findClerkUserByEmail(email);
}

function clerkErrorMessage(err: unknown): string {
  if (!err || typeof err !== 'object') return 'Grant failed';
  const e = err as {
    message?: string;
    errors?: Array<{ message?: string; code?: string; longMessage?: string }>;
  };
  const first = e.errors?.[0];
  return first?.longMessage || first?.message || first?.code || e.message || 'Grant failed';
}

function isClerkIdentifierExistsError(err: unknown): boolean {
  const msg = clerkErrorMessage(err).toLowerCase();
  const code = String(
    (err as { errors?: Array<{ code?: string }> })?.errors?.[0]?.code || ''
  ).toLowerCase();
  return (
    code.includes('identifier_exists') ||
    code.includes('form_identifier_exists') ||
    code.includes('duplicate') ||
    msg.includes('already exists') ||
    msg.includes('already been taken') ||
    msg.includes('is taken') ||
    msg.includes('already invited') ||
    msg.includes('invitation')
  );
}

export async function searchClerkUsers(query: string, limit = 15) {
  const clerk = await clerkClient();
  const q = query.trim();
  const byId = new Map<
    string,
    Awaited<ReturnType<typeof clerk.users.getUserList>>['data'][number]
  >();

  const merge = (
    users: Awaited<ReturnType<typeof clerk.users.getUserList>>['data']
  ) => {
    for (const user of users) {
      if (!byId.has(user.id)) byId.set(user.id, user);
    }
  };

  if (isEmailQuery(q)) {
    const found = await findClerkUserByEmail(q);
    if (found) merge([found]);

    if (byId.size === 0) {
      const fuzzy = await clerk.users.getUserList({
        query: q.toLowerCase(),
        limit,
      });
      merge(fuzzy.data);
    }
  } else {
    const fuzzy = await clerk.users.getUserList({ query: q, limit });
    merge(fuzzy.data);

    if (byId.size === 0 && !q.includes('@') && q.length >= 3) {
      const asEmailGuess = await clerk.users.getUserList({
        query: `${q}@`,
        limit,
      });
      merge(asEmailGuess.data);
    }
  }

  return [...byId.values()].slice(0, limit);
}

export { clerkErrorMessage, isClerkIdentifierExistsError };

export const DEFAULT_DASHBOARD_ORIGIN = 'https://dashboard.myunilab.net';

export function getAppBaseUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_DASHBOARD_URL,
  ];

  for (const raw of candidates) {
    const value = (raw || '').trim().replace(/\/$/, '');
    if (!value) continue;
    if (/vercel\.app|vercel\.com/i.test(value)) continue;
    // Production must never use a local dashboard origin
    if (
      process.env.NODE_ENV === 'production' &&
      /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(value)
    ) {
      continue;
    }
    return value.startsWith('http') ? value : `https://${value}`;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  return DEFAULT_DASHBOARD_ORIGIN;
}

/** E-postalara gömülecek linkler için: localhost / preview origin'i asla kullanma. */
export function getMailSafeAppBaseUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_DASHBOARD_URL,
  ];

  for (const raw of candidates) {
    const value = (raw || '').trim().replace(/\/$/, '');
    if (!value) continue;
    if (/localhost|127\.0\.0\.1|0\.0\.0\.0|vercel\.app|vercel\.com/i.test(value)) {
      continue;
    }
    return value.startsWith('http') ? value : `https://${value}`;
  }

  return DEFAULT_DASHBOARD_ORIGIN;
}

export function buildModuleAccessLinks(locale: string, dashboardPath: string) {
  const base = getAppBaseUrl();
  const safeLocale = locale === 'en' ? 'en' : 'tr';
  const panelPath = `/${safeLocale}/${dashboardPath}`.replace(/\/{2,}/g, '/');
  const panelUrl = `${base}${panelPath}`;
  const loginUrl = `${base}/${safeLocale}/login?tab=signin&redirect=${encodeURIComponent(panelPath)}`;
  const signUpUrl = `${base}/${safeLocale}/login?tab=signup&redirect=${encodeURIComponent(panelPath)}`;
  return { base, panelPath, panelUrl, loginUrl, signUpUrl };
}
