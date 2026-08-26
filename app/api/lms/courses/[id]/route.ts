import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { buildCourseUpdatePayload } from '@/app/lib/lms/courseUtils';
import { normalizeDescriptionForStorage } from '@/app/lib/lms/htmlContent';
import type { Course } from '@/app/types/course';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH – Update course fields via service role (bypasses anon RLS).
 * Publishes to myunilab.net by setting is_active=true on the shared DB.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const title = String(body.title || '').trim();
  const slug = String(body.slug || '').trim();
  if (!title) {
    return NextResponse.json({ error: 'Kurs başlığı gerekli' }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ error: 'Kurs kısa adı gerekli' }, { status: 400 });
  }

  const courseType = ['online', 'live', 'hybrid'].includes(String(body.course_type))
    ? (body.course_type as Course['course_type'])
    : 'online';

  const asOptionalNumber = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  };

  const payload = buildCourseUpdatePayload({
    id,
    title,
    slug,
    description: normalizeDescriptionForStorage(String(body.description || '')) || undefined,
    instructor_name: body.instructor_name != null ? String(body.instructor_name) : undefined,
    instructor_description:
      body.instructor_description != null ? String(body.instructor_description) : undefined,
    instructor_email: body.instructor_email != null ? String(body.instructor_email) : undefined,
    instructor_linkedin:
      body.instructor_linkedin != null ? String(body.instructor_linkedin) : undefined,
    instructor_image_url:
      body.instructor_image_url != null ? String(body.instructor_image_url) : undefined,
    duration: body.duration != null ? String(body.duration) : undefined,
    level: body.level != null ? String(body.level) : undefined,
    price: asOptionalNumber(body.price),
    original_price: asOptionalNumber(body.original_price),
    thumbnail_url:
      body.thumbnail_url != null && String(body.thumbnail_url).trim()
        ? String(body.thumbnail_url)
        : undefined,
    banner_url:
      body.banner_url != null && String(body.banner_url).trim()
        ? String(body.banner_url)
        : undefined,
    is_active: Boolean(body.is_active),
    course_type: courseType,
    live_start_date: body.live_start_date ? String(body.live_start_date) : undefined,
    live_end_date: body.live_end_date ? String(body.live_end_date) : undefined,
    live_timezone: body.live_timezone != null ? String(body.live_timezone) : undefined,
    max_participants: asOptionalNumber(body.max_participants),
    session_count: asOptionalNumber(body.session_count),
    session_duration_minutes: asOptionalNumber(body.session_duration_minutes) ?? 0,
    registration_deadline: body.registration_deadline
      ? String(body.registration_deadline)
      : undefined,
    is_registration_open: Boolean(body.is_registration_open),
  }) as Record<string, unknown>;

  // Explicit null clears for image URLs when admin removes them
  if (body.banner_url === null || body.banner_url === '') {
    payload.banner_url = null;
  }
  if (body.thumbnail_url === null || body.thumbnail_url === '') {
    payload.thumbnail_url = null;
  }

  const { data, error } = await authResult.supabase
    .from('myuni_courses')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('LMS course PATCH error:', error);
    const message = error.message || 'Kurs kaydedilemedi';
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json(
      {
        error:
          error.code === '23505'
            ? 'Bu kısa ad başka bir kursta kullanılıyor'
            : message,
      },
      { status }
    );
  }

  if (!data) {
    return NextResponse.json({ error: 'Kurs bulunamadı' }, { status: 404 });
  }

  return NextResponse.json({ success: true, course: data });
}
