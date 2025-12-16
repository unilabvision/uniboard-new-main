import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  UserProgress, 
  UserProgressWithRelations, 
  CourseProgress, 
  LessonProgress,
  ProgressStatistics,
  ProgressTimeframe,
  CourseCompletion,
  ProgressFilters
} from './types';

// Supabase client
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg'
});

export class ProgressService {
  /**
   * Get user's progress for a specific lesson
   */
  static async getUserLessonProgress(userId: string, lessonId: string): Promise<UserProgress | null> {
    try {
      const { data, error } = await supabase
        .from('myuni_user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching user lesson progress:', error);
      throw error;
    }
  }

  /**
   * Update or create user's lesson progress
   */
  static async updateLessonProgress(
    userId: string, 
    lessonId: string, 
    updates: Partial<Omit<UserProgress, 'id' | 'user_id' | 'lesson_id' | 'created_at'>>
  ): Promise<UserProgress> {
    try {
      const { data, error } = await supabase
        .from('myuni_user_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          updated_at: new Date().toISOString(),
          ...updates
        }, {
          onConflict: 'user_id,lesson_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      throw error;
    }
  }

  /**
   * Mark lesson as completed
   */
  static async markLessonCompleted(userId: string, lessonId: string): Promise<UserProgress> {
    try {
      return await this.updateLessonProgress(userId, lessonId, {
        is_completed: true,
        completed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      throw error;
    }
  }

  /**
   * Update video watch progress
   */
  static async updateVideoProgress(
    userId: string, 
    lessonId: string, 
    watchTimeSeconds: number, 
    lastPositionSeconds: number
  ): Promise<UserProgress> {
    try {
      // Get current progress to increment watch count
      const currentProgress = await this.getUserLessonProgress(userId, lessonId);
      const currentWatchCount = currentProgress?.video_watch_count || 0;

      return await this.updateLessonProgress(userId, lessonId, {
        watch_time_seconds: watchTimeSeconds,
        last_position_seconds: lastPositionSeconds,
        video_watch_count: currentWatchCount + 1,
        last_video_watch_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating video progress:', error);
      throw error;
    }
  }

  /**
   * Record quiz attempt
   */
  static async recordQuizAttempt(
    userId: string, 
    lessonId: string, 
    score: number
  ): Promise<UserProgress> {
    try {
      const currentProgress = await this.getUserLessonProgress(userId, lessonId);
      const currentAttempts = currentProgress?.quiz_attempts || 0;

      return await this.updateLessonProgress(userId, lessonId, {
        quiz_score: score,
        quiz_attempts: currentAttempts + 1,
        last_quiz_attempt_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error recording quiz attempt:', error);
      throw error;
    }
  }

  /**
   * Add or update lesson notes
   */
  static async updateLessonNotes(
    userId: string, 
    lessonId: string, 
    notes: string
  ): Promise<UserProgress> {
    try {
      return await this.updateLessonProgress(userId, lessonId, { notes });
    } catch (error) {
      console.error('Error updating lesson notes:', error);
      throw error;
    }
  }

  /**
   * Get user's course progress summary
   */
  static async getUserCourseProgress(userId: string, filters?: ProgressFilters): Promise<CourseProgress[]> {
    try {
      // This will use a database function for better performance
      let query = supabase.rpc('get_user_course_progress', { p_user_id: userId });

      if (filters?.course_type && filters.course_type !== 'all') {
        query = query.eq('course_type', filters.course_type);
      }

      if (filters?.completion_status && filters.completion_status !== 'all') {
        switch (filters.completion_status) {
          case 'completed':
            query = query.eq('completion_percentage', 100);
            break;
          case 'in_progress':
            query = query.gt('completion_percentage', 0).lt('completion_percentage', 100);
            break;
          case 'not_started':
            query = query.eq('completion_percentage', 0);
            break;
        }
      }

      if (filters?.sort_by) {
        const ascending = filters.sort_order === 'asc';
        query = query.order(filters.sort_by, { ascending });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user course progress:', error);
      throw error;
    }
  }

  /**
   * Get detailed lesson progress for a course
   */
  static async getCourseLessonProgress(userId: string, courseId: string): Promise<LessonProgress[]> {
    try {
      const { data, error } = await supabase
        .from('myuni_course_lessons')
        .select(`
          id,
          title,
          description,
          duration_minutes,
          order_index,
          section:section_id (
            id,
            title,
            order_index,
            course_id
          ),
          myuni_user_progress!left (
            is_completed,
            watch_time_seconds,
            last_position_seconds,
            quiz_score,
            quiz_attempts,
            notes,
            created_at,
            updated_at,
            completed_at,
            video_watch_count,
            last_video_watch_at
          )
        `)
        .eq('section.course_id', courseId)
        .eq('myuni_user_progress.user_id', userId)
        .order('section.order_index')
        .order('order_index');

      if (error) throw error;

      // Transform the data to match LessonProgress interface
      return (data || []).map((lesson: {
        id: string;
        title: string;
        description?: string;
        duration_minutes?: number;
        myuni_user_progress?: Array<{
          is_completed?: boolean;
          watch_time_seconds?: number;
          last_position_seconds?: number;
          quiz_score?: number;
          quiz_attempts?: number;
          notes?: string;
          created_at?: string;
          last_video_watch_at?: string;
          completed_at?: string;
          video_watch_count?: number;
        }>;
        section?: unknown;
        [key: string]: unknown;
      }) => {
        const progress = lesson.myuni_user_progress?.[0];
        const section = Array.isArray(lesson.section) ? lesson.section[0] : lesson.section;
        const completionPercentage = progress?.is_completed ? 100 : 
          (progress?.watch_time_seconds && lesson.duration_minutes) ? 
          Math.min(100, (progress.watch_time_seconds / (lesson.duration_minutes * 60)) * 100) : 0;

        return {
          lesson_id: lesson.id,
          lesson_title: lesson.title,
          lesson_description: lesson.description,
          lesson_duration_minutes: lesson.duration_minutes,
          lesson_order: lesson.order_index,
          section_id: section?.id || '',
          section_title: section?.title || '',
          section_order: section?.order_index || 0,
          course_id: section?.course_id || '',
          course_title: '', // This would need to be fetched separately or joined
          course_slug: '', // This would need to be fetched separately or joined
          is_completed: progress?.is_completed || false,
          completion_percentage: completionPercentage,
          watch_time_seconds: progress?.watch_time_seconds || 0,
          last_position_seconds: progress?.last_position_seconds || 0,
          quiz_score: progress?.quiz_score || null,
          quiz_attempts: progress?.quiz_attempts || 0,
          notes: progress?.notes || null,
          first_watched_at: progress?.created_at || null,
          last_watched_at: progress?.last_video_watch_at || null,
          completed_at: progress?.completed_at || null,
          video_watch_count: progress?.video_watch_count || 0
        } as LessonProgress;
      });
    } catch (error) {
      console.error('Error fetching course lesson progress:', error);
      throw error;
    }
  }

  /**
   * Get user's overall progress statistics
   */
  static async getProgressStatistics(userId: string): Promise<ProgressStatistics> {
    try {
      const { data, error } = await supabase.rpc('get_user_progress_statistics', { 
        p_user_id: userId 
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching progress statistics:', error);
      // Return default statistics if RPC fails
      return {
        total_courses: 0,
        enrolled_courses: 0,
        completed_courses: 0,
        in_progress_courses: 0,
        not_started_courses: 0,
        total_lessons: 0,
        completed_lessons: 0,
        total_watch_time_seconds: 0,
        total_quiz_attempts: 0,
        avg_quiz_score: 0,
        total_video_watches: 0,
        streak_days: 0,
        last_activity_date: null,
        most_active_day_of_week: null,
        preferred_study_time_hour: null
      };
    }
  }

  /**
   * Get progress data for a specific timeframe
   */
  static async getProgressTimeframe(
    userId: string, 
    periodType: 'day' | 'week' | 'month',
    startDate: string,
    endDate: string
  ): Promise<ProgressTimeframe[]> {
    try {
      const { data, error } = await supabase.rpc('get_progress_timeframe', {
        p_user_id: userId,
        p_period_type: periodType,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching progress timeframe:', error);
      return [];
    }
  }

  /**
   * Get recent user progress activity
   */
  static async getRecentProgress(userId: string, limit: number = 10): Promise<UserProgressWithRelations[]> {
    try {
      const { data, error } = await supabase
        .from('myuni_user_progress')
        .select(`
          *,
          lesson:lesson_id (
            id,
            title,
            description,
            duration_minutes,
            video_url,
            content,
            order_index,
            section:section_id (
              id,
              title,
              description,
              order_index,
              course:course_id (
                id,
                title,
                slug,
                description,
                thumbnail_url,
                instructor_name,
                instructor_email,
                course_type,
                level,
                duration,
                price,
                is_active
              )
            )
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent progress:', error);
      throw error;
    }
  }

  /**
   * Get completed courses with certificate information
   */
  static async getCompletedCourses(userId: string): Promise<CourseCompletion[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_completed_courses', { 
        p_user_id: userId 
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching completed courses:', error);
      return [];
    }
  }

  /**
   * Calculate course completion percentage
   */
  static async getCourseCompletionPercentage(userId: string, courseId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_course_completion', {
        p_user_id: userId,
        p_course_id: courseId
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating course completion:', error);
      return 0;
    }
  }

  /**
   * Get learning streak information
   */
  static async getLearningStreak(userId: string): Promise<{ current_streak: number; longest_streak: number; last_activity: string | null }> {
    try {
      const { data, error } = await supabase.rpc('get_learning_streak', { 
        p_user_id: userId 
      });

      if (error) throw error;
      return data || { current_streak: 0, longest_streak: 0, last_activity: null };
    } catch (error) {
      console.error('Error fetching learning streak:', error);
      return { current_streak: 0, longest_streak: 0, last_activity: null };
    }
  }

  /**
   * Delete user progress for a specific lesson
   */
  static async deleteProgress(userId: string, lessonId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('myuni_user_progress')
        .delete()
        .eq('user_id', userId)
        .eq('lesson_id', lessonId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting progress:', error);
      throw error;
    }
  }

  /**
   * Reset course progress (delete all progress for course lessons)
   */
  static async resetCourseProgress(userId: string, courseId: string): Promise<void> {
    try {
      // First get all lesson IDs for the course
      const { data: lessons, error: lessonsError } = await supabase
        .from('myuni_course_lessons')
        .select('id')
        .eq('section.course_id', courseId);

      if (lessonsError) throw lessonsError;

      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map(lesson => lesson.id);
        
        const { error } = await supabase
          .from('myuni_user_progress')
          .delete()
          .eq('user_id', userId)
          .in('lesson_id', lessonIds);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error resetting course progress:', error);
      throw error;
    }
  }

  /**
   * Bulk update progress for multiple lessons
   */
  static async bulkUpdateProgress(
    userId: string,
    updates: Array<{ lessonId: string; progress: Partial<Omit<UserProgress, 'id' | 'user_id' | 'lesson_id' | 'created_at'>> }>
  ): Promise<UserProgress[]> {
    try {
      const upsertData = updates.map(({ lessonId, progress }) => ({
        user_id: userId,
        lesson_id: lessonId,
        updated_at: new Date().toISOString(),
        ...progress
      }));

      const { data, error } = await supabase
        .from('myuni_user_progress')
        .upsert(upsertData, { onConflict: 'user_id,lesson_id' })
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error bulk updating progress:', error);
      throw error;
    }
  }
}

export default ProgressService;