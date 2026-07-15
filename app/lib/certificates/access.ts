import { auth } from '@clerk/nextjs/server';
import { getCertificatesServiceSupabase } from '@/app/lib/certificates/issuance';

const CERTIFICATES_MODULE_KEY = 'certificates';

export async function requireCertificatesModuleUser() {
  const { userId } = await auth();
  if (!userId) {
    return {
      error: 'Unauthorized' as const,
      status: 401 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  const supabase = getCertificatesServiceSupabase();
  const { data: rows, error } = await supabase
    .from('user_module_access')
    .select('module_key, is_enabled, is_super_admin')
    .eq('clerk_user_id', userId)
    .eq('is_enabled', true);

  if (error) {
    return {
      error: error.message,
      status: 500 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  const isSuperAdmin = (rows || []).some((r) => r.is_super_admin === true);
  const hasModule =
    isSuperAdmin ||
    (rows || []).some((r) => r.module_key === CERTIFICATES_MODULE_KEY);

  if (!hasModule) {
    return {
      error: 'Forbidden' as const,
      status: 403 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
    };
  }

  return { error: null, status: 200 as const, userId, supabase, isSuperAdmin };
}
