import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import {
  MEMBERSHIPS_MODULE_KEY,
  type MembershipsCapability,
  hasMembershipsAccess,
} from '@/app/lib/memberships/permissions';
import {
  hasFeature,
  loadUserAccessRows,
  resolveMembershipFromRows,
} from '@/app/lib/moduleAccess/rbac';

function getMembershipsSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function requireMembershipsCapability(
  required: MembershipsCapability,
  options: { superAdminOnly?: boolean } = {}
) {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized', status: 401 as const, userId: null, supabase: null };
  }

  const supabase = getMembershipsSupabase();
  try {
    const rows = await loadUserAccessRows(supabase, userId);
    const access = resolveMembershipFromRows(rows, MEMBERSHIPS_MODULE_KEY);
    if (!hasMembershipsAccess(access.moduleKeys, access.isSuperAdmin)) {
      return { error: 'Forbidden', status: 403 as const, userId: null, supabase: null };
    }
    if (!hasFeature(access.membership, required, access.isSuperAdmin)) {
      return { error: 'Forbidden', status: 403 as const, userId: null, supabase: null };
    }
    if (options.superAdminOnly && !access.isSuperAdmin) {
      return { error: 'Super admin required', status: 403 as const, userId: null, supabase: null };
    }
    return {
      error: null,
      status: 200 as const,
      userId,
      supabase,
      isSuperAdmin: access.isSuperAdmin,
    };
  } catch (error) {
    console.error('[memberships] access check failed', error);
    return { error: 'Access check failed', status: 500 as const, userId: null, supabase: null };
  }
}

export function validateMembershipPlanPayload(plan: Record<string, unknown>): string | null {
  const price = Number(plan.price);
  const durationMonths = Number(plan.duration_months);
  const code = typeof plan.code === 'string' ? plan.code.trim() : '';
  const nameTr = typeof plan.name_tr === 'string' ? plan.name_tr.trim() : '';

  if (!Number.isFinite(price) || price < 0) return 'Price must be zero or greater';
  if (![1, 3, 6].includes(durationMonths)) return 'Duration must be 1, 3 or 6 months';
  if (!/^[A-Z0-9_]+$/.test(code)) return 'Plan code is invalid';
  if (!nameTr) return 'Turkish plan name is required';
  return null;
}
