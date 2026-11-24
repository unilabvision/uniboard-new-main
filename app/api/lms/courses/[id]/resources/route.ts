import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getLmsServiceSupabase, requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { getIdentityAdminClient } from '@/app/lib/supabase/adminDatabases.server';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: courseId } = await context.params;
  if (!courseId) {
    return NextResponse.json({ error: 'course id is required' }, { status: 400 });
  }

  const identity = getIdentityAdminClient();
  const { data: enrollment, error: enrollmentError } = await identity
    .from('myuni_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (enrollmentError) {
    return NextResponse.json({ error: enrollmentError.message }, { status: 500 });
  }

  let learning = getLmsServiceSupabase();
  if (!enrollment) {
    const adminResult = await requireLmsContentAdmin();
    if (adminResult.error || !adminResult.supabase) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    learning = adminResult.supabase;
  }

  const { data: sections, error: sectionError } = await learning
    .from('myuni_course_sections')
    .select('id')
    .eq('course_id', courseId);
  if (sectionError) {
    return NextResponse.json({ error: sectionError.message }, { status: 500 });
  }

  const sectionIds = (sections || []).map((section) => section.id);
  if (sectionIds.length === 0) return NextResponse.json({ notes: [] });

  const { data: lessons, error: lessonError } = await learning
    .from('myuni_course_lessons')
    .select('id')
    .in('section_id', sectionIds);
  if (lessonError) {
    return NextResponse.json({ error: lessonError.message }, { status: 500 });
  }

  const lessonIds = (lessons || []).map((lesson) => lesson.id);
  if (lessonIds.length === 0) return NextResponse.json({ notes: [] });

  const { data: notes, error: noteError } = await learning
    .from('myuni_notes')
    .select('id,lesson_id,title,content,content_type,file_url,order_index')
    .in('lesson_id', lessonIds)
    .order('order_index', { ascending: true });
  if (noteError) {
    return NextResponse.json({ error: noteError.message }, { status: 500 });
  }

  return NextResponse.json({ notes: notes || [] });
}
