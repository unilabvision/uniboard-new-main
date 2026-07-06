import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function createCertificatesSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2;

  if (!url || !anonKey) {
    throw new Error(
      'Sertifika Supabase yapılandırması eksik. .env.local dosyasında NEXT_PUBLIC_SUPABASE_URL2 ve NEXT_PUBLIC_SUPABASE_ANON_KEY2 tanımlayın.'
    );
  }

  return createClient(url, anonKey);
}

export function getCertificatesSupabase(): SupabaseClient {
  if (!client) {
    client = createCertificatesSupabaseClient();
  }
  return client;
}

/** Lazy init — env değişkenleri yalnızca client kullanıldığında okunur */
export const certificatesSupabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const instance = getCertificatesSupabase();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value;
  },
});
