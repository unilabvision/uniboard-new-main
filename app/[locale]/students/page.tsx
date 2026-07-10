'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  BookOpen, PlayCircle, ArrowLeft, Clock, User,
  Video, Calendar,
} from 'lucide-react';
import { getUserEnrolledCourses } from '@/app/lib/lms/enrollmentService';

interface EnrolledCourse {
  id: string;
  course_id: string;
  enrolled_at: string;
  progress_percentage: number;
  myuni_courses: {
    id: string;
    slug: string;
    title: string;
    description?: string;
    instructor_name?: string;
    thumbnail_url?: string;
    duration?: string;
    level?: string;
    course_type: string;
    is_active: boolean;
  } | {
    id: string;
    slug: string;
    title: string;
    description?: string;
    instructor_name?: string;
    thumbnail_url?: string;
    duration?: string;
    level?: string;
    course_type: string;
    is_active: boolean;
  }[] | null;
}

function resolveCourse(enrollment: EnrolledCourse) {
  const raw = enrollment.myuni_courses;
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] : raw;
}

const texts = {
  tr: {
    title: 'Kurslarım',
    subtitle: 'Kayıtlı olduğunuz kurslara buradan erişebilirsiniz',
    backHome: 'Ana Sayfa',
    emptyTitle: 'Henüz kayıtlı kursunuz yok',
    emptySubtitle: 'Kurslara kayıt olduktan sonra burada görünecekler',
    continueLearning: 'Öğrenmeye Devam Et',
    progress: 'İlerleme',
    instructor: 'Eğitmen',
    enrolledAt: 'Kayıt tarihi',
    loginRequired: 'Kurslarınızı görmek için giriş yapın.',
    loading: 'Kurslar yükleniyor...',
    courseTypes: { online: 'Online', live: 'Canlı', hybrid: 'Hibrit' },
  },
  en: {
    title: 'My Courses',
    subtitle: 'Access your enrolled courses here',
    backHome: 'Home',
    emptyTitle: 'No enrolled courses yet',
    emptySubtitle: 'Courses will appear here after you enroll',
    continueLearning: 'Continue Learning',
    progress: 'Progress',
    instructor: 'Instructor',
    enrolledAt: 'Enrolled',
    loginRequired: 'Please sign in to view your courses.',
    loading: 'Loading courses...',
    courseTypes: { online: 'Online', live: 'Live', hybrid: 'Hybrid' },
  },
};

export default function StudentsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const { user, isLoaded } = useUser();

  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserEnrolledCourses(user.id);
        setEnrollments(data as unknown as EnrolledCourse[]);
      } catch (err) {
        console.error('Error fetching enrollments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [user, isLoaded]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#990000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <p className="text-red-600">{t.loginRequired}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backHome}
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{t.title}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">{t.subtitle}</p>
        </div>

        {enrollments.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-12 text-center">
            <BookOpen className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">{t.emptyTitle}</h3>
            <p className="text-neutral-600 dark:text-neutral-400">{t.emptySubtitle}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const course = resolveCourse(enrollment);
              if (!course) return null;

              return (
                <div
                  key={enrollment.id}
                  className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-40 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                    {course.thumbnail_url ? (
                      <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="w-12 h-12 text-neutral-400" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-white/90 dark:bg-black/90 rounded-full text-xs font-medium">
                        {t.courseTypes[course.course_type as keyof typeof t.courseTypes] || course.course_type}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2">
                      {course.title}
                    </h3>

                    {course.instructor_name && (
                      <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                        <User className="w-4 h-4 mr-1" />
                        {course.instructor_name}
                      </div>
                    )}

                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                        <span>{t.progress}</span>
                        <span>{Math.round(enrollment.progress_percentage || 0)}%</span>
                      </div>
                      <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#990000] rounded-full transition-all"
                          style={{ width: `${enrollment.progress_percentage || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                      {course.duration && (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {course.duration}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(enrollment.enrolled_at)}
                      </span>
                    </div>

                    <Link
                      href={`/${locale}/watch/${course.slug}`}
                      className="w-full flex items-center justify-center px-4 py-2.5 bg-[#990000] hover:bg-[#880000] text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {t.continueLearning}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
