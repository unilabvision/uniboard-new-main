import { NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';

const COURSE_MANAGEMENT_COLUMNS = `
  id, slug, title, instructor_name, duration, level, price, original_price,
  thumbnail_url, is_active, is_featured, created_at, course_type,
  max_participants, current_participants, session_count,
  registration_deadline, is_registration_open
`;

export async function GET() {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { data, error } = await authResult.supabase
    .from('myuni_courses')
    .select(COURSE_MANAGEMENT_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[lms/courses/manage] list failed:', error.message);
    return NextResponse.json({ error: 'Kurslar alınamadı' }, { status: 500 });
  }

  return NextResponse.json({ success: true, courses: data ?? [] });
}
