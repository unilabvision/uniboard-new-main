'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart3,
  Users,
  ShoppingCart,
  BookOpen,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Download,
  AlertCircle,
  GraduationCap,
  CheckCircle,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient({
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL2 ||
    'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg',
});

type PeriodKey =
  | 'last7Days'
  | 'last30Days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'all';

type TrendMetric = 'revenue' | 'orders' | 'enrollments' | 'students';

interface OrderRow {
  id: string;
  courseid: string;
  coursename: string;
  amount: number;
  discountamount?: number | null;
  status: string;
  created_at: string;
  useremail: string;
}

interface EnrollmentRow {
  course_id: string;
  user_id: string;
  enrolled_at: string | null;
  progress_percentage: number | null;
}

interface CourseRow {
  id: string;
  title: string;
  is_active: boolean | null;
}

interface DailyPoint {
  date: string;
  revenue: number;
  orders: number;
  enrollments: number;
  students: number;
}

interface CourseStat {
  course_id: string;
  course_name: string;
  enrollments: number;
  unique_students: number;
  revenue: number;
  orders: number;
  avg_progress: number;
  completed: number;
}

interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  uniqueStudents: number;
  totalEnrollments: number;
  activeCourses: number;
  completedEnrollments: number;
  averageOrderValue: number;
  averageProgress: number;
}

const texts = {
  tr: {
    title: 'Analitik Raporları',
    subtitle: 'Sistem genelinde eğitim satışları, kayıtlar ve katılım metrikleri',
    periods: {
      last7Days: 'Son 7 Gün',
      last30Days: 'Son 30 Gün',
      thisMonth: 'Bu Ay',
      lastMonth: 'Geçen Ay',
      thisYear: 'Bu Yıl',
      all: 'Tümü',
    },
    metrics: {
      totalRevenue: 'Toplam Satış',
      totalOrders: 'Toplam Sipariş',
      uniqueStudents: 'Benzersiz Öğrenci',
      totalEnrollments: 'Toplam Kayıt',
      activeCourses: 'Aktif Kurs',
      completedEnrollments: 'Tamamlanan Kayıt',
      averageOrderValue: 'Ort. Sipariş Tutarı',
      averageProgress: 'Ort. İlerleme',
    },
    charts: {
      trend: 'Zaman İçinde Trend',
      topCoursesEnrollments: 'En Çok Kayıt Alan Kurslar',
      topCoursesRevenue: 'En Çok Gelir Getiren Kurslar',
    },
    trendMetrics: {
      revenue: 'Gelir',
      orders: 'Sipariş',
      enrollments: 'Kayıt',
      students: 'Yeni Öğrenci',
    },
    table: {
      course: 'Kurs',
      enrollments: 'Kayıt',
      students: 'Öğrenci',
      revenue: 'Gelir',
      orders: 'Sipariş',
      avgProgress: 'Ort. İlerleme',
      completed: 'Tamamlayan',
    },
    actions: { refresh: 'Yenile', export: 'Raporu İndir' },
    empty: 'Seçilen dönem için veri bulunamadı.',
    loading: 'Veriler yükleniyor...',
    error: 'Veriler yüklenirken hata oluştu.',
    salesSection: 'Satış Özeti',
    enrollmentsSection: 'Eğitim Katılımı',
    trendsSection: 'Trend Analizi',
  },
  en: {
    title: 'Analytics Reports',
    subtitle: 'System-wide training sales, enrollments and participation metrics',
    periods: {
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      thisYear: 'This Year',
      all: 'All Time',
    },
    metrics: {
      totalRevenue: 'Total Revenue',
      totalOrders: 'Total Orders',
      uniqueStudents: 'Unique Students',
      totalEnrollments: 'Total Enrollments',
      activeCourses: 'Active Courses',
      completedEnrollments: 'Completed Enrollments',
      averageOrderValue: 'Avg. Order Value',
      averageProgress: 'Avg. Progress',
    },
    charts: {
      trend: 'Trend Over Time',
      topCoursesEnrollments: 'Top Courses by Enrollments',
      topCoursesRevenue: 'Top Courses by Revenue',
    },
    trendMetrics: {
      revenue: 'Revenue',
      orders: 'Orders',
      enrollments: 'Enrollments',
      students: 'New Students',
    },
    table: {
      course: 'Course',
      enrollments: 'Enrollments',
      students: 'Students',
      revenue: 'Revenue',
      orders: 'Orders',
      avgProgress: 'Avg. Progress',
      completed: 'Completed',
    },
    actions: { refresh: 'Refresh', export: 'Export Report' },
    empty: 'No data found for the selected period.',
    loading: 'Loading data...',
    error: 'An error occurred while loading data.',
    salesSection: 'Sales Summary',
    enrollmentsSection: 'Training Participation',
    trendsSection: 'Trend Analysis',
  },
};

