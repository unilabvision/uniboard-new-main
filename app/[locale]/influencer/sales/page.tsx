"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Clock, Users, CheckCircle, Book, TrendingUp, Award, 
  Calendar, ShoppingCart, BarChart3, AlertCircle,
  RefreshCw, ExternalLink, Target, Percent, Tag
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Supabase clients
const supabaseMain = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg'
});

const supabaseProfiles = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mzlvfmyrzytwvwndqgnz.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bHZmbXlyenl0d3Z3bmRxZ256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMzA3NTgsImV4cCI6MjA1NzgwNjc1OH0.GC7zAi1mUb9rOYiDhRJ8420bXgmjaR0YfwYNG0xM0sY'
});

// Types
interface SaleRecord {
  id: string;
  orderid: string;
  courseid: string;
  useremail: string;
  coursename: string;
  amount: number;
  status: string;
  paymentid?: string;
  paymentmethod?: string;
  created_at: string;
  updated_at: string;
  enrolled: boolean;
  enrollmentid?: string;
  notes?: string;
  custom_data?: Record<string, unknown>;
  discountcode?: string;
  discountamount?: number;
  ip_address?: string;
  user_agent?: string;
  // Computed fields
  commission_amount: number;
  commission_rate: number;
  net_amount: number;
  student_name: string;
  discount_code?: {
    id: string;
    code: string;
    discount_amount: number;
    discount_type: 'fixed' | 'percentage';
    commission: number;
    campaign_id?: string;
  };
  campaign?: {
    id: string;
    name: string;
    description?: string;
  };
}

interface InfluencerStats {
  totalSales: number;
  totalCommission: number;
  totalStudents: number;
  activeCourses: number;
  thisMonthSales: number;
  thisMonthCommission: number;
  pendingCommission: number;
  completedSales: number;
  averageCommissionRate: number;
  averageOrderValue: number;
  thisWeekSales: number;
  thisWeekCommission: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  commission_rate: number;
  userType?: string;
}

interface DashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

interface CourseGroup {
  courseid: string;
  coursename: string;
  sales: SaleRecord[];
}

interface SalesTexts {
  title: string;
  subtitle: string;
  noDataNote: string;
  tabs: {
    overview: string;
    sales: string;
    courses: string;
    performance: string;
  };
  stats: {
    totalSales: string;
    totalCommission: string;
    totalStudents: string;
    activeCourses: string;
    thisMonth: string;
    thisWeek: string;
    salesAmount: string;
    commission: string;
    pendingCommission: string;
    completedSales: string;
    averageCommission: string;
    averageOrderValue: string;
  };
  filters: {
    all: string;
    thisWeek: string;
    thisMonth: string;
    lastMonth: string;
    pending: string;
    completed: string;
    thisYear: string;
  };
  salesCard: {
    student: string;
    course: string;
    saleDate: string;
    amount: string;
    netAmount: string;
    commission: string;
    status: string;
    commissionRate: string;
    discountCode: string;
    campaign: string;
    discountAmount: string;
    orderId: string;
    paymentMethod: string;
  };
  courseCard: {
    totalSales: string;
    totalCommission: string;
    students: string;
    lastSale: string;
    viewCourse: string;
    salesCount: string;
    averageCommission: string;
  };
  status: {
    pending: string;
    completed: string;
    cancelled: string;
    refunded: string;
  };
  sections: {
    recentSales: string;
    topCourses: string;
    refreshData: string;
    monthlyTrend: string;
    performance: string;
  };
  empty: {
    sales: {
      title: string;
      subtitle: string;
      action: string;
    };
    courses: {
      title: string;
      subtitle: string;
    };
  };
  loading: string;
  error: string;
  retry: string;
}

