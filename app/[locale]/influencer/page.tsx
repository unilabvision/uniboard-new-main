"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, DollarSign, Users, Award, Calendar, Target,
  BarChart3, Tag, FileText, ArrowUpRight,
  Clock, Percent, RefreshCw, AlertCircle, TrendingDown
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Tek Supabase client - sadece ana veritabanı
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg'
});

// Test Supabase connection
const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testing main database connection...');
    const { data, error } = await supabase.from('user_module_access').select('count').limit(1);
    console.log('🧪 Connection test result:', { data, error });
    return !error;
  } catch (error) {
    console.error('🧪 Connection test failed:', error);
    return false;
  }
};

// Types
interface DashboardStats {
  totalCommission: number;
  thisMonthCommission: number;
  thisWeekCommission: number;
  totalStudents: number;
  activeCourses: number;
  totalCampaigns: number;
  totalCodes: number;
  usedCodes: number;
  averageCommissionRate: number;
  completedSales: number;
  pendingSales: number;
}

interface RecentSale {
  id: string;
  coursename: string;
  student_name: string;
  amount: number;
  commission_amount: number;
  commission_rate: number;
  status: string;
  created_at: string;
  discountcode?: string;
}

interface TopCourse {
  course_id: string;
  course_name: string;
  total_commission: number;
  sales_count: number;
  student_count: number;
}

interface ActiveCampaign {
  id: string;
  name: string;
  status: string;
  codes_count: number;
  end_date: string;
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

// Dil metinleri
const texts = {
  tr: {
    title: "Dashboard",
    subtitle: "Satış performansınızın özeti ve hızlı erişim",
    welcome: "Hoş geldiniz",
    sections: {
      overview: "Genel Bakış",
      recentSales: "Son Satışlar",
      topCourses: "En İyi Kurslar",
      activeCampaigns: "Aktif Kampanyalar",
      documents: "Son Dokümanlar",
      quickActions: "Hızlı İşlemler"
    },
    metrics: {
      totalCommission: "Toplam Komisyon",
      thisMonthCommission: "Bu Ay Komisyon",
      thisWeekCommission: "Bu Hafta Komisyon",
      totalStudents: "Toplam Öğrenci",
      activeCourses: "Aktif Kurs",
      totalCampaigns: "Toplam Kampanya",
      totalCodes: "Toplam Kod",
      usedCodes: "Kullanılan Kod",
      averageCommission: "Ortalama Komisyon",
      completedSales: "Tamamlanan Satış",
      pendingSales: "Bekleyen Satış"
    },
    actions: {
      viewAll: "Tümünü Görüntüle",
      viewDetails: "Detayları Gör",
      copyCode: "Kodu Kopyala",
      refresh: "Yenile",
      viewSales: "Satışları Görüntüle",
      viewCampaigns: "Kampanyaları Görüntüle",
      viewDocuments: "Dokümanları Görüntüle",
      viewPerformance: "Performansı Görüntüle"
    },
    status: {
      active: "Aktif",
      completed: "Tamamlandı",
      pending: "Bekliyor",
      used: "Kullanıldı"
    },
    empty: {
      noSales: "Henüz satış yok",
      noCampaigns: "Henüz kampanya yok",
      noDocuments: "Henüz doküman yok",
      subtitle: "Veriler yüklendikçe burada görünecek"
    },
    quickActions: {
      title: "Hızlı İşlemler",
      viewSalesTitle: "Satış Raporları",
      viewSalesDesc: "Detaylı satış analizinizi görün",
      viewCampaignsTitle: "Kampanya Yönetimi",
      viewCampaignsDesc: "Kampanya ve kodlarınızı yönetin",
      viewDocsTitle: "Pazarlama Materyalleri",
      viewDocsDesc: "Tanıtım metinleri ve görsellere erişin",
      viewPerformanceTitle: "Performans Analizi",
      viewPerformanceDesc: "Detaylı performans metriklerinizi inceleyin"
    },
    loading: "Yükleniyor...",
    error: "Veriler yüklenirken bir hata oluştu"
  },
  en: {
    title: "Dashboard",
    subtitle: "Overview of your sales performance and quick access",
    welcome: "Welcome",
    sections: {
      overview: "Overview",
      recentSales: "Recent Sales",
      topCourses: "Top Courses",
      activeCampaigns: "Active Campaigns",
      documents: "Recent Documents",
      quickActions: "Quick Actions"
    },
    metrics: {
      totalCommission: "Total Commission",
      thisMonthCommission: "This Month Commission",
      thisWeekCommission: "This Week Commission",
      totalStudents: "Total Students",
      activeCourses: "Active Courses",
      totalCampaigns: "Total Campaigns",
      totalCodes: "Total Codes",
      usedCodes: "Used Codes",
      averageCommission: "Average Commission",
      completedSales: "Completed Sales",
      pendingSales: "Pending Sales"
    },
    actions: {
      viewAll: "View All",
      viewDetails: "View Details",
      copyCode: "Copy Code",
      refresh: "Refresh",
      viewSales: "View Sales",
      viewCampaigns: "View Campaigns",
      viewDocuments: "View Documents",
      viewPerformance: "View Performance"
    },
    status: {
      active: "Active",
      completed: "Completed",
      pending: "Pending",
      used: "Used"
    },
    empty: {
      noSales: "No sales yet",
      noCampaigns: "No campaigns yet",
      noDocuments: "No documents yet",
      subtitle: "Data will appear here as it loads"
    },
    quickActions: {
      title: "Quick Actions",
      viewSalesTitle: "Sales Reports",
      viewSalesDesc: "View your detailed sales analysis",
      viewCampaignsTitle: "Campaign Management",
      viewCampaignsDesc: "Manage your campaigns and codes",
      viewDocsTitle: "Marketing Materials",
      viewDocsDesc: "Access promotional texts and images",
      viewPerformanceTitle: "Performance Analysis",
      viewPerformanceDesc: "Review your detailed performance metrics"
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

const formatShortDate = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short'
  });
};

const calculateCommission = (saleAmount: number, discountAmount: number = 0, commissionRate: number = 15) => {
  const netAmount = saleAmount - discountAmount;
  return Math.round((netAmount * commissionRate / 100) * 100) / 100;
};

// Components
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color,
  subtitle,
  trend,
  loading = false,
  href
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  subtitle?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' };
  loading?: boolean;
  href?: string;
}) => {
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all duration-300 cursor-pointer">
      {children}
    </div>
  );

  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-6 h-6 ${color}`} />
        {trend && (
          <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
            trend.direction === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
            trend.direction === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
            'bg-neutral-100 text-neutral-700 dark:bg-neutral-900/20 dark:text-neutral-400'
          }`}>
            {trend.direction === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> :
             trend.direction === 'down' ? <TrendingDown className="w-3 h-3 mr-1" /> : null}
            {trend.value}
          </div>
        )}
      </div>
      <div className="mb-2">
        {loading ? (
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-20 animate-pulse"></div>
        ) : (
          <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {value}
          </span>
        )}
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-neutral-500">
          {subtitle}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href}>
        <Card>{content}</Card>
      </Link>
    );
  }

  return <Card>{content}</Card>;
};

