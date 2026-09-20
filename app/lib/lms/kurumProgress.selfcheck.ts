import assert from 'node:assert/strict';
import {
  buildKurumCourseOverviews,
  buildKurumStudentProgress,
  type KurumCourseRow,
  type KurumEnrollmentRow,
  type KurumLessonRow,
  type KurumProgressRow,
} from './kurumProgress';

const courses: KurumCourseRow[] = [
  {
    id: 'course-1',
    title: 'Course',
    slug: 'course',
    banner_image_url: null,
    instructor_name: 'Instructor',
  },
];
const lessons: KurumLessonRow[] = [
  { id: 'lesson-1', course_id: 'course-1', order_index: 0, title: 'First' },
  { id: 'lesson-2', course_id: 'course-1', order_index: 1, title: 'Second' },
];
const enrollments: KurumEnrollmentRow[] = [
  {
    course_id: 'course-1',
    user_id: 'user-1',
    enrolled_at: '2026-01-01T00:00:00.000Z',
    progress_percentage: 0,
  },
  {
    course_id: 'course-1',
    user_id: 'user-2',
    enrolled_at: '2026-01-02T00:00:00.000Z',
    progress_percentage: 0,
  },
];
const progress: KurumProgressRow[] = [
  {
    user_id: 'user-1',
    lesson_id: 'lesson-1',
    is_completed: true,
    watch_time_seconds: 120,
    quiz_score: 80,
    updated_at: '2026-01-03T00:00:00.000Z',
  },
  {
    user_id: 'user-1',
    lesson_id: 'lesson-2',
    is_completed: true,
    watch_time_seconds: 180,
    quiz_score: 100,
    updated_at: '2026-01-04T00:00:00.000Z',
  },
];

const [overview] = buildKurumCourseOverviews(
  courses,
  lessons,
  enrollments,
  progress
);
assert.equal(overview.total_students, 2);
assert.equal(overview.students_completed, 1);
assert.equal(overview.students_not_started, 1);
assert.equal(overview.avg_completion_percentage, 50);
assert.equal(overview.avg_quiz_score, 90);
assert.equal(overview.total_watch_time, 300);

const students = buildKurumStudentProgress(lessons, enrollments, progress);
const completed = students.find((student) => student.user_id === 'user-1');
const notStarted = students.find((student) => student.user_id === 'user-2');
assert.equal(completed?.enrollment_status, 'completed');
assert.equal(completed?.current_lesson, null);
assert.equal(notStarted?.enrollment_status, 'not_started');
assert.equal(notStarted?.current_lesson, 'First');

console.log('kurumProgress selfcheck OK');

