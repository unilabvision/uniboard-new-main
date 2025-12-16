// User Progress Types based on myuni_user_progress table
export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string | null;
  watch_time_seconds: number;
  is_completed: boolean;
  last_position_seconds: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  quiz_score: number | null;
  quiz_attempts: number;
  last_quiz_attempt_at: string | null;
  video_watch_count: number;
  last_video_watch_at: string | null;
}

// Extended User Progress with related data
export interface UserProgressWithRelations extends UserProgress {
  lesson?: {
    id: string;
    title: string;
    description?: string;
    duration_minutes: number;
    video_url?: string;
    content?: string;
    order_index: number;
    section?: {
      id: string;
      title: string;
      description?: string;
      order_index: number;
      course?: {
        id: string;
        title: string;
        slug: string;
        description?: string;
        thumbnail_url?: string;
        instructor_name?: string;
        instructor_email?: string;
        course_type: 'online' | 'live' | 'hybrid';
        level?: string;
        duration?: string;
        price?: number;
        is_active: boolean;
      };
    };
  };
}

// Course Progress Summary
export interface CourseProgress {
  course_id: string;
  course_title: string;
  course_slug: string;
  course_thumbnail: string | null;
  course_description?: string;
  instructor_name: string | null;
  instructor_email?: string | null;
  course_type: 'online' | 'live' | 'hybrid';
  level?: string;
  duration?: string;
  price?: number;
  total_lessons: number;
  completed_lessons: number;
  total_watch_time: number; // in seconds
  total_duration: number; // in seconds
  completion_percentage: number;
  last_activity: string | null;
  avg_quiz_score: number | null;
  total_quiz_attempts: number;
  course_is_active: boolean;
  first_started_at?: string;
  last_completed_at?: string;
}

// Lesson Progress Details
export interface LessonProgress {
  lesson_id: string;
  lesson_title: string;
  lesson_description?: string;
  lesson_duration_minutes: number;
  lesson_order: number;
  section_id: string;
  section_title: string;
  section_order: number;
  course_id: string;
  course_title: string;
  course_slug: string;
  // Progress data
  is_completed: boolean;
  completion_percentage: number;
  watch_time_seconds: number;
  last_position_seconds: number;
  quiz_score: number | null;
  quiz_attempts: number;
  notes: string | null;
  first_watched_at?: string;
  last_watched_at?: string;
  completed_at?: string;
  video_watch_count: number;
}

// Progress Statistics
export interface ProgressStatistics {
  total_courses: number;
  enrolled_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  not_started_courses: number;
  total_lessons: number;
  completed_lessons: number;
  total_watch_time_seconds: number;
  total_quiz_attempts: number;
  avg_quiz_score: number;
  total_video_watches: number;
  streak_days: number;
  last_activity_date: string | null;
  most_active_day_of_week: number | null; // 0-6, 0 = Sunday
  preferred_study_time_hour: number | null; // 0-23
}

// Weekly/Monthly Progress Summary
export interface ProgressTimeframe {
  period_start: string;
  period_end: string;
  period_type: 'day' | 'week' | 'month';
  lessons_completed: number;
  watch_time_seconds: number;
  quiz_attempts: number;
  avg_quiz_score: number;
  courses_started: number;
  courses_completed: number;
  video_watches: number;
}

// Course Completion Certificate Info
export interface CourseCompletion {
  course_id: string;
  course_title: string;
  course_slug: string;
  instructor_name: string | null;
  completion_date: string;
  total_lessons: number;
  total_watch_time_seconds: number;
  avg_quiz_score: number;
  certificate_url?: string | null;
  certificate_id?: string | null;
}

// Activity Log Entry
export interface ActivityLogEntry {
  id: string;
  user_id: string;
  activity_type: 'lesson_start' | 'lesson_complete' | 'quiz_attempt' | 'course_start' | 'course_complete' | 'video_watch';
  lesson_id?: string | null;
  course_id?: string | null;
  activity_data?: {
    quiz_score?: number;
    watch_time?: number;
    position?: number;
    attempt_number?: number;
    [key: string]: string | number | boolean | null | undefined;
  };
  created_at: string;
}

// Learning Path Progress
export interface LearningPathProgress {
  path_id: string;
  path_title: string;
  path_description?: string;
  total_courses: number;
  completed_courses: number;
  current_course_id?: string | null;
  current_course_title?: string | null;
  completion_percentage: number;
  estimated_completion_date?: string | null;
  started_at?: string | null;
  last_activity_at?: string | null;
}

// User Preferences for Progress Tracking
export interface ProgressPreferences {
  user_id: string;
  daily_goal_minutes: number;
  weekly_goal_lessons: number;
  reminder_enabled: boolean;
  reminder_time: string; // HH:mm format
  reminder_days: number[]; // 0-6, 0 = Sunday
  email_digest_frequency: 'daily' | 'weekly' | 'monthly' | 'disabled';
  show_leaderboard: boolean;
  public_profile: boolean;
  goal_notifications: boolean;
  streak_notifications: boolean;
}

// API Response Types
export interface ProgressAPIResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter and Sort Options
export interface ProgressFilters {
  course_type?: 'online' | 'live' | 'hybrid' | 'all';
  completion_status?: 'completed' | 'in_progress' | 'not_started' | 'all';
  date_range?: {
    start: string;
    end: string;
  };
  instructor?: string;
  level?: string;
  sort_by?: 'completion_date' | 'progress' | 'title' | 'last_activity' | 'quiz_score';
  sort_order?: 'asc' | 'desc';
}

// Utility Types
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type ActivityPeriod = 'today' | 'week' | 'month' | 'year' | 'all_time';