function formatCurrency(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPeriodStart(period: PeriodKey): Date | null {
  const now = new Date();
  if (period === 'all') return null;
  if (period === 'last7Days') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  }
  if (period === 'last30Days') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  }
  if (period === 'thisMonth') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === 'lastMonth') {
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
  return new Date(now.getFullYear(), 0, 1);
}

function getPeriodEnd(period: PeriodKey): Date | null {
  const now = new Date();
  if (period === 'lastMonth') {
    return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  }
  return null;
}

function isInPeriod(
  dateString: string | null | undefined,
  period: PeriodKey
): boolean {
  if (!dateString) return period === 'all';
  const date = new Date(dateString);
  const start = getPeriodStart(period);
  const end = getPeriodEnd(period);
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function dateKey(dateString: string) {
  return dateString.slice(0, 10);
}

function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
}) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{title}</p>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-[#990000]/10">
          <Icon className="w-5 h-5 text-[#990000]" />
        </div>
      </div>
    </div>
  );
}

function TrendChart({
  data,
  activeMetric,
  onMetricChange,
  locale,
  labels,
}: {
  data: DailyPoint[];
  activeMetric: TrendMetric;
  onMetricChange: (metric: TrendMetric) => void;
  locale: string;
  labels: Record<TrendMetric, string>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const values = data.map((d) => d[activeMetric]);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    const points = values.map((value, index) => ({
      x: padding + (chartWidth / Math.max(values.length - 1, 1)) * index,
      y: padding + chartHeight - ((value - min) / range) * chartHeight,
    }));

    const color = '#990000';

    if (points.length > 1) {
      ctx.fillStyle = `${color}20`;
      ctx.beginPath();
      ctx.moveTo(points[0].x, height - padding);
      points.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.lineTo(points[points.length - 1].x, height - padding);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    }

    ctx.fillStyle = color;
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [data, activeMetric]);

  const metrics: TrendMetric[] = ['revenue', 'orders', 'enrollments', 'students'];

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {metrics.map((metric) => (
          <button
            key={metric}
            type="button"
            onClick={() => onMetricChange(metric)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              activeMetric === metric
                ? 'bg-[#990000] text-white'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {labels[metric]}
          </button>
        ))}
      </div>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-neutral-500">
          {locale === 'tr' ? 'Grafik verisi yok' : 'No chart data'}
        </div>
      ) : (
        <canvas ref={canvasRef} className="w-full h-64" />
      )}
    </div>
  );
}

