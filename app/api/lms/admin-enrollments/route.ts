import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { loadUserAccessRows } from '@/app/lib/moduleAccess/rbac';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireLmsOrStudentsAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' as const, status: 401 as const, supabase: null };
  }

  const supabase = getServiceSupabase();
  let rows: Awaited<ReturnType<typeof loadUserAccessRows>>;
  try {
    rows = await loadUserAccessRows(supabase, userId);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Error',
      status: 500 as const,
      supabase: null,
    };
  }

  const isSuperAdmin = rows.some((r) => r.is_super_admin === true);
  const allowed = isSuperAdmin ||
    rows.some((r) =>
      ['students', 'student', 'lms', 'courses'].includes(r.module_key)
    );

  if (!allowed) {
    return { error: 'Forbidden' as const, status: 403 as const, supabase: null };
  }

  return { error: null, status: 200 as const, supabase };
}

/**
 * Admin enrollment read (bypasses anon RLS).
 * POST { courseIds?: string[], courseId?: string }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireLmsOrStudentsAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const body = await request.json().catch(() => ({}));
  const courseId =
    typeof body.courseId === 'string' ? body.courseId.trim() : '';
  const courseIds = Array.isArray(body.courseIds)
    ? body.courseIds.map(String).filter(Boolean)
    : [];

  let query = authResult.supabase
    .from('myuni_enrollments')
    .select(
      'id, course_id, user_id, enrolled_at, progress_percentage, is_active, tier_id'
    );

  if (courseId) {
    query = query.eq('course_id', courseId);
  } else if (courseIds.length > 0) {
    query = query.in('course_id', courseIds);
  } else {
    return NextResponse.json(
      { error: 'courseId or courseIds required' },
      { status: 400 }
    );
  }

  // Include active + null (legacy rows)
  query = query.or('is_active.eq.true,is_active.is.null');

  const { data, error } = await query.limit(10000);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enrollments = (data || []).filter(
    (row) => row.is_active !== false
  );

  return NextResponse.json({
    enrollments,
    count: enrollments.length,
  });
}
