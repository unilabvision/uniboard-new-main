'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Save, ArrowLeft, AlertCircle,
  Eye, Calendar, PlayCircle, Plus, Trash2, 
  ChevronDown, ChevronRight,
  Video, FileText, Edit2, Check, X,
  ArrowUp, ArrowDown, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import VideoUploadModal from '../../../../components/lms/VideoUploadModal';
import NoteUploadModal from '../../../../components/lms/NoteUploadModal';
import QuizUploadModal from '../../../../components/lms/QuizUploadModal';
import ModuleSelectionModal from '../../../../components/lms/ModuleSelectionModal';
import { Course, CourseSection, CourseLesson, CourseVideo, CourseNote, CourseQuiz, ModuleType } from '../../../../types/course';

// Supabase client
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg'
});

// Localized texts
const texts = {
  tr: {
    title: "Kursu Düzenle",
    subtitle: "Kurs bilgilerini güncelleyin",
    backToList: "Kurs Listesine Dön",
    courseInfo: "Kurs Bilgileri",
    courseTitle: "Kurs Başlığı",
    courseSlug: "Kurs Kısa Adı",
    courseDescription: "Kurs Açıklaması",
    courseType: "Kurs Türü",
    courseLevel: "Seviye",
    coursePrice: "Fiyat",
    courseOriginalPrice: "Orijinal Fiyat",
    liveSettings: "Canlı Kurs Ayarları",
    liveStartDate: "Başlangıç Tarihi",
    liveEndDate: "Bitiş Tarihi",
    maxParticipants: "Maksimum Katılımcı",
    sessionCount: "Oturum Sayısı",
    registrationDeadline: "Kayıt Son Tarihi",
    registrationOpen: "Kayıt Açık",
    courseTypes: {
      online: "Online",
      live: "Canlı",
      hybrid: "Hibrit"
    },
    status: "Durum",
    active: "Aktif",
    save: "Kaydet",
    preview: "Önizleme",
    loading: "Yükleniyor...",
    saving: "Kaydediliyor...",
    saved: "Kurs başarıyla kaydedildi",
    error: "Bir hata oluştu",
    notFound: "Kurs bulunamadı"
  }
};

