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
  const allowed =
    isSuperAdmin ||
    rows.some((r) =>
      ['students', 'student', 'lms', 'courses'].includes(r.module_key)
    );

  if (!allowed) {
    return { error: 'Forbidden' as const, status: 403 as const, supabase: null };
  }

  return { error: null, status: 200 as const, supabase };
}

/**
 * Admin read of lesson progress for a course (bypasses anon RLS).
 * POST { courseId: string, userIds?: string[] }
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
    ? [...new Set(body.courseIds.map(String).filter(Boolean))]
    : [];
  const targetCourseIds = courseId ? [courseId] : courseIds;

  if (targetCourseIds.length === 0) {
    return NextResponse.json(
      { error: 'courseId or courseIds required' },
      { status: 400 }
    );
  }

  const userIds = Array.isArray(body.userIds)
    ? [...new Set(body.userIds.map(String).filter(Boolean))]
    : [];

  let lessonsQuery = authResult.supabase
    .from('myuni_course_lessons')
    .select(
      `
      id,
      title,
      myuni_course_sections!inner (
        id,
        title,
        course_id
      )
    `
    );

  if (targetCourseIds.length === 1) {
    lessonsQuery = lessonsQuery.eq(
      'myuni_course_sections.course_id',
      targetCourseIds[0]
    );
  } else {
    lessonsQuery = lessonsQuery.in(
      'myuni_course_sections.course_id',
      targetCourseIds
    );
  }

  const { data: lessons, error: lessonsError } = await lessonsQuery;

  if (lessonsError) {
    return NextResponse.json({ error: lessonsError.message }, { status: 500 });
  }

  const lessonRows = lessons || [];
  const lessonIds = lessonRows.map((l) => l.id);

  if (lessonIds.length === 0) {
    return NextResponse.json({ lessons: lessonRows, progress: [] });
  }

  let progressQuery = authResult.supabase
    .from('myuni_user_progress')
    .select(
      'user_id, lesson_id, is_completed, watch_time_seconds, quiz_score, updated_at'
    )
    .in('lesson_id', lessonIds);

  if (userIds.length > 0) {
    progressQuery = progressQuery.in('user_id', userIds);
  }

  const { data: progress, error: progressError } =
    await progressQuery.limit(50000);

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  return NextResponse.json({
    lessons: lessonRows,
    progress: progress || [],
  });
}
