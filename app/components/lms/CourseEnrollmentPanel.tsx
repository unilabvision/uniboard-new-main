'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Search,
  Users,
} from 'lucide-react';
import {
  getEnrollmentOverview,
  type CourseEnrollmentDetail,
  type PersonEnrollmentOverview,
} from '@/app/lib/lms/enrollmentOverviewService';

const texts = {
  tr: {
    title: 'Katılımcılar ve Kurs Kayıtları',
    subtitle: 'Hangi öğrencinin hangi kursa / pakete kayıtlı olduğunu görün',
    searchPlaceholder: 'Kişi, e-posta, kurs veya paket ara...',
    loading: 'Yükleniyor...',
    error: 'Katılımcı verileri yüklenirken bir hata oluştu',
    empty: 'Henüz kayıtlı katılımcı bulunmuyor',
    courses: 'kurs',
    modules: 'modül',
    packages: 'paket',
    purchasedPackages: 'Satın alınan paketler',
    fullAccess: 'Tam eğitim erişimi',
    packageAccess: 'Paket erişimi',
    paymentInfo: 'Ödeme bilgisi',
    amountPaid: 'Ödenen tutar',
    discountCode: 'İndirim kodu',
    discountAmount: 'İndirim tutarı',
    noPayment: 'Ödeme kaydı bulunamadı',
    noDiscount: 'İndirim kullanılmadı',
    email: 'E-posta',
    completed: 'Tamamlandı',
    incomplete: 'Devam ediyor',
    notStarted: 'Başlanmamış',
    enrolledAt: 'Kayıt',
    viewCourse: 'Kursa git',
    noModules: 'Bu paket için eşleşen modül yok',
    peopleCount: 'kişi',
  },
  en: {
    title: 'Participants & Course Enrollments',
    subtitle: 'See which student is enrolled in which course / package',
    searchPlaceholder: 'Search person, email, course or package...',
    loading: 'Loading...',
    error: 'An error occurred while loading participant data',
    empty: 'No enrolled participants yet',
    courses: 'courses',
    modules: 'modules',
    packages: 'packages',
    purchasedPackages: 'Purchased packages',
    fullAccess: 'Full course access',
    packageAccess: 'Package access',
    paymentInfo: 'Payment info',
    amountPaid: 'Amount paid',
    discountCode: 'Discount code',
    discountAmount: 'Discount amount',
    noPayment: 'No payment record found',
    noDiscount: 'No discount used',
    email: 'Email',
    completed: 'Completed',
    incomplete: 'In progress',
    notStarted: 'Not started',
    enrolledAt: 'Enrolled',
    viewCourse: 'Open course',
    noModules: 'No modules matched this package',
    peopleCount: 'people',
  },
};

function formatDate(dateString: string | null, locale: string) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatMoney(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount || 0);
}

