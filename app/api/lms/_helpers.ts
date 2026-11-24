import { auth } from '@clerk/nextjs/server';
import { loadUserAccessRows } from '@/app/lib/moduleAccess/rbac';
import {
  getFormsAdminClient,
  getIdentityAdminClient,
  getLearningAdminClient,
} from '@/app/lib/supabase/adminDatabases.server';

export function getLmsServiceSupabase() {
  return getLearningAdminClient();
}

export function getLmsFormSupabase() {
  return getFormsAdminClient();
}

export function getIdentityServiceSupabase() {
  return getIdentityAdminClient();
}

/** LMS content admin: super-admin or lms/courses/students module. */
export async function requireLmsContentAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' as const, status: 401 as const, supabase: null };
  }

  const supabase = getLmsServiceSupabase();
  const accessSupabase = getIdentityServiceSupabase();
  let rows: Awaited<ReturnType<typeof loadUserAccessRows>>;
  try {
    rows = await loadUserAccessRows(accessSupabase, userId);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Error',
      status: 500 as const,
      supabase: null,
    };
  }

  const isSuperAdmin = rows.some((r) => r.is_super_admin === true);
  const allowed =
    isSuperAdmin ||
    rows.some((r) => ['students', 'student', 'lms', 'courses', 'lms-2'].includes(r.module_key));

  if (!allowed) {
    return { error: 'Forbidden' as const, status: 403 as const, supabase: null };
  }

  return { error: null, status: 200 as const, supabase, userId };
}
