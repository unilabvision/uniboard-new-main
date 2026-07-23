import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Clerk JWT template used for Supabase third-party auth.
 * Template claims (MyUniLab):
 *   aud: "authenticated"
 *   email: "{{user.primary_email_address}}"
 *   role: "authenticated"
 * JWKS: https://clerk.myunilab.net/.well-known/jwks.json
 *
 * Client-safe module — do NOT import @clerk/nextjs/server here.
 * Server helper: ./clerkLmsClient.server.ts
 */
export const CLERK_JWT_TEMPLATE =
  process.env.NEXT_PUBLIC_CLERK_JWT_TEMPLATE || 'supabase';

const LMS_URL_FALLBACK = 'https://emfvwpztyuykqtepnsfp.supabase.co';

export function getLmsSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2 || LMS_URL_FALLBACK;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2;
  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY2 is not configured');
  }
  return { url, anonKey };
}

type GetToken = (options?: { template?: string }) => Promise<string | null>;

/**
 * Browser LMS Supabase client authenticated via Clerk JWT template.
 * Pass `getToken` from `useAuth()` so each request carries a fresh template token.
 */
export function createBrowserClerkLmsClient(getToken: GetToken): SupabaseClient {
  const { url, anonKey } = getLmsSupabaseConfig();
  return createClient(url, anonKey, {
    accessToken: async () => {
      try {
        return (await getToken({ template: CLERK_JWT_TEMPLATE })) ?? null;
      } catch (error) {
        console.warn('[clerkLmsClient] getToken failed:', error);
        return null;
      }
    },
  });
}
