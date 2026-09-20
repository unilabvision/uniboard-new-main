export type KurumCourseRow = {
  id: string;
  title: string;
  slug: string;
  banner_image_url: string | null;
  instructor_name: string | null;
};

export type KurumLessonRow = {
  id: string;
  course_id: string;
  order_index: number;
  title: string;
};

export type KurumEnrollmentRow = {
  course_id: string;
  user_id: string;
  enrolled_at: string | null;
  progress_percentage: number | null;
};

export type KurumProgressRow = {
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  watch_time_seconds: number | null;
  quiz_score: number | null;
  updated_at: string | null;
};

export type KurumCourseOverview = {
  course_id: string;
  course_title: string;
  course_slug: string;
  course_thumbnail: string | null;
  instructor_name: string | null;
  total_lessons: number;
  total_students: number;
  students_completed: number;
  students_in_progress: number;
  students_not_started: number;
  avg_completion_percentage: number;
  avg_quiz_score: number | null;
  total_watch_time: number;
  last_activity: string | null;
};

export type KurumStudentProgress = {
  user_id: string;
  enrolled_at: string | null;
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
  total_watch_time: number;
  avg_quiz_score: number | null;
  last_activity: string | null;
  current_lesson: string | null;
  current_section: string | null;
  enrollment_status: 'enrolled' | 'in_progress' | 'completed' | 'not_started';
};

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function laterDate(current: string | null, candidate: string | null): string | null {
  if (!candidate) return current;
  if (!current) return candidate;
  return candidate > current ? candidate : current;
}

function completionPercentage(
  completedLessons: number,
  totalLessons: number,
  enrollmentPercentage: number | null
): number {
  if (totalLessons > 0) return (completedLessons / totalLessons) * 100;
  return enrollmentPercentage || 0;
}

function enrollmentStatus(
  percentage: number,
  completedLessons: number,
  watchTime: number
): KurumStudentProgress['enrollment_status'] {
  if (percentage >= 100) return 'completed';
  if (percentage > 0) return 'in_progress';
  if (completedLessons === 0 && watchTime === 0) return 'not_started';
  return 'enrolled';
}

function groupBy<T>(rows: T[], getKey: (row: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const key = getKey(row);
    const group = grouped.get(key);
    if (group) group.push(row);
    else grouped.set(key, [row]);
  }
  return grouped;
}

export function buildKurumCourseOverviews(
  courses: KurumCourseRow[],
  lessons: KurumLessonRow[],
  enrollments: KurumEnrollmentRow[],
  progress: KurumProgressRow[]
): KurumCourseOverview[] {
  const lessonsByCourse = groupBy(lessons, (row) => row.course_id);
  const enrollmentsByCourse = groupBy(enrollments, (row) => row.course_id);
  const courseByLesson = new Map(lessons.map((row) => [row.id, row.course_id]));
  const progressByCourse = groupBy(
    progress.filter((row) => courseByLesson.has(row.lesson_id)),
    (row) => courseByLesson.get(row.lesson_id) as string
  );

  return courses.map((course) => {
    const courseLessons = lessonsByCourse.get(course.id) || [];
    const courseEnrollments = enrollmentsByCourse.get(course.id) || [];
    const courseProgress = progressByCourse.get(course.id) || [];
    const progressByUser = groupBy(courseProgress, (row) => row.user_id);
    const percentages = courseEnrollments.map((enrollment) => {
      const rows = progressByUser.get(enrollment.user_id) || [];
      const completed = rows.filter((row) => row.is_completed).length;
      return completionPercentage(completed, courseLessons.length, enrollment.progress_percentage);
    });
    const quizScores = courseProgress
      .map((row) => row.quiz_score)
      .filter((score): score is number => score !== null);

    return {
      course_id: course.id,
      course_title: course.title,
      course_slug: course.slug,
      course_thumbnail: course.banner_image_url,
      instructor_name: course.instructor_name,
      total_lessons: courseLessons.length,
      total_students: courseEnrollments.length,
      students_completed: percentages.filter((value) => value >= 100).length,
      students_in_progress: percentages.filter((value) => value > 0 && value < 100).length,
      students_not_started: percentages.filter((value) => value <= 0).length,
      avg_completion_percentage: average(percentages) || 0,
      avg_quiz_score: average(quizScores),
      total_watch_time: courseProgress.reduce(
        (sum, row) => sum + (row.watch_time_seconds || 0),
        0
      ),
      last_activity: courseProgress.reduce(
        (latest, row) => laterDate(latest, row.updated_at),
        null as string | null
      ),
    };
  });
}

export function buildKurumStudentProgress(
  lessons: KurumLessonRow[],
  enrollments: KurumEnrollmentRow[],
  progress: KurumProgressRow[]
): KurumStudentProgress[] {
  const orderedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index);
  const progressByUser = groupBy(progress, (row) => row.user_id);

  return enrollments.map((enrollment) => {
    const rows = progressByUser.get(enrollment.user_id) || [];
    const completedIds = new Set(
      rows.filter((row) => row.is_completed).map((row) => row.lesson_id)
    );
    const watchTime = rows.reduce((sum, row) => sum + (row.watch_time_seconds || 0), 0);
    const percentage = completionPercentage(
      completedIds.size,
      orderedLessons.length,
      enrollment.progress_percentage
    );
    const quizScores = rows
      .map((row) => row.quiz_score)
      .filter((score): score is number => score !== null);
    const nextLesson = orderedLessons.find((lesson) => !completedIds.has(lesson.id));

    return {
      user_id: enrollment.user_id,
      enrolled_at: enrollment.enrolled_at,
      total_lessons: orderedLessons.length,
      completed_lessons: completedIds.size,
      completion_percentage: percentage,
      total_watch_time: watchTime,
      avg_quiz_score: average(quizScores),
      last_activity: rows.reduce(
        (latest, row) => laterDate(latest, row.updated_at),
        enrollment.enrolled_at
      ),
      current_lesson: percentage >= 100 ? null : nextLesson?.title || null,
      current_section: percentage >= 100 || !nextLesson ? null : 'Course Content',
      enrollment_status: enrollmentStatus(percentage, completedIds.size, watchTime),
    };
  });
}
