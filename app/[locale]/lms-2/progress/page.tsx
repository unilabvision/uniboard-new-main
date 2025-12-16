'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Award, Clock, 
  CheckCircle, Users,
  Search
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

// Batch fetch multiple users
const fetchMultipleClerkUsers = async (userIds: string[]) => {
  const userDetailsMap = new Map();
  
  if (userIds.length === 0) {
    return userDetailsMap;
  }
  
  try {
    const response = await fetch('/api/auth/user-details-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userIds })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Process the returned users
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.entries(data.users).forEach(([userId, userData]: [string, any]) => {
        userDetailsMap.set(userId, {
          fullName: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}` 
            : userData.firstName || userData.lastName || userData.username || `Kullanıcı ${userId.substring(0, 8)}`,
          email: userData.emailAddresses?.[0]?.emailAddress || 'email@example.com',
          imageUrl: userData.imageUrl || null
        });
      });
    } else {
      console.error('Failed to fetch user details batch:', response.statusText);
    }
  } catch (error) {
    console.error('Error fetching user details batch:', error);
  }
  
  // Fill in missing users with default data
  userIds.forEach(userId => {
    if (!userDetailsMap.has(userId)) {
      userDetailsMap.set(userId, {
        fullName: `Kullanıcı ${userId.substring(0, 8)}`,
        email: 'email@example.com',
        imageUrl: null
      });
    }
  });
  
  return userDetailsMap;
};

// Types for course progress overview
interface CourseOverview {
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
}

interface StudentProgress {
  user_id: string;
  user_name: string;
  user_email: string;
  user_image: string | null;
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
}

// Supabase client
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg'
});

// Localized texts
const texts = {
  tr: {
    title: "Kurs İlerleme Analizi",
    subtitle: "Tüm kurslarınızdaki öğrenci ilerlemelerini takip edin",
    courseOverview: "Kurs Genel Bakış",
    studentsProgress: "Öğrenci İlerlemeleri",
    totalStudents: "Toplam Öğrenci",
    completedStudents: "Tamamlayan",
    inProgressStudents: "Devam Eden",
    notStartedStudents: "Başlamayan",
    avgCompletion: "Ortalama Tamamlanma",
    avgQuizScore: "Ortalama Quiz Puanı",
    totalWatchTime: "Toplam İzlenme",
    lastActivity: "Son Aktivite",
    studentName: "Öğrenci Adı",
    progress: "İlerleme",
    currentLesson: "Mevcut Ders",
    viewDetails: "Detayları Görüntüle",
    searchStudents: "Öğrenci ara...",
    searchCourses: "Kurs ara...",
    selectCourse: "Kurs seçin",
    allCourses: "Tüm Kurslar",
    minutes: "dakika",
    hours: "saat",
    noData: "Henüz veri bulunmuyor",
    noStudents: "Bu kursta henüz öğrenci bulunmuyor",
    loading: "Yükleniyor...",
    error: "Veri yüklenirken hata oluştu",
    enrolledStudents: "Kayıtlı Öğrenciler",
    statusCompleted: "Tamamlandı",
    statusInProgress: "Devam Ediyor",
    statusNotStarted: "Başlanmamış",
    statusEnrolled: "Kayıtlı",
    enrollmentDate: "Kayıt Tarihi",
    loadingUserDetails: "Kullanıcı bilgileri yükleniyor..."
  },
  en: {
    title: "Course Progress Analytics",
    subtitle: "Track student progress across all your courses",
    courseOverview: "Course Overview",
    studentsProgress: "Students Progress",
    totalStudents: "Total Students",
    completedStudents: "Completed",
    inProgressStudents: "In Progress",
    notStartedStudents: "Not Started",
    avgCompletion: "Average Completion",
    avgQuizScore: "Average Quiz Score",
    totalWatchTime: "Total Watch Time",
    lastActivity: "Last Activity",
    studentName: "Student Name",
    progress: "Progress",
    currentLesson: "Current Lesson",
    viewDetails: "View Details",
    searchStudents: "Search students...",
    searchCourses: "Search courses...",
    selectCourse: "Select course",
    allCourses: "All Courses",
    minutes: "minutes",
    hours: "hours",
    noData: "No data available yet",
    noStudents: "No students in this course yet",
    loading: "Loading...",
    error: "Error loading data",
    enrolledStudents: "Enrolled Students",
    statusCompleted: "Completed",
    statusInProgress: "In Progress",
    statusNotStarted: "Not Started",
    statusEnrolled: "Enrolled",
    enrollmentDate: "Enrollment Date",
    loadingUserDetails: "Loading user details..."
  }
};

// Utility functions
const formatDuration = (seconds: number, locale: string) => {
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours} ${t.hours} ${remainingMinutes} ${t.minutes}`;
  }
  return `${minutes} ${t.minutes}`;
};

const formatDate = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Progress Circle Component
const ProgressCircle = ({ percentage, size = 40 }: { percentage: number; size?: number }) => {
  const radius = (size - 4) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          className="text-neutral-200 dark:text-neutral-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-green-500 transition-all duration-300"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
};

// Course Overview Card Component
const CourseOverviewCard = ({ 
  course, 
  // locale, 
  // t,
  onClick
}: { 
  course: CourseOverview;
  locale?: string;
  t?: typeof texts.tr;
  onClick: () => void;
}) => {
  return (
    <div 
      className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start space-x-4">
        {/* Course Thumbnail */}
        <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg flex-shrink-0 overflow-hidden">
          {course.course_thumbnail ? (
            <Image 
              src={course.course_thumbnail} 
              alt={course.course_title}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-neutral-400" />
            </div>
          )}
        </div>
        
        {/* Course Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {course.course_title}
              </h3>
              {course.instructor_name && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {course.instructor_name}
                </p>
              )}
            </div>
            <ProgressCircle percentage={course.avg_completion_percentage} />
          </div>
          
          {/* Course Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400 mb-3">
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {course.total_students} öğrenci
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
              {course.students_completed} tamamlayan
            </div>
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {course.total_lessons} ders
            </div>
            {course.avg_quiz_score && (
              <div className="flex items-center">
                <Award className="w-3 h-3 mr-1 text-yellow-500" />
                %{Math.round(course.avg_quiz_score)} quiz
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${course.avg_completion_percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Student Progress Row Component
const StudentProgressRow = ({ 
  student, 
  // courseId,
  locale, 
  t,
  onViewDetails
}: { 
  student: StudentProgress;
  courseId: string;
  locale: string;
  t: typeof texts.tr;
  onViewDetails: (userId: string) => void;
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'completed': { 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        text: t.statusCompleted
      },
      'in_progress': { 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        text: t.statusInProgress
      },
      'not_started': { 
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        text: t.statusNotStarted
      },
      'enrolled': { 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        text: t.statusEnrolled
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.enrolled;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {student.user_image ? (
              <Image
                src={student.user_image}
                alt={student.user_name}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {student.user_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="min-w-0 flex-1">
            <div className="font-medium text-neutral-900 dark:text-neutral-100">
              {student.user_name || 'Anonim Kullanıcı'}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
              {student.user_email}
            </div>
            <div className="mt-1">
              {getStatusBadge(student.enrollment_status)}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <ProgressCircle percentage={student.completion_percentage} size={32} />
          <span className="text-sm font-medium">
            {student.completed_lessons}/{student.total_lessons}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm">
          {student.current_lesson ? (
            <>
              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                {student.current_lesson}
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">
                {student.current_section}
              </div>
            </>
          ) : (
            <span className="text-neutral-500 dark:text-neutral-400">
              {student.enrollment_status === 'not_started' ? 'Henüz başlanmamış' : 'Ders bilgisi yok'}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
        {formatDuration(student.total_watch_time, locale)}
      </td>
      <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
        {student.avg_quiz_score ? `%${Math.round(student.avg_quiz_score)}` : '-'}
      </td>
      <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
        <div>
          <div>
            {student.last_activity ? formatDate(student.last_activity, locale) : '-'}
          </div>
          {student.enrolled_at && (
            <div className="text-xs text-neutral-500 dark:text-neutral-500">
              Kayıt: {formatDate(student.enrolled_at, locale)}
            </div>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onViewDetails(student.user_id)}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm font-medium"
        >
          {t.viewDetails}
        </button>
      </td>
    </tr>
  );
};

// Main Component
export default function ProgressAnalyticsPage() {
  const [coursesOverview, setCoursesOverview] = useState<CourseOverview[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [studentsProgress, setStudentsProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  
  // Clerk user hook
  const { user: clerkUser, isLoaded } = useUser();
  const locale = 'tr'; // You can get this from params or context
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Fetch courses overview data
  useEffect(() => {
    const fetchCoursesOverview = async () => {
      if (!isLoaded || !clerkUser) return;
      
      try {
        setLoading(true);
        
        console.log('Fetching courses overview for instructor:', clerkUser.id);
        
        // Fetch all courses from new table structure
        const { data: coursesData, error: coursesError } = await supabase
          .from('myuni_kurum_courses')
          .select(`
            id,
            title,
            slug,
            banner_image_url,
            instructor_name,
            is_active
          `)
          .eq('is_active', true);
        
        if (coursesError) {
          throw coursesError;
        }
        
        console.log('Courses data:', coursesData);
        
        if (!coursesData || coursesData.length === 0) {
          setCoursesOverview([]);
          return;
        }
        
        // For each course, get progress statistics
        const coursesWithStats = await Promise.all(
          coursesData.map(async (course) => {
            // Get all lessons for this course using new table structure
            const { data: lessonsData, error: lessonsError } = await supabase
              .from('myuni_kurum_course_lessons_user')
              .select(`
                id,
                lesson_data_id,
                order_index,
                myuni_kurum_lessons_data!inner (
                  id,
                  title
                )
              `)
              .eq('course_id', course.id)
              .eq('is_active', true)
              .order('order_index', { ascending: true });
            
            if (lessonsError) {
              console.error('Error fetching lessons:', lessonsError);
              return null;
            }
            
            const totalLessons = lessonsData?.length || 0;
            const lessonIds = lessonsData?.map(lesson => lesson.id) || [];
            
            console.log('🔍 Course lesson data:', {
              courseId: course.id,
              totalLessons,
              lessonIds,
              lessonsData: lessonsData?.slice(0, 2) // Show first 2 lessons for debugging
            });
            
            // Get enrollments for this course
            const { data: enrollmentsData, error: enrollmentsError } = await supabase
              .from('myuni_kurum_enrollments')
              .select(`
                user_id,
                enrolled_at,
                progress_percentage,
                is_active
              `)
              .eq('course_id', course.id)
              .eq('is_active', true);
            
            if (enrollmentsError) {
              console.error('Error fetching enrollments:', enrollmentsError);
              return null;
            }
            
            const totalStudents = enrollmentsData?.length || 0;
            
            if (totalStudents === 0) {
              return {
                course_id: course.id,
                course_title: course.title,
                course_slug: course.slug,
                course_thumbnail: course.banner_image_url,
                instructor_name: course.instructor_name,
                total_lessons: totalLessons,
                total_students: 0,
                students_completed: 0,
                students_in_progress: 0,
                students_not_started: 0,
                avg_completion_percentage: 0,
                avg_quiz_score: null,
                total_watch_time: 0,
                last_activity: null
              };
            }
            
            // Get progress data for enrolled students if there are lessons
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let progressData: any[] = [];
            if (lessonIds.length > 0) {
              const { data: pData, error: progressError } = await supabase
                .from('myuni_kurum_user_progress')
                .select(`
                  user_id,
                  lesson_id,
                  is_completed,
                  watch_time_seconds,
                  quiz_score,
                  updated_at
                `)
                .in('lesson_id', lessonIds)
                .in('user_id', enrollmentsData.map(e => e.user_id));
              
              console.log('🔍 Progress query result:', {
                courseId: course.id,
                lessonIds,
                enrolledUserIds: enrollmentsData.map(e => e.user_id),
                progressError,
                progressDataCount: pData?.length || 0,
                progressDataSample: pData?.slice(0, 3) // Show first 3 progress records
              });
              
              if (!progressError) {
                progressData = pData || [];
              }
            } else {
              console.log('🔍 No lessons found for course:s', course.id);
            }
            
            // Calculate statistics based on enrollments and progress
            const studentProgressMap = new Map();
            let totalWatchTime = 0;
            const quizScores: number[] = [];
            let lastActivity: string | null = null;
            
            // Initialize all enrolled students
            enrollmentsData.forEach((enrollment) => {
              studentProgressMap.set(enrollment.user_id, {
                completedLessons: 0,
                enrolled_at: enrollment.enrolled_at,
                progress_percentage_from_enrollment: enrollment.progress_percentage || 0
              });
            });
            
            // Add progress data
            progressData.forEach((progress) => {
              const userId = progress.user_id;
              
              if (studentProgressMap.has(userId)) {
                const userProgress = studentProgressMap.get(userId);
                
                if (progress.is_completed) {
                  userProgress.completedLessons += 1;
                }
                
                totalWatchTime += progress.watch_time_seconds || 0;
                
                if (progress.quiz_score !== null) {
                  quizScores.push(progress.quiz_score);
                }
                
                if (!lastActivity || progress.updated_at > lastActivity) {
                  lastActivity = progress.updated_at;
                }
              }
            });
            
            let studentsCompleted = 0;
            let studentsInProgress = 0;
            let studentsNotStarted = 0;
            let totalCompletionPercentage = 0;
            
            studentProgressMap.forEach((userProgress) => {
              const completionPercentage = totalLessons > 0 
                ? (userProgress.completedLessons / totalLessons) * 100 
                : userProgress.progress_percentage_from_enrollment;
              
              totalCompletionPercentage += completionPercentage;
              
              if (completionPercentage === 100) {
                studentsCompleted += 1;
              } else if (completionPercentage > 0) {
                studentsInProgress += 1;
              } else {
                studentsNotStarted += 1;
              }
            });
            
            const avgCompletionPercentage = totalStudents > 0 
              ? totalCompletionPercentage / totalStudents 
              : 0;
            
            const avgQuizScore = quizScores.length > 0
              ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length
              : null;
            
            return {
              course_id: course.id,
              course_title: course.title,
              course_slug: course.slug,
              course_thumbnail: course.banner_image_url,
              instructor_name: course.instructor_name,
              total_lessons: totalLessons,
              total_students: totalStudents,
              students_completed: studentsCompleted,
              students_in_progress: studentsInProgress,
              students_not_started: studentsNotStarted,
              avg_completion_percentage: avgCompletionPercentage,
              avg_quiz_score: avgQuizScore,
              total_watch_time: totalWatchTime,
              last_activity: lastActivity
            };
          })
        );
        
        const validCourses = coursesWithStats.filter(course => course !== null) as CourseOverview[];
        setCoursesOverview(validCourses);
        
      } catch (error: unknown) {
        console.error('Error fetching courses overview:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoursesOverview();
  }, [clerkUser, isLoaded]);

  // Fetch students progress for selected course
  useEffect(() => {
    const fetchStudentsProgress = async () => {
      if (!selectedCourse) {
        setStudentsProgress([]);
        return;
      }
      
      try {
        // Get all enrollments for the selected course
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('myuni_kurum_enrollments')
          .select(`
            user_id,
            enrolled_at,
            progress_percentage,
            is_active
          `)
          .eq('course_id', selectedCourse)
          .eq('is_active', true);
        
        if (enrollmentsError) {
          throw enrollmentsError;
        }
        
        if (!enrollmentsData || enrollmentsData.length === 0) {
          setStudentsProgress([]);
          return;
        }
        
        // Get all lessons for the selected course using new table structure
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('myuni_kurum_course_lessons_user')
          .select(`
            id,
            lesson_data_id,
            order_index,
            myuni_kurum_lessons_data!inner (
              id,
              title,
              lesson_type,
              duration_minutes
            )
          `)
          .eq('course_id', selectedCourse)
          .eq('is_active', true)
          .order('order_index', { ascending: true });
        
        if (lessonsError) {
          throw lessonsError;
        }
        
        const lessonIds = lessonsData?.map(lesson => lesson.id) || [];
        const totalLessons = lessonIds.length;
        
        console.log('🔍 Detailed progress - Course lesson data:', {
          selectedCourse,
          totalLessons,
          lessonIds,
          lessonsData: lessonsData?.slice(0, 2),
          sortedLessons: lessonsData?.sort((a, b) => a.order_index - b.order_index).slice(0, 2)
        });
        
        // Get progress data for enrolled students
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let progressData: any[] = [];
        if (lessonIds.length > 0) {
          const { data: pData, error: progressError } = await supabase
            .from('myuni_kurum_user_progress')
            .select(`
              user_id,
              lesson_id,
              is_completed,
              watch_time_seconds,
              quiz_score,
              updated_at
            `)
            .in('lesson_id', lessonIds)
            .in('user_id', enrollmentsData.map(e => e.user_id));
          
          console.log('🔍 Detailed progress query result:', {
            selectedCourse,
            lessonIds,
            enrolledUserIds: enrollmentsData.map(e => e.user_id),
            progressError,
            progressDataCount: pData?.length || 0,
            progressDataSample: pData?.slice(0, 5)
          });
          
          if (!progressError) {
            progressData = pData || [];
          }
        } else {
          console.log('🔍 No lessons found for selected course:', selectedCourse);
        }
        
        // Create a map for each enrolled user
        const userProgressMap = new Map();
        
        // Get all unique user IDs for batch fetching user details
        const userIds = enrollmentsData.map(e => e.user_id);
        const userDetailsMap = await fetchMultipleClerkUsers(userIds);
        
        // Initialize all enrolled students with real user data
        enrollmentsData.forEach((enrollment) => {
          const userDetails = userDetailsMap.get(enrollment.user_id) || {
            fullName: `Kullanıcı ${enrollment.user_id.substring(0, 8)}`,
            email: 'email@example.com',
            imageUrl: null
          };
          
          userProgressMap.set(enrollment.user_id, {
            user_id: enrollment.user_id,
            user_name: userDetails.fullName,
            user_email: userDetails.email,
            user_image: userDetails.imageUrl,
            enrolled_at: enrollment.enrolled_at,
            total_lessons: totalLessons,
            completed_lessons: 0,
            total_watch_time: 0,
            quiz_scores: [],
            last_activity: enrollment.enrolled_at,
            current_lesson: null,
            current_section: null,
            progress_percentage_from_enrollment: enrollment.progress_percentage || 0
          });
        });
        
        // Add progress data for users who have started
        progressData.forEach((progress) => {
          const userId = progress.user_id;
          
          if (userProgressMap.has(userId)) {
            const userProgress = userProgressMap.get(userId);
            
            if (progress.is_completed) {
              userProgress.completed_lessons += 1;
            } else {
              // This is the current lesson (not completed yet)
              const currentLesson = lessonsData?.find(lesson => lesson.id === progress.lesson_id);
              if (currentLesson && currentLesson.myuni_kurum_lessons_data) {
                const lessonData = Array.isArray(currentLesson.myuni_kurum_lessons_data) 
                  ? currentLesson.myuni_kurum_lessons_data[0] 
                  : currentLesson.myuni_kurum_lessons_data;
                userProgress.current_lesson = lessonData?.title || 'Unknown Lesson';
                userProgress.current_section = 'Course Content';
              }
            }
            
            userProgress.total_watch_time += progress.watch_time_seconds || 0;
            
            if (progress.quiz_score !== null) {
              userProgress.quiz_scores.push(progress.quiz_score);
            }
            
            if (!userProgress.last_activity || progress.updated_at > userProgress.last_activity) {
              userProgress.last_activity = progress.updated_at;
            }
          }
        });
        
        // For users who have progress but no current lesson set, find their next lesson
        userProgressMap.forEach((userProgress, userId) => {
          if (!userProgress.current_lesson && userProgress.completed_lessons < totalLessons && totalLessons > 0) {
            // Find the next lesson they should start (first incomplete lesson)
            const sortedLessons = lessonsData?.sort((a, b) => a.order_index - b.order_index) || [];
            const completedLessonIds = progressData
              .filter(p => p.user_id === userId && p.is_completed)
              .map(p => p.lesson_id);
            
            const nextLesson = sortedLessons.find(lesson => !completedLessonIds.includes(lesson.id));
            if (nextLesson && nextLesson.myuni_kurum_lessons_data) {
              const lessonData = Array.isArray(nextLesson.myuni_kurum_lessons_data) 
                ? nextLesson.myuni_kurum_lessons_data[0] 
                : nextLesson.myuni_kurum_lessons_data;
              userProgress.current_lesson = lessonData?.title || 'Unknown Lesson';
              userProgress.current_section = 'Course Content';
            }
          }
        });
        
        // Convert to array and calculate final stats
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const studentsArray = Array.from(userProgressMap.values()).map((student: any) => {
          const completionPercentage = student.total_lessons > 0 
            ? (student.completed_lessons / student.total_lessons) * 100 
            : student.progress_percentage_from_enrollment;
          
          let enrollmentStatus: 'enrolled' | 'in_progress' | 'completed' | 'not_started' = 'enrolled';
          
          if (completionPercentage === 100) {
            enrollmentStatus = 'completed';
          } else if (completionPercentage > 0) {
            enrollmentStatus = 'in_progress';
          } else if (student.completed_lessons === 0 && student.total_watch_time === 0) {
            enrollmentStatus = 'not_started';
          }
          
          return {
            user_id: student.user_id,
            user_name: student.user_name,
            user_email: student.user_email,
            user_image: student.user_image,
            enrolled_at: student.enrolled_at,
            total_lessons: student.total_lessons,
            completed_lessons: student.completed_lessons,
            completion_percentage: completionPercentage,
            total_watch_time: student.total_watch_time,
            avg_quiz_score: student.quiz_scores.length > 0
              ? student.quiz_scores.reduce((sum: number, score: number) => sum + score, 0) / student.quiz_scores.length
              : null,
            last_activity: student.last_activity,
            current_lesson: student.current_lesson,
            current_section: student.current_section,
            enrollment_status: enrollmentStatus
          };
        });
        
        setStudentsProgress(studentsArray);
        
      } catch (error: unknown) {
        console.error('Error fetching students progress:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      }
    };
    
    fetchStudentsProgress();
  }, [selectedCourse]);

  // Handle course selection
  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
  };

  // Handle student details view
  const handleViewStudentDetails = (userId: string) => {
    // Implement student detail modal or navigation
    console.log('View details for user:', userId);
  };

  // Filter functions
  const getFilteredCourses = () => {
    return coursesOverview.filter(course =>
      course.course_title.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
      course.instructor_name?.toLowerCase().includes(courseSearchQuery.toLowerCase())
    );
  };

  const getFilteredStudents = () => {
    return studentsProgress.filter(student =>
      student.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.user_email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mb-8"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auth check
  if (!clerkUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Lütfen giriş yapınız.</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const filteredCourses = getFilteredCourses();
  const filteredStudents = getFilteredStudents();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {t.title}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {t.subtitle}
          </p>
          <div className="w-12 h-1 bg-[#990000] mt-3"></div>
        </div>

        {/* Course Overview Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t.courseOverview}
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500 w-4 h-4" />
              <input
                type="text"
                value={courseSearchQuery}
                onChange={(e) => setCourseSearchQuery(e.target.value)}
                placeholder={t.searchCourses}
                className="pl-9 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm"
              />
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {t.noData}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Henüz aktif kurs bulunmuyor veya kurslarınızda öğrenci yok.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <CourseOverviewCard
                  key={course.course_id}
                  course={course}
                  onClick={() => handleCourseSelect(course.course_id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Students Progress Section */}
        {selectedCourse && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {t.studentsProgress}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchStudents}
                    className="pl-9 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm"
                  />
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 text-sm"
                >
                  Geri Dön
                </button>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {t.noStudents}
                </h3>
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 dark:bg-neutral-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-72">
                          {t.studentName} / Durum
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-32">
                          {t.progress}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-48">
                          {t.currentLesson}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-32">
                          {t.totalWatchTime}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                          Quiz
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-40">
                          {t.lastActivity} / Kayıt
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider w-24">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                      {filteredStudents.map((student) => (
                        <StudentProgressRow
                          key={student.user_id}
                          student={student}
                          courseId={selectedCourse}
                          locale={locale}
                          t={t}
                          onViewDetails={handleViewStudentDetails}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}