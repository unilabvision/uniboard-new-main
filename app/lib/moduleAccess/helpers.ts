import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import type { ModuleAccessDefinition } from '@/app/lib/moduleAccess/registry';
import { isEmailQuery } from '@/app/lib/internship/accessQuery';

export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function requireModuleAccessManager(def: ModuleAccessDefinition) {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized', status: 401 as const, userId: null, supabase: null };
  }

  const supabase = getServiceSupabase();
  const { data: rows, error } = await supabase
    .from('user_module_access')
    .select('module_key, is_enabled, is_super_admin')
    .eq('clerk_user_id', userId)
    .eq('is_enabled', true);

  if (error) {
    return { error: error.message, status: 500 as const, userId: null, supabase: null };
  }

  const isSuperAdmin = (rows ?? []).some((r) => r.is_super_admin === true);
  const hasModule = (rows ?? []).some(
    (r) => r.is_enabled && def.moduleKeys.includes(r.module_key)
  );

  const canManage =
    def.managePolicy === 'superAdminOnly'
      ? isSuperAdmin
      : isSuperAdmin || hasModule;

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
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  // 1) Tam e-posta filtresi
  const exact = await clerk.users.getUserList({
    emailAddress: [normalized],
    limit: 10,
  });
  const exactHit =
    exact.data.find((u) =>
      u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === normalized)
    ) ?? exact.data[0];
  if (exactHit) return exactHit;

  // 2) Genel query (Clerk spotlight) — filtre bazen kaçırabiliyor
  const fuzzy = await clerk.users.getUserList({
    query: normalized,
    limit: 25,
  });
  const fuzzyHit = fuzzy.data.find((u) =>
    u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === normalized)
  );
  if (fuzzyHit) return fuzzyHit;

  // 3) Orijinal casing ile bir kez daha dene
  if (email.trim() !== normalized) {
    const cased = await clerk.users.getUserList({
      emailAddress: [email.trim()],
      limit: 10,
    });
    if (cased.data[0]) return cased.data[0];
  }

  return null;
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

/**
 * Clerk kullanıcı araması: e-posta tam eşleşme + genel query.
 * Sonuçlar id'ye göre birleştirilir.
 */
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

    // Ek sonuçlar için query
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

/** Kullanıcıya giden maillerde asla Vercel preview URL kullanma (Deployment Protection → vercel.com login). */
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
    return value.startsWith('http') ? value : `https://${value}`;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  return DEFAULT_DASHBOARD_ORIGIN;
}

/** Yetkilendirme maili / Clerk daveti için panel + login/kayıt linkleri */
export function buildModuleAccessLinks(locale: string, dashboardPath: string) {
  const base = getAppBaseUrl();
  const safeLocale = locale === 'en' ? 'en' : 'tr';
  const panelPath = `/${safeLocale}/${dashboardPath}`.replace(/\/{2,}/g, '/');
  const panelUrl = `${base}${panelPath}`;
  const loginUrl = `${base}/${safeLocale}/login?tab=signin&redirect=${encodeURIComponent(panelPath)}`;
  const signUpUrl = `${base}/${safeLocale}/login?tab=signup&redirect=${encodeURIComponent(panelPath)}`;
  return { base, panelPath, panelUrl, loginUrl, signUpUrl };
}
