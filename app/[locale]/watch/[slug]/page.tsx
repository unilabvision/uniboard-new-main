'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  ArrowLeft, ChevronRight, PlayCircle, CheckCircle,
  Lock, BookOpen, Video,
} from 'lucide-react';
import { VimeoPlayer } from '@/app/components/lms/VimeoPlayer';
import { ProgressService } from '@/app/[locale]/lms/progress/progressService';
import { getUserEnrollment } from '@/app/lib/lms/enrollmentService';
import { processCourseSectionsForDisplay } from '@/app/lib/lms/courseContent';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg',
});

interface CourseVideo {
  id: string;
  lesson_id: string;
  title: string;
  vimeo_id?: string;
  vimeo_hash?: string;
  duration_seconds?: number;
  order_index: number;
}

interface CourseLesson {
  id: string;
  section_id: string;
  title: string;
  order_index: number;
  is_locked: boolean;
  duration_minutes?: number;
  videos: CourseVideo[];
}

interface CourseSection {
  id: string;
  title: string;
  order_index: number;
  lessons: CourseLesson[];
}

interface Course {
  id: string;
  slug: string;
  title: string;
  description?: string;
  instructor_name?: string;
}

const texts = {
  tr: {
    backToCourses: 'Kurslarıma Dön',
    courseContent: 'Kurs İçeriği',
    noVideo: 'Bu ders için henüz video yüklenmemiş.',
    notEnrolled: 'Bu kursa kayıtlı değilsiniz.',
    enrollLink: 'Kursa kayıt ol',
    loginRequired: 'Video izlemek için giriş yapın.',
    loading: 'Kurs yükleniyor...',
    notFound: 'Kurs bulunamadı',
    selectLesson: 'Başlamak için soldan bir ders seçin',
    completed: 'Tamamlandı',
  },
  en: {
    backToCourses: 'Back to My Courses',
    courseContent: 'Course Content',
    noVideo: 'No video uploaded for this lesson yet.',
    notEnrolled: 'You are not enrolled in this course.',
    enrollLink: 'Enroll in course',
    loginRequired: 'Please sign in to watch videos.',
    loading: 'Loading course...',
    notFound: 'Course not found',
    selectLesson: 'Select a lesson from the sidebar to start',
    completed: 'Completed',
  },
};

