// Base Course Types
export interface Course {
  id: string;
  slug: string;
  title: string;
  description?: string;
  instructor_name?: string;
  duration?: string;
  level?: string;
  price?: number;
  original_price?: number;
  thumbnail_url?: string;
  banner_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  instructor_description?: string;
  instructor_email?: string;
  instructor_linkedin?: string;
  instructor_image_url?: string;
  course_type: 'online' | 'live' | 'hybrid';
  live_start_date?: string;
  live_end_date?: string;
  live_timezone?: string;
  max_participants?: number;
  current_participants?: number;
  session_count?: number;
  session_duration_minutes?: number;
  registration_deadline?: string;
  is_registration_open: boolean;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  lessons: CourseLesson[];
}

export interface CourseLesson {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  lesson_type: 'content' | 'video' | 'notes' | 'quick';
  order_index: number;
  duration_minutes?: number;
  is_active: boolean;
  is_locked: boolean;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
  // Module data - only one should be present per lesson
  videos?: CourseVideo[];
  notes?: CourseNote[];
  quizzes?: CourseQuiz[];
}

export interface CourseVideo {
  id: string;
  lesson_id: string;
  title: string;
  vimeo_id?: string;
  video_url?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  order_index: number;
  created_at?: string;
  updated_at?: string;
  vimeo_embed_url?: string;
  vimeo_hash?: string;
  width: number;
  height: number;
  description?: string;
}

export interface CourseNote {
  id: string;
  lesson_id: string;
  title: string;
  content: string;
  content_type: 'markdown' | 'html' | 'text';
  file_url?: string;
  order_index: number;
  is_ai_generated: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CourseQuiz {
  id: string;
  lesson_id: string;
  title: string;
  description?: string;
  quick_type: 'quiz';
  config: QuizConfig;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

// Quiz Configuration Types - Updated to match database structure
export interface QuizConfig {
  questions: QuizQuestion[];
  time_limit?: number; // in seconds
  passing_score?: number; // percentage
  shuffle_options?: boolean;
  shuffle_questions?: boolean;
}

export interface QuizQuestion {
  points: number;
  correct: number; // index of correct option (0-based)
  options: string[]; // array of option texts
  question: string;
  explanation?: string;
}

// Legacy interfaces for backward compatibility
export interface QuizSettings {
  time_limit_minutes?: number;
  max_attempts: number;
  pass_percentage: number;
  show_correct_answers: boolean;
  randomize_questions: boolean;
  randomize_options: boolean;
  allow_review: boolean;
  immediate_feedback: boolean;
}

export interface QuizOption {
  id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
}

export interface DragDropItem {
  id: string;
  text: string;
  group: string;
  correct_position: number;
}

// Module Types for UI
export type ModuleType = 'video' | 'notes' | 'quiz' | 'url' | 'resource';

export interface ModuleOption {
  type: ModuleType;
  label: string;
  icon: string;
  description: string;
}

// UI State Types
export interface EditState {
  activeTab: 'info' | 'content' | 'settings';
  expandedSections: Set<string>;
  expandedLessons: Set<string>;
  editingLesson: string | null;
  editingLessonTitle: string;
  editingSection: string | null;
  editingSectionTitle: string;
  isAddingSection: boolean;
  newSectionTitle: string;
  selectedModule: ModuleType | null;
  selectedLessonForModule: string | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Section Reorder Data
export interface SectionReorderData {
  id: string;
  order_index: number;
}

// Lesson Reorder Data
export interface LessonReorderData {
  id: string;
  order_index: number;
}

// Complete Course with Relations
export interface CourseWithRelations extends Course {
  sections: CourseSectionWithRelations[];
}

export interface CourseSectionWithRelations extends Omit<CourseSection, 'lessons'> {
  lessons: CourseLessonWithRelations[];
}

export interface CourseLessonWithRelations extends Omit<CourseLesson, 'videos' | 'notes' | 'quizzes'> {
  videos: CourseVideo[];
  notes: CourseNote[];
  quizzes: CourseQuiz[];
  // Helper to determine which module type is active
  active_module_type: ModuleType | null;
  active_module_count: number;
}

// Form Data Types
export interface SectionFormData {
  title: string;
  description?: string;
}

export interface LessonFormData {
  title: string;
  description?: string;
  duration_minutes?: number;
  lesson_type: string;
}

export interface VideoFormData {
  title: string;
  description?: string;
  file?: File;
}

export interface NoteFormData {
  title: string;
  content: string;
  content_type: 'markdown' | 'html' | 'text';
  file?: File;
}

export interface QuizFormData {
  title: string;
  description?: string;
  quick_type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'essay' | 'drag_drop';
  questions: QuizQuestion[];
  settings: QuizSettings;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}