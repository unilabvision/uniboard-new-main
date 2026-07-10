'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, PlayCircle, Clock, 
  Calendar, BookOpen, ChevronDown,
  ChevronRight, Video, FileText, 
  User, Mail, Linkedin,
  CheckCircle, Lock, Eye
} from 'lucide-react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { enrollUser, getUserEnrollment } from '@/app/lib/lms/enrollmentService';

// Supabase client
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg'
});

// Types based on database schema
interface Course {
  id: string;
  slug: string;
  title: string;
  description?: string;
  instructor_name?: string;
  instructor_description?: string;
  instructor_email?: string;
  instructor_linkedin?: string;
  instructor_image_url?: string;
  duration?: string;
  level?: string;
  price?: number;
  original_price?: number;
  thumbnail_url?: string;
  banner_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  course_type: 'online' | 'live' | 'hybrid';
  live_start_date?: string;
  live_end_date?: string;
  live_timezone?: string;
  max_participants?: number;
  current_participants: number;
  session_count?: number;
  session_duration_minutes: number;
  registration_deadline?: string;
  is_registration_open: boolean;
}

interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  lessons: CourseLesson[];
}

interface CourseLesson {
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
  created_at: string;
  updated_at: string;
  videos: CourseVideo[];
}

interface CourseVideo {
  id: string;
  lesson_id: string;
  title: string;
  vimeo_id?: string;
  video_url?: string;
  vimeo_embed_url?: string;
  vimeo_hash?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  width: number;
  height: number;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Localized texts
const texts = {
  tr: {
    backToCourses: "Kurslara Dön",
    instructor: "Eğitmen",
    duration: "Süre",
    level: "Seviye",
    price: "Fiyat",
    participants: "Katılımcı",
    sessions: "Oturum",
    type: "Tür",
    startDate: "Başlangıç Tarihi",
    endDate: "Bitiş Tarihi",
    registrationDeadline: "Kayıt Son Tarihi",
    timezone: "Saat Dilimi",
    courseContent: "Kurs İçeriği",
    aboutInstructor: "Eğitmen Hakkında",
    contactInstructor: "Eğitmenle İletişim",
    enrollNow: "Kursa Kayıt Ol",
    enrolled: "Kayıtlı",
    registrationClosed: "Kayıt Kapalı",
    courseFull: "Kurs Dolu",
    free: "Ücretsiz",
    sections: "Bölüm",
    lessons: "Ders",
    videos: "Video",
    totalDuration: "Toplam Süre",
    loading: "Yükleniyor...",
    error: "Bir hata oluştu",
    notFound: "Kurs bulunamadı",
    courseTypes: {
      online: "Online",
      live: "Canlı",
      hybrid: "Hibrit"
    },
    lessonTypes: {
      video: "Video",
      text: "Metin",
      quiz: "Quiz",
      assignment: "Ödev"
    }
  },
  en: {
    backToCourses: "Back to Courses",
    instructor: "Instructor",
    duration: "Duration",
    level: "Level",
    price: "Price",
    participants: "Participants",
    sessions: "Sessions",
    type: "Type",
    startDate: "Start Date",
    endDate: "End Date",
    registrationDeadline: "Registration Deadline",
    timezone: "Timezone",
    courseContent: "Course Content",
    aboutInstructor: "About Instructor",
    contactInstructor: "Contact Instructor",
    enrollNow: "Enroll Now",
    enrolled: "Enrolled",
    registrationClosed: "Registration Closed",
    courseFull: "Course Full",
    free: "Free",
    sections: "Section",
    lessons: "Lesson",
    videos: "Video",
    totalDuration: "Total Duration",
    loading: "Loading...",
    error: "An error occurred",
    notFound: "Course not found",
    courseTypes: {
      online: "Online",
      live: "Live",
      hybrid: "Hybrid"
    },
    lessonTypes: {
      video: "Video",
      text: "Text",
      quiz: "Quiz",
      assignment: "Assignment"
    }
  }
};

// Utility functions
const formatDate = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPrice = (price: number | null, locale: string) => {
  if (!price || price === 0) return locale === 'tr' ? 'Ücretsiz' : 'Free';
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY'
  }).format(price);
};

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}s ${remainingMinutes}dk` : `${hours}s`;
};

// Course Type Icon Component
const CourseTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'online':
      return <Video className="w-5 h-5" />;
    case 'live':
      return <PlayCircle className="w-5 h-5" />;
    case 'hybrid':
      return <Calendar className="w-5 h-5" />;
    default:
      return <BookOpen className="w-5 h-5" />;
  }
};

// Lesson Type Icon Component
const LessonTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'video':
      return <PlayCircle className="w-4 h-4" />;
    case 'text':
      return <FileText className="w-4 h-4" />;
    case 'quiz':
      return <CheckCircle className="w-4 h-4" />;
    case 'assignment':
      return <FileText className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
};

// Vimeo Player Component
/*
const VideoPlayer = ({ 
  vimeoId, 
  vimeoHash, 
  title, 
  width = 640, 
  height = 360 
}: { 
  vimeoId?: string;
  vimeoHash?: string;
  title: string;
  width?: number;
  height?: number;
}) => {
  if (!vimeoId) return null;

  const embedUrl = vimeoHash 
    ? `https://player.vimeo.com/video/${vimeoId}?h=${vimeoHash}&badge=0&autopause=0&quality_selector=1&player_id=0&app_id=58479`
    : `https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&quality_selector=1&player_id=0&app_id=58479`;

  return (
    <div className="relative w-full" style={{ paddingBottom: `${(height / width) * 100}%` }}>
      <iframe
        src={embedUrl}
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        title={title}
      />
    </div>
  );
};
*/

