"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, TrendingUp, Target, Award,
  Calendar, ArrowUpRight, BarChart3,
  Star, Users, DollarSign, Download, RefreshCw, AlertCircle
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Supabase clients
const supabaseMain = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg'
});

const supabaseProfiles = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 ,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 
});

// Types
type PeriodKey = 'last7Days' | 'last30Days' | 'thisMonth' | 'lastMonth' | 'thisYear';

interface SaleRecord {
  id: string;
  orderid: string;
  courseid: string;
  useremail: string;
  coursename: string;
  amount: number;
  status: string;
  created_at: string;
  discountcode?: string;
  discountamount?: number;
  commission_amount: number;
  commission_rate: number;
  net_amount: number;
  student_name: string;
}

interface PerformanceMetrics {
  totalSales: number;
  totalCommission: number;
  totalStudents: number;
  activeCourses: number;
  thisWeekSales: number;
  thisWeekCommission: number;
  thisMonthSales: number;
  thisMonthCommission: number;
  averageOrderValue: number;
  averageCommissionRate: number;
  completedSales: number;
  pendingSales: number;
}

interface DailyData {
  date: string;
  sales: number;
  commission: number;
  students: number;
  orders: number;
}

interface CoursePerformance {
  course_id: string;
  course_name: string;
  total_sales: number;
  total_commission: number;
  sales_count: number;
  student_count: number;
  average_commission: number;
  last_sale_date?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  commission_rate: number;
  userType?: string;
}

interface PerformancePageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Icon component type
type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

// Texts interface
interface LocalizedTexts {
  title: string;
  subtitle: string;
  periods: Record<PeriodKey, string>;
  metrics: {
    totalSales: string;
    totalCommission: string;
    totalStudents: string;
    activeCourses: string;
    averageOrderValue: string;
    averageCommissionRate: string;
    completedSales: string;
  };
  charts: {
    performanceTrend: string;
    topCourses: string;
  };
  insights: {
    title: string;
    bestCourse: string;
    improvementTip: string;
    nextGoal: string;
  };
  actions: {
    exportReport: string;
    refresh: string;
    viewAllSales: string;
  };
  empty: {
    title: string;
    subtitle: string;
    action: string;
  };
  loading: string;
  error: string;
}

// Dil metinleri
const texts: Record<string, LocalizedTexts> = {
  tr: {
    title: "Performans Analizi",
    subtitle: "Satış performansınızı ve komisyon metriklerinizi detaylı olarak analiz edin.",
    periods: {
      last7Days: "Son 7 Gün",
      last30Days: "Son 30 Gün",
      thisMonth: "Bu Ay",
      lastMonth: "Geçen Ay",
      thisYear: "Bu Yıl"
    },
    metrics: {
      totalSales: "Toplam Satış",
      totalCommission: "Toplam Komisyon",
      totalStudents: "Toplam Öğrenci",
      activeCourses: "Aktif Kurs",
      averageOrderValue: "Ortalama Sipariş Değeri",
      averageCommissionRate: "Ortalama Komisyon Oranı",
      completedSales: "Tamamlanan Satış"
    },
    charts: {
      performanceTrend: "Performans Trendi",
      topCourses: "En İyi Performans Gösteren Kurslar"
    },
    insights: {
      title: "Performans İçgörüleri",
      bestCourse: "En İyi Kurs",
      improvementTip: "İyileştirme Önerisi",
      nextGoal: "Sonraki Hedef"
    },
    actions: {
      exportReport: "Rapor İndir",
      refresh: "Yenile",
      viewAllSales: "Tüm Satışları Görüntüle"
    },
    empty: {
      title: "Henüz performans verisi yok",
      subtitle: "İlk satışınızı yaptıktan sonra performans verileri burada görünecek",
      action: "Kampanyalarımı Görüntüle"
    },
    loading: "Yükleniyor...",
    error: "Veriler yüklenirken bir hata oluştu"
  },
  en: {
    title: "Performance Analytics",
    subtitle: "Analyze your sales performance and commission metrics in detail.",
    periods: {
      last7Days: "Last 7 Days",
      last30Days: "Last 30 Days",
      thisMonth: "This Month",
      lastMonth: "Last Month",
      thisYear: "This Year"
    },
    metrics: {
      totalSales: "Total Sales",
      totalCommission: "Total Commission",
      totalStudents: "Total Students",
      activeCourses: "Active Courses",
      averageOrderValue: "Average Order Value",
      averageCommissionRate: "Average Commission Rate",
      completedSales: "Completed Sales"
    },
    charts: {
      performanceTrend: "Performance Trend",
      topCourses: "Top Performing Courses"
    },
    insights: {
      title: "Performance Insights",
      bestCourse: "Best Course",
      improvementTip: "Improvement Tip",
      nextGoal: "Next Goal"
    },
    actions: {
      exportReport: "Export Report",
      refresh: "Refresh",
      viewAllSales: "View All Sales"
    },
    empty: {
      title: "No performance data yet",
      subtitle: "Performance data will appear here after your first sale",
      action: "View My Campaigns"
    },
    loading: "Loading...",
    error: "An error occurred while loading data"
  }
};