// Main Component
export default function EditCoursePage() {
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'settings'>('info');
  
  const params = useParams();
  const { user: clerkUser, isLoaded } = useUser();
  
  const courseId = params?.id as string;
  const locale = 'tr';
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Fetch course data
  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !isLoaded || !clerkUser) return;
      
      try {
        setLoading(true);
        
        // Fetch course with new table structure from myuni_kurum_lessons_data
        const { data: courseData, error: courseError } = await supabase
          .from('myuni_kurum_courses')
          .select(`
            *,
            myuni_kurum_course_lessons_user(
              id,
              order_index,
              is_active,
              myuni_kurum_lessons_data(
                id,
                title,
                description,
                context,
                video_embed_url,
                note_content,
                quiz_content,
                quiz_type,
                lesson_type,
                duration_minutes,
                is_active,
                created_at,
                updated_at
              )
            )
          `)
          .eq('id', courseId)
          .single();
        
        if (courseError) {
          if (courseError.code === 'PGRST116') {
            setError('Course not found');
          } else {
            throw courseError;
          }
          return;
        }
        
        // Process the data for new table structure
        const processedSections: CourseSection[] = [];
        
        console.log('🔍 Course data structure:', {
          courseData,
          hasLessonsUser: !!courseData.myuni_kurum_course_lessons_user,
          lessonsCount: courseData.myuni_kurum_course_lessons_user?.length || 0,
          lessonsData: courseData.myuni_kurum_course_lessons_user
        });
        
        // For now, create a single section with all lessons
        if (courseData.myuni_kurum_course_lessons_user && courseData.myuni_kurum_course_lessons_user.length > 0) {
          const lessons = courseData.myuni_kurum_course_lessons_user
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((courseLesson: any) => {
              console.log('🔍 Processing lesson:', courseLesson);
              const lessonData = courseLesson.myuni_kurum_lessons_data;
              return {
                id: lessonData?.id || courseLesson.id,
                course_id: courseData.id,
                section_id: 'default-section',
                title: lessonData?.title || 'Untitled Lesson',
                description: lessonData?.description || '',
                context: lessonData?.context || '',
                video_embed_url: lessonData?.video_embed_url || '',
                note_content: lessonData?.note_content || '',
                quiz_content: lessonData?.quiz_content || null,
                quiz_type: lessonData?.quiz_type || '',
                lesson_type: lessonData?.lesson_type || 'video',
                duration_minutes: lessonData?.duration_minutes || 0,
                order_index: courseLesson.order_index || 0,
                is_active: lessonData?.is_active ?? true,
                created_at: lessonData?.created_at || new Date().toISOString(),
                updated_at: lessonData?.updated_at || new Date().toISOString(),
                videos: [], // Legacy field for compatibility
                notes: [], // Legacy field for compatibility  
                quizzes: [] // Legacy field for compatibility
              };
            })
            .sort((a: CourseLesson, b: CourseLesson) => a.order_index - b.order_index);
          
          console.log('🔍 Processed lessons:', lessons);
          
          processedSections.push({
            id: 'default-section',
            course_id: courseData.id,
            title: 'Course Content',
            description: '',
            order_index: 1,
            is_active: true,
            lessons: lessons
          });
        } else {
          // Create empty section even if no lessons
          processedSections.push({
            id: 'default-section',
            course_id: courseData.id,
            title: 'Course Content',
            description: '',
            order_index: 1,
            is_active: true,
            lessons: []
          });
        }
        
        console.log('🔍 Final processed sections:', processedSections);
        
        // Remove nested data from course object
        const cleanCourse = {
          ...courseData,
          myuni_kurum_course_lessons_user: undefined
        };
        
        setCourse(cleanCourse);
        setSections(processedSections);
        
      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, clerkUser, isLoaded]);

  // Handle course update
  const handleSave = async () => {
    if (!course) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('myuni_kurum_courses')
        .update({
          ...course,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);
      
      if (error) throw error;
      
      alert(t.saved);
      
    } catch (error: unknown) {
      console.error('Error saving course:', error);
      alert(t.error + ': ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32">
          <div className="animate-pulse">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-6"></div>
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-8"></div>
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="space-y-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-2"></div>
                    <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  </div>
                ))}
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
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32">
          <Link 
            href={`/${locale}/lms-2`} 
            className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToList}
          </Link>
          
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {error === 'Course not found' ? t.notFound : t.error}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              {error === 'Course not found' 
                ? 'Düzenlemek istediğiniz kurs bulunamadı.'
                : error
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!clerkUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Lütfen giriş yapınız.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href={`/${locale}/lms-2`} 
              className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backToList}
            </Link>
            
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t.title}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {t.subtitle}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              href={`/${locale}/lms/courses/${course.slug}`}
              className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              {t.preview}
            </Link>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#990000] hover:bg-[#880000] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t.saving}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t.save}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-neutral-200 dark:border-neutral-700 mb-8">
          <nav className="flex space-x-8">
            {[
              { key: 'info', label: t.courseInfo, icon: BookOpen },
              { key: 'content', label: 'Kurs İçeriği', icon: PlayCircle },
              { key: 'settings', label: t.liveSettings, icon: Calendar }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as 'info' | 'content' | 'settings')}
                className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? 'border-[#990000] text-[#990000]'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.courseTitle} *
                  </label>
                  <input
                    type="text"
                    value={course.title}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.courseSlug} *
                  </label>
                  <input
                    type="text"
                    value={course.slug}
                    onChange={(e) => setCourse({ ...course, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.courseDescription}
                  </label>
                  <textarea
                    value={course.description || ''}
                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.courseType} *
                  </label>
                  <select
                    value={course.course_type}
                    onChange={(e) => setCourse({ ...course, course_type: e.target.value as 'online' | 'live' | 'hybrid' })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                    required
                  >
                    <option value="online">{t.courseTypes.online}</option>
                    <option value="live">{t.courseTypes.live}</option>
                    <option value="hybrid">{t.courseTypes.hybrid}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.courseLevel}
                  </label>
                  <input
                    type="text"
                    value={course.level || ''}
                    onChange={(e) => setCourse({ ...course, level: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                    placeholder="Başlangıç, Orta, İleri"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.coursePrice}
                  </label>
                  <input
                    type="number"
                    value={course.price || ''}
                    onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.courseOriginalPrice}
                  </label>
                  <input
                    type="number"
                    value={course.original_price || ''}
                    onChange={(e) => setCourse({ ...course, original_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={course.is_active}
                    onChange={(e) => setCourse({ ...course, is_active: e.target.checked })}
                    className="w-4 h-4 text-[#990000] bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded focus:ring-[#990000] focus:ring-2"
                  />
                  <label htmlFor="is_active" className="ml-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t.active}
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <CourseContentManager 
              courseId={courseId}
              sections={sections}
              setSections={setSections}
            />
          )}

          {activeTab === 'settings' && course.course_type === 'live' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.liveStartDate}
                  </label>
                  <input
                    type="datetime-local"
                    value={course.live_start_date ? new Date(course.live_start_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCourse({ ...course, live_start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.liveEndDate}
                  </label>
                  <input
                    type="datetime-local"
                    value={course.live_end_date ? new Date(course.live_end_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCourse({ ...course, live_end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.maxParticipants}
                  </label>
                  <input
                    type="number"
                    value={course.max_participants || ''}
                    onChange={(e) => setCourse({ ...course, max_participants: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.sessionCount}
                  </label>
                  <input
                    type="number"
                    value={course.session_count || ''}
                    onChange={(e) => setCourse({ ...course, session_count: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.registrationDeadline}
                  </label>
                  <input
                    type="datetime-local"
                    value={course.registration_deadline ? new Date(course.registration_deadline).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCourse({ ...course, registration_deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_registration_open"
                      checked={course.is_registration_open}
                      onChange={(e) => setCourse({ ...course, is_registration_open: e.target.checked })}
                      className="w-4 h-4 text-[#990000] bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded focus:ring-[#990000] focus:ring-2"
                    />
                    <label htmlFor="is_registration_open" className="ml-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {t.registrationOpen}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && course.course_type !== 'live' && (
            <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
              <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Bu kurs türü için özel ayar bulunmamaktadır.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Course Content Manager Component
const CourseContentManager = ({ 
  courseId, 
  sections, 
  setSections 
}: { 
  courseId: string;
  sections: CourseSection[];
  setSections: React.Dispatch<React.SetStateAction<CourseSection[]>>;
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  
  // Module management states
  const [showModuleSelection, setShowModuleSelection] = useState(false);
  const [selectedLessonForModule, setSelectedLessonForModule] = useState<string | null>(null);
  const [selectedLessonTitle, setSelectedLessonTitle] = useState('');
  
  // Module modals
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showNoteUpload, setShowNoteUpload] = useState(false);
  const [showQuizUpload, setShowQuizUpload] = useState(false);
  
  // Lesson editing
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editingLessonTitle, setEditingLessonTitle] = useState('');

  // Add new section
  const addSection = async () => {
    if (!newSectionTitle.trim()) return;

    try {
      const newSection: CourseSection = {
        id: `temp-${Date.now()}`, // Temporary ID
        course_id: courseId,
        title: newSectionTitle,
        description: '',
        order_index: sections.length,
        is_active: true,
        lessons: []
      };

      // Add to database
      const { data, error } = await supabase
        .from('myuni_course_sections')
        .insert([{
          course_id: courseId,
          title: newSectionTitle,
          description: '',
          order_index: sections.length,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const sectionWithRealId = { ...newSection, id: data.id };
      setSections([...sections, sectionWithRealId]);
      
      // Reset form
      setNewSectionTitle('');
      setIsAddingSection(false);
      
      // Expand the new section
      setExpandedSections(prev => new Set([...prev, data.id]));
      
    } catch (error) {
      console.error('Error adding section:', error);
      alert('Bölüm eklenirken bir hata oluştu');
    }
  };

  // Delete section
  const deleteSection = async (sectionId: string) => {
    if (!confirm('Bu bölümü ve tüm içeriğini silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('myuni_course_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      setSections(sections.filter(s => s.id !== sectionId));
      
    } catch (error) {
      console.error('Error deleting section:', error);
      alert('Bölüm silinirken bir hata oluştu');
    }
  };

  // Move section up/down
  const moveSectionUp = async (sectionId: string) => {
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex <= 0) return;

    const newSections = [...sections];
    [newSections[currentIndex], newSections[currentIndex - 1]] = [newSections[currentIndex - 1], newSections[currentIndex]];

    // Update order_index in database
    try {
      const updates = newSections.map((section, index) => ({
        id: section.id,
        order_index: index
      }));

      for (const update of updates) {
        await supabase
          .from('myuni_course_sections')
          .update({ 
            order_index: update.order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);
      }

      setSections(newSections);
      
    } catch (error) {
      console.error('Error reordering sections:', error);
      alert('Bölüm sırası güncellenirken bir hata oluştu');
    }
  };

  const moveSectionDown = async (sectionId: string) => {
    const currentIndex = sections.findIndex(s => s.id === sectionId);
    if (currentIndex >= sections.length - 1) return;

    const newSections = [...sections];
    [newSections[currentIndex], newSections[currentIndex + 1]] = [newSections[currentIndex + 1], newSections[currentIndex]];

    // Update order_index in database
    try {
      const updates = newSections.map((section, index) => ({
        id: section.id,
        order_index: index
      }));

      for (const update of updates) {
        await supabase
          .from('myuni_course_sections')
          .update({ 
            order_index: update.order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);
      }

      setSections(newSections);
      
    } catch (error) {
      console.error('Error reordering sections:', error);
      alert('Bölüm sırası güncellenirken bir hata oluştu');
    }
  };

  // Start editing section
  const startEditingSection = (sectionId: string, currentTitle: string) => {
    setEditingSection(sectionId);
    setEditingSectionTitle(currentTitle);
  };

  // Save section title
  const saveSectionTitle = async (sectionId: string) => {
    if (!editingSectionTitle.trim()) {
      alert('Bölüm başlığı boş olamaz');
      return;
    }

    try {
      const { error } = await supabase
        .from('myuni_course_sections')
        .update({ 
          title: editingSectionTitle.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sectionId);

      if (error) throw error;

      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, title: editingSectionTitle.trim() }
          : s
      ));

      setEditingSection(null);
      setEditingSectionTitle('');
      
    } catch (error) {
      console.error('Error updating section title:', error);
      alert('Bölüm başlığı güncellenirken bir hata oluştu');
    }
  };

  // Add new lesson
  const addLesson = async (sectionId: string) => {
    const lessonTitle = prompt('Ders başlığını girin:');
    if (!lessonTitle?.trim()) return;

    const durationInput = prompt('Ders süresini dakika cinsinden girin (opsiyonel):');
    const durationMinutes = durationInput ? parseInt(durationInput) : null;

    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      const { data, error } = await supabase
        .from('myuni_course_lessons')
        .insert([{
          section_id: sectionId,
          title: lessonTitle,
          description: '',
          lesson_type: 'content',
          duration_minutes: durationMinutes,
          order_index: section.lessons.length,
          is_active: true,
          is_locked: false,
          is_completed: false
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const newLesson: CourseLesson = {
        ...data,
        videos: [],
        notes: [],
        quizzes: []
      };

      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, lessons: [...s.lessons, newLesson] }
          : s
      ));
      
    } catch (error) {
      console.error('Error adding lesson:', error);
      alert('Ders eklenirken bir hata oluştu');
    }
  };

  // Delete lesson
  const deleteLesson = async (sectionId: string, lessonId: string) => {
    if (!confirm('Bu dersi ve tüm içeriğini silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('myuni_course_lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) }
          : s
      ));
      
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Ders silinirken bir hata oluştu');
    }
  };

  // Start editing lesson
  const startEditingLesson = (lessonId: string, currentTitle: string) => {
    setEditingLesson(lessonId);
    setEditingLessonTitle(currentTitle);
  };

  // Cancel editing lesson
  const cancelEditingLesson = () => {
    setEditingLesson(null);
    setEditingLessonTitle('');
  };

  // Save lesson title
  const saveLessonTitle = async (sectionId: string, lessonId: string) => {
    if (!editingLessonTitle.trim()) {
      alert('Ders başlığı boş olamaz');
      return;
    }

    try {
      const { error } = await supabase
        .from('myuni_course_lessons')
        .update({ 
          title: editingLessonTitle.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', lessonId);

      if (error) throw error;

      setSections(sections.map(s => 
        s.id === sectionId 
          ? { 
              ...s, 
              lessons: s.lessons.map(l => 
                l.id === lessonId 
                  ? { ...l, title: editingLessonTitle.trim() }
                  : l
              )
            }
          : s
      ));

      setEditingLesson(null);
      setEditingLessonTitle('');
      
    } catch (error) {
      console.error('Error updating lesson title:', error);
      alert('Ders başlığı güncellenirken bir hata oluştu');
    }
  };

  // Move lesson up/down
  const moveLessonUp = async (sectionId: string, lessonId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const lessonIndex = section.lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex <= 0) return;

    const newLessons = [...section.lessons];
    [newLessons[lessonIndex], newLessons[lessonIndex - 1]] = [newLessons[lessonIndex - 1], newLessons[lessonIndex]];

    // Update order_index in database
    try {
      const updates = newLessons.map((lesson, index) => ({
        id: lesson.id,
        order_index: index
      }));

      for (const update of updates) {
        await supabase
          .from('myuni_course_lessons')
          .update({ 
            order_index: update.order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);
      }

      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, lessons: newLessons }
          : s
      ));
      
    } catch (error) {
      console.error('Error reordering lessons:', error);
      alert('Ders sırası güncellenirken bir hata oluştu');
    }
  };

  const moveLessonDown = async (sectionId: string, lessonId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const lessonIndex = section.lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex >= section.lessons.length - 1) return;

    const newLessons = [...section.lessons];
    [newLessons[lessonIndex], newLessons[lessonIndex + 1]] = [newLessons[lessonIndex + 1], newLessons[lessonIndex]];

    // Update order_index in database
    try {
      const updates = newLessons.map((lesson, index) => ({
        id: lesson.id,
        order_index: index
      }));

      for (const update of updates) {
        await supabase
          .from('myuni_course_lessons')
          .update({ 
            order_index: update.order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);
      }

      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, lessons: newLessons }
          : s
      ));
      
    } catch (error) {
      console.error('Error reordering lessons:', error);
      alert('Ders sırası güncellenirken bir hata oluştu');
    }
  };

  // Get lesson module info
  const getLessonModuleInfo = (lesson: CourseLesson) => {
    const hasVideo = lesson.videos && lesson.videos.length > 0;
    const hasNotes = lesson.notes && lesson.notes.length > 0;
    const hasQuiz = lesson.quizzes && lesson.quizzes.length > 0;
    
    const moduleCount = (hasVideo ? 1 : 0) + (hasNotes ? 1 : 0) + (hasQuiz ? 1 : 0);
    
    let activeModuleType: ModuleType | null = null;
    if (hasVideo) activeModuleType = 'video';
    else if (hasNotes) activeModuleType = 'notes';
    else if (hasQuiz) activeModuleType = 'quiz';
    
    return {
      hasVideo,
      hasNotes,
      hasQuiz,
      moduleCount,
      activeModuleType
    };
  };

  // Open module selection
  const openModuleSelection = (lessonId: string, lessonTitle: string) => {
    setSelectedLessonForModule(lessonId);
    setSelectedLessonTitle(lessonTitle);
    setShowModuleSelection(true);
  };

  // Handle module selection
  const handleModuleSelected = async (moduleType: ModuleType) => {
    if (!selectedLessonForModule) return;
    
    const lesson = sections
      .flatMap(s => s.lessons)
      .find(l => l.id === selectedLessonForModule);
    
    if (!lesson) return;
    
    const moduleInfo = getLessonModuleInfo(lesson);
    
    // If lesson already has content and user is selecting a different type, delete existing content
    if (moduleInfo.moduleCount > 0 && moduleInfo.activeModuleType !== moduleType) {
      const confirmDelete = confirm(
        `Bu derste zaten ${
          moduleInfo.activeModuleType === 'video' ? 'video' :
          moduleInfo.activeModuleType === 'notes' ? 'not' : 'quiz'
        } içeriği var. Yeni ${
          moduleType === 'video' ? 'video' :
          moduleType === 'notes' ? 'not' : 'quiz'
        } eklemek için mevcut içerik silinecek. Devam etmek istiyor musunuz?`
      );
      
      if (!confirmDelete) {
        setShowModuleSelection(false);
        return;
      }
      
      // Delete existing content
      try {
        if (moduleInfo.hasVideo) {
          await supabase.from('myuni_videos').delete().eq('lesson_id', selectedLessonForModule);
        }
        if (moduleInfo.hasNotes) {
          await supabase.from('myuni_notes').delete().eq('lesson_id', selectedLessonForModule);
        }
        if (moduleInfo.hasQuiz) {
          await supabase.from('myuni_quicks').delete().eq('lesson_id', selectedLessonForModule);
        }
        
        // Update local state to remove deleted content
        setSections(sections.map(s => ({
          ...s,
          lessons: s.lessons.map(l => 
            l.id === selectedLessonForModule
              ? { ...l, videos: [], notes: [], quizzes: [] }
              : l
          )
        })));
        
      } catch (error) {
        console.error('Error deleting existing content:', error);
        alert('Mevcut içerik silinirken hata oluştu');
        setShowModuleSelection(false);
        return;
      }
    }
    
    // Open appropriate modal
    setShowModuleSelection(false);
    
    if (moduleType === 'video') {
      setShowVideoUpload(true);
    } else if (moduleType === 'notes') {
      setShowNoteUpload(true);
    } else if (moduleType === 'quiz') {
      setShowQuizUpload(true);
    }
  };

  // Handle video upload
  const handleVideoUploaded = (uploadedVideo: CourseVideo) => {
    setSections(sections.map(s => ({
      ...s,
      lessons: s.lessons.map(l => 
        l.id === selectedLessonForModule 
          ? { ...l, videos: [...(l.videos || []), uploadedVideo] }
          : l
      )
    })));
    
    setShowVideoUpload(false);
    setSelectedLessonForModule(null);
  };

  // Handle note upload
  const handleNoteUploaded = (uploadedNote: CourseNote) => {
    setSections(sections.map(s => ({
      ...s,
      lessons: s.lessons.map(l => 
        l.id === selectedLessonForModule 
          ? { ...l, notes: [...(l.notes || []), uploadedNote] }
          : l
      )
    })));
    
    setShowNoteUpload(false);
    setSelectedLessonForModule(null);
  };

  // Handle quiz upload
  const handleQuizUploaded = (uploadedQuiz: CourseQuiz) => {
    setSections(sections.map(s => ({
      ...s,
      lessons: s.lessons.map(l => 
        l.id === selectedLessonForModule 
          ? { ...l, quizzes: [...(l.quizzes || []), uploadedQuiz] }
          : l
      )
    })));
    
    setShowQuizUpload(false);
    setSelectedLessonForModule(null);
  };

  // Close modals
  const closeModals = () => {
    setShowModuleSelection(false);
    setShowVideoUpload(false);
    setShowNoteUpload(false);
    setShowQuizUpload(false);
    setSelectedLessonForModule(null);
    setSelectedLessonTitle('');
  };

  // Delete module content
  const deleteModuleContent = async (lessonId: string, moduleType: ModuleType, itemId: string) => {
    if (!confirm(`Bu ${moduleType === 'video' ? 'videoyu' : moduleType === 'notes' ? 'notu' : 'quiz\'i'} silmek istediğinizden emin misiniz?`)) return;

    try {
      let tableName = '';
      if (moduleType === 'video') tableName = 'myuni_videos';
      else if (moduleType === 'notes') tableName = 'myuni_notes';
      else if (moduleType === 'quiz') tableName = 'myuni_quicks';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setSections(sections.map(s => ({
        ...s,
        lessons: s.lessons.map(l => 
          l.id === lessonId 
            ? { 
                ...l, 
                videos: moduleType === 'video' ? (l.videos || []).filter(v => v.id !== itemId) : l.videos,
                notes: moduleType === 'notes' ? (l.notes || []).filter(n => n.id !== itemId) : l.notes,
                quizzes: moduleType === 'quiz' ? (l.quizzes || []).filter(q => q.id !== itemId) : l.quizzes
              }
            : l
        )
      })));
      
    } catch (error) {
      console.error('Error deleting module content:', error);
      alert('İçerik silinirken bir hata oluştu');
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

  // Toggle lesson expansion
  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Kurs İçeriği
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Bölümler, dersler ve içerikleri yönetin
          </p>
        </div>
        
        {!isAddingSection ? (
          <button
            onClick={() => setIsAddingSection(true)}
            className="px-4 py-2 bg-[#990000] hover:bg-[#880000] text-white rounded-lg transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Bölüm Ekle
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              placeholder="Bölüm başlığı..."
              className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addSection()}
              autoFocus
            />
            <button
              onClick={addSection}
              disabled={!newSectionTitle.trim()}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsAddingSection(false);
                setNewSectionTitle('');
              }}
              className="px-3 py-2 bg-neutral-500 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Henüz bölüm eklenmemiş</p>
            <p className="text-sm mt-2">İlk bölümü ekleyerek başlayın</p>
          </div>
        ) : (
          sections.map((section, sectionIndex) => (
            <div key={section.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
              {/* Section Header */}
              <div className="bg-neutral-50 dark:bg-neutral-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        #{sectionIndex + 1}
                      </span>
                      {editingSection === section.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingSectionTitle}
                            onChange={(e) => setEditingSectionTitle(e.target.value)}
                            className="px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyPress={(e) => e.key === 'Enter' && saveSectionTitle(section.id)}
                            autoFocus
                          />
                          <button
                            onClick={() => saveSectionTitle(section.id)}
                            className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingSection(null);
                              setEditingSectionTitle('');
                            }}
                            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                          {section.title}
                        </h4>
                      )}
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        ({section.lessons.length} ders)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {/* Section reorder buttons */}
                    <button
                      onClick={() => moveSectionUp(section.id)}
                      disabled={sectionIndex === 0}
                      className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Yukarı Taşı"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveSectionDown(section.id)}
                      disabled={sectionIndex === sections.length - 1}
                      className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Aşağı Taşı"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    
                    {/* Edit section name */}
                    {editingSection !== section.id && (
                      <button
                        onClick={() => startEditingSection(section.id, section.title)}
                        className="p-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                        title="Bölüm Adını Düzenle"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    
                    {/* Add lesson */}
                    <button
                      onClick={() => addLesson(section.id)}
                      className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                      title="Ders Ekle"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    
                    {/* Delete section */}
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Bölümü Sil"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              {expandedSections.has(section.id) && (
                <div className="p-4 space-y-3">
                  {section.lessons.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Bu bölümde henüz ders yok</p>
                      <button
                        onClick={() => addLesson(section.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-2"
                      >
                        İlk dersi ekle
                      </button>
                    </div>
                  ) : (
                    section.lessons.map((lesson, lessonIndex) => {
                      const moduleInfo = getLessonModuleInfo(lesson);
                      
                      return (
                        <div key={lesson.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg">
                          {/* Lesson Header */}
                          <div className="p-3 bg-white dark:bg-neutral-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => toggleLesson(lesson.id)}
                                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                                >
                                  {expandedLessons.has(lesson.id) ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                                
                                <div className="flex items-center space-x-2">
                                  {/* Module type icon */}
                                  {moduleInfo.activeModuleType === 'video' && <Video className="w-4 h-4 text-red-600 dark:text-red-400" />}
                                  {moduleInfo.activeModuleType === 'notes' && <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                  {moduleInfo.activeModuleType === 'quiz' && <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                                  {!moduleInfo.activeModuleType && <div className="w-4 h-4 border border-neutral-300 dark:border-neutral-600 rounded" />}
                                  
                                  <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                    {sectionIndex + 1}.{lessonIndex + 1}
                                  </span>
                                  
                                  {editingLesson === lesson.id ? (
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="text"
                                        value={editingLessonTitle}
                                        onChange={(e) => setEditingLessonTitle(e.target.value)}
                                        className="px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onKeyPress={(e) => e.key === 'Enter' && saveLessonTitle(section.id, lesson.id)}
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => saveLessonTitle(section.id, lesson.id)}
                                        className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                                      >
                                        <Check className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={cancelEditingLesson}
                                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                      {lesson.title}
                                    </span>
                                  )}
                                  
                                  {/* Module count indicator */}
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    moduleInfo.moduleCount > 0
                                      ? moduleInfo.activeModuleType === 'video'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                        : moduleInfo.activeModuleType === 'notes'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400'
                                  }`}>
                                    {moduleInfo.moduleCount > 0 
                                      ? `${moduleInfo.activeModuleType === 'video' ? 'Video' : 
                                         moduleInfo.activeModuleType === 'notes' ? 'Not' : 'Quiz'}`
                                      : 'İçerik Yok'
                                    }
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                {/* Lesson reorder buttons */}
                                <button
                                  onClick={() => moveLessonUp(section.id, lesson.id)}
                                  disabled={lessonIndex === 0}
                                  className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Yukarı Taşı"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => moveLessonDown(section.id, lesson.id)}
                                  disabled={lessonIndex === section.lessons.length - 1}
                                  className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Aşağı Taşı"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                                
                                {/* Edit lesson name */}
                                {editingLesson !== lesson.id && (
                                  <button
                                    onClick={() => startEditingLesson(lesson.id, lesson.title)}
                                    className="p-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                                    title="Ders Adını Düzenle"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                )}
                                
                                {/* Add/Edit content */}
                                <button
                                  onClick={() => openModuleSelection(lesson.id, lesson.title)}
                                  className={`p-1 transition-colors ${
                                    moduleInfo.moduleCount > 0
                                      ? 'text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300'
                                      : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                                  }`}
                                  title={moduleInfo.moduleCount > 0 ? 'İçeriği Düzenle' : 'İçerik Ekle'}
                                >
                                  {moduleInfo.moduleCount > 0 ? <Edit2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                </button>
                                
                                {/* Delete lesson */}
                                <button
                                  onClick={() => deleteLesson(section.id, lesson.id)}
                                  className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  title="Dersi Sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Lesson Content */}
                          {expandedLessons.has(lesson.id) && (
                            <div className="p-3 bg-neutral-50 dark:bg-neutral-900 space-y-2">
                              {moduleInfo.moduleCount === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-md flex items-center justify-center mb-3">
                                    <Plus className="w-6 h-6 text-neutral-400" />
                                  </div>
                                  <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                                    Bu derste henüz içerik yok
                                  </h3>
                                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 max-w-sm">
                                    Video, not veya quiz ekleyerek dersinizi zenginleştirin
                                  </p>
                                  <button
                                    onClick={() => openModuleSelection(lesson.id, lesson.title)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors duration-200 space-x-2"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>İçerik Ekle</span>
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  {/* Video Content */}
                                  {lesson.videos && lesson.videos.map((video, videoIndex) => (
                                    <div key={video.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 mb-2">
                                      <div className="flex items-center space-x-3">
                                        <Video className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                          Video {videoIndex + 1}
                                        </span>
                                        <span className="text-sm text-neutral-900 dark:text-neutral-100">
                                          {video.title}
                                        </span>
                                        {video.vimeo_id && (
                                          <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                                            Vimeo: {video.vimeo_id}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => {
                                            setSelectedLessonForModule(lesson.id);
                                            setSelectedLessonTitle(lesson.title);
                                            setShowVideoUpload(true);
                                          }}
                                          className="p-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                                          title="Videoyu Düzenle"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => deleteModuleContent(lesson.id, 'video', video.id)}
                                          className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                          title="Videoyu Sil"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Notes Content */}
                                  {lesson.notes && lesson.notes.map((note, noteIndex) => (
                                    <div key={note.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 mb-2">
                                      <div className="flex items-center space-x-3">
                                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                          Not {noteIndex + 1}
                                        </span>
                                        <span className="text-sm text-neutral-900 dark:text-neutral-100">
                                          {note.title}
                                        </span>
                                        <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                          {note.content_type.toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => {
                                            setSelectedLessonForModule(lesson.id);
                                            setSelectedLessonTitle(lesson.title);
                                            setShowNoteUpload(true);
                                          }}
                                          className="p-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                                          title="Notu Düzenle"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => deleteModuleContent(lesson.id, 'notes', note.id)}
                                          className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                          title="Notu Sil"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}

                                  {/* Quiz Content */}
                                  {lesson.quizzes && lesson.quizzes.map((quiz, quizIndex) => (
                                    <div key={quiz.id} className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 mb-2">
                                      <div className="flex items-center space-x-3">
                                        <HelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                                          Quiz {quizIndex + 1}
                                        </span>
                                        <span className="text-sm text-neutral-900 dark:text-neutral-100">
                                          {quiz.title}
                                        </span>
                                        <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                                          {quiz.config?.questions?.length || 0} Soru
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => {
                                            setSelectedLessonForModule(lesson.id);
                                            setSelectedLessonTitle(lesson.title);
                                            setShowQuizUpload(true);
                                          }}
                                          className="p-1 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                                          title="Quiz'i Düzenle"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => deleteModuleContent(lesson.id, 'quiz', quiz.id)}
                                          className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                          title="Quiz'i Sil"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {/* Module Selection Modal */}
      {showModuleSelection && selectedLessonForModule && (
        <ModuleSelectionModal
          lessonTitle={selectedLessonTitle}
          onModuleSelected={handleModuleSelected}
          onClose={closeModals}
          existingModules={(() => {
            const lesson = sections.flatMap(s => s.lessons).find(l => l.id === selectedLessonForModule);
            if (!lesson) return { hasVideo: false, hasNotes: false, hasQuiz: false };
            return {
              hasVideo: Boolean(lesson.videos && lesson.videos.length > 0),
              hasNotes: Boolean(lesson.notes && lesson.notes.length > 0),
              hasQuiz: Boolean(lesson.quizzes && lesson.quizzes.length > 0)
            };
          })()}
        />
      )}

      {/* Video Upload Modal */}
      {showVideoUpload && selectedLessonForModule && (
        <VideoUploadModal
          lessonId={selectedLessonForModule}
          onVideoUploaded={handleVideoUploaded}
          onClose={closeModals}
          orderIndex={
            sections
              .flatMap(s => s.lessons)
              .find(l => l.id === selectedLessonForModule)?.videos?.length || 0
          }
        />
      )}

      {/* Note Upload Modal */}
      {showNoteUpload && selectedLessonForModule && (
        <NoteUploadModal
          lessonId={selectedLessonForModule}
          onNoteUploaded={handleNoteUploaded}
          onClose={closeModals}
          orderIndex={
            sections
              .flatMap(s => s.lessons)
              .find(l => l.id === selectedLessonForModule)?.notes?.length || 0
          }
        />
      )}

      {/* Quiz Upload Modal */}
      {showQuizUpload && selectedLessonForModule && (
        <QuizUploadModal
          lessonId={selectedLessonForModule}
          onQuizUploaded={handleQuizUploaded}
          onClose={closeModals}
          orderIndex={
            sections
              .flatMap(s => s.lessons)
              .find(l => l.id === selectedLessonForModule)?.quizzes?.length || 0
          }
        />
      )}
    </div>
  );
};
