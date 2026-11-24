import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { decodeCertOrgsFromNotes } from '@/app/lib/moduleAccess/rbac';

export async function resolveCertificateOrganizationSlugs(params: {
  supabase: SupabaseClient;
  clerkUserId: string | null;
  isSuperAdmin: boolean;
}): Promise<string[] | null> {
  const { supabase, clerkUserId, isSuperAdmin } = params;
  if (isSuperAdmin) return null;
  if (!clerkUserId) return [];

  type AccessRow = { organization_id: number | string | null; notes: string | null };
  const { data: accessRows, error } = await supabase
    .from('user_module_access')
    .select('organization_id, notes')
    .eq('clerk_user_id', clerkUserId)
    .eq('module_key', 'certificates')
    .eq('is_enabled', true);
  if (error) throw new Error(error.message);

  for (const row of (accessRows ?? []) as AccessRow[]) {
    const slugs = decodeCertOrgsFromNotes(row.notes);
    if (slugs?.length) return [...new Set(slugs)];
  }

  const organizationIds = (accessRows ?? [])
    .map((row) => row.organization_id)
    .map((id) => (typeof id === 'string' ? Number(id) : id))
    .filter((id): id is number => Number.isFinite(id));
  if (organizationIds.length === 0) return [];

  const { data: organizations, error: organizationError } = await supabase
    .from('organizations')
    .select('slug')
    .in('id', organizationIds);
  if (organizationError) throw new Error(organizationError.message);
  return [...new Set((organizations ?? []).map((row) => row.slug).filter(Boolean))];
}
