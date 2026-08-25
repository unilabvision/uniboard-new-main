import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { generateCourseSlug } from '@/app/lib/lms/courseUtils';
import { normalizeDescriptionForStorage } from '@/app/lib/lms/htmlContent';

/**
 * GET – Active courses for discount code course picker.
 */
export async function GET() {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { data, error } = await authResult.supabase
      .from('myuni_courses')
      .select('id, title, slug')
      .eq('is_active', true)
      .order('title');

    if (error) {
      console.error('LMS courses list error:', error);
      return NextResponse.json({ error: error.message || 'Kurslar alınamadı' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (e) {
    console.error('LMS courses GET error:', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * POST – Create course + default section/lesson (service role, bypasses anon RLS).
 * Body: { title, description?, instructor_name?, course_type?, level?, duration?, price?, locale? }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const title = String(body.title || '').trim();
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const locale = body.locale === 'en' ? 'en' : 'tr';
    const courseType = ['online', 'live', 'hybrid'].includes(body.course_type)
      ? body.course_type
      : 'online';
    const level = String(body.level || 'beginner').trim() || 'beginner';
    const parsedPrice =
      body.price === null || body.price === undefined || body.price === ''
        ? 0
        : Number(body.price);
    const price = Number.isFinite(parsedPrice) ? parsedPrice : 0;

    const { data: course, error: courseError } = await authResult.supabase
      .from('myuni_courses')
      .insert([
        {
          slug: generateCourseSlug(title),
          title,
          description: normalizeDescriptionForStorage(String(body.description || '')),
          instructor_name: String(body.instructor_name || '').trim() || null,
          course_type: courseType,
          level,
          duration: String(body.duration || '').trim() || null,
          price,
          is_active: false,
          is_registration_open: true,
          current_participants: 0,
          session_duration_minutes: 0,
        },
      ])
      .select('id, slug, title')
      .single();

    if (courseError || !course) {
      console.error('[lms/courses] insert:', courseError?.message);
      return NextResponse.json(
        { error: courseError?.message || 'Kurs oluşturulamadı' },
        { status: 500 }
      );
    }

    const { data: section, error: sectionError } = await authResult.supabase
      .from('myuni_course_sections')
      .insert([
        {
          course_id: course.id,
          title: locale === 'en' ? 'General' : 'Genel',
          description: '',
          order_index: 0,
          is_active: true,
        },
      ])
      .select('id')
      .single();

    if (sectionError || !section) {
      console.error('[lms/courses] section insert:', sectionError?.message);
      return NextResponse.json(
        { error: sectionError?.message || 'Bölüm oluşturulamadı', course },
        { status: 500 }
      );
    }

    const { error: lessonError } = await authResult.supabase
      .from('myuni_course_lessons')
      .insert([
        {
          section_id: section.id,
          title: locale === 'en' ? 'Introduction' : 'Giriş',
          description: '',
          lesson_type: 'video',
          order_index: 0,
          is_active: true,
          is_locked: false,
          is_completed: false,
        },
      ]);

    if (lessonError) {
      console.error('[lms/courses] lesson insert:', lessonError.message);
      return NextResponse.json(
        { error: lessonError.message || 'Ders oluşturulamadı', course },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (e) {
    console.error('LMS courses POST error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
