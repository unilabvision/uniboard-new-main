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
  const { data } = await clerk.users.getUserList({
    emailAddress: [email.toLowerCase()],
    limit: 1,
  });
  return data[0] ?? null;
}

/**
 * Clerk kullanıcı araması: e-posta tam eşleşme + genel query.
 * Sonuçlar id'ye göre birleştirilir.
 */
export async function searchClerkUsers(query: string, limit = 15) {
  const clerk = await clerkClient();
  const q = query.trim();
  const byId = new Map<string, Awaited<ReturnType<typeof clerk.users.getUserList>>['data'][number]>();

  const merge = (
    users: Awaited<ReturnType<typeof clerk.users.getUserList>>['data']
  ) => {
    for (const user of users) {
      if (!byId.has(user.id)) byId.set(user.id, user);
    }
  };

  if (isEmailQuery(q)) {
    const email = q.toLowerCase();
    const exact = await clerk.users.getUserList({
      emailAddress: [email],
      limit,
    });
    merge(exact.data);

    // Tam eşleşme yoksa veya eksikse genel arama ile tamamla
    if (byId.size === 0) {
      const fuzzy = await clerk.users.getUserList({ query: email, limit });
      merge(fuzzy.data);
    }
  } else {
    const fuzzy = await clerk.users.getUserList({ query: q, limit });
    merge(fuzzy.data);

    // "ozden2004" gibi e-posta lokal kısmı yazıldıysa @gmail ile de dene
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
