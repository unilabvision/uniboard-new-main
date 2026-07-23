import { auth } from '@clerk/nextjs/server';
import { getCertificatesServiceSupabase } from '@/app/lib/certificates/issuance';
import {
  hasFeature,
  loadUserAccessRows,
  resolveMembershipFromRows,
  type PanelMembership,
} from '@/app/lib/moduleAccess/rbac';

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
      membership: null as PanelMembership | null,
    };
  }

  const supabase = getCertificatesServiceSupabase();
  let rows: Awaited<ReturnType<typeof loadUserAccessRows>>;
  try {
    rows = await loadUserAccessRows(supabase, userId);
  } catch (e) {
    return {
      error: (e instanceof Error ? e.message : 'Error') as string,
      status: 500 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null,
    };
  }

  const resolved = resolveMembershipFromRows(rows, CERTIFICATES_MODULE_KEY);
  const hasModule = resolved.isSuperAdmin || Boolean(resolved.membership);

  if (!hasModule) {
    return {
      error: 'Forbidden' as const,
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

export async function requireCertificatesCapability(required: string) {
  const base = await requireCertificatesModuleUser();
  if (base.error || !base.supabase) return base;

  if (!hasFeature(base.membership, required, base.isSuperAdmin)) {
    return {
      error: 'Forbidden' as const,
      status: 403 as const,
      userId: null,
      supabase: null,
      isSuperAdmin: false,
      membership: null as PanelMembership | null,
    };
  }

  return base;
}
