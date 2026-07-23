import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import {
  CLERK_JWT_TEMPLATE,
  getLmsSupabaseConfig,
} from '@/app/lib/supabase/clerkLmsClient';

/**
 * Server LMS Supabase client authenticated via Clerk JWT template.
 * Import only from Server Components / Route Handlers.
 */
export async function createServerClerkLmsClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getLmsSupabaseConfig();

  return createClient(url, anonKey, {
    accessToken: async () => {
      try {
        const session = await auth();
        return (await session.getToken({ template: CLERK_JWT_TEMPLATE })) ?? null;
      } catch (error) {
        console.warn('[clerkLmsClient.server] getToken failed:', error);
        return null;
      }
    },
  });
}