// Dil metinleri
const texts: Record<string, SalesTexts> = {
  tr: {
    title: "Satış Dashboard'u",
    subtitle: "Satış performansınızı ve komisyonlarınızı buradan takip edebilirsiniz.",
    noDataNote: "Henüz satış verisi bulunmuyor. İndirim kodlarınızı paylaşmaya başlayın!",
    tabs: {
      overview: "Genel Bakış",
      sales: "Tüm Satışlar",
      courses: "Kurslar",
      performance: "Performans"
    },
    stats: {
      totalSales: "Toplam Satış",
      totalCommission: "Toplam Komisyon", 
      totalStudents: "Toplam Öğrenci",
      activeCourses: "Aktif Kurs",
      thisMonth: "Bu Ay",
      thisWeek: "Bu Hafta",
      salesAmount: "Satış Tutarı",
      commission: "Komisyon",
      pendingCommission: "Bekleyen Komisyon",
      completedSales: "Tamamlanan Satış",
      averageCommission: "Ortalama Komisyon",
      averageOrderValue: "Ortalama Sipariş Değeri"
    },
    filters: {
      all: "Tümü",
      thisWeek: "Bu Hafta", 
      thisMonth: "Bu Ay",
      lastMonth: "Geçen Ay",
      pending: "Bekleyenler",
      completed: "Tamamlananlar",
      thisYear: "Bu Yıl"
    },
    salesCard: {
      student: "Öğrenci",
      course: "Kurs",
      saleDate: "Satış Tarihi",
      amount: "Tutar",
      netAmount: "Net Tutar", 
      commission: "Komisyon",
      status: "Durum",
      commissionRate: "Komisyon Oranı",
      discountCode: "İndirim Kodu",
      campaign: "Kampanya",
      discountAmount: "İndirim Tutarı",
      orderId: "Sipariş ID",
      paymentMethod: "Ödeme Yöntemi"
    },
    courseCard: {
      totalSales: "Toplam Satış",
      totalCommission: "Toplam Komisyon",
      students: "Öğrenci Sayısı",
      lastSale: "Son Satış",
      viewCourse: "Kursu Görüntüle",
      salesCount: "Satış Sayısı",
      averageCommission: "Ortalama Komisyon"
    },
    status: {
      pending: "Bekliyor",
      completed: "Tamamlandı", 
      cancelled: "İptal Edildi",
      refunded: "İade Edildi"
    },
    sections: {
      recentSales: "Son Satışlar",
      topCourses: "En Çok Satan Kurslar",
      refreshData: "Verileri Yenile",
      monthlyTrend: "Aylık Trend",
      performance: "Performans Analizi"
    },
    empty: {
      sales: {
        title: "Henüz satışınız yok",
        subtitle: "İndirim kodlarınızı paylaşmaya başlayın ve ilk satışınızı yapın",
        action: "Kampanyalarımı Görüntüle"
      },
      courses: {
        title: "Henüz kurs satışınız yok", 
        subtitle: "İndirim kodlarınızla kurs satışları yapıldığında burada görünecek"
      }
    },
    loading: "Yükleniyor...",
    error: "Veriler yüklenirken bir hata oluştu",
    retry: "Tekrar Dene"
  },
  en: {
    title: "Sales Dashboard",
    subtitle: "Track your sales performance and commissions here.",
    noDataNote: "No sales data found yet. Start sharing your discount codes!",
    tabs: {
      overview: "Overview",
      sales: "All Sales", 
      courses: "Courses",
      performance: "Performance"
    },
    stats: {
      totalSales: "Total Sales",
      totalCommission: "Total Commission",
      totalStudents: "Total Students", 
      activeCourses: "Active Courses",
      thisMonth: "This Month",
      thisWeek: "This Week",
      salesAmount: "Sales Amount",
      commission: "Commission",
      pendingCommission: "Pending Commission",
      completedSales: "Completed Sales",
      averageCommission: "Average Commission",
      averageOrderValue: "Average Order Value"
    },
    filters: {
      all: "All",
      thisWeek: "This Week",
      thisMonth: "This Month", 
      lastMonth: "Last Month",
      pending: "Pending",
      completed: "Completed",
      thisYear: "This Year"
    },
    salesCard: {
      student: "Student",
      course: "Course",
      saleDate: "Sale Date",
      amount: "Amount",
      netAmount: "Net Amount",
      commission: "Commission",
      status: "Status", 
      commissionRate: "Commission Rate",
      discountCode: "Discount Code",
      campaign: "Campaign",
      discountAmount: "Discount Amount",
      orderId: "Order ID",
      paymentMethod: "Payment Method"
    },
    courseCard: {
      totalSales: "Total Sales",
      totalCommission: "Total Commission",
      students: "Students Count",
      lastSale: "Last Sale", 
      viewCourse: "View Course",
      salesCount: "Sales Count",
      averageCommission: "Average Commission"
    },
    status: {
      pending: "Pending",
      completed: "Completed",
      cancelled: "Cancelled", 
      refunded: "Refunded"
    },
    sections: {
      recentSales: "Recent Sales",
      topCourses: "Top Selling Courses",
      refreshData: "Refresh Data",
      monthlyTrend: "Monthly Trend",
      performance: "Performance Analysis"
    },
    empty: {
      sales: {
        title: "No sales yet",
        subtitle: "Start sharing your discount codes to make your first sale",
        action: "View My Campaigns"
      },
      courses: {
        title: "No course sales yet",
        subtitle: "Course sales with your discount codes will appear here"
      }
    },
    loading: "Loading...",
    error: "An error occurred while loading data",
    retry: "Retry"
  }
};

