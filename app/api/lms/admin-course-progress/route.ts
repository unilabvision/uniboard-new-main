import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { loadUserAccessRows } from '@/app/lib/moduleAccess/rbac';
import {
  buildKurumCourseOverviews,
  buildKurumStudentProgress,
  type KurumCourseRow,
  type KurumEnrollmentRow,
  type KurumLessonRow,
  type KurumProgressRow,
} from '@/app/lib/lms/kurumProgress';

const MAX_KURUM_COURSES = 500;
const MAX_KURUM_LESSONS = 10_000;
const MAX_KURUM_ENROLLMENTS = 20_000;
const MAX_KURUM_PROGRESS_ROWS = 50_000;

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

function lessonTitle(relation: unknown): string {
  const value = Array.isArray(relation) ? relation[0] : relation;
  if (!value || typeof value !== 'object') return '';
  const title = (value as { title?: unknown }).title;
  return typeof title === 'string' ? title : '';
}

async function loadKurumProgressRows(
  supabase: NonNullable<Awaited<ReturnType<typeof requireLmsOrStudentsAdmin>>['supabase']>,
  lessonIds: string[]
): Promise<{ data: KurumProgressRow[]; error: string | null }> {
  if (lessonIds.length === 0) return { data: [], error: null };

  const rows: KurumProgressRow[] = [];
  for (let index = 0; index < lessonIds.length; index += 500) {
    const chunk = lessonIds.slice(index, index + 500);
    const { data, error } = await supabase
      .from('myuni_kurum_user_progress')
      .select('user_id, lesson_id, is_completed, watch_time_seconds, quiz_score, updated_at')
      .in('lesson_id', chunk)
      .limit(MAX_KURUM_PROGRESS_ROWS + 1);
    if (error) return { data: [], error: error.message };
    rows.push(...((data || []) as KurumProgressRow[]));
    if (rows.length > MAX_KURUM_PROGRESS_ROWS) {
      return { data: [], error: 'Progress dataset exceeds the safe response limit' };
    }
  }
  return { data: rows, error: null };
}

async function loadKurumDataset(
  supabase: NonNullable<Awaited<ReturnType<typeof requireLmsOrStudentsAdmin>>['supabase']>,
  courseId?: string
) {
  let coursesQuery = supabase
    .from('myuni_kurum_courses')
    .select('id, title, slug, banner_image_url, instructor_name')
    .eq('is_active', true)
    .limit(MAX_KURUM_COURSES);
  if (courseId) coursesQuery = coursesQuery.eq('id', courseId);

  let lessonsQuery = supabase
    .from('myuni_kurum_course_lessons_user')
    .select('id, course_id, order_index, myuni_kurum_lessons_data!inner(title)')
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .limit(MAX_KURUM_LESSONS);
  if (courseId) lessonsQuery = lessonsQuery.eq('course_id', courseId);

  let enrollmentsQuery = supabase
    .from('myuni_kurum_enrollments')
    .select('course_id, user_id, enrolled_at, progress_percentage')
    .eq('is_active', true)
    .limit(MAX_KURUM_ENROLLMENTS);
  if (courseId) enrollmentsQuery = enrollmentsQuery.eq('course_id', courseId);

  const [coursesResult, lessonsResult, enrollmentsResult] = await Promise.all([
    coursesQuery,
    lessonsQuery,
    enrollmentsQuery,
  ]);
  const firstError = coursesResult.error || lessonsResult.error || enrollmentsResult.error;
  if (firstError) throw new Error(firstError.message);

  const lessons: KurumLessonRow[] = (lessonsResult.data || []).map((row) => ({
    id: String(row.id),
    course_id: String(row.course_id),
    order_index: Number(row.order_index) || 0,
    title: lessonTitle(row.myuni_kurum_lessons_data),
  }));
  const progressResult = await loadKurumProgressRows(
    supabase,
    lessons.map((row) => row.id)
  );
  if (progressResult.error) throw new Error(progressResult.error);

  return {
    courses: (coursesResult.data || []) as KurumCourseRow[],
    lessons,
    enrollments: (enrollmentsResult.data || []) as KurumEnrollmentRow[],
    progress: progressResult.data,
  };
}

async function handleKurumProgress(
  supabase: NonNullable<Awaited<ReturnType<typeof requireLmsOrStudentsAdmin>>['supabase']>,
  body: Record<string, unknown>
) {
  const view = body.view === 'course' ? 'course' : 'overview';
  const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
  if (view === 'course' && !courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  try {
    const dataset = await loadKurumDataset(supabase, courseId || undefined);
    if (view === 'course') {
      return NextResponse.json({
        students: buildKurumStudentProgress(
          dataset.lessons,
          dataset.enrollments,
          dataset.progress
        ),
      });
    }
    return NextResponse.json({
      courses: buildKurumCourseOverviews(
        dataset.courses,
        dataset.lessons,
        dataset.enrollments,
        dataset.progress
      ),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Progress query failed' },
      { status: 500 }
    );
  }
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

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.dataset === 'kurum') {
    return handleKurumProgress(authResult.supabase, body);
  }
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
