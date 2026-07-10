import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg',
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
  const { data, error } = await supabase
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

  const { data, error } = await supabase
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

  const { data: courseRow } = await supabase
    .from('myuni_courses')
    .select('current_participants')
    .eq('id', courseId)
    .single();

  if (courseRow) {
    await supabase
      .from('myuni_courses')
      .update({ current_participants: (courseRow.current_participants || 0) + 1 })
      .eq('id', courseId);
  }

  return data;
}

export async function getUserEnrolledCourses(userId: string) {
  const { data, error } = await supabase
    .from('myuni_enrollments')
    .select(`
      id,
      course_id,
      enrolled_at,
      progress_percentage,
      is_active,
      myuni_courses (
        id,
        slug,
        title,
        description,
        instructor_name,
        thumbnail_url,
        duration,
        level,
        course_type,
        is_active
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('enrolled_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