export default function WatchCoursePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'tr';
  const slug = params?.slug as string;
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const { user, isLoaded } = useUser();

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const allLessons = useMemo(
    () => sections.flatMap((s) => s.lessons).sort((a, b) => a.order_index - b.order_index),
    [sections]
  );

  const activeLesson = allLessons.find((l) => l.id === activeLessonId) || null;
  const activeVideo = activeLesson?.videos?.[0] || null;

  useEffect(() => {
    const fetchCourse = async () => {
      if (!slug || !isLoaded) return;
      if (!user) { setLoading(false); return; }

      try {
        setLoading(true);

        const { data: courseData, error: courseError } = await supabase
          .from('myuni_courses')
          .select(`
            id, slug, title, description, instructor_name,
            myuni_course_sections (
              id, title, order_index, is_active,
              myuni_course_lessons (
                id, section_id, title, order_index, is_locked, is_active, duration_minutes,
                myuni_videos ( id, lesson_id, title, vimeo_id, vimeo_hash, duration_seconds, order_index )
              )
            )
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (courseError) throw courseError;

        const enrollment = await getUserEnrollment(user.id, courseData.id);
        if (!enrollment) {
          setIsEnrolled(false);
          setCourse({ id: courseData.id, slug: courseData.slug, title: courseData.title, description: courseData.description, instructor_name: courseData.instructor_name });
          setLoading(false);
          return;
        }
        setIsEnrolled(true);

        const processedSections = processCourseSectionsForDisplay(
          courseData.myuni_course_sections,
          { publicView: true }
        );

        setCourse({ id: courseData.id, slug: courseData.slug, title: courseData.title, description: courseData.description, instructor_name: courseData.instructor_name });
        setSections(processedSections as CourseSection[]);

        const lessonIds = processedSections.flatMap((s) => s.lessons.map((l) => l.id));
        if (lessonIds.length > 0) {
          const { data: progressData } = await supabase
            .from('myuni_user_progress')
            .select('lesson_id, is_completed')
            .eq('user_id', user.id)
            .in('lesson_id', lessonIds);

          const completed = new Set(
            (progressData || []).filter((p) => p.is_completed).map((p) => p.lesson_id)
          );
          setCompletedLessons(completed);
        }

        const lessonParam = searchParams.get('lesson');
        const firstLessonWithVideo = processedSections
          .flatMap((s) => s.lessons)
          .find((l) => l.videos.length > 0);

        if (lessonParam && lessonIds.includes(lessonParam)) {
          setActiveLessonId(lessonParam);
        } else if (firstLessonWithVideo) {
          setActiveLessonId(firstLessonWithVideo.id);
        }
      } catch (err) {
        console.error('Error loading course:', err);
        setError(err instanceof Error ? err.message : t.notFound);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [slug, user, isLoaded, searchParams, t.notFound]);

  const handleVideoProgress = useCallback(async (percent: number) => {
    if (!user || !activeLesson) return;
    const watchSeconds = activeVideo?.duration_seconds
      ? Math.round((percent / 100) * activeVideo.duration_seconds)
      : 0;

    try {
      await ProgressService.updateVideoProgress(user.id, activeLesson.id, watchSeconds, watchSeconds);

      if (percent >= 90) {
        await ProgressService.markLessonCompleted(user.id, activeLesson.id);
        setCompletedLessons((prev) => new Set([...prev, activeLesson.id]));
      }
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  }, [user, activeLesson, activeVideo]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <p className="text-white">{t.loginRequired}</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-white">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>{error || t.notFound}</p>
          <Link href={`/${locale}/students`} className="mt-4 inline-block text-[#ff6666] hover:underline">
            {t.backToCourses}
          </Link>
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md px-4">
          <Lock className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
          <p className="text-neutral-400 mb-6">{t.notEnrolled}</p>
          <Link
            href={`/${locale}/lms/courses/${course.slug}`}
            className="px-6 py-3 bg-[#990000] hover:bg-[#880000] text-white rounded-lg font-medium transition-colors"
          >
            {t.enrollLink}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col">
      <header className="border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/students`}
            className="flex items-center text-neutral-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t.backToCourses}
          </Link>
          <div className="h-4 w-px bg-neutral-700" />
          <h1 className="font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">
            {course.title}
          </h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 bg-black flex items-center justify-center">
            {activeVideo?.vimeo_id ? (
              <div className="w-full max-w-5xl mx-auto px-4">
                <VimeoPlayer
                  vimeoId={activeVideo.vimeo_id}
                  vimeoHash={activeVideo.vimeo_hash}
                  title={activeVideo.title}
                  responsive
                  onProgress={handleVideoProgress}
                  className="w-full"
                />
              </div>
            ) : activeLesson ? (
              <div className="text-center text-neutral-400 p-8">
                <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>{t.noVideo}</p>
              </div>
            ) : (
              <div className="text-center text-neutral-400 p-8">
                <PlayCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>{t.selectLesson}</p>
              </div>
            )}
          </div>

          {activeLesson && (
            <div className="p-4 border-t border-neutral-800">
              <h2 className="font-semibold text-lg">{activeLesson.title}</h2>
              {activeVideo && (
                <p className="text-neutral-400 text-sm mt-1">{activeVideo.title}</p>
              )}
            </div>
          )}
        </main>

        <aside className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-neutral-800 overflow-y-auto max-h-[40vh] lg:max-h-none">
          <div className="p-4 border-b border-neutral-800">
            <h3 className="font-semibold text-sm text-neutral-300">{t.courseContent}</h3>
          </div>

          {sections.map((section) => (
            <div key={section.id}>
              <div className="px-4 py-2 bg-neutral-800/50 text-xs font-medium text-neutral-400 uppercase tracking-wide">
                {section.title}
              </div>
              {section.lessons.map((lesson) => {
                const hasVideo = lesson.videos.length > 0;
                const isActive = lesson.id === activeLessonId;
                const isCompleted = completedLessons.has(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLessonId(lesson.id)}
                    disabled={lesson.is_locked}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                      isActive
                        ? 'bg-[#990000]/20 border-l-2 border-[#990000]'
                        : 'hover:bg-neutral-800/50 border-l-2 border-transparent'
                    } ${lesson.is_locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : lesson.is_locked ? (
                      <Lock className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    ) : hasVideo ? (
                      <PlayCircle className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    )}
                    <span className="flex-1 truncate">
                      {lesson.title}
                      {lesson.videos[0]?.title && lesson.videos[0].title !== lesson.title && (
                        <span className="block text-xs text-neutral-500 truncate">{lesson.videos[0].title}</span>
                      )}
                    </span>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#990000] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
