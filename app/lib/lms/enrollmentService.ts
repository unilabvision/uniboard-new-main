import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const identitySupabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_IDENTITY_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_IDENTITY_PUBLISHABLE_KEY,
});

const learningSupabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_LEARNING_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_LEARNING_PUBLISHABLE_KEY,
});

export interface Enrollment {
  id?: string;
  course_id: string;
  user_id: string;
  enrolled_at: string;
  progress_percentage: number;
  is_active: boolean;
}

export async function getUserEnrollment(userId: string, courseId: string): Promise<Enrollment | null> {
  const { data, error } = await identitySupabase
    .from('myuni_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function enrollUser(userId: string, courseId: string): Promise<Enrollment> {
  const existing = await getUserEnrollment(userId, courseId);
  if (existing) return existing;

  const { data, error } = await identitySupabase
    .from('myuni_enrollments')
    .insert([{
      course_id: courseId,
      user_id: userId,
      enrolled_at: new Date().toISOString(),
      progress_percentage: 0,
      is_active: true,
    }])
    .select()
    .single();

  if (error) throw error;

  const { data: courseRow } = await learningSupabase
    .from('myuni_courses')
    .select('current_participants')
    .eq('id', courseId)
    .single();

  if (courseRow) {
    await learningSupabase
      .from('myuni_courses')
      .update({ current_participants: (courseRow.current_participants || 0) + 1 })
      .eq('id', courseId);
  }

  return data;
}

export async function getUserEnrolledCourses(userId: string) {
  const { data, error } = await identitySupabase
    .from('myuni_enrollments')
    .select('id, course_id, enrolled_at, progress_percentage, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  const enrollments = data || [];
  const courseIds = [...new Set(enrollments.map((row) => row.course_id).filter(Boolean))];
  if (courseIds.length === 0) return [];

  const { data: courses, error: coursesError } = await learningSupabase
    .from('myuni_courses')
    .select('id, slug, title, description, instructor_name, thumbnail_url, duration, level, course_type, is_active')
    .in('id', courseIds);
  if (coursesError) throw coursesError;

  const courseById = new Map((courses || []).map((course) => [course.id, course]));
  return enrollments.map((row) => ({
    ...row,
    myuni_courses: courseById.get(row.course_id) ?? null,
  }));
}
