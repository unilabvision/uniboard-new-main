'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, PlusCircle, 
  Eye, Grid3X3, List,
  Edit2, Trash2, MoreVertical,
  PlayCircle, Calendar, Clock,
  Users, Video,
  TrendingUp, Check, X, Tag, Layers
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
import { sanitizeHtml } from '@/app/lib/lms/htmlContent';
import {
  getCoursePackagePrices,
  updateCoursePrices,
  updateCourseTierPrices,
  type CoursePackagePrice,
} from '@/app/lib/lms/enrollmentOverviewService';

// Utility function to sanitize HTML content
const sanitizeHtmlForCard = sanitizeHtml;

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
  // Computed fields
  sections_count?: number;
  lessons_count?: number;
  total_videos?: number;
  total_duration?: number;
}

// Localized texts
const texts = {
  tr: {
    title: "Kurs Yönetimi",
    subtitle: "Eğitim kurslarınızı oluşturun, düzenleyin ve yönetin",
    searchPlaceholder: "Kurs adı, eğitmen veya açıklama ara...",
    emptyState: {
      title: "Henüz kurs bulunmuyor",
      subtitle: "Yeni bir kurs oluşturarak başlayın",
      buttonText: "Kurs Oluştur"
    },
    createNew: "Yeni Kurs",
    viewCourse: "Kursu Görüntüle",
    editCourse: "Kursu Düzenle",
    deleteCourse: "Kursu Sil",
    deleteConfirmTitle: "Kursu Sil",
    deleteConfirmMessage: "Bu kursu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
    deleteConfirmButton: "Evet, Sil",
    cancelButton: "İptal",
    deleting: "Siliniyor...",
    deleteSuccess: "Kurs başarıyla silindi",
    deleteError: "Kurs silinirken bir hata oluştu",
    courseDetails: {
      instructor: "Eğitmen",
      duration: "Süre",
      level: "Seviye",
      price: "Fiyat",
      participants: "Katılımcı",
      sessions: "Oturum",
      type: "Tür",
      status: "Durum"
    },
    courseTypes: {
      online: "Online",
      live: "Canlı",
      hybrid: "Hibrit",
      all: "Tümü"
    },
    courseStatus: {
      active: "Aktif",
      inactive: "Pasif",
      registrationOpen: "Kayıt Açık",
      registrationClosed: "Kayıt Kapalı"
    },
    filters: {
      all: "Tüm Kurslar",
      type: "Tür",
      level: "Seviye",
      status: "Durum"
    },
    sorting: {
      newest: "En Yeni",
      oldest: "En Eski",
      nameAsc: "A-Z",
      nameDesc: "Z-A",
      priceAsc: "Fiyat (Düşük)",
      priceDesc: "Fiyat (Yüksek)"
    },
    loading: "Yükleniyor...",
    error: "Veriler yüklenirken bir hata oluştu",
    free: "Ücretsiz",
    panelCourses: "Kurslar",
    panelEnrollments: "Katılımcılar",
    editPrice: "Fiyatı Düzenle",
    editPackagePrices: "Paket Fiyatları",
    savePrice: "Kaydet",
    cancelPrice: "İptal",
    priceSaved: "Fiyat güncellendi",
    priceSaveError: "Fiyat kaydedilemedi",
    originalPriceShort: "Liste",
    packagesLoading: "Paketler yükleniyor...",
    noPackages: "Bu kursa bağlı aktif paket yok",
    packagePricesSaved: "Paket fiyatları güncellendi",
    packagePricesSaveError: "Paket fiyatları kaydedilemedi",
  },
  en: {
    title: "Course Management",
    subtitle: "Create, edit and manage your training courses",
    searchPlaceholder: "Search course name, instructor or description...",
    emptyState: {
      title: "No courses found",
      subtitle: "Get started by creating a new course",
      buttonText: "Create Course"
    },
    createNew: "New Course",
    viewCourse: "View Course",
    editCourse: "Edit Course",
    deleteCourse: "Delete Course",
    deleteConfirmTitle: "Delete Course",
    deleteConfirmMessage: "Are you sure you want to delete this course? This action cannot be undone.",
    deleteConfirmButton: "Yes, Delete",
    cancelButton: "Cancel",
    deleting: "Deleting...",
    deleteSuccess: "Course deleted successfully",
    deleteError: "An error occurred while deleting the course",
    courseDetails: {
      instructor: "Instructor",
      duration: "Duration",
      level: "Level",
      price: "Price",
      participants: "Participants",
      sessions: "Sessions",
      type: "Type",
      status: "Status"
    },
    courseTypes: {
      online: "Online",
      live: "Live",
      hybrid: "Hybrid",
      all: "All"
    },
    courseStatus: {
      active: "Active",
      inactive: "Inactive",
      registrationOpen: "Registration Open",
      registrationClosed: "Registration Closed"
    },
    filters: {
      all: "All Courses",
      type: "Type",
      level: "Level",
      status: "Status"
    },
    sorting: {
      newest: "Newest",
      oldest: "Oldest",
      nameAsc: "A-Z",
      nameDesc: "Z-A",
      priceAsc: "Price (Low)",
      priceDesc: "Price (High)"
    },
    loading: "Loading...",
    error: "An error occurred while loading data",
    free: "Free",
    panelCourses: "Courses",
    panelEnrollments: "Participants",
    editPrice: "Edit Price",
    editPackagePrices: "Package Prices",
    savePrice: "Save",
    cancelPrice: "Cancel",
    priceSaved: "Price updated",
    priceSaveError: "Could not save price",
    originalPriceShort: "List",
    packagesLoading: "Loading packages...",
    noPackages: "No active packages for this course",
    packagePricesSaved: "Package prices updated",
    packagePricesSaveError: "Could not save package prices",
  }
};