// Utility Functions
const formatCurrency = (amount: number, locale: string) => {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: locale === 'tr' ? 'TRY' : 'USD'
  }).format(amount);
};

const formatShortDate = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short'
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'refunded':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    default:
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/20 dark:text-neutral-400';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'pending':
      return Clock;
    case 'cancelled':
    case 'refunded':
      return AlertCircle;
    default:
      return Clock;
  }
};

// Calculate commission
const calculateCommission = (saleAmount: number, discountAmount: number = 0, commissionRate: number = 15) => {
  const netAmount = saleAmount - discountAmount;
  return Math.round((netAmount * commissionRate / 100) * 100) / 100;
};

// Components
const StatsCard = ({ 
  value, 
  label, 
  icon: Icon, 
  color,
  loading = false,
  trend,
  trendDirection
}: { 
  value: string | number; 
  label: string; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
  loading?: boolean;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
}) => (
  <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      {loading ? (
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-20 animate-pulse"></div>
      ) : (
        <span className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100">
          {value}
        </span>
      )}
      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
    </div>
    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-1">
      {label}
    </p>
    {trend && (
      <div className={`flex items-center text-xs ${
        trendDirection === 'up' ? 'text-green-600' : 
        trendDirection === 'down' ? 'text-red-600' : 
        'text-neutral-600'
      }`}>
        <TrendingUp className="w-3 h-3 mr-1" />
        {trend}
      </div>
    )}
  </div>
);

const SaleCard = ({ sale, locale, t }: { sale: SaleRecord; locale: string; t: SalesTexts }) => {
  const StatusIcon = getStatusIcon(sale.status);
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-2">
            {sale.coursename}
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t.salesCard.student}: {sale.student_name}
          </p>
          {sale.discount_code && (
            <div className="flex items-center mt-1">
              <Tag className="w-3 h-3 mr-1 text-blue-500" />
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {sale.discount_code.code}
              </span>
            </div>
          )}
          {sale.campaign && (
            <div className="flex items-center mt-1">
              <Target className="w-3 h-3 mr-1 text-purple-500" />
              <span className="text-xs text-purple-600 dark:text-purple-400">
                {sale.campaign.name}
              </span>
            </div>
          )}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
          <StatusIcon className="w-3 h-3 inline mr-1" />
          {t.status[sale.status as keyof typeof t.status] || sale.status}
        </span>
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            {t.salesCard.commission}
          </p>
          <p className="font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(sale.commission_amount, locale)}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            {t.salesCard.commissionRate}
          </p>
          <p className="font-semibold text-blue-600 dark:text-blue-400">
            %{sale.commission_rate}
          </p>
        </div>
        {sale.discountamount && sale.discountamount > 0 && (
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {t.salesCard.discountAmount}
            </p>
            <p className="font-semibold text-orange-600 dark:text-orange-400">
              -{formatCurrency(sale.discountamount, locale)}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm border-t border-neutral-200 dark:border-neutral-700 pt-3">
        <span className="flex items-center text-neutral-500 dark:text-neutral-400">
          <Calendar className="w-4 h-4 mr-1" />
          {formatShortDate(sale.created_at, locale)}
        </span>
        <span className="text-xs text-neutral-400 font-mono">
          {sale.orderid.slice(0, 8)}...
        </span>
      </div>
    </div>
  );
};

