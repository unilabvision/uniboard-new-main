import 'server-only';

import { loadUserAccessRows } from '@/app/lib/moduleAccess/rbac';
import { getIdentityAdminClient } from '@/app/lib/supabase/adminDatabases.server';

const USER_DIRECTORY_MODULES = new Set([
  'analytics',
  'reports',
  'courses',
  'lms',
  'students',
  'student',
  'lms-2',
]);

export async function canReadUserDirectory(clerkUserId: string): Promise<boolean> {
  const rows = await loadUserAccessRows(getIdentityAdminClient(), clerkUserId);
  return rows.some(
    (row) =>
      row.is_super_admin === true || USER_DIRECTORY_MODULES.has(row.module_key)
  );
}