function ModuleList({
  course,
  locale,
  t,
}: {
  course: CourseEnrollmentDetail;
  locale: string;
  t: typeof texts.tr;
}) {
  if (course.modules.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.noModules}</p>;
  }

  return (
    <ul className="space-y-2">
      {course.modules.map((module) => (
        <li
          key={module.lesson_id}
          className="flex items-start justify-between gap-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/40 px-3 py-2"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {module.is_completed ? (
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {module.lesson_title}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 ml-6">
              {module.section_title}
              {module.lesson_type ? ` · ${module.lesson_type}` : ''}
              {module.entitled_by && module.entitled_by.length > 0
                ? ` · ${module.entitled_by.join(', ')}`
                : ''}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span
              className={`text-xs font-medium ${
                module.is_completed
                  ? 'text-green-600 dark:text-green-400'
                  : module.watch_time_seconds > 0 || module.quiz_score !== null
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {module.is_completed
                ? t.completed
                : module.watch_time_seconds > 0 || module.quiz_score !== null
                  ? t.incomplete
                  : t.notStarted}
            </span>
            {module.last_activity && (
              <div className="text-[11px] text-neutral-400 mt-0.5">
                {formatDate(module.last_activity, locale)}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function CourseBlock({
  course,
  locale,
  t,
  defaultOpen = false,
}: {
  course: CourseEnrollmentDetail;
  locale: string;
  t: typeof texts.tr;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left"
      >
        <div className="min-w-0 flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
          )}
          <BookOpen className="w-4 h-4 text-[#990000] shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {course.course_title}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {course.has_full_access ? t.fullAccess : t.packageAccess}
              {' · '}
              {course.purchased_packages.length} {t.packages}
              {' · '}
              {course.completed_modules}/{course.total_modules} {t.modules}
              {' · '}%{course.progress_percentage}
              {course.enrolled_at ? ` · ${t.enrolledAt}: ${formatDate(course.enrolled_at, locale)}` : ''}
            </div>
          </div>
        </div>
        <Link
          href={`/${locale}/lms/courses/${course.course_slug}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
        >
          {t.viewCourse}
        </Link>
      </button>
      {open && (
        <div className="p-3 bg-white dark:bg-neutral-900/30 space-y-3">
          {course.purchased_packages.length > 0 && (
            <div>
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                {t.purchasedPackages}
              </div>
              <div className="flex flex-wrap gap-2">
                {course.purchased_packages.map((pkg) => (
                  <span
                    key={`${pkg.tier_id || 'full'}-${pkg.title}`}
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                      pkg.is_full_course
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}
                  >
                    {pkg.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 p-3">
            <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
              {t.paymentInfo}
            </div>
            {course.payments.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.noPayment}</p>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">{t.amountPaid}: </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatMoney(course.total_paid, locale)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">{t.discountCode}: </span>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {course.discount_codes.length > 0
                        ? course.discount_codes.join(', ')
                        : t.noDiscount}
                    </span>
                  </div>
                  {course.total_discount > 0 && (
                    <div>
                      <span className="text-neutral-500 dark:text-neutral-400">{t.discountAmount}: </span>
                      <span className="font-medium text-green-700 dark:text-green-400">
                        -{formatMoney(course.total_discount, locale)}
                      </span>
                    </div>
                  )}
                </div>
                {course.payments.length > 1 && (
                  <ul className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                    {course.payments.map((payment) => (
                      <li key={`${payment.order_id}-${payment.tier_id || 'course'}`}>
                        {formatMoney(payment.amount, locale)}
                        {payment.discount_code ? ` · ${payment.discount_code}` : ''}
                        {payment.paid_at ? ` · ${formatDate(payment.paid_at, locale)}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <ModuleList course={course} locale={locale} t={t} />
        </div>
      )}
    </div>
  );
}

export default function CourseEnrollmentPanel({
  locale = 'tr',
  courseId,
  showHeader = true,
}: {
  locale?: string;
  courseId?: string;
  showHeader?: boolean;
}) {
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const [people, setPeople] = useState<PersonEnrollmentOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEnrollmentOverview(courseId ? { courseId } : undefined);
      setPeople(data);
      if (courseId && data.length > 0) {
        setExpandedUsers(new Set(data.map((p) => p.user_id)));
      }
    } catch (err) {
      console.error('Enrollment overview error:', err);
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  }, [courseId, t.error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPeople = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (person) =>
        person.user_name.toLowerCase().includes(q) ||
        person.user_email.toLowerCase().includes(q) ||
        person.courses.some(
          (c) =>
            c.course_title.toLowerCase().includes(q) ||
            c.purchased_packages.some((pkg) => pkg.title.toLowerCase().includes(q))
        )
    );
  }, [people, searchQuery]);

  const toggleUser = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t.title}</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{t.subtitle}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
          />
        </div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
          <Users className="w-4 h-4" />
          {filteredPeople.length} {t.peopleCount}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-8 text-center text-neutral-500 dark:text-neutral-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>{t.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPeople.map((person) => {
            const expanded = expandedUsers.has(person.user_id);
            return (
              <div
                key={person.user_id}
                className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleUser(person.user_id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 text-left"
                >
                  {expanded ? (
                    <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 shrink-0">
                    {person.user_image ? (
                      <Image src={person.user_image} alt={person.user_name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-medium text-neutral-600 dark:text-neutral-300">
                        {person.user_name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {person.user_name}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-300 truncate">
                      {t.email}: {person.user_email || '-'}
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
                    {person.courses.length} {t.courses}
                  </div>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 space-y-2 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                    {person.courses.map((course) => (
                      <CourseBlock
                        key={`${person.user_id}-${course.course_id}`}
                        course={course}
                        locale={locale}
                        t={t}
                        defaultOpen={Boolean(courseId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