// Main Dashboard Component
const DashboardContent = ({ locale }: { locale: string }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalCommission: 0,
    thisMonthCommission: 0,
    thisWeekCommission: 0,
    totalStudents: 0,
    activeCourses: 0,
    totalCampaigns: 0,
    totalCodes: 0,
    usedCodes: 0,
    averageCommissionRate: 0,
    completedSales: 0,
    pendingSales: 0
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<ActiveCampaign[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing');

  const { user: clerkUser, isLoaded } = useUser();
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🧪 Testing database connection...');
        setConnectionStatus('testing');
        
        const isConnected = await testSupabaseConnection();
        
        if (isConnected) {
          console.log('✅ Database connection successful');
          setConnectionStatus('connected');
        } else {
          console.error('❌ Database connection failed');
          setConnectionStatus('failed');
          setError('Veritabanına bağlanılamadı');
        }
      } catch (err: unknown) {
        console.error('💥 Connection test error:', err);
        setConnectionStatus('failed');
        const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
        setError('Veritabanı bağlantı testi başarısız: ' + errorMessage);
      }
    };
    
    testConnection();
  }, []);

  // Get current user - SADECE CLERK VERİSİ KULLAN
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!isLoaded) {
        console.log('⏳ Clerk not loaded yet...');
        return;
      }
      
      if (!clerkUser) {
        console.log('❌ No Clerk user found');
        setLoading(false);
        return;
      }

      try {
        console.log('👤 Setting user from Clerk data:', clerkUser.id);
        
        // Sadece Clerk verilerini kullan, profil tablosuna gitme
        const userData = {
          id: clerkUser.id,
          name: clerkUser.fullName 
            || clerkUser.firstName 
            || clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] 
            || 'Kullanıcı',
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          commission_rate: 15, // Varsayılan komisyon oranı
          userType: 'influencer' // Varsayılan kullanıcı tipi
        };
        
        console.log('✅ Setting current user:', userData);
        setCurrentUser(userData);
        
      } catch {
        console.error('❌ Error setting user data');
        
        // Fallback user data
        const fallbackUserData = {
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.firstName || 'Kullanıcı',
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          commission_rate: 15
        };
        
        console.log('🔄 Setting fallback user data:', fallbackUserData);
        setCurrentUser(fallbackUserData);
      }
    };

    getCurrentUser().catch(err => {
      console.error('🔥 Unhandled error in getCurrentUser:', err);
    });
  }, [clerkUser, isLoaded]);

  // Fetch dashboard data - TEK VERİTABANINDAN
  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) {
      console.log('❌ No current user found');
      return;
    }
    
    console.log('🔍 Starting dashboard data fetch for user:', currentUser.id);
    setLoading(true);
    setError(null);
    
    try {
      // 1. Kullanıcının modül erişimlerini kontrol et
      console.log('📡 Checking user module access...');
      const { data: userAccess, error: accessError } = await supabase
        .from('user_module_access')
        .select('*')
        .eq('clerk_user_id', currentUser.id)
        .eq('is_enabled', true);

      console.log('🎟️ User access result:', { userAccess, accessError });

      if (accessError) {
        console.error('❌ Access error:', accessError);
        throw accessError;
      }

      if (!userAccess || userAccess.length === 0) {
        console.log('⚠️ No module access found for user');
        setError('Bu modüle erişim yetkiniz bulunmamaktadır.');
        setLoading(false);
        return;
      }

      // 2. Kullanıcının discount code'larını al
      console.log('📡 Fetching user discount codes...');
      const { data: userCodes, error: codesError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('influencer_id', currentUser.id);

      console.log('🎟️ User codes result:', { userCodes, codesError });

      if (codesError) {
        console.error('❌ Codes error:', codesError);
        // Kod hatası olsa bile devam et, belki kod yoktur
        console.log('⚠️ No discount codes found, continuing...');
      }

      const userDiscountCodes = userCodes?.map(code => code.code) || [];
      console.log('📋 User discount codes:', userDiscountCodes);
      
      // 3. Kampanyaları al
      console.log('📡 Fetching campaigns...');
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('influencer_id', currentUser.id)
        .order('created_at', { ascending: false });

      console.log('🎯 Campaigns result:', { campaignsData, campaignsError });

      if (campaignsError) {
        console.warn('⚠️ Campaigns error (non-blocking):', campaignsError);
      }

      // 4. Siparişleri al (sadece kullanıcının kodları varsa)
      console.log('📡 Fetching orders...');
      let ordersData = [];
      if (userDiscountCodes.length > 0) {
        console.log('🔍 Searching orders with codes:', userDiscountCodes);
        
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('enrolled', true)
          .in('discountcode', userDiscountCodes)
          .order('created_at', { ascending: false });

        console.log('📦 Orders result:', { orders, ordersError });

        if (ordersError) {
          console.warn('⚠️ Orders error (non-blocking):', ordersError);
        } else {
          ordersData = orders || [];
        }
      } else {
        console.log('⚠️ No discount codes found, skipping orders fetch');
      }

      // 5. Veri işleme
      console.log('🔄 Processing data...');
      
      // Satış verilerini işle
      const processedSales: RecentSale[] = ordersData.map(order => {
        const matchingDiscountCode = userCodes?.find(code => code.code === order.discountcode);
        const commissionRate = matchingDiscountCode?.commission || 15;
        const commissionAmount = calculateCommission(order.amount, order.discountamount || 0, commissionRate);

        return {
          id: order.id,
          coursename: order.coursename,
          student_name: order.useremail.split('@')[0],
          amount: order.amount,
          commission_amount: commissionAmount,
          commission_rate: commissionRate,
          status: order.status,
          created_at: order.created_at,
          discountcode: order.discountcode
        };
      });

      console.log('✅ Processed sales:', processedSales.length, 'sales');

      // İstatistikleri hesapla
      console.log('📊 Calculating statistics...');
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const totalCommission = processedSales.reduce((sum, sale) => sum + sale.commission_amount, 0);
      const thisMonthCommission = processedSales
        .filter(sale => new Date(sale.created_at) >= startOfMonth)
        .reduce((sum, sale) => sum + sale.commission_amount, 0);
      const thisWeekCommission = processedSales
        .filter(sale => new Date(sale.created_at) >= startOfWeek)
        .reduce((sum, sale) => sum + sale.commission_amount, 0);
      const totalStudents = new Set(processedSales.map(sale => sale.student_name)).size;
      const activeCourses = new Set(processedSales.map(sale => sale.coursename)).size;
      const averageCommissionRate = processedSales.length > 0 
        ? processedSales.reduce((sum, sale) => sum + sale.commission_rate, 0) / processedSales.length
        : 0;
      const completedSales = processedSales.filter(sale => sale.status === 'completed').length;
      const pendingSales = processedSales.filter(sale => sale.status === 'pending').length;
      const usedCodes = userCodes?.filter(code => code.is_used).length || 0;

      const calculatedStats = {
        totalCommission,
        thisMonthCommission,
        thisWeekCommission,
        totalStudents,
        activeCourses,
        totalCampaigns: campaignsData?.length || 0,
        totalCodes: userCodes?.length || 0,
        usedCodes,
        averageCommissionRate,
        completedSales,
        pendingSales
      };

      console.log('📈 Calculated stats:', calculatedStats);

      // State'leri güncelle
      setStats(calculatedStats);
      setRecentSales(processedSales.slice(0, 4));
      
      // En iyi kursları hesapla
      const courseMap = new Map();
      processedSales.forEach(sale => {
        if (!courseMap.has(sale.coursename)) {
          courseMap.set(sale.coursename, {
            course_id: sale.coursename,
            course_name: sale.coursename,
            total_commission: 0,
            sales_count: 0,
            student_count: new Set()
          });
        }
        
        const course = courseMap.get(sale.coursename);
        course.total_commission += sale.commission_amount;
        course.sales_count += 1;
        course.student_count.add(sale.student_name);
      });

      const topCoursesData = Array.from(courseMap.values())
        .map(course => ({
          ...course,
          student_count: course.student_count.size
        }))
        .sort((a, b) => b.total_commission - a.total_commission)
        .slice(0, 3);

      setTopCourses(topCoursesData);

      // Aktif kampanyalar
      const activeCampaignsData = campaignsData
        ?.filter(campaign => campaign.status === 'active')
        .map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          codes_count: userCodes?.filter(code => code.campaign_id === campaign.id).length || 0,
          end_date: campaign.end_date
        }))
        .slice(0, 3) || [];

      setActiveCampaigns(activeCampaignsData);

      console.log('✅ Dashboard data fetch completed successfully');

    } catch (err: unknown) {
      console.error('💥 Error fetching dashboard data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Veriler yüklenirken bir hata oluştu';
      setError(errorMessage);
    } finally {
      console.log('🔚 Dashboard data fetch finished');
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && connectionStatus === 'connected') {
      console.log('🚀 Dashboard useEffect triggered with user:', currentUser);
      fetchDashboardData().catch(err => {
        console.error('🔥 Unhandled error in fetchDashboardData:', err);
      });
    } else if (connectionStatus === 'failed') {
      console.log('❌ Skipping data fetch due to connection failure');
      setLoading(false);
    } else {
      console.log('⏳ Waiting for currentUser and connection...', { 
        hasUser: !!currentUser, 
        connectionStatus 
      });
    }
  }, [currentUser, connectionStatus, fetchDashboardData]);

  // Handle refresh
  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading || connectionStatus === 'testing') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mb-8"></div>
            
            {connectionStatus === 'testing' && (
              <div className="text-center py-8">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                  Veritabanı bağlantısı test ediliyor...
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
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
        </div>
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {t.welcome}, {currentUser.name}! 👋
              </h1>
              <div className="w-12 sm:w-16 h-px bg-[#990000] mb-4"></div>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
                {t.subtitle}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="mt-4 lg:mt-0 flex items-center px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t.actions.refresh}
            </button>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title={t.metrics.totalCommission}
            value={formatCurrency(stats.totalCommission, locale)}
            icon={DollarSign}
            color="text-green-500"
            href={`/${locale}/influencer/sales`}
          />
          <StatCard
            title={t.metrics.totalStudents}
            value={stats.totalStudents}
            icon={Users}
            color="text-purple-500"
            href={`/${locale}/influencer/sales`}
          />
          <StatCard
            title={t.metrics.activeCourses}
            value={stats.activeCourses}
            icon={Award}
            color="text-red-500"
            href={`/${locale}/influencer/sales`}
          />
          <StatCard
            title={t.metrics.totalCampaigns}
            value={stats.totalCampaigns}
            icon={Target}
            color="text-blue-500"
            href={`/${locale}/influencer/campaigns`}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 text-green-900 dark:text-green-100 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg sm:text-xl font-bold">
                {formatCurrency(stats.thisMonthCommission, locale)}
              </span>
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs sm:text-sm">
              {t.metrics.thisMonthCommission}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg sm:text-xl font-bold">
                {formatCurrency(stats.thisWeekCommission, locale)}
              </span>
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs sm:text-sm">
              {t.metrics.thisWeekCommission}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 text-purple-900 dark:text-purple-100 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg sm:text-xl font-bold">
                {stats.totalCodes}
              </span>
              <Tag className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs sm:text-sm">
              {t.metrics.totalCodes} ({stats.usedCodes} {t.status.used.toLowerCase()})
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700 text-orange-900 dark:text-orange-100 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg sm:text-xl font-bold">
                %{stats.averageCommissionRate.toFixed(1)}
              </span>
              <Percent className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs sm:text-sm">
              {t.metrics.averageCommission}
            </p>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-6">
            {t.quickActions.title}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href={`/${locale}/influencer/sales`}>
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] transition-colors">
                      {t.quickActions.viewSalesTitle}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      {t.quickActions.viewSalesDesc}
                    </p>
                    <div className="flex items-center text-sm text-[#990000] font-medium">
                      <span>Detayları Gör</span>
                      <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href={`/${locale}/influencer/campaigns`}>
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] transition-colors">
                      {t.quickActions.viewCampaignsTitle}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      {t.quickActions.viewCampaignsDesc}
                    </p>
                    <div className="flex items-center text-sm text-[#990000] font-medium">
                      <span>Detayları Gör</span>
                      <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href={`/${locale}/influencer/docs`}>
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] transition-colors">
                      {t.quickActions.viewDocsTitle}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      {t.quickActions.viewDocsDesc}
                    </p>
                    <div className="flex items-center text-sm text-[#990000] font-medium">
                      <span>Detayları Gör</span>
                      <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href={`/${locale}/influencer/performance`}>
              <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] transition-colors">
                      {t.quickActions.viewPerformanceTitle}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      {t.quickActions.viewPerformanceDesc}
                    </p>
                    <div className="flex items-center text-sm text-[#990000] font-medium">
                      <span>Detayları Gör</span>
                      <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Data Preview Sections */}
        {(recentSales.length > 0 || topCourses.length > 0 || activeCampaigns.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
            {/* Recent Sales Preview */}
            {recentSales.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    {t.sections.recentSales}
                  </h2>
                  <Link 
                    href={`/${locale}/influencer/sales`}
                    className="text-sm text-[#990000] hover:text-[#770000] font-medium flex items-center"
                  >
                    {t.actions.viewAll}
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {recentSales.slice(0, 3).map((sale) => (
                    <div key={sale.id} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {sale.coursename}
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {sale.student_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {formatCurrency(sale.commission_amount, locale)}
                        </span>
                        <span className="text-neutral-500 dark:text-neutral-400">
                          {formatShortDate(sale.created_at, locale)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Courses Preview */}
            {topCourses.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    {t.sections.topCourses}
                  </h2>
                  <Link 
                    href={`/${locale}/influencer/performance`}
                    className="text-sm text-[#990000] hover:text-[#770000] font-medium flex items-center"
                  >
                    {t.actions.viewDetails}
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {topCourses.slice(0, 3).map((course) => (
                    <div key={course.course_id} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2">
                        {course.course_name}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">Komisyon:</span>
                          <span className="font-medium text-green-600 dark:text-green-400 ml-1">
                            {formatCurrency(course.total_commission, locale)}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">Satış:</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400 ml-1">
                            {course.sales_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Campaigns Preview */}
            {activeCampaigns.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    {t.sections.activeCampaigns}
                  </h2>
                  <Link 
                    href={`/${locale}/influencer/campaigns`}
                    className="text-sm text-[#990000] hover:text-[#770000] font-medium flex items-center"
                  >
                    {t.actions.viewAll}
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {activeCampaigns.slice(0, 3).map((campaign) => (
                    <div key={campaign.id} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                        {campaign.name}
                      </h4>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">
                          {campaign.codes_count} kod
                        </span>
                        <span className="text-neutral-500 dark:text-neutral-400">
                          {formatShortDate(campaign.end_date, locale)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats Footer */}
        <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(stats.totalCommission, locale)}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Toplam Kazanç
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.completedSales}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Tamamlanan Satış
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.totalStudents}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Etkilenen Öğrenci
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                %{stats.averageCommissionRate.toFixed(1)}
              </div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Ortalama Komisyon
              </div>
            </div>
          </div>
        </div>
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