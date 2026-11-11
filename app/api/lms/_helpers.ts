import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { loadUserAccessRows } from '@/app/lib/moduleAccess/rbac';

export function getLmsServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_LEARNING_URL;
  const key = process.env.SUPABASE_LEARNING_SECRET_KEY;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getLmsFormSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_FORMS_URL;
  const key = process.env.SUPABASE_FORMS_SECRET_KEY;
  if (!url || !key) throw new Error('Form database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getModuleAccessSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_IDENTITY_URL;
  const key = process.env.SUPABASE_IDENTITY_SECRET_KEY;
  if (!url || !key) throw new Error('Identity database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** LMS content admin: super-admin or lms/courses/students module. */
export async function requireLmsContentAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' as const, status: 401 as const, supabase: null };
  }

  const supabase = getLmsServiceSupabase();
  const accessSupabase = getModuleAccessSupabase();
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