// Utility Functions
const formatCurrency = (amount: number, locale: string) => {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: locale === 'tr' ? 'TRY' : 'USD'
  }).format(amount);
};

const formatDate = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short'
  });
};

const getDateRanges = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return {
    last7Days: {
      start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      end: today
    },
    last30Days: {
      start: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
      end: today
    },
    thisMonth: {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: today
    },
    lastMonth: {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0)
    },
    thisYear: {
      start: new Date(now.getFullYear(), 0, 1),
      end: today
    }
  };
};

// Calculate commission
const calculateCommission = (saleAmount: number, discountAmount: number = 0, commissionRate: number = 15) => {
  const netAmount = saleAmount - discountAmount;
  return Math.round((netAmount * commissionRate / 100) * 100) / 100;
};

// Components
const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color,
  subtitle,
  loading = false
}: {
  title: string;
  value: string | number;
  icon: IconComponent;
  color: string;
  subtitle?: string;
  loading?: boolean;
}) => (
  <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
    </div>
    <div className="mb-2">
      {loading ? (
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-20 animate-pulse"></div>
      ) : (
        <span className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {value}
        </span>
      )}
    </div>
    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
      {title}
    </p>
    {subtitle && (
      <p className="text-xs text-neutral-500 dark:text-neutral-500">
        {subtitle}
      </p>
    )}
  </div>
);