function HorizontalBars({
  items,
  valueKey,
  formatValue,
}: {
  items: CourseStat[];
  valueKey: 'enrollments' | 'revenue';
  formatValue: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => item[valueKey]), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.course_id}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-800 dark:text-neutral-200 truncate pr-4">
              {item.course_name}
            </span>
            <span className="text-neutral-600 dark:text-neutral-400 shrink-0">
              {formatValue(item[valueKey])}
            </span>
          </div>
          <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#990000] rounded-full transition-all duration-500"
              style={{ width: `${(item[valueKey] / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('last30Days');
  const [activeTrendMetric, setActiveTrendMetric] = useState<TrendMetric>('enrollments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    uniqueStudents: 0,
    totalEnrollments: 0,
    activeCourses: 0,
    completedEnrollments: 0,
    averageOrderValue: 0,
    averageProgress: 0,
  });
  const [dailyData, setDailyData] = useState<DailyPoint[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStat[]>([]);

  const { isLoaded } = useUser();
  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    params.then((resolved) => setLocale(resolved.locale || 'tr'));
  }, [params]);

  const processData = useCallback(
    (
      orders: OrderRow[],
      enrollments: EnrollmentRow[],
      courses: CourseRow[],
      period: PeriodKey
    ) => {
      const courseTitleMap = new Map(
        courses.map((course) => [course.id, course.title])
      );

      const filteredOrders = orders.filter((order) =>
        isInPeriod(order.created_at, period)
      );
      const filteredEnrollments = enrollments.filter((enrollment) =>
        isInPeriod(enrollment.enrolled_at, period)
      );

      const uniqueStudentIds = new Set(
        filteredEnrollments.map((enrollment) => enrollment.user_id)
      );
      const totalRevenue = filteredOrders.reduce(
        (sum, order) => sum + (order.amount - (order.discountamount || 0)),
        0
      );
      const completedEnrollments = filteredEnrollments.filter(
        (enrollment) => (enrollment.progress_percentage || 0) >= 100
      ).length;
      const averageProgress =
        filteredEnrollments.length > 0
          ? filteredEnrollments.reduce(
              (sum, enrollment) => sum + (enrollment.progress_percentage || 0),
              0
            ) / filteredEnrollments.length
          : 0;

      setMetrics({
        totalRevenue,
        totalOrders: filteredOrders.length,
        uniqueStudents: uniqueStudentIds.size,
        totalEnrollments: filteredEnrollments.length,
        activeCourses: courses.filter((course) => course.is_active !== false).length,
        completedEnrollments,
        averageOrderValue:
          filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
        averageProgress,
      });

      const dailyMap = new Map<string, DailyPoint>();
      const ensureDay = (key: string) => {
        if (!dailyMap.has(key)) {
          dailyMap.set(key, {
            date: key,
            revenue: 0,
            orders: 0,
            enrollments: 0,
            students: 0,
          });
        }
        return dailyMap.get(key)!;
      };

      const studentsByDay = new Map<string, Set<string>>();

      filteredOrders.forEach((order) => {
        const key = dateKey(order.created_at);
        const day = ensureDay(key);
        day.revenue += order.amount - (order.discountamount || 0);
        day.orders += 1;
      });

      filteredEnrollments.forEach((enrollment) => {
        if (!enrollment.enrolled_at) return;
        const key = dateKey(enrollment.enrolled_at);
        const day = ensureDay(key);
        day.enrollments += 1;
        if (!studentsByDay.has(key)) studentsByDay.set(key, new Set());
        studentsByDay.get(key)!.add(enrollment.user_id);
      });

      studentsByDay.forEach((students, key) => {
        const day = ensureDay(key);
        day.students = students.size;
      });

      setDailyData(
        Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
      );

      const statsMap = new Map<string, CourseStat>();

      filteredEnrollments.forEach((enrollment) => {
        const existing = statsMap.get(enrollment.course_id) || {
          course_id: enrollment.course_id,
          course_name:
            courseTitleMap.get(enrollment.course_id) ||
            `Kurs ${enrollment.course_id.slice(0, 8)}`,
          enrollments: 0,
          unique_students: 0,
          revenue: 0,
          orders: 0,
          avg_progress: 0,
          completed: 0,
        };
        existing.enrollments += 1;
        statsMap.set(enrollment.course_id, existing);
      });

      const studentsPerCourse = new Map<string, Set<string>>();
      const progressPerCourse = new Map<string, number[]>();

      filteredEnrollments.forEach((enrollment) => {
        if (!studentsPerCourse.has(enrollment.course_id)) {
          studentsPerCourse.set(enrollment.course_id, new Set());
        }
        studentsPerCourse.get(enrollment.course_id)!.add(enrollment.user_id);

        if (!progressPerCourse.has(enrollment.course_id)) {
          progressPerCourse.set(enrollment.course_id, []);
        }
        progressPerCourse
          .get(enrollment.course_id)!
          .push(enrollment.progress_percentage || 0);

        const stat = statsMap.get(enrollment.course_id);
        if (stat && (enrollment.progress_percentage || 0) >= 100) {
          stat.completed += 1;
        }
      });

      filteredOrders.forEach((order) => {
        const stat = statsMap.get(order.courseid) || {
          course_id: order.courseid,
          course_name:
            order.coursename ||
            courseTitleMap.get(order.courseid) ||
            `Kurs ${order.courseid.slice(0, 8)}`,
          enrollments: 0,
          unique_students: 0,
          revenue: 0,
          orders: 0,
          avg_progress: 0,
          completed: 0,
        };
        stat.revenue += order.amount - (order.discountamount || 0);
        stat.orders += 1;
        statsMap.set(order.courseid, stat);
      });

      statsMap.forEach((stat, courseId) => {
        stat.unique_students = studentsPerCourse.get(courseId)?.size || 0;
        const progresses = progressPerCourse.get(courseId) || [];
        stat.avg_progress =
          progresses.length > 0
            ? progresses.reduce((sum, value) => sum + value, 0) / progresses.length
            : 0;
      });

      setCourseStats(
        Array.from(statsMap.values()).sort((a, b) => b.enrollments - a.enrollments)
      );
    },
    []
  );

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [ordersResult, enrollmentsResult, coursesResult] = await Promise.all([
        supabase
          .from('orders')
          .select(
            'id, courseid, coursename, amount, discountamount, status, created_at, useremail'
          )
          .eq('enrolled', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('myuni_enrollments')
          .select('course_id, user_id, enrolled_at, progress_percentage')
          .eq('is_active', true),
        supabase.from('myuni_courses').select('id, title, is_active'),
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (enrollmentsResult.error) throw enrollmentsResult.error;
      if (coursesResult.error) throw coursesResult.error;

      processData(
        (ordersResult.data || []) as OrderRow[],
        (enrollmentsResult.data || []) as EnrollmentRow[],
        (coursesResult.data || []) as CourseRow[],
        selectedPeriod
      );
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  }, [processData, selectedPeriod, t.error]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchAnalytics();
  }, [isLoaded, fetchAnalytics]);

  const handleExport = () => {
    const lines = [
      `${t.title} - ${t.periods[selectedPeriod]}`,
      '',
      'METRIK,DEGER',
      `${t.metrics.totalRevenue},${metrics.totalRevenue}`,
      `${t.metrics.totalOrders},${metrics.totalOrders}`,
      `${t.metrics.uniqueStudents},${metrics.uniqueStudents}`,
      `${t.metrics.totalEnrollments},${metrics.totalEnrollments}`,
      '',
      `${t.table.course},${t.table.enrollments},${t.table.students},${t.table.revenue},${t.table.orders}`,
      ...courseStats.map(
        (course) =>
          `"${course.course_name}",${course.enrollments},${course.unique_students},${course.revenue},${course.orders}`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analitik-rapor-${Date.now()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const topByEnrollments = courseStats.slice(0, 6);
  const topByRevenue = [...courseStats]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#990000] mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {t.title}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">{t.subtitle}</p>
            <div className="w-12 h-1 bg-[#990000] mt-3" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(t.periods) as PeriodKey[]).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedPeriod === period
                    ? 'bg-[#990000] text-white'
                    : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {t.periods[period]}
              </button>
            ))}
            <button
              type="button"
              onClick={fetchAnalytics}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              {t.actions.refresh}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#990000] text-white text-sm"
            >
              <Download className="w-4 h-4" />
              {t.actions.export}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title={t.metrics.totalRevenue}
            value={formatCurrency(metrics.totalRevenue, locale)}
            icon={DollarSign}
          />
          <MetricCard
            title={t.metrics.totalOrders}
            value={metrics.totalOrders.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
            icon={ShoppingCart}
          />
          <MetricCard
            title={t.metrics.uniqueStudents}
            value={metrics.uniqueStudents.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
            icon={Users}
          />
          <MetricCard
            title={t.metrics.totalEnrollments}
            value={metrics.totalEnrollments.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
            icon={GraduationCap}
          />
          <MetricCard
            title={t.metrics.activeCourses}
            value={metrics.activeCourses.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
            icon={BookOpen}
          />
          <MetricCard
            title={t.metrics.completedEnrollments}
            value={metrics.completedEnrollments.toLocaleString(
              locale === 'tr' ? 'tr-TR' : 'en-US'
            )}
            icon={CheckCircle}
          />
          <MetricCard
            title={t.metrics.averageOrderValue}
            value={formatCurrency(metrics.averageOrderValue, locale)}
            icon={TrendingUp}
          />
          <MetricCard
            title={t.metrics.averageProgress}
            value={`${metrics.averageProgress.toFixed(1)}%`}
            icon={BarChart3}
          />
        </div>

        <section id="trends" className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t.trendsSection}
          </h2>
          <TrendChart
            data={dailyData}
            activeMetric={activeTrendMetric}
            onMetricChange={setActiveTrendMetric}
            locale={locale}
            labels={t.trendMetrics}
          />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <section
            id="enrollments"
            className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t.charts.topCoursesEnrollments}
            </h2>
            {topByEnrollments.length === 0 ? (
              <p className="text-neutral-500">{t.empty}</p>
            ) : (
              <HorizontalBars
                items={topByEnrollments}
                valueKey="enrollments"
                formatValue={(value) => value.toString()}
              />
            )}
          </section>

          <section
            id="sales"
            className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6"
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t.charts.topCoursesRevenue}
            </h2>
            {topByRevenue.length === 0 ? (
              <p className="text-neutral-500">{t.empty}</p>
            ) : (
              <HorizontalBars
                items={topByRevenue}
                valueKey="revenue"
                formatValue={(value) => formatCurrency(value, locale)}
              />
            )}
          </section>
        </div>

        <section className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t.enrollmentsSection}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">{t.table.course}</th>
                  <th className="text-right px-4 py-3 font-medium">{t.table.enrollments}</th>
                  <th className="text-right px-4 py-3 font-medium">{t.table.students}</th>
                  <th className="text-right px-4 py-3 font-medium">{t.table.revenue}</th>
                  <th className="text-right px-4 py-3 font-medium">{t.table.orders}</th>
                  <th className="text-right px-4 py-3 font-medium">{t.table.avgProgress}</th>
                  <th className="text-right px-6 py-3 font-medium">{t.table.completed}</th>
                </tr>
              </thead>
              <tbody>
                {courseStats.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                      {t.empty}
                    </td>
                  </tr>
                ) : (
                  courseStats.map((course) => (
                    <tr
                      key={course.course_id}
                      className="border-t border-neutral-100 dark:border-neutral-700"
                    >
                      <td className="px-6 py-3 text-neutral-900 dark:text-neutral-100">
                        {course.course_name}
                      </td>
                      <td className="px-4 py-3 text-right">{course.enrollments}</td>
                      <td className="px-4 py-3 text-right">{course.unique_students}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(course.revenue, locale)}
                      </td>
                      <td className="px-4 py-3 text-right">{course.orders}</td>
                      <td className="px-4 py-3 text-right">
                        {course.avg_progress.toFixed(1)}%
                      </td>
                      <td className="px-6 py-3 text-right">{course.completed}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