const CourseCard = ({ 
  course, 
  sales, 
  locale, 
  t 
}: { 
  course: CourseGroup; 
  sales: SaleRecord[]; 
  locale: string; 
  t: SalesTexts; 
}) => {
  const courseSales = sales.filter(sale => sale.courseid === course.courseid);
  const totalCommissionAmount = courseSales.reduce((sum, sale) => sum + sale.commission_amount, 0);
  const studentCount = new Set(courseSales.map(sale => sale.useremail)).size;
  const salesCount = courseSales.length;
  const averageCommission = salesCount > 0 ? totalCommissionAmount / salesCount : 0;
  const lastSale = courseSales.length > 0 ? courseSales[0].created_at : null;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300">
      {/* Course Header */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2 leading-tight">
          {course.coursename}
        </h3>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            {salesCount} satış
          </span>
          <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
            {studentCount} öğrenci
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {t.courseCard.totalCommission}
            </p>
            <p className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(totalCommissionAmount, locale)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {t.courseCard.averageCommission}
            </p>
            <p className="font-semibold text-blue-600 dark:text-blue-400">
              {formatCurrency(averageCommission, locale)}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {t.courseCard.salesCount}
            </p>
            <p className="font-semibold text-purple-600 dark:text-purple-400">
              {salesCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              {t.courseCard.lastSale}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {lastSale ? formatShortDate(lastSale, locale) : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
}) => (
  <button
    onClick={onClick}
    className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm sm:text-base ${
      active
        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
    }`}
  >
    {children}
  </button>
);

const FilterButton = ({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode; 
}) => (
  <button
    onClick={onClick}
    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
      active
        ? 'bg-[#990000] dark:bg-red-600 text-white shadow-md'
        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700'
    }`}
  >
    {children}
  </button>
);

// Main Dashboard Component
const DashboardContent = ({ locale }: { locale: string }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [stats, setStats] = useState<InfluencerStats>({
    totalSales: 0,
    totalCommission: 0,
    totalStudents: 0,
    activeCourses: 0,
    thisMonthSales: 0,
    thisMonthCommission: 0,
    pendingCommission: 0,
    completedSales: 0,
    averageCommissionRate: 0,
    averageOrderValue: 0,
    thisWeekSales: 0,
    thisWeekCommission: 0
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const { user: clerkUser, isLoaded } = useUser();
  const t = texts[locale] || texts.tr;

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
      } catch {
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

  // Fetch sales data from orders table
  const fetchSalesData = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching sales data for user:', currentUser.id);

      // Debug 1: Check user's discount codes first
      const { data: userCodes, error: codesError } = await supabaseMain
        .from('discount_codes')
        .select('*')
        .eq('influencer_id', currentUser.id);

      console.log('🎟️ User discount codes:', userCodes);
      console.log('❌ Codes error:', codesError);

      if (!userCodes || userCodes.length === 0) {
        console.log('⚠️ No discount codes found for this user');
        setSales([]);
        setStats({
          totalSales: 0,
          totalCommission: 0,
          totalStudents: 0,
          activeCourses: 0,
          thisMonthSales: 0,
          thisMonthCommission: 0,
          thisWeekSales: 0,
          thisWeekCommission: 0,
          pendingCommission: 0,
          completedSales: 0,
          averageCommissionRate: 0,
          averageOrderValue: 0
        });
        setLoading(false);
        return;
      }

      const userDiscountCodes = userCodes.map(code => code.code);
      console.log('📋 User discount code list:', userDiscountCodes);

      // Debug 2: Check orders with these discount codes
      const { data: ordersData, error: ordersError } = await supabaseMain
        .from('orders')
        .select('*')
        .eq('enrolled', true)
        .in('discountcode', userDiscountCodes)
        .order('created_at', { ascending: false });

      console.log('📦 Orders data:', ordersData);
      console.log('❌ Orders error:', ordersError);

      if (ordersError) {
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        console.log('⚠️ No orders found with user discount codes');
        setSales([]);
        setStats({
          totalSales: 0,
          totalCommission: 0,
          totalStudents: 0,
          activeCourses: 0,
          thisMonthSales: 0,
          thisMonthCommission: 0,
          thisWeekSales: 0,
          thisWeekCommission: 0,
          pendingCommission: 0,
          completedSales: 0,
          averageCommissionRate: 0,
          averageOrderValue: 0
        });
        setLoading(false);
        return;
      }

      // Debug 3: Get campaign data if needed
      const campaignIds = userCodes
        .filter(code => code.campaign_id)
        .map(code => code.campaign_id);

      let campaignsData = [];
      if (campaignIds.length > 0) {
        const { data: campaigns, error: campaignsError } = await supabaseMain
          .from('campaigns')
          .select('*')
          .in('id', campaignIds);
        
        console.log('🎯 Campaigns data:', campaigns);
        console.log('❌ Campaigns error:', campaignsError);
        
        campaignsData = campaigns || [];
      }

      // Process sales data
      const processedSales: SaleRecord[] = ordersData.map(order => {
        // Find matching discount code
        const matchingDiscountCode = userCodes.find(code => code.code === order.discountcode);
        const commissionRate = matchingDiscountCode?.commission || 15;
        const netAmount = order.amount - (order.discountamount || 0);
        const commissionAmount = calculateCommission(order.amount, order.discountamount || 0, commissionRate);

        // Find campaign if exists
        const campaign = campaignsData.find(c => c.id === matchingDiscountCode?.campaign_id);

        return {
          ...order,
          commission_amount: commissionAmount,
          commission_rate: commissionRate,
          net_amount: netAmount,
          student_name: order.useremail.split('@')[0],
          discount_code: matchingDiscountCode ? {
            id: matchingDiscountCode.id,
            code: matchingDiscountCode.code,
            discount_amount: matchingDiscountCode.discount_amount,
            discount_type: matchingDiscountCode.discount_type,
            commission: matchingDiscountCode.commission,
            campaign_id: matchingDiscountCode.campaign_id
          } : undefined,
          campaign: campaign ? {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description
          } : undefined
        };
      });

      console.log('✅ Processed sales:', processedSales);
      setSales(processedSales);

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const totalSales = processedSales.reduce((sum, sale) => sum + sale.amount, 0);
      const totalCommission = processedSales.reduce((sum, sale) => sum + sale.commission_amount, 0);
      const totalStudents = new Set(processedSales.map(sale => sale.useremail)).size;
      const activeCourses = new Set(processedSales.map(sale => sale.courseid)).size;
      
      const thisMonthSales = processedSales
        .filter(sale => new Date(sale.created_at) >= startOfMonth)
        .reduce((sum, sale) => sum + sale.amount, 0);
      const thisMonthCommission = processedSales
        .filter(sale => new Date(sale.created_at) >= startOfMonth)
        .reduce((sum, sale) => sum + sale.commission_amount, 0);
        
      const thisWeekSales = processedSales
        .filter(sale => new Date(sale.created_at) >= startOfWeek)
        .reduce((sum, sale) => sum + sale.amount, 0);
      const thisWeekCommission = processedSales
        .filter(sale => new Date(sale.created_at) >= startOfWeek)
        .reduce((sum, sale) => sum + sale.commission_amount, 0);
      
      const pendingCommission = processedSales
        .filter(sale => sale.status === 'pending')
        .reduce((sum, sale) => sum + sale.commission_amount, 0);
        
      const completedSales = processedSales.filter(sale => sale.status === 'completed').length;
      
      const averageCommissionRate = processedSales.length > 0 
        ? processedSales.reduce((sum, sale) => sum + sale.commission_rate, 0) / processedSales.length
        : 0;
        
      const averageOrderValue = processedSales.length > 0 ? totalSales / processedSales.length : 0;

      setStats({
        totalSales,
        totalCommission,
        totalStudents,
        activeCourses,
        thisMonthSales,
        thisMonthCommission,
        thisWeekSales,
        thisWeekCommission,
        pendingCommission,
        completedSales,
        averageCommissionRate,
        averageOrderValue
      });

      console.log('📈 Calculated stats:', {
        totalSales,
        totalCommission,
        totalStudents,
        activeCourses,
        thisMonthSales,
        thisMonthCommission,
        thisWeekSales,
        thisWeekCommission,
        pendingCommission,
        completedSales,
        averageCommissionRate,
        averageOrderValue
      });

    } catch (err: unknown) {
      console.error('💥 Error fetching sales data:');
      console.error('Error object:', err);
      
      const errorMessage = err instanceof Error ? err.message : t.error;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentUser, t.error]);

  useEffect(() => {
    if (currentUser) {
      fetchSalesData();
    }
  }, [currentUser, fetchSalesData]);

  // Filter sales based on active filter
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.created_at);
    const now = new Date();
    
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return sale.status === 'pending';
    if (activeFilter === 'completed') return sale.status === 'completed';
    if (activeFilter === 'thisWeek') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return saleDate >= weekAgo;
    }
    if (activeFilter === 'thisMonth') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return saleDate >= startOfMonth;
    }
    if (activeFilter === 'lastMonth') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return saleDate >= startOfLastMonth && saleDate <= endOfLastMonth;
    }
    if (activeFilter === 'thisYear') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return saleDate >= startOfYear;
    }
    return true;
  });

  // Group sales by course for courses tab
  const courseGroups = sales.reduce((groups, sale) => {
    const courseId = sale.courseid;
    if (!groups[courseId]) {
      groups[courseId] = {
        courseid: courseId,
        coursename: sale.coursename,
        sales: []
      };
    }
    groups[courseId].sales.push(sale);
    return groups;
  }, {} as Record<string, CourseGroup>);

  const courses = Object.values(courseGroups).sort((a, b) => {
    const aTotalSales = a.sales.reduce((sum: number, sale: SaleRecord) => sum + sale.amount, 0);
    const bTotalSales = b.sales.reduce((sum: number, sale: SaleRecord) => sum + sale.amount, 0);
    return bTotalSales - aTotalSales;
  });

  // Handle refresh
  const handleRefresh = () => {
    fetchSalesData();
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mb-8"></div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 p-6 rounded-lg border">
                  <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-12 mb-2"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg border overflow-hidden">
                  <div className="h-48 bg-neutral-200 dark:bg-neutral-700"></div>
                  <div className="p-6">
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-4"></div>
                    <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  </div>
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
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                {t.title}
              </h1>
              <div className="w-12 sm:w-16 h-px bg-[#990000] mb-4"></div>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
                {sales.length > 0 ? t.subtitle : t.noDataNote}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t.sections.refreshData}
            </button>
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
                {t.retry}
              </button>
            </div>
          </div>
        )}

        {/* Main Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatsCard
            value={formatCurrency(stats.totalCommission, locale)}
            label={t.stats.totalCommission}
            icon={TrendingUp}
            color="text-green-500"
            loading={loading}
          />
          <StatsCard
            value={stats.totalStudents}
            label={t.stats.totalStudents}
            icon={Users}
            color="text-purple-500"
            loading={loading}
          />
          <StatsCard
            value={stats.activeCourses}
            label={t.stats.activeCourses}
            icon={Book}
            color="text-orange-500"
            loading={loading}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 text-green-900 dark:text-green-100 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg sm:text-xl font-bold">
                {formatCurrency(stats.thisMonthCommission, locale)}
              </span>
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs sm:text-sm">
              {t.stats.thisMonth} - {t.stats.commission}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg sm:text-xl font-bold">
                {formatCurrency(stats.thisWeekCommission, locale)}
              </span>
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs sm:text-sm">
              {t.stats.thisWeek} - {t.stats.commission}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg sm:text-xl font-bold">
                {formatCurrency(stats.pendingCommission, locale)}
              </span>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs sm:text-sm">
              {t.stats.pendingCommission}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg sm:text-xl font-bold">
                %{stats.averageCommissionRate.toFixed(1)}
              </span>
              <Percent className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs sm:text-sm">
              {t.stats.averageCommission}
            </p>
          </div>
        </div>

        {sales.length > 0 && (
          <>
            {/* Tabs */}
            <div className="mb-6 sm:mb-8">
              <div className="flex space-x-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg max-w-lg">
                <TabButton
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                >
                  {t.tabs.overview}
                </TabButton>
                <TabButton
                  active={activeTab === 'sales'}
                  onClick={() => setActiveTab('sales')}
                >
                  {t.tabs.sales}
                </TabButton>
                <TabButton
                  active={activeTab === 'courses'}
                  onClick={() => setActiveTab('courses')}
                >
                  {t.tabs.courses}
                </TabButton>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6 sm:space-y-8">
                {/* Recent Sales */}
                <div>
                  <h2 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                    {t.sections.recentSales}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {sales.slice(0, 6).map((sale) => (
                      <SaleCard key={sale.id || sale.orderid} sale={sale} locale={locale} t={t} />
                    ))}
                  </div>
                  {sales.length > 6 && (
                    <div className="text-center mt-6">
                      <button
                        onClick={() => setActiveTab('sales')}
                        className="px-6 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      >
                        {locale === 'tr' ? 'Tüm Satışları Görüntüle' : 'View All Sales'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Top Courses */}
                {courses.length > 0 && (
                  <div>
                    <h2 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                      {t.sections.topCourses}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {courses.slice(0, 3).map((course) => (
                        <CourseCard key={course.courseid} course={course} sales={course.sales} locale={locale} t={t} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sales' && (
              <>
                {/* Filters */}
                <div className="mb-6 sm:mb-8 flex flex-wrap gap-2 sm:gap-3">
                  {Object.entries(t.filters).map(([key, label]) => (
                    <FilterButton
                      key={key}
                      active={activeFilter === key}
                      onClick={() => setActiveFilter(key)}
                    >
                      {label}
                    </FilterButton>
                  ))}
                </div>

                {/* Sales Grid */}
                {filteredSales.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredSales.map((sale) => (
                      <SaleCard key={sale.id || sale.orderid} sale={sale} locale={locale} t={t} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <span className="text-xl sm:text-2xl">🔍</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      {locale === 'tr' ? 'Bu filtreye uygun satış bulunamadı' : 'No sales found for this filter'}
                    </h3>
                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4">
                      {locale === 'tr' ? 'Farklı bir filtre deneyin veya tüm satışları görüntüleyin.' : 'Try a different filter or view all sales.'}
                    </p>
                    <FilterButton
                      active={false}
                      onClick={() => setActiveFilter('all')}
                    >
                      {locale === 'tr' ? 'Tümünü Göster' : 'Show All'}
                    </FilterButton>
                  </div>
                )}
              </>
            )}

            {activeTab === 'courses' && (
              <>
                {courses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {courses.map((course) => (
                      <CourseCard key={course.courseid} course={course} sales={course.sales} locale={locale} t={t} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Book className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-500" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      {t.empty.courses.title}
                    </h3>
                    <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                      {t.empty.courses.subtitle}
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Empty State - No Data */}
        {sales.length === 0 && !loading && !error && (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-6 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {t.empty.sales.title}
            </h3>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
              {t.empty.sales.subtitle}
            </p>
            <Link
              href={`/${locale}/influencer/campaigns`}
              className="inline-flex items-center px-6 py-3 bg-[#990000] hover:bg-[#770000] text-white rounded-lg transition-colors font-medium"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t.empty.sales.action}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Page Component
export default function DashboardPage({ params }: DashboardPageProps) {
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

  return <DashboardContent locale={locale} />;
}