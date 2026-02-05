'use client';

import React, { useState, useEffect, use } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText,
  TrendingUp,
  Calendar,
  Download,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCvDownloadUrl } from './utils/cvDownload';

// Supabase client
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || ''
});

// Types
interface InternshipApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  school: string;
  grade: string;
  position: string;
  motivation: string;
  status: 'pending' | 'under_review' | 'interview' | 'accepted' | 'rejected';
  cv_file_name: string;
  cv_storage_path: string;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  total: number;
  pending: number;
  under_review: number;
  interview: number;
  accepted: number;
  rejected: number;
  thisWeek: number;
  thisMonth: number;
}

// Localized texts
const texts = {
  tr: {
    title: "Staj Başvuruları",
    subtitle: "Başvuruları görüntüleyin ve yönetin",
    stats: {
      total: "Toplam Başvuru",
      pending: "Bekleyen",
      underReview: "İncelemede",
      interview: "Mülakatta",
      accepted: "Kabul Edilen",
      rejected: "Reddedilen",
      thisWeek: "Bu Hafta",
      thisMonth: "Bu Ay"
    },
    recentApplications: "Son Başvurular",
    viewAll: "Tümünü Gör",
    noApplications: "Henüz başvuru bulunmuyor",
    loading: "Yükleniyor...",
    error: "Veriler yüklenirken bir hata oluştu",
    statusLabels: {
      pending: "Bekliyor",
      under_review: "İncelemede",
      interview: "Mülakat",
      accepted: "Kabul Edildi",
      rejected: "Reddedildi"
    },
    viewDetails: "Detayları Gör",
    downloadCV: "CV İndir",
    quickStats: "Hızlı İstatistikler",
    applicationTrend: "Başvuru Trendi",
    positionDistribution: "Pozisyon Dağılımı",
    schoolDistribution: "Okul Dağılımı"
  },
  en: {
    title: "Internship Applications",
    subtitle: "View and manage applications",
    stats: {
      total: "Total Applications",
      pending: "Pending",
      underReview: "Under Review",
      interview: "Interview",
      accepted: "Accepted",
      rejected: "Rejected",
      thisWeek: "This Week",
      thisMonth: "This Month"
    },
    recentApplications: "Recent Applications",
    viewAll: "View All",
    noApplications: "No applications yet",
    loading: "Loading...",
    error: "An error occurred while loading data",
    statusLabels: {
      pending: "Pending",
      under_review: "Under Review",
      interview: "Interview",
      accepted: "Accepted",
      rejected: "Rejected"
    },
    viewDetails: "View Details",
    downloadCV: "Download CV",
    quickStats: "Quick Stats",
    applicationTrend: "Application Trend",
    positionDistribution: "Position Distribution",
    schoolDistribution: "School Distribution"
  }
};

// Status color helper
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'under_review':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'interview':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'accepted':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
  }
};

// Format date helper
const formatDate = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatRelativeTime = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInHours < 1) {
    return locale === 'tr' ? 'Az önce' : 'Just now';
  } else if (diffInHours < 24) {
    return locale === 'tr' ? `${diffInHours} saat önce` : `${diffInHours} hours ago`;
  } else if (diffInDays < 7) {
    return locale === 'tr' ? `${diffInDays} gün önce` : `${diffInDays} days ago`;
  } else {
    return formatDate(dateString, locale);
  }
};

// Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend 
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType; 
  color: string;
  trend?: { value: number; isPositive: boolean };
}) => (
  <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
        {trend && (
          <div className={`flex items-center mt-1 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-3 h-3 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
            <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// Application Card Component
const ApplicationCard = ({ 
  application, 
  locale, 
  t, 
  onDownloadCv,
  downloading
}: { 
  application: InternshipApplication; 
  locale: string;
  t: typeof texts.tr;
  onDownloadCv?: (application: InternshipApplication) => void;
  downloading?: boolean;
}) => (
  <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#990000] to-[#660000] flex items-center justify-center text-white font-semibold text-sm">
            {application.first_name?.[0]}{application.last_name?.[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {application.first_name} {application.last_name}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
              {application.position || 'Pozisyon belirtilmemiş'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400 mb-3">
          <div className="flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            <span className="truncate">{application.school}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            <span className="truncate">{application.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            <span>{application.grade}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatRelativeTime(application.created_at, locale)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2 ml-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
          {t.statusLabels[application.status as keyof typeof t.statusLabels]}
        </span>
      </div>
    </div>
    
    <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-700 mt-3">
      <div className="flex items-center gap-2">
        {application.cv_file_name && (
          <button 
            onClick={() => onDownloadCv?.(application)}
            disabled={!onDownloadCv || downloading}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-[#990000] dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={downloading ? (locale === 'tr' ? 'İndiriliyor...' : 'Downloading...') : t.downloadCV}
          >
            {downloading ? (
              <span>{locale === 'tr' ? 'İndiriliyor' : 'Downloading'}</span>
            ) : (
              <>
                <Download className="w-3 h-3" />
                <span>CV</span>
              </>
            )}
          </button>
        )}
      </div>
      <Link 
        href={`/${locale}/internship/applications/${application.id}`}
        className="flex items-center gap-1 text-xs text-[#990000] hover:text-[#770000] dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
      >
        {t.viewDetails}
        <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  </div>
);

// Main Component
export default function InternshipDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const t = texts[locale as keyof typeof texts] || texts.tr;
  
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    under_review: 0,
    interview: 0,
    accepted: 0,
    rejected: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const { user: clerkUser, isLoaded } = useUser();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!isLoaded || !clerkUser) return;
      
      try {
        setLoading(true);
        
        // Fetch all applications
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('internship_applications')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (applicationsError) throw applicationsError;
        
        const apps = applicationsData || [];
        setApplications(apps);
        
        // Calculate stats
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const calculatedStats: DashboardStats = {
          total: apps.length,
          pending: apps.filter(a => a.status === 'pending').length,
          under_review: apps.filter(a => a.status === 'under_review').length,
          interview: apps.filter(a => a.status === 'interview').length,
          accepted: apps.filter(a => a.status === 'accepted').length,
          rejected: apps.filter(a => a.status === 'rejected').length,
          thisWeek: apps.filter(a => new Date(a.created_at) >= oneWeekAgo).length,
          thisMonth: apps.filter(a => new Date(a.created_at) >= oneMonthAgo).length
        };
        
        setStats(calculatedStats);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isLoaded, clerkUser]);

  const handleDownloadCv = async (application: InternshipApplication) => {
    if (!application.cv_storage_path) {
      alert(locale === 'tr' ? 'CV bulunamadı.' : 'No CV file attached.');
      return;
    }

    try {
      setDownloadingId(application.id);
      const url = await getCvDownloadUrl(supabase, application.cv_storage_path);

      if (!url) {
        throw new Error('CV URL missing');
      }

      window.open(url, '_blank', 'noopener');
    } catch (err) {
      console.error('Error downloading CV:', err);
      alert(locale === 'tr'
        ? 'CV indirilirken bir hata oluştu.'
        : 'Unable to download the CV.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-2"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-48 mb-8"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl p-5 h-24"></div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg p-4 h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {t.error}: {error}
          </div>
        </div>
      </div>
    );
  }

  // Auth check
  if (!clerkUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">
          {locale === 'tr' ? 'Lütfen giriş yapınız.' : 'Please log in.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {t.title}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {t.subtitle}
          </p>
          <div className="w-12 h-1 bg-[#990000] mt-3 rounded"></div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title={t.stats.total} 
            value={stats.total} 
            icon={Users} 
            color="bg-gradient-to-br from-[#990000] to-[#660000]"
          />
          <StatCard 
            title={t.stats.pending} 
            value={stats.pending} 
            icon={Clock} 
            color="bg-gradient-to-br from-yellow-500 to-yellow-600"
          />
          <StatCard 
            title={t.stats.accepted} 
            value={stats.accepted} 
            icon={CheckCircle} 
            color="bg-gradient-to-br from-green-500 to-green-600"
          />
          <StatCard 
            title={t.stats.rejected} 
            value={stats.rejected} 
            icon={XCircle} 
            color="bg-gradient-to-br from-red-500 to-red-600"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title={t.stats.underReview} 
            value={stats.under_review} 
            icon={FileText} 
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard 
            title={t.stats.interview} 
            value={stats.interview} 
            icon={Briefcase} 
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatCard 
            title={t.stats.thisWeek} 
            value={stats.thisWeek} 
            icon={Calendar} 
            color="bg-gradient-to-br from-indigo-500 to-indigo-600"
          />
          <StatCard 
            title={t.stats.thisMonth} 
            value={stats.thisMonth} 
            icon={TrendingUp} 
            color="bg-gradient-to-br from-teal-500 to-teal-600"
          />
        </div>

        {/* Recent Applications */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t.recentApplications}
            </h2>
            <Link 
              href={`/${locale}/internship/applications`}
              className="flex items-center gap-1 text-sm text-[#990000] hover:text-[#770000] dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
            >
              {t.viewAll}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="p-4">
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {t.noApplications}
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {applications.slice(0, 6).map((application) => (
                  <ApplicationCard 
                    key={application.id} 
                    application={application} 
                    locale={locale} 
                    t={t}
                    onDownloadCv={handleDownloadCv}
                    downloading={downloadingId === application.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