// Section Component
const SectionComponent = ({ 
  section, 
  isExpanded, 
  onToggle,
  t 
}: { 
  section: CourseSection;
  isExpanded: boolean;
  onToggle: () => void;
  t: typeof texts.tr;
}) => {
  const totalLessons = section.lessons.length;
  const totalDuration = section.lessons.reduce((acc, lesson) => {
    return acc + (lesson.duration_minutes || 0);
  }, 0);

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-neutral-500 mr-2" />
          ) : (
            <ChevronRight className="w-5 h-5 text-neutral-500 mr-2" />
          )}
          <div className="text-left">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
              {section.title}
            </h3>
            <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {totalLessons} {t.lessons} • {formatDuration(totalDuration * 60)}
            </div>
          </div>
        </div>
      </button>
      
      {isExpanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
          {section.lessons.map((lesson) => (
            <div 
              key={lesson.id}
              className="px-6 py-3 border-b border-neutral-200 dark:border-neutral-700 last:border-b-0 flex items-center justify-between hover:bg-white dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center flex-1">
                <div className="flex items-center justify-center w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full mr-3 text-sm font-medium">
                  {lesson.is_completed ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : lesson.is_locked ? (
                    <Lock className="w-4 h-4 text-neutral-400" />
                  ) : (
                    <LessonTypeIcon type={lesson.lesson_type} />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                    {lesson.title}
                  </h4>
                  {lesson.description && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                      {lesson.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {lesson.duration_minutes ? formatDuration(lesson.duration_minutes * 60) : '-'}
                </span>
                {lesson.videos.length > 0 && (
                  <span className="flex items-center">
                    <Video className="w-4 h-4 mr-1" />
                    {lesson.videos.length}
                  </span>
                )}
                <button 
                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                  title="Dersi Görüntüle"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Component
export default function CourseDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [locale, setLocale] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  
  const { user } = useUser();
  const router = useRouter();
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setLocale(resolvedParams.locale);
      setSlug(resolvedParams.slug);
    };
    resolveParams();
  }, [params]);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        
        // Fetch course with sections and lessons
        const { data: courseData, error: courseError } = await supabase
          .from('myuni_courses')
          .select(`
            *,
            myuni_course_sections(
              *,
              myuni_course_lessons(
                *,
                myuni_videos(*)
              )
            )
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .single();
        
        if (courseError) {
          if (courseError.code === 'PGRST116') {
            setError('Course not found');
          } else {
            throw courseError;
          }
          return;
        }
        
        // Process the data
        const processedSections: CourseSection[] = (courseData.myuni_course_sections || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((section: any) => ({
            ...section,
            lessons: (section.myuni_course_lessons || [])
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((lesson: any) => ({
                ...lesson,
                videos: lesson.myuni_videos || []
              }))
              .sort((a: CourseLesson, b: CourseLesson) => a.order_index - b.order_index)
          }))
          .sort((a: CourseSection, b: CourseSection) => a.order_index - b.order_index);
        
        // Remove nested data from course object
        const cleanCourse = {
          ...courseData,
          myuni_course_sections: undefined
        };
        
        setCourse(cleanCourse);
        setSections(processedSections);
        
        if (user) {
          const enrollment = await getUserEnrollment(user.id, cleanCourse.id);
          setIsEnrolled(!!enrollment);
        }
        
        // Expand first section by default
        if (processedSections.length > 0) {
          setExpandedSections(new Set([processedSections[0].id]));
        }
        
      } catch (error: unknown) {
        console.error('Error fetching course:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourse();
  }, [slug, user]);

  const handleEnroll = async () => {
    if (!user || !course) {
      router.push(`/${locale}/sign-in`);
      return;
    }

    try {
      setEnrolling(true);
      await enrollUser(user.id, course.id);
      setIsEnrolled(true);
      router.push(`/${locale}/watch/${course.slug}`);
    } catch (err) {
      console.error('Enrollment error:', err);
      alert(locale === 'en' ? 'Enrollment failed' : 'Kayıt işlemi başarısız oldu');
    } finally {
      setEnrolling(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Calculate totals
  const totalLessons = sections.reduce((acc, section) => acc + section.lessons.length, 0);
  const totalVideos = sections.reduce((acc, section) => 
    acc + section.lessons.reduce((lessonAcc, lesson) => lessonAcc + lesson.videos.length, 0), 0
  );
  const totalDuration = sections.reduce((acc, section) => 
    acc + section.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration_minutes || 0), 0), 0
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-6"></div>
            <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  ))}
                </div>
              </div>
              <div>
                <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-48 mb-4"></div>
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            href={`/${locale}/lms`} 
            className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToCourses}
          </Link>
          
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {error === 'Course not found' ? t.notFound : t.error}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              {error === 'Course not found' 
                ? 'Aradığınız kurs bulunamadı veya mevcut değil.'
                : error
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <Link 
          href={`/${locale}/lms`} 
          className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToCourses}
        </Link>

        {/* Course Header */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-8">
          {/* Banner Image */}
          {course.banner_url && (
            <div className="relative h-64 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
              <Image 
                src={course.banner_url} 
                alt={course.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center mb-2">
                  <CourseTypeIcon type={course.course_type} />
                  <span className="ml-2 text-white text-sm font-medium">
                    {t.courseTypes[course.course_type]}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {course.title}
                </h1>
                {course.instructor_name && (
                  <p className="text-white/90">
                    {t.instructor}: {course.instructor_name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Course Info */}
          <div className="p-6">
            {!course.banner_url && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <CourseTypeIcon type={course.course_type} />
                  <span className="ml-2 text-neutral-600 dark:text-neutral-400 text-sm font-medium">
                    {t.courseTypes[course.course_type]}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  {course.title}
                </h1>
                {course.instructor_name && (
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {t.instructor}: {course.instructor_name}
                  </p>
                )}
              </div>
            )}

            {course.description && (
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                {course.description}
              </p>
            )}

            {/* Course Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {sections.length}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t.sections}
                </div>
              </div>
              <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {totalLessons}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t.lessons}
                </div>
              </div>
              <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {totalVideos}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t.videos}
                </div>
              </div>
              <div className="text-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                <div className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatDuration(totalDuration * 60)}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t.totalDuration}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                {t.courseContent}
              </h2>
              
              <div className="space-y-4">
                {sections.map((section) => (
                  <SectionComponent
                    key={section.id}
                    section={section}
                    isExpanded={expandedSections.has(section.id)}
                    onToggle={() => toggleSection(section.id)}
                    t={t}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Details */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="space-y-4">
                {course.price !== undefined && (
                  <div className="text-center pb-4 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {formatPrice(course.price, locale)}
                    </div>
                    {course.original_price && course.original_price > course.price && (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400 line-through">
                        {formatPrice(course.original_price, locale)}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  {course.level && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">{t.level}:</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{course.level}</span>
                    </div>
                  )}
                  
                  {course.duration && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">{t.duration}:</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{course.duration}</span>
                    </div>
                  )}

                  {course.course_type === 'live' && (
                    <>
                      {course.live_start_date && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500 dark:text-neutral-400">{t.startDate}:</span>
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {formatDate(course.live_start_date, locale)}
                          </span>
                        </div>
                      )}
                      
                      {course.live_end_date && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500 dark:text-neutral-400">{t.endDate}:</span>
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {formatDate(course.live_end_date, locale)}
                          </span>
                        </div>
                      )}
                      
                      {course.max_participants && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500 dark:text-neutral-400">{t.participants}:</span>
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {course.current_participants}/{course.max_participants}
                          </span>
                        </div>
                      )}
                      
                      {course.registration_deadline && (
                        <div className="flex justify-between">
                          <span className="text-neutral-500 dark:text-neutral-400">{t.registrationDeadline}:</span>
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {formatDate(course.registration_deadline, locale)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {course.session_count && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 dark:text-neutral-400">{t.sessions}:</span>
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{course.session_count}</span>
                    </div>
                  )}
                </div>

                {/* Enrollment Button */}
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  {course.course_type === 'live' && !course.is_registration_open ? (
                    <button
                      disabled
                      className="w-full px-4 py-3 bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-lg font-medium cursor-not-allowed"
                    >
                      {t.registrationClosed}
                    </button>
                  ) : course.course_type === 'live' && course.max_participants && course.current_participants >= course.max_participants ? (
                    <button
                      disabled
                      className="w-full px-4 py-3 bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-lg font-medium cursor-not-allowed"
                    >
                      {t.courseFull}
                    </button>
                  ) : isEnrolled ? (
                    <Link
                      href={`/${locale}/watch/${course.slug}`}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {t.enrolled}
                    </Link>
                  ) : (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full px-4 py-3 bg-[#990000] hover:bg-[#880000] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {enrolling ? '...' : t.enrollNow}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Instructor Info */}
            {course.instructor_name && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                  {t.aboutInstructor}
                </h3>
                
                <div className="flex items-start space-x-4">
                  {course.instructor_image_url ? (
                    <Image 
                      src={course.instructor_image_url} 
                      alt={course.instructor_name}
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-neutral-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                      {course.instructor_name}
                    </h4>
                    
                    {course.instructor_description && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                        {course.instructor_description}
                      </p>
                    )}
                    
                    <div className="flex space-x-2">
                      {course.instructor_email && (
                        <a 
                          href={`mailto:${course.instructor_email}`}
                          className="p-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                          title="E-posta Gönder"
                        >
                          <Mail className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                        </a>
                      )}
                      
                      {course.instructor_linkedin && (
                        <a 
                          href={course.instructor_linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors"
                          title="LinkedIn Profili"
                        >
                          <Linkedin className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
