import { createHmac, timingSafeEqual } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MODULE_ACCESS_REGISTRY } from '@/app/lib/moduleAccess/registry';

const GRANT_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 gün

function getGrantSecret() {
  return (
    process.env.MODULE_GRANT_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    process.env.EMAIL_PASSWORD ||
    'uniboard-module-grant-dev'
  );
}

function b64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromB64url(input: string) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64').toString('utf8');
}

/** Davet mailine gömülür; kullanıcı kayıt/giriş sonrası claim edilir. */
export function createModuleGrantToken(email: string, moduleKey: string) {
  const exp = Date.now() + GRANT_TTL_MS;
  const payload = `${email.trim().toLowerCase()}|${moduleKey}|${exp}`;
  const sig = createHmac('sha256', getGrantSecret()).update(payload).digest('hex');
  return b64url(`${payload}|${sig}`);
}

export function verifyModuleGrantToken(token: string): {
  email: string;
  moduleKey: string;
} | null {
  try {
    const raw = fromB64url(token.trim());
    const parts = raw.split('|');
    if (parts.length !== 4) return null;
    const [email, moduleKey, expStr, sig] = parts;
    const payload = `${email}|${moduleKey}|${expStr}`;
    const expected = createHmac('sha256', getGrantSecret()).update(payload).digest('hex');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || Date.now() > exp) return null;
    const known = Object.values(MODULE_ACCESS_REGISTRY).some(
      (d) => d.primaryModuleKey === moduleKey || d.moduleKeys.includes(moduleKey)
    );
    if (!email || !known) return null;
    return { email: email.toLowerCase(), moduleKey };
  } catch {
    return null;
  }
}

export function withGrantToken(url: string, token: string) {
  try {
    const u = new URL(url);
    u.searchParams.set('grant', token);
    return u.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}grant=${encodeURIComponent(token)}`;
  }
}

export async function upsertModuleAccessByClerkId(
  supabase: SupabaseClient,
  clerkUserId: string,
  moduleKey: string
) {
  const { data: existing } = await supabase
    .from('user_module_access')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .eq('module_key', moduleKey)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from('user_module_access')
      .update({ is_enabled: true, granted_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('user_module_access').insert({
      clerk_user_id: clerkUserId,
      module_key: moduleKey,
      is_enabled: true,
      is_super_admin: false,
      granted_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

/** Clerk publicMetadata.pendingModule varsa erişim ver ve metadata temizle. */
export async function claimPendingModuleFromClerkMetadata(
  supabase: SupabaseClient,
  clerkUserId: string,
  publicMetadata: Record<string, unknown> | null | undefined
): Promise<string | null> {
  const pending = publicMetadata?.pendingModule;
  if (typeof pending !== 'string' || !pending.trim()) return null;

  const moduleKey = pending.trim();
  const known = Object.values(MODULE_ACCESS_REGISTRY).some(
    (d) => d.primaryModuleKey === moduleKey || d.moduleKeys.includes(moduleKey)
  );
  if (!known) return null;

  await upsertModuleAccessByClerkId(supabase, clerkUserId, moduleKey);

  try {
    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerk = await clerkClient();
    const nextMeta = { ...(publicMetadata || {}) };
    delete nextMeta.pendingModule;
    await clerk.users.updateUser(clerkUserId, { publicMetadata: nextMeta });
  } catch (err) {
    console.warn('Could not clear pendingModule metadata:', err);
  }

  return moduleKey;
}
