export interface DisplayVideo {
  id: string;
  lesson_id: string;
  title: string;
  vimeo_id?: string;
  vimeo_hash?: string;
  duration_seconds?: number;
  order_index: number;
}

export interface DisplayLesson {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  lesson_type: string;
  order_index: number;
  duration_minutes?: number;
  is_active: boolean;
  is_locked: boolean;
  is_completed: boolean;
  videos: DisplayVideo[];
}

export interface DisplaySection {
  id: string;
  course_id?: string;
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  lessons: DisplayLesson[];
}

type RawLesson = {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  lesson_type?: string;
  order_index: number;
  duration_minutes?: number;
  is_active?: boolean;
  is_locked?: boolean;
  is_completed?: boolean;
  myuni_videos?: DisplayVideo[];
  videos?: DisplayVideo[];
};

type RawSection = {
  id: string;
  course_id?: string;
  title: string;
  description?: string;
  order_index: number;
  is_active?: boolean;
  myuni_course_lessons?: RawLesson[];
  lessons?: RawLesson[];
};

export function processCourseSectionsForDisplay(
  rawSections: RawSection[] | null | undefined,
  options: { publicView?: boolean } = {}
): DisplaySection[] {
  const { publicView = false } = options;

  return (rawSections || [])
    .filter((section) => !publicView || section.is_active !== false)
    .map((section) => {
      const rawLessons = section.myuni_course_lessons || section.lessons || [];

      const lessons: DisplayLesson[] = rawLessons
        .filter((lesson) => !publicView || lesson.is_active !== false)
        .map((lesson) => ({
          id: lesson.id,
          section_id: lesson.section_id,
          title: lesson.title,
          description: lesson.description,
          lesson_type: lesson.lesson_type || 'content',
          order_index: lesson.order_index,
          duration_minutes: lesson.duration_minutes,
          is_active: lesson.is_active !== false,
          is_locked: lesson.is_locked ?? false,
          is_completed: lesson.is_completed ?? false,
          videos: (lesson.myuni_videos || lesson.videos || []).sort(
            (a, b) => a.order_index - b.order_index
          ),
        }))
        .sort((a, b) => a.order_index - b.order_index);

      return {
        id: section.id,
        course_id: section.course_id,
        title: section.title,
        description: section.description,
        order_index: section.order_index,
        is_active: section.is_active !== false,
        lessons,
      };
    })
    .filter((section) => !publicView || section.lessons.length > 0)
    .sort((a, b) => a.order_index - b.order_index);
}