const PerformanceChart = ({ 
  data, 
  locale, 
  t 
}: { 
  data: DailyData[]; 
  locale: string; 
  t: LocalizedTexts; 
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [activeMetric, setActiveMetric] = useState<'commission' | 'sales' | 'students' | 'orders'>('commission');

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

    ctx.clearRect(0, 0, width, height);

    const values = data.map(d => d[activeMetric]);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    if (values.length === 0) return;

    const points = values.map((value, index) => ({
      x: padding + (chartWidth / Math.max(values.length - 1, 1)) * index,
      y: padding + chartHeight - ((value - min) / range) * chartHeight,
      value: value
    }));

    const color = '#990000';

    // Draw area fill
    if (points.length > 1) {
      ctx.fillStyle = color + '20';
      ctx.beginPath();
      ctx.moveTo(points[0].x, height - padding);
      points.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.lineTo(points[points.length - 1].x, height - padding);
      ctx.closePath();
      ctx.fill();
    }

    // Draw line
    if (points.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    }

    // Draw points
    ctx.fillStyle = color;
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

  }, [data, activeMetric]);

  const metrics = [
    { key: 'commission', label: 'Komisyon', icon: DollarSign },
    { key: 'sales', label: 'Satış Tutarı', icon: ShoppingCart },
    { key: 'students', label: 'Öğrenci', icon: Users },
    { key: 'orders', label: 'Sipariş', icon: Target }
  ] as const;

  return (
    <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          {t.charts.performanceTrend}
        </h3>
        <BarChart3 className="w-5 h-5 text-neutral-400" />
      </div>
      
      {/* Metric Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <button
              key={metric.key}
              onClick={() => setActiveMetric(metric.key)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeMetric === metric.key
                  ? 'bg-[#990000] text-white shadow-md'
                  : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {metric.label}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-64 mb-4">
        {data.length > 0 ? (
          <canvas 
            ref={canvasRef}
            className="w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Henüz veri yok</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="text-center">
            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {activeMetric === 'commission' 
                ? formatCurrency(data.reduce((sum, d) => sum + d[activeMetric], 0), locale)
                : data.reduce((sum, d) => sum + d[activeMetric], 0).toString()
              }
            </div>
            <div className="text-xs text-neutral-500">
              {locale === 'tr' ? 'Toplam' : 'Total'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {activeMetric === 'commission'
                ? formatCurrency(data.reduce((sum, d) => sum + d[activeMetric], 0) / data.length, locale)
                : Math.round(data.reduce((sum, d) => sum + d[activeMetric], 0) / data.length).toString()
              }
            </div>
            <div className="text-xs text-neutral-500">
              {locale === 'tr' ? 'Günlük Ort.' : 'Daily Avg'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-green-600 dark:text-green-400">
              {data.length >= 2 ? 
                ((data[data.length - 1][activeMetric] - data[data.length - 2][activeMetric]) / Math.max(data[data.length - 2][activeMetric], 1) * 100).toFixed(1) + '%'
                : '0.0%'
              }
            </div>
            <div className="text-xs text-neutral-500">
              {locale === 'tr' ? 'Değişim' : 'Change'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CoursePerformanceCard = ({ 
  course, 
  locale 
}: { 
  course: CoursePerformance; 
  locale: string; 
}) => (
  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow">
    <div className="p-4 sm:p-6">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#990000]/20 flex items-center justify-center">
            <span className="text-[#990000] font-bold text-lg">
              {course.course_name.charAt(0)}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2">
            {course.course_name}
          </h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Satış:</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100 ml-1">
                {formatCurrency(course.total_sales, locale)}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Komisyon:</span>
              <span className="font-medium text-[#990000] ml-1">
                {formatCurrency(course.total_commission, locale)}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Sipariş:</span>
              <span className="font-medium text-green-600 dark:text-green-400 ml-1">
                {course.sales_count}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Öğrenci:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400 ml-1">
                {course.student_count}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center space-x-4 text-xs">
            <div className="flex items-center">
              <Target className="w-3 h-3 text-blue-500 mr-1" />
              <span className="text-neutral-600 dark:text-neutral-400">
                Ort. Komisyon: {formatCurrency(course.average_commission, locale)}
              </span>
            </div>
            {course.last_sale_date && (
              <div className="flex items-center">
                <Calendar className="w-3 h-3 text-green-500 mr-1" />
                <span className="text-neutral-600 dark:text-neutral-400">
                  Son: {formatDate(course.last_sale_date, locale)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Main Component
const PerformanceContent = ({ locale }: { locale: string }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('last30Days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalSales: 0,
    totalCommission: 0,
    totalStudents: 0,
    activeCourses: 0,
    thisWeekSales: 0,
    thisWeekCommission: 0,
    thisMonthSales: 0,
    thisMonthCommission: 0,
    averageOrderValue: 0,
    averageCommissionRate: 0,
    completedSales: 0,
    pendingSales: 0
  });
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [coursePerformance, setCoursePerformance] = useState<CoursePerformance[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const { user: clerkUser, isLoaded } = useUser();
  const t = texts[locale] || texts.tr;

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get user's discount codes
      const { data: userCodes, error: codesError } = await supabaseMain
        .from('discount_codes')
        .select('*')
        .eq('influencer_id', currentUser.id);

      if (codesError) throw codesError;

      if (!userCodes || userCodes.length === 0) {
        setSales([]);
        setMetrics({
          totalSales: 0,
          totalCommission: 0,
          totalStudents: 0,
          activeCourses: 0,
          thisWeekSales: 0,
          thisWeekCommission: 0,
          thisMonthSales: 0,
          thisMonthCommission: 0,
          averageOrderValue: 0,
          averageCommissionRate: 0,
          completedSales: 0,
          pendingSales: 0
        });
        setDailyData([]);
        setCoursePerformance([]);
        setLoading(false);
        return;
      }

      const userDiscountCodes = userCodes.map(code => code.code);

      // Get orders with these discount codes
      const { data: ordersData, error: ordersError } = await supabaseMain
        .from('orders')
        .select('*')
        .eq('enrolled', true)
        .in('discountcode', userDiscountCodes)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setSales([]);
        setMetrics({
          totalSales: 0,
          totalCommission: 0,
          totalStudents: 0,
          activeCourses: 0,
          thisWeekSales: 0,
          thisWeekCommission: 0,
          thisMonthSales: 0,
          thisMonthCommission: 0,
          averageOrderValue: 0,
          averageCommissionRate: 0,
          completedSales: 0,
          pendingSales: 0
        });
        setDailyData([]);
        setCoursePerformance([]);
        setLoading(false);
        return;
      }

      // Process sales data
      const processedSales: SaleRecord[] = ordersData.map(order => {
        const matchingDiscountCode = userCodes.find(code => code.code === order.discountcode);
        const commissionRate = matchingDiscountCode?.commission || 15;
        const netAmount = order.amount - (order.discountamount || 0);
        const commissionAmount = calculateCommission(order.amount, order.discountamount || 0, commissionRate);

        return {
          ...order,
          commission_amount: commissionAmount,
          commission_rate: commissionRate,
          net_amount: netAmount,
          student_name: order.useremail.split('@')[0]
        };
      });

      setSales(processedSales);

      // Calculate metrics
      const ranges = getDateRanges();
      
      const totalSales = processedSales.reduce((sum, sale) => sum + sale.amount, 0);
      const totalCommission = processedSales.reduce((sum, sale) => sum + sale.commission_amount, 0);
      const totalStudents = new Set(processedSales.map(sale => sale.useremail)).size;
      const activeCourses = new Set(processedSales.map(sale => sale.courseid)).size;
      
      const thisWeekSales = processedSales.filter(sale => 
        new Date(sale.created_at) >= ranges.last7Days.start
      );
      const thisWeekSalesAmount = thisWeekSales.reduce((sum, sale) => sum + sale.amount, 0);
      const thisWeekCommission = thisWeekSales.reduce((sum, sale) => sum + sale.commission_amount, 0);
      
      const thisMonthSales = processedSales.filter(sale => 
        new Date(sale.created_at) >= ranges.thisMonth.start
      );
      const thisMonthSalesAmount = thisMonthSales.reduce((sum, sale) => sum + sale.amount, 0);
      const thisMonthCommission = thisMonthSales.reduce((sum, sale) => sum + sale.commission_amount, 0);
      
      const averageOrderValue = processedSales.length > 0 ? totalSales / processedSales.length : 0;
      const averageCommissionRate = processedSales.length > 0 
        ? processedSales.reduce((sum, sale) => sum + sale.commission_rate, 0) / processedSales.length
        : 0;
      
      const completedSales = processedSales.filter(sale => sale.status === 'completed').length;
      const pendingSales = processedSales.filter(sale => sale.status === 'pending').length;

      setMetrics({
        totalSales,
        totalCommission,
        totalStudents,
        activeCourses,
        thisWeekSales: thisWeekSalesAmount,
        thisWeekCommission,
        thisMonthSales: thisMonthSalesAmount,
        thisMonthCommission,
        averageOrderValue,
        averageCommissionRate,
        completedSales,
        pendingSales
      });

      // Generate daily data for the selected period
      const periodRange = ranges[selectedPeriod];
      const dailyDataMap = new Map<string, DailyData>();
      
      // Initialize all dates in range with zero values
      for (let date = new Date(periodRange.start); date <= periodRange.end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        dailyDataMap.set(dateStr, {
          date: dateStr,
          sales: 0,
          commission: 0,
          students: 0,
          orders: 0
        });
      }
      
      // Fill with actual data
      processedSales
        .filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate >= periodRange.start && saleDate <= periodRange.end;
        })
        .forEach(sale => {
          const dateStr = sale.created_at.split('T')[0];
          const existing = dailyDataMap.get(dateStr);
          if (existing) {
            existing.sales += sale.amount;
            existing.commission += sale.commission_amount;
            existing.orders += 1;
            // Count unique students per day
            existing.students = processedSales
              .filter(s => s.created_at.split('T')[0] === dateStr)
              .reduce((uniqueStudents, s) => {
                if (!uniqueStudents.includes(s.useremail)) {
                  uniqueStudents.push(s.useremail);
                }
                return uniqueStudents;
              }, [] as string[]).length;
          }
        });

      setDailyData(Array.from(dailyDataMap.values()).sort((a, b) => a.date.localeCompare(b.date)));

      // Calculate course performance
      const courseMap = new Map<string, CoursePerformance>();
      
      processedSales.forEach(sale => {
        if (!courseMap.has(sale.courseid)) {
          courseMap.set(sale.courseid, {
            course_id: sale.courseid,
            course_name: sale.coursename,
            total_sales: 0,
            total_commission: 0,
            sales_count: 0,
            student_count: 0,
            average_commission: 0
          });
        }
        
        const course = courseMap.get(sale.courseid)!;
        course.total_sales += sale.amount;
        course.total_commission += sale.commission_amount;
        course.sales_count += 1;
        course.last_sale_date = sale.created_at;
      });
      
      // Calculate unique students per course
      courseMap.forEach((course, courseId) => {
        const courseSales = processedSales.filter(sale => sale.courseid === courseId);
        course.student_count = new Set(courseSales.map(sale => sale.useremail)).size;
        course.average_commission = course.sales_count > 0 ? course.total_commission / course.sales_count : 0;
      });

      setCoursePerformance(
        Array.from(courseMap.values())
          .sort((a, b) => b.total_commission - a.total_commission)
          .slice(0, 6)
      );

    } catch (error: unknown) {
      console.error('Error fetching performance data:', error);
      const errorMessage = error instanceof Error ? error.message : t.error;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedPeriod, t.error]);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!isLoaded || !clerkUser) return;

      try {
        const { data: profile } = await supabaseProfiles
          .from('myuni_profiles')
          .select('*')
          .eq('clerk_user_id', clerkUser.id)
          .single();
        
        setCurrentUser({
          id: clerkUser.id,
          name: profile?.first_name && profile?.last_name 
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.first_name 
            || clerkUser.fullName 
            || clerkUser.firstName 
            || clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] 
            || 'Kullanıcı',
          email: profile?.email || clerkUser.emailAddresses[0]?.emailAddress || '',
          commission_rate: 15,
          userType: profile?.user_type
        });
      } catch (error) {
        console.error('Error getting user profile:', error);
        setCurrentUser({
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.firstName || 'Kullanıcı',
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          commission_rate: 15
        });
      }
    };

    getCurrentUser();
  }, [clerkUser, isLoaded]);

  useEffect(() => {
    if (currentUser) {
      fetchPerformanceData();
    }
  }, [currentUser, fetchPerformanceData]);

  // Handle refresh
  const handleRefresh = () => {
    fetchPerformanceData();
  };

  // Handle export report
  const handleExportReport = () => {
    try {
      // Check if data is available
      if (!sales.length) {
        alert(locale === 'tr' ? 'İndirilecek veri bulunmuyor.' : 'No data available to export.');
        return;
      }

      // Simple CSV generation
      const currentDate = new Date().toLocaleDateString();
      const period = t.periods[selectedPeriod];
      
      let csvContent = '';
      
      // Header
      csvContent += `Performans Raporu - ${period}\n`;
      csvContent += `Tarih: ${currentDate}\n\n`;
      
      // Metrics
      csvContent += 'METRIKLER\n';
      csvContent += `Toplam Komisyon,${metrics.totalCommission}\n`;
      csvContent += `Toplam Ogrenci,${metrics.totalStudents}\n`;
      csvContent += `Aktif Kurs,${metrics.activeCourses}\n`;
      csvContent += `Bu Ay Komisyon,${metrics.thisMonthCommission}\n`;
      csvContent += `Bu Hafta Komisyon,${metrics.thisWeekCommission}\n`;
      csvContent += `Ortalama Komisyon Orani,%${metrics.averageCommissionRate.toFixed(1)}\n\n`;
      
      // Top courses
      if (coursePerformance.length > 0) {
        csvContent += 'EN IYI KURSLAR\n';
        csvContent += 'Kurs Adi,Toplam Komisyon,Satis Sayisi,Ogrenci Sayisi\n';
        coursePerformance.slice(0, 5).forEach(course => {
          csvContent += `"${course.course_name}",${course.total_commission},${course.sales_count},${course.student_count}\n`;
        });
        csvContent += '\n';
      }
      
      // Daily data
      if (dailyData.length > 0) {
        csvContent += 'GUNLUK VERI\n';
        csvContent += 'Tarih,Komisyon,Ogrenci,Siparis\n';
        dailyData.forEach(day => {
          csvContent += `${day.date},${day.commission},${day.students},${day.orders}\n`;
        });
      }

      // Create and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performans-raporu-${new Date().getTime()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Rapor indirildi');
      
    } catch (error) {
      console.error('Export error:', error);
      alert(locale === 'tr' ? 'Rapor indirilirken hata olustu.' : 'Error downloading report.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mb-8"></div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 p-6 rounded-lg border">
                  <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-12 mb-2"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auth check
  if (!clerkUser || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Lütfen giriş yapınız.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                {t.title}
              </h1>
              <div className="w-12 sm:w-16 h-px bg-[#990000] mb-4"></div>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
                {t.subtitle}
              </p>
            </div>
            
            {/* Period Selector & Actions */}
            <div className="mt-4 lg:mt-0 flex items-center space-x-3">
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as PeriodKey)}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
              >
                {Object.entries(t.periods).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              
              <button 
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t.actions.refresh}
              </button>
              
              <button 
                onClick={handleExportReport}
                className="flex items-center px-4 py-2 bg-[#990000] text-white rounded-lg hover:bg-[#770000] transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                {t.actions.exportReport}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
              <button
                onClick={handleRefresh}
                className="ml-auto px-3 py-1 text-sm bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        )}

        {sales.length > 0 ? (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <MetricCard
                title={t.metrics.totalCommission}
                value={formatCurrency(metrics.totalCommission, locale)}
                icon={DollarSign}
                color="text-green-500"
                loading={loading}
              />
              <MetricCard
                title={t.metrics.totalStudents}
                value={metrics.totalStudents}
                icon={Users}
                color="text-purple-500"
                loading={loading}
              />
              <MetricCard
                title={t.metrics.activeCourses}
                value={metrics.activeCourses}
                icon={Award}
                color="text-red-500"
                subtitle={`${metrics.completedSales} tamamlandı`}
                loading={loading}
              />
              <MetricCard
                title="Bu Ay Komisyon"
                value={formatCurrency(metrics.thisMonthCommission, locale)}
                icon={TrendingUp}
                color="text-blue-500"
                loading={loading}
              />
              <MetricCard
                title="Bu Hafta Komisyon"
                value={formatCurrency(metrics.thisWeekCommission, locale)}
                icon={Calendar}
                color="text-indigo-500"
                loading={loading}
              />
              <MetricCard
                title={t.metrics.averageCommissionRate}
                value={`${metrics.averageCommissionRate.toFixed(1)}%`}
                icon={Target}
                color="text-orange-500"
                loading={loading}
              />
            </div>

            {/* Performance Chart */}
            <div className="mb-8">
              <PerformanceChart data={dailyData} locale={locale} t={t} />
            </div>

            {/* Top Courses */}
            {coursePerformance.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100">
                    {t.charts.topCourses}
                  </h2>
                  <Link 
                    href={`/${locale}/influencer/sales`}
                    className="text-sm text-[#990000] hover:text-[#770000] font-medium flex items-center"
                  >
                    {t.actions.viewAllSales}
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {coursePerformance.slice(0, 4).map((course) => (
                    <CoursePerformanceCard 
                      key={course.course_id} 
                      course={course} 
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Insights */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <Star className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                  <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                    {t.insights.title}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {coursePerformance.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-800 dark:text-blue-300">
                        {t.insights.bestCourse}:
                      </span>
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate ml-2">
                        {coursePerformance[0].course_name.substring(0, 20)}...
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
                    <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                      {t.insights.improvementTip}:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                      {locale === 'tr' 
                        ? `Ortalama komisyon oranınız %${metrics.averageCommissionRate.toFixed(1)} ve toplam ${formatCurrency(metrics.totalCommission, locale)} kazandınız.`
                        : `Your average commission rate is ${metrics.averageCommissionRate.toFixed(1)}% and you've earned ${formatCurrency(metrics.totalCommission, locale)} total.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Period Summary */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Award className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                    <h3 className="text-lg font-medium text-green-900 dark:text-green-100">
                      {locale === 'tr' ? `${t.periods[selectedPeriod]} Özeti` : `${t.periods[selectedPeriod]} Summary`}
                    </h3>
                  </div>
                  <button 
                    onClick={handleRefresh}
                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {formatCurrency(metrics.thisMonthCommission, locale)}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Bu Ay Komisyon
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {formatCurrency(metrics.thisWeekCommission, locale)}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Bu Hafta Komisyon
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-green-200 dark:border-green-700">
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {locale === 'tr' 
                      ? `Bu ay toplam ${formatCurrency(metrics.thisMonthCommission, locale)} komisyon kazandınız.`
                      : `You've earned ${formatCurrency(metrics.thisMonthCommission, locale)} in commission this month.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-6 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {t.empty.title}
            </h3>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
              {t.empty.subtitle}
            </p>
            <Link
              href={`/${locale}/influencer/campaigns`}
              className="inline-flex items-center px-6 py-3 bg-[#990000] hover:bg-[#770000] text-white rounded-lg transition-colors font-medium"
            >
              <Target className="w-4 h-4 mr-2" />
              {t.empty.action}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Page Component
export default function PerformancePage({ params }: PerformancePageProps) {
  const [locale, setLocale] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setLocale(resolvedParams.locale);
      setMounted(true);
    };
    resolveParams();
  }, [params]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-100"></div>
      </div>
    );
  }

  return <PerformanceContent locale={locale} />;
}