// Utility functions
// const formatDate = (dateString: string, locale: string) => {
//   const date = new Date(dateString);
//   return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
//     day: 'numeric',
//     month: 'long',
//     year: 'numeric'
//   });
// };

const formatPrice = (price: number | null, locale: string) => {
  if (!price || price === 0) return locale === 'tr' ? 'Ücretsiz' : 'Free';
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY'
  }).format(price);
};

// const formatDuration = (minutes: number) => {
//   if (minutes < 60) return `${minutes} dk`;
//   const hours = Math.floor(minutes / 60);
//   const remainingMinutes = minutes % 60;
//   return remainingMinutes > 0 ? `${hours}s ${remainingMinutes}dk` : `${hours}s`;
// };

// Course Type Icon Component
const CourseTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'online':
      return <Video className="w-4 h-4" />;
    case 'live':
      return <PlayCircle className="w-4 h-4" />;
    case 'hybrid':
      return <Calendar className="w-4 h-4" />;
    default:
      return <BookOpen className="w-4 h-4" />;
  }
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  course,
  isDeleting,
  t 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  course: Course | null;
  isDeleting: boolean;
  t: typeof texts.tr;
}) => {
  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mr-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {t.deleteConfirmTitle}
              </h3>
            </div>
          </div>
          
          <p className="text-neutral-600 dark:text-neutral-400 mb-2">
            {t.deleteConfirmMessage}
          </p>
          
          <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-3 mb-6">
            <div className="text-sm">
              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                {course.title}
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">
                {course.instructor_name} - {course.course_type}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {t.cancelButton}
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t.deleting}
                </>
              ) : (
                t.deleteConfirmButton
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Course Card Component
const CourseCard = ({ 
  course, 
  locale, 
  t,
  onEdit,
  onDelete,
  onPriceUpdate
}: { 
  course: Course;
  locale: string;
  t: typeof texts.tr;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onPriceUpdate: (courseId: string, price: number | null, originalPrice: number | null) => Promise<void>;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState(String(course.price ?? 0));
  const [originalPriceDraft, setOriginalPriceDraft] = useState(String(course.original_price ?? ''));
  const [savingPrice, setSavingPrice] = useState(false);

  const [editingPackages, setEditingPackages] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packages, setPackages] = useState<CoursePackagePrice[]>([]);
  const [packageDrafts, setPackageDrafts] = useState<
    Record<string, { price: string; original: string }>
  >({});
  const [savingPackages, setSavingPackages] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        const target = event.target as Element;
        if (!target.closest('.menu-container')) {
          setShowMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const startPriceEdit = () => {
    setEditingPackages(false);
    setPriceDraft(String(course.price ?? 0));
    setOriginalPriceDraft(course.original_price ? String(course.original_price) : '');
    setEditingPrice(true);
    setShowMenu(false);
  };

  const cancelPriceEdit = () => {
    setEditingPrice(false);
    setPriceDraft(String(course.price ?? 0));
    setOriginalPriceDraft(course.original_price ? String(course.original_price) : '');
  };

  const savePriceEdit = async () => {
    try {
      setSavingPrice(true);
      const nextPrice = priceDraft === '' ? 0 : Number(priceDraft);
      const nextOriginal =
        originalPriceDraft === '' ? null : Number(originalPriceDraft);

      if (Number.isNaN(nextPrice) || (nextOriginal !== null && Number.isNaN(nextOriginal))) {
        throw new Error(t.priceSaveError);
      }

      await onPriceUpdate(
        course.id,
        nextPrice,
        nextOriginal
      );
      setEditingPrice(false);
    } catch (error) {
      console.error('Price update failed:', error);
      alert(t.priceSaveError);
    } finally {
      setSavingPrice(false);
    }
  };

  const startPackagePriceEdit = async () => {
    setEditingPrice(false);
    setEditingPackages(true);
    setShowMenu(false);
    setPackagesLoading(true);
    try {
      const rows = await getCoursePackagePrices(course.id);
      setPackages(rows);
      const drafts: Record<string, { price: string; original: string }> = {};
      rows.forEach((pkg) => {
        drafts[pkg.id] = {
          price: String(pkg.price ?? 0),
          original: pkg.original_price != null ? String(pkg.original_price) : '',
        };
      });
      setPackageDrafts(drafts);
    } catch (error) {
      console.error('Package load failed:', error);
      setPackages([]);
      setPackageDrafts({});
      alert(t.packagePricesSaveError);
      setEditingPackages(false);
    } finally {
      setPackagesLoading(false);
    }
  };

  const cancelPackagePriceEdit = () => {
    setEditingPackages(false);
    setPackages([]);
    setPackageDrafts({});
  };

  const savePackagePriceEdit = async () => {
    try {
      setSavingPackages(true);
      const updates = packages.map((pkg) => {
        const draft = packageDrafts[pkg.id] || { price: '0', original: '' };
        const nextPrice = draft.price === '' ? 0 : Number(draft.price);
        const nextOriginal = draft.original === '' ? null : Number(draft.original);
        if (Number.isNaN(nextPrice) || (nextOriginal !== null && Number.isNaN(nextOriginal))) {
          throw new Error(t.packagePricesSaveError);
        }
        return { id: pkg.id, price: nextPrice, original: nextOriginal };
      });

      await Promise.all(
        updates.map((u) => updateCourseTierPrices(u.id, u.price, u.original))
      );

      setEditingPackages(false);
    } catch (error) {
      console.error('Package price update failed:', error);
      alert(t.packagePricesSaveError);
    } finally {
      setSavingPackages(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Course Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
        {course.thumbnail_url ? (
          <Image 
            src={course.thumbnail_url} 
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <CourseTypeIcon type={course.course_type} />
          </div>
        )}
        
        {/* Course Type Badge */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center px-2 py-1 bg-white/90 dark:bg-black/90 rounded-full text-xs font-medium">
            <CourseTypeIcon type={course.course_type} />
            <span className="ml-1">{t.courseTypes[course.course_type]}</span>
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            course.is_active 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {course.is_active ? t.courseStatus.active : t.courseStatus.inactive}
          </div>
        </div>
        
        {/* Action Menu */}
        <div className="absolute bottom-3 right-3 menu-container">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-white/90 dark:bg-black/90 rounded-full hover:bg-white dark:hover:bg-black transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-lg z-10">
              <Link
                href={`/${locale}/lms/courses/${course.slug}`}
                className="w-full px-3 py-2 text-left text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md flex items-center text-sm"
                onClick={() => setShowMenu(false)}
              >
                <Eye className="w-3 h-3 mr-2" />
                {t.viewCourse}
              </Link>
              <button
                onClick={() => {
                  onEdit(course);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md flex items-center text-sm"
              >
                <Edit2 className="w-3 h-3 mr-2" />
                {t.editCourse}
              </button>
              <button
                onClick={startPriceEdit}
                className="w-full px-3 py-2 text-left text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md flex items-center text-sm"
              >
                <Tag className="w-3 h-3 mr-2" />
                {t.editPrice}
              </button>
              <button
                onClick={() => {
                  void startPackagePriceEdit();
                }}
                className="w-full px-3 py-2 text-left text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-md flex items-center text-sm"
              >
                <Layers className="w-3 h-3 mr-2" />
                {t.editPackagePrices}
              </button>
              <button
                onClick={() => {
                  onDelete(course);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center text-sm"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                {t.deleteCourse}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Course Content */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-1">
            {course.title}
          </h3>
          {course.instructor_name && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {course.instructor_name}
            </p>
          )}
        </div>
        
        {course.description && (
          <div 
            className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3 prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*]:mb-1 [&>*:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: sanitizeHtmlForCard(course.description) }}
          />
        )}
        
        {/* Course Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-3">
          {course.duration && (
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {course.duration}
            </div>
          )}
          {course.current_participants !== undefined && course.max_participants && (
            <div className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {course.current_participants}/{course.max_participants}
            </div>
          )}
          {course.level && (
            <div className="flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {course.level}
            </div>
          )}
          {course.session_count && (
            <div className="flex items-center">
              <PlayCircle className="w-3 h-3 mr-1" />
              {course.session_count} oturum
            </div>
          )}
        </div>
        
        {/* Price and Registration */}
        <div className="flex items-start justify-between gap-2">
          {editingPrice ? (
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">{t.courseDetails.price}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceDraft}
                    onChange={(e) => setPriceDraft(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-500 mb-1">{t.originalPriceShort}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={originalPriceDraft}
                    onChange={(e) => setOriginalPriceDraft(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900"
                    placeholder="—"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={savePriceEdit}
                  disabled={savingPrice}
                  className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-[#990000] text-white disabled:opacity-50"
                >
                  <Check className="w-3 h-3 mr-1" />
                  {savingPrice ? '...' : t.savePrice}
                </button>
                <button
                  type="button"
                  onClick={cancelPriceEdit}
                  disabled={savingPrice}
                  className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200"
                >
                  <X className="w-3 h-3 mr-1" />
                  {t.cancelPrice}
                </button>
              </div>
            </div>
          ) : editingPackages ? (
            <div className="flex-1 space-y-3">
              {packagesLoading ? (
                <p className="text-xs text-neutral-500">{t.packagesLoading}</p>
              ) : packages.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-neutral-500">{t.noPackages}</p>
                  <button
                    type="button"
                    onClick={cancelPackagePriceEdit}
                    className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200"
                  >
                    <X className="w-3 h-3 mr-1" />
                    {t.cancelPrice}
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {packages.map((pkg) => {
                      const draft = packageDrafts[pkg.id] || { price: '0', original: '' };
                      return (
                        <div
                          key={pkg.id}
                          className="rounded-md border border-neutral-200 dark:border-neutral-700 p-2 space-y-2"
                        >
                          <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2">
                            {pkg.title}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] text-neutral-500 mb-1">
                                {t.courseDetails.price}
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft.price}
                                onChange={(e) =>
                                  setPackageDrafts((prev) => ({
                                    ...prev,
                                    [pkg.id]: { ...draft, price: e.target.value },
                                  }))
                                }
                                className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-neutral-500 mb-1">
                                {t.originalPriceShort}
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft.original}
                                onChange={(e) =>
                                  setPackageDrafts((prev) => ({
                                    ...prev,
                                    [pkg.id]: { ...draft, original: e.target.value },
                                  }))
                                }
                                className="w-full px-2 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900"
                                placeholder="—"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        void savePackagePriceEdit();
                      }}
                      disabled={savingPackages}
                      className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-[#990000] text-white disabled:opacity-50"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      {savingPackages ? '...' : t.savePrice}
                    </button>
                    <button
                      type="button"
                      onClick={cancelPackagePriceEdit}
                      disabled={savingPackages}
                      className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200"
                    >
                      <X className="w-3 h-3 mr-1" />
                      {t.cancelPrice}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div>
              {course.price ? (
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                    {formatPrice(course.price, locale)}
                  </span>
                  {course.original_price && course.original_price > course.price && (
                    <span className="text-sm text-neutral-500 dark:text-neutral-400 line-through">
                      {formatPrice(course.original_price, locale)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                  {t.free}
                </span>
              )}
              <div className="mt-1 flex flex-col items-start gap-0.5">
                <button
                  type="button"
                  onClick={startPriceEdit}
                  className="text-xs text-[#990000] hover:underline"
                >
                  {t.editPrice}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void startPackagePriceEdit();
                  }}
                  className="text-xs text-[#990000] hover:underline"
                >
                  {t.editPackagePrices}
                </button>
              </div>
            </div>
          )}
          
          {course.course_type === 'live' && !editingPrice && !editingPackages && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              course.is_registration_open 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {course.is_registration_open ? t.courseStatus.registrationOpen : t.courseStatus.registrationClosed}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // If few pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      // Show dots if not close to first page
      if (currentPage > 3) {
        pageNumbers.push('...');
      }
      
      // Show current page and surrounding pages
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Show dots if not close to last page
      if (currentPage < totalPages - 2) {
        pageNumbers.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  return (
    <div className="flex justify-center items-center mt-8 mb-4">
      <div className="flex space-x-1">
        {/* Previous page button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-md ${
            currentPage === 1
              ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          aria-label="Previous page"
        >
          <span className="sr-only">Previous Page</span>
          &laquo;
        </button>
        
        {/* Page numbers */}
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' ? onPageChange(page) : null}
            disabled={page === '...'}
            className={`px-3 py-1 rounded-md ${
              page === currentPage
                ? 'bg-[#990000] text-white'
                : page === '...'
                ? 'text-neutral-400 dark:text-neutral-600 cursor-default'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}
        
        {/* Next page button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className={`px-3 py-2 rounded-md ${
            currentPage === totalPages || totalPages === 0
              ? 'text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
          aria-label="Next page"
        >
          <span className="sr-only">Next Page</span>
          &raquo;
        </button>
      </div>
    </div>
  );
};

// Main Component
export default function LMSPage({ searchParams }: { searchParams?: Promise<{ type?: string }> }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 4 columns x 3 rows grid
  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Clerk user hook
  const { user: clerkUser, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Handle search params
  useEffect(() => {
    const handleSearchParams = async () => {
      if (searchParams) {
        try {
          const resolvedParams = await searchParams;
          if (resolvedParams?.type && resolvedParams.type !== selectedType) {
            setSelectedType(resolvedParams.type);
          }
        } catch (error) {
          console.error('Error resolving search params:', error);
        }
      }
    };
    
    handleSearchParams();
  }, [searchParams, selectedType]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedLevel, selectedStatus, viewMode, sortBy]);

  // Fetch courses data
  useEffect(() => {
    const fetchCourses = async () => {
      if (!clerkUser?.id || !isLoaded) {
        if (isLoaded && !clerkUser) {
          setCoursesLoading(false);
        }
        return;
      }

      try {
        setCoursesLoading(true);
        
        // Fetch courses with sections and lessons count
        const { data: coursesData, error: coursesError } = await supabase
          .from('myuni_courses')
          .select(`
            *,
            myuni_course_sections(
              id,
              myuni_course_lessons(
                id,
                myuni_videos(
                  id,
                  duration_seconds
                )
              )
            )
          `)
          .order('created_at', { ascending: false });
        
        if (coursesError) {
          throw coursesError;
        }
        
        // Process courses data to add computed fields
        const processedCourses = (coursesData || []).map(course => {
          const sections = course.myuni_course_sections || [];
          const sectionsCount = sections.length;
          
          let lessonsCount = 0;
          let totalVideos = 0;
          let totalDuration = 0;
          
          sections.forEach((section: { myuni_course_lessons?: Array<{ myuni_videos?: Array<{ duration_seconds?: number }> }> }) => {
            const lessons = section.myuni_course_lessons || [];
            lessonsCount += lessons.length;
            
            lessons.forEach((lesson: { myuni_videos?: Array<{ duration_seconds?: number }> }) => {
              const videos = lesson.myuni_videos || [];
              totalVideos += videos.length;
              
              videos.forEach((video: { duration_seconds?: number }) => {
                if (video.duration_seconds) {
                  totalDuration += video.duration_seconds;
                }
              });
            });
          });
          
          return {
            ...course,
            sections_count: sectionsCount,
            lessons_count: lessonsCount,
            total_videos: totalVideos,
            total_duration: Math.round(totalDuration / 60), // Convert to minutes
            // Remove the nested data to clean up the object
            myuni_course_sections: undefined
          };
        });
        
        setCourses(processedCourses);
        
      } catch (error: unknown) {
        console.error('Error fetching courses:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setCoursesLoading(false);
      }
    };
    
    fetchCourses();
  }, [clerkUser?.id, isLoaded]);

  // Filter data based on search and filters
  const getFilteredData = () => {
    let filtered = courses;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(course => course.course_type === selectedType);
    }
    
    // Apply level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'active') {
        filtered = filtered.filter(course => course.is_active);
      } else if (selectedStatus === 'inactive') {
        filtered = filtered.filter(course => !course.is_active);
      }
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name-asc':
          return a.title.localeCompare(b.title, 'tr', { sensitivity: 'base' });
        case 'name-desc':
          return b.title.localeCompare(a.title, 'tr', { sensitivity: 'base' });
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    return filtered;
  };

  // Get unique levels
  const getUniqueLevels = () => {
    const levels = courses
      .map(course => course.level)
      .filter((level, index, array) => level && array.indexOf(level) === index)
      .filter(Boolean);
    return levels;
  };

  // Get paginated data
  const getPaginatedData = () => {
    const filteredData = getFilteredData();
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    // If current page is out of range, adjust it
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
    
    // Get the current page of data
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: filteredData.slice(startIndex, endIndex),
      totalItems: filteredData.length,
      totalPages
    };
  };

  // Handle edit course
  const handleEditCourse = (course: Course) => {
    router.push(`/${locale}/lms/edit/${course.id}`);
  };

  // Handle delete course
  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  // Confirm delete course
  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('myuni_courses')
        .delete()
        .eq('id', courseToDelete.id);
      
      if (error) {
        throw error;
      }
      
      // Remove course from local state
      setCourses(prev => prev.filter(course => course.id !== courseToDelete.id));
      
      // Close modal
      setShowDeleteModal(false);
      setCourseToDelete(null);
      
      // Show success message (you can implement a toast notification system)
      alert(t.deleteSuccess);
      
    } catch (error: unknown) {
      console.error('Error deleting course:', error);
      alert(t.deleteError + ': ' + (error instanceof Error ? error.message : 'An error occurred'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setCourseToDelete(null);
    }
  };

  const handlePriceUpdate = async (
    courseId: string,
    price: number | null,
    originalPrice: number | null
  ) => {
    await updateCoursePrices(courseId, price, originalPrice);
    setCourses((prev) =>
      prev.map((course) =>
        course.id === courseId
          ? {
              ...course,
              price: price ?? 0,
              original_price: originalPrice ?? undefined,
            }
          : course
      )
    );
  };

  // Auth check
  if (!isLoaded) {
    return null;
  }

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
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12 overflow-x-hidden">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-20 2xl:px-24 w-full break-words">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const { data: paginatedData, totalPages, totalItems } = getPaginatedData();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12 overflow-x-hidden">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-20 2xl:px-24 w-full break-words">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {t.title}
              </h1>
              <div className="w-8 h-px bg-[#990000] mt-2"></div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/${locale}/students`}
                className="flex items-center px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 text-sm font-medium rounded-md transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <Users className="w-4 h-4 mr-1" />
                {locale === 'tr' ? 'Öğrenci Yönetimi' : 'Students'}
              </Link>
              <Link 
                href={`/${locale}/lms/create`} 
                className="flex items-center px-3 py-1.5 bg-[#990000] hover:bg-[#880000] text-white text-sm font-medium rounded-md transition-colors"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                {t.createNew}
              </Link>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
          />
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm px-3 py-1.5 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
            >
              <option value="all">{t.filters.all}</option>
              <option value="online">{t.courseTypes.online}</option>
              <option value="live">{t.courseTypes.live}</option>
              <option value="hybrid">{t.courseTypes.hybrid}</option>
            </select>
            
            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm px-3 py-1.5 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
            >
              <option value="all">Tüm Seviyeler</option>
              {getUniqueLevels().map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm px-3 py-1.5 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">{t.courseStatus.active}</option>
              <option value="inactive">{t.courseStatus.inactive}</option>
            </select>
            
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {totalItems} kurs
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm px-3 py-1.5 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
            >
              <option value="date-desc">{t.sorting.newest}</option>
              <option value="date-asc">{t.sorting.oldest}</option>
              <option value="name-asc">{t.sorting.nameAsc}</option>
              <option value="name-desc">{t.sorting.nameDesc}</option>
              <option value="price-asc">{t.sorting.priceAsc}</option>
              <option value="price-desc">{t.sorting.priceDesc}</option>
            </select>
            
            <div className="flex bg-neutral-100 dark:bg-neutral-700 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white dark:bg-neutral-600 shadow-sm' : 'hover:bg-neutral-200 dark:hover:bg-neutral-600'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white dark:bg-neutral-600 shadow-sm' : 'hover:bg-neutral-200 dark:hover:bg-neutral-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {coursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="h-48 bg-neutral-200 dark:bg-neutral-700"></div>
                <div className="p-4">
                  <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {t.emptyState.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {t.emptyState.subtitle}
            </p>
            <Link 
              href={`/${locale}/lms/create`} 
              className="inline-flex items-center px-4 py-2 bg-[#990000] hover:bg-[#880000] text-white text-sm font-medium rounded-md transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              {t.emptyState.buttonText}
            </Link>
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 text-center">
            <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Search className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              Sonuç bulunamadı
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-sm">
              Farklı arama kriterleri deneyin
            </p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
                setSelectedLevel('all');
                setSelectedStatus('all');
                setSortBy('date-desc');
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-sm font-medium rounded-md transition-colors"
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          // Course cards with pagination
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedData.map((course: Course) => (
                <CourseCard 
                  key={course.id}
                  course={course}
                  locale={locale}
                  t={t}
                  onEdit={handleEditCourse}
                  onDelete={handleDeleteCourse}
                  onPriceUpdate={handlePriceUpdate}
                />
              ))}
            </div>
            
            {/* Pagination component */}
            {totalPages > 1 && (
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            )}
            
            {/* Results count */}
            <div className="text-center mt-3 text-xs text-neutral-500 dark:text-neutral-400">
              {totalItems} kurs • {currentPage}/{totalPages} sayfa
            </div>
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteCourse}
        course={courseToDelete}
        isDeleting={isDeleting}
        t={t}
      />
    </div>
  );
}