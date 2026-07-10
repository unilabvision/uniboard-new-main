import type { Course } from '@/app/types/course';

export function generateCourseSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${base || 'kurs'}-${Date.now().toString(36)}`;
}

export function buildCourseUpdatePayload(course: Course) {
  return {
    slug: course.slug,
    title: course.title,
    description: course.description ?? null,
    instructor_name: course.instructor_name ?? null,
    instructor_description: course.instructor_description ?? null,
    instructor_email: course.instructor_email ?? null,
    instructor_linkedin: course.instructor_linkedin ?? null,
    instructor_image_url: course.instructor_image_url ?? null,
    duration: course.duration ?? null,
    level: course.level ?? null,
    price: course.price ?? null,
    original_price: course.original_price ?? null,
    thumbnail_url: course.thumbnail_url ?? null,
    banner_url: course.banner_url ?? null,
    is_active: course.is_active,
    course_type: course.course_type,
    live_start_date: course.live_start_date ?? null,
    live_end_date: course.live_end_date ?? null,
    live_timezone: course.live_timezone ?? null,
    max_participants: course.max_participants ?? null,
    session_count: course.session_count ?? null,
    session_duration_minutes: course.session_duration_minutes ?? 0,
    registration_deadline: course.registration_deadline ?? null,
    is_registration_open: course.is_registration_open,
    updated_at: new Date().toISOString(),
  };
}
