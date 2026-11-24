import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseDatabase } from './databaseOwnership';

type AdminDatabaseConfig = {
  url?: string;
  secretKey?: string;
};

function configFor(database: SupabaseDatabase): AdminDatabaseConfig {
  switch (database) {
    case 'identity':
      return {
        url: process.env.NEXT_PUBLIC_SUPABASE_IDENTITY_URL,
        secretKey: process.env.SUPABASE_IDENTITY_SECRET_KEY,
      };
    case 'learning':
      return {
        url: process.env.NEXT_PUBLIC_SUPABASE_LEARNING_URL,
        secretKey: process.env.SUPABASE_LEARNING_SECRET_KEY,
      };
    case 'forms':
      return {
        url: process.env.NEXT_PUBLIC_SUPABASE_FORMS_URL,
        secretKey: process.env.SUPABASE_FORMS_SECRET_KEY,
      };
  }
}

const clients: Partial<Record<SupabaseDatabase, SupabaseClient>> = {};

export function getAdminSupabaseClient(database: SupabaseDatabase): SupabaseClient {
  const existing = clients[database];
  if (existing) return existing;

  const { url, secretKey } = configFor(database);
  if (!url || !secretKey) {
    throw new Error(`Missing server-side Supabase configuration for ${database}`);
  }

  const client = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  clients[database] = client;
  return client;
}

export const getIdentityAdminClient = () => getAdminSupabaseClient('identity');
export const getLearningAdminClient = () => getAdminSupabaseClient('learning');
export const getFormsAdminClient = () => getAdminSupabaseClient('forms');
