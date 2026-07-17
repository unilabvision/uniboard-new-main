'use client';

import React, { useState, useEffect } from 'react';
import { 
  Eye, Edit, Copy,
  Clock, Users, DollarSign, Target,
  CheckCircle, Pause, Play,
  Folder, Tag, Percent, Plus
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

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
interface Campaign {
  id: string;
  name: string;
  description?: string;
  target_audience?: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  influencer_id: string;
  created_at: string;
}

interface DiscountCode {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: 'fixed' | 'percentage';
  valid_until: string;
  applicable_courses: string[];
  is_one_time: boolean;
  is_used: boolean;
  used_by?: string;
  used_at?: string;
  influencer_id: string;
  campaign_id?: string;
  commission: number;
  max_usage?: number;
  usage_count?: number;
  created_at: string;
  campaign?: Campaign;
}

interface User {
  id: string;
  name: string;
  email: string;
  commission_rate: number;
  userType?: string;
}

// Icon component type
type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

// Texts interface
interface LocalizedTexts {
  title: string;
  subtitle: string;
  tabs: {
    campaigns: string;
    codes: string;
  };
  actions: {
    copyCode: string;
    viewCodes: string;
  };
  filters: {
    all: string;
    active: string;
    used: string;
    expired: string;
    paused: string;
    completed: string;
    draft: string;
  };
  status: {
    active: string;
    used: string;
    expired: string;
    paused: string;
    completed: string;
    draft: string;
  };
  campaign: {
    name: string;
    description: string;
    targetAudience: string;
    startDate: string;
    endDate: string;
    status: string;
    codesCount: string;
    createdAt: string;
  };
  code: {
    code: string;
    discountType: string;
    discountAmount: string;
    validUntil: string;
    oneTime: string;
    usedBy: string;
    usedAt: string;
    createdAt: string;
    daysLeft: string;
    performance: string;
    campaign: string;
    commission: string;
  };
  empty: {
    campaignsTitle: string;
    campaignsSubtitle: string;
    campaignsAction: string;
    codesTitle: string;
    codesSubtitle: string;
    codesAction: string;
  };
  toast: {
    codeCopied: string;
  };
  loading: string;
  error: string;
}

// Dil metinleri
const texts: Record<string, LocalizedTexts> = {
  tr: {
    title: "Kampanya & İndirim Kodlarım",
    subtitle: "Kampanyalarınızı görüntüleyin. Yeni kod oluşturmak ve kullanan e-postaları görmek için Kodlarım sayfasını kullanın.",
    tabs: {
      campaigns: "Kampanyalar",
      codes: "İndirim Kodları"
    },
    actions: {
      copyCode: "Kodu Kopyala",
      viewCodes: "Kodları Görüntüle"
    },
    filters: {
      all: "Tümü",
      active: "Aktif",
      used: "Kullanıldı",
      expired: "Süresi Doldu",
      paused: "Duraklatıldı",
      completed: "Tamamlandı",
      draft: "Taslak"
    },
    status: {
      active: "Aktif",
      used: "Kullanıldı",
      expired: "Süresi Doldu",
      paused: "Duraklatıldı",
      completed: "Tamamlandı",
      draft: "Taslak"
    },
    campaign: {
      name: "Kampanya Adı",
      description: "Açıklama",
      targetAudience: "Hedef Kitle",
      startDate: "Başlangıç",
      endDate: "Bitiş",
      status: "Durum",
      codesCount: "Kod Sayısı",
      createdAt: "Oluşturulma"
    },
    code: {
      code: "Kod",
      discountType: "İndirim Tipi",
      discountAmount: "İndirim Miktarı",
      validUntil: "Geçerlilik",
      oneTime: "Tek Kullanım",
      usedBy: "Kullanan",
      usedAt: "Kullanım Tarihi",
      createdAt: "Oluşturulma",
      daysLeft: "Kalan Gün",
      performance: "Performans",
      campaign: "Kampanya",
      commission: "Komisyon"
    },
    empty: {
      campaignsTitle: "Henüz kampanyanız yok",
      campaignsSubtitle: "Size bağlı kampanyalar burada görünecek",
      campaignsAction: "",
      codesTitle: "Henüz indirim kodunuz yok",
      codesSubtitle: "Kod oluşturmak için Kodlarım sayfasına gidin",
      codesAction: "Kodlarıma git"
    },
    toast: {
      codeCopied: "Kod kopyalandı"
    },
    loading: "Yükleniyor...",
    error: "Veriler yüklenirken bir hata oluştu"
  },
  en: {
    title: "My Campaigns & Discount Codes",
    subtitle: "View your campaigns. Use My Codes to create codes and see which emails used them.",
    tabs: {
      campaigns: "Campaigns",
      codes: "Discount Codes"
    },
    actions: {
      copyCode: "Copy Code",
      viewCodes: "View Codes"
    },
    filters: {
      all: "All",
      active: "Active",
      used: "Used",
      expired: "Expired",
      paused: "Paused",
      completed: "Completed",
      draft: "Draft"
    },
    status: {
      active: "Active",
      used: "Used",
      expired: "Expired",
      paused: "Paused",
      completed: "Completed",
      draft: "Draft"
    },
    campaign: {
      name: "Campaign Name",
      description: "Description",
      targetAudience: "Target Audience",
      startDate: "Start Date",
      endDate: "End Date",
      status: "Status",
      codesCount: "Codes Count",
      createdAt: "Created"
    },
    code: {
      code: "Code",
      discountType: "Discount Type",
      discountAmount: "Discount Amount",
      validUntil: "Valid Until",
      oneTime: "One Time",
      usedBy: "Used By",
      usedAt: "Used At",
      createdAt: "Created",
      daysLeft: "Days Left",
      performance: "Performance",
      campaign: "Campaign",
      commission: "Commission"
    },
    empty: {
      campaignsTitle: "No campaigns yet",
      campaignsSubtitle: "Your linked campaigns will appear here",
      campaignsAction: "",
      codesTitle: "No discount codes yet",
      codesSubtitle: "Go to My Codes to create a code",
      codesAction: "Go to My Codes"
    },
    toast: {
      codeCopied: "Code copied"
    },
    loading: "Loading...",
    error: "An error occurred while loading data"
  }
};

// Utility Functions
const formatDate = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getStatusColor = (status: string, isCode: boolean = false) => {
  if (isCode) {
    // Discount code status colors
    if (status === 'used') {
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    } else if (status === 'expired') {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    } else {
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  } else {
    // Campaign status colors
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/20 dark:text-neutral-400';
    }
  }
};

const getStatusIcon = (code: DiscountCode): IconComponent => {
  if (code.is_used) {
    return CheckCircle;
  } else if (new Date(code.valid_until) < new Date()) {
    return Clock;
  } else {
    return Target;
  }
};

const getCampaignStatusIcon = (status: string): IconComponent => {
  switch (status) {
    case 'active':
      return Play;
    case 'paused':
      return Pause;
    case 'completed':
      return CheckCircle;
    case 'draft':
      return Edit;
    default:
      return Target;
  }
};

const getStatusText = (code: DiscountCode, t: LocalizedTexts) => {
  if (code.is_used) {
    return t.status.used;
  } else if (new Date(code.valid_until) < new Date()) {
    return t.status.expired;
  } else {
    return t.status.active;
  }
};

const getDaysLeft = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Components
const FilterButton = ({ 
  active, 
  onClick, 
  children,
  count 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm ${
      active
        ? 'bg-[#990000] dark:bg-red-600 text-white shadow-md'
        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700'
    }`}
  >
    {children}
    {count !== undefined && (
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
        active 
          ? 'bg-white/20 text-white' 
          : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
      }`}>
        {count}
      </span>
    )}
  </button>
);

const CampaignCard = ({ 
  campaign, 
  locale, 
  t,
  codesCount,
  onViewCodes
}: { 
  campaign: Campaign; 
  locale: string; 
  t: LocalizedTexts;
  codesCount: number;
  onViewCodes: (campaign: Campaign) => void;
}) => {
  const StatusIcon = getCampaignStatusIcon(campaign.status);
  const daysLeft = getDaysLeft(campaign.end_date);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            {/* Campaign Icon */}
            <div className="w-16 h-16 rounded-lg bg-[#990000]/10 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Folder className="w-8 h-8 text-[#990000] dark:text-red-400" />
            </div>

            {/* Campaign Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100 mb-2">
                {campaign.name}
              </h3>
              
              {campaign.description && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                  {campaign.description}
                </p>
              )}
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full">
                  {formatDate(campaign.start_date, locale)} - {formatDate(campaign.end_date, locale)}
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                  {codesCount} kod
                </span>
               
              </div>
            </div>
          </div>

          {/* Status & View Button */}
          <div className="flex flex-col items-end space-y-2">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {t.status[campaign.status as keyof typeof t.status]}
            </div>
            
            {/* View Codes Button */}
            <button
              onClick={() => onViewCodes(campaign)}
              className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title={t.actions.viewCodes}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block">
              Kalan Gün
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {daysLeft} gün
            </span>
          </div>
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block">
              {t.campaign.createdAt}
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {formatDate(campaign.created_at, locale)}
            </span>
          </div>
        </div>

        {/* Target Audience */}
        {campaign.target_audience && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-2 text-sm">
              <Users className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-500 dark:text-neutral-400">
                Hedef Kitle:
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {campaign.target_audience}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-neutral-50 dark:bg-neutral-900 px-4 sm:px-6 py-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          ID: {campaign.id.slice(0, 8)}...
        </div>
        
        <button
          onClick={() => onViewCodes(campaign)}
          className="flex items-center px-3 py-1.5 text-xs bg-[#990000] hover:bg-[#770000] dark:bg-red-600 dark:hover:bg-red-700 text-white rounded transition-colors"
        >
          <Eye className="w-3 h-3 mr-1" />
          Kodları Gör
        </button>
      </div>
    </div>
  );
};

const DiscountCodeCard = ({ 
  code, 
  locale, 
  t,
  onCopy
}: { 
  code: DiscountCode; 
  locale: string; 
  t: LocalizedTexts;
  onCopy: (code: DiscountCode) => void;
}) => {
  const StatusIcon = getStatusIcon(code);
  const daysLeft = getDaysLeft(code.valid_until);
  const statusText = getStatusText(code, t);

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300">
      {/* Header */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4 flex-1">
            {/* Code Icon */}
            <div className="w-16 h-16 rounded-lg bg-[#990000]/10 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
              {code.discount_type === 'percentage' ? (
                <Percent className="w-8 h-8 text-[#990000] dark:text-red-400" />
              ) : (
                <DollarSign className="w-8 h-8 text-[#990000] dark:text-red-400" />
              )}
            </div>

            {/* Code Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-mono font-bold text-lg text-neutral-900 dark:text-neutral-100">
                  {code.code}
                </h3>
                <button
                  onClick={() => onCopy(code)}
                  className="p-1 text-neutral-400 hover:text-[#990000] dark:hover:text-red-400 transition-colors"
                  title={t.actions.copyCode}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl font-bold text-[#990000] dark:text-red-400">
                  {code.discount_type === 'percentage' ? `%${code.discount_amount}` : `₺${code.discount_amount}`}
                </span>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {code.discount_type === 'percentage' ? 'indirim' : 'sabit indirim'}
                </span>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 text-xs">
                {code.is_one_time && (
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full">
                    {t.code.oneTime}
                  </span>
                )}
                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full">
                  Geçerli: {formatDate(code.valid_until, locale)}
                </span>
                {/* Komisyon bilgisi */}
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
                  %{code.commission} komisyon
                </span>
                {code.campaign && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                    {code.campaign.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col items-end space-y-2">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(statusText, true)}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusText}
            </div>
          </div>
        </div>

        {/* Code Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block">
              {code.is_used ? t.code.usedAt : t.code.daysLeft}
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {code.is_used && code.used_at 
                ? formatDate(code.used_at, locale)
                : code.is_used 
                ? '-'
                : `${daysLeft} gün`
              }
            </span>
          </div>
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block">
              {t.code.commission}
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              %{code.commission}
            </span>
          </div>
        </div>

        {/* Used By Info */}
        {code.is_used && code.used_by && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-2 text-sm">
              <Users className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-500 dark:text-neutral-400">
                {t.code.usedBy}:
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {code.used_by}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-neutral-50 dark:bg-neutral-900 px-4 sm:px-6 py-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          ID: {code.id.slice(0, 8)}...
        </div>
        
        <button
          onClick={() => onCopy(code)}
          className="flex items-center px-3 py-1.5 text-xs bg-[#990000] hover:bg-[#770000] dark:bg-red-600 dark:hover:bg-red-700 text-white rounded transition-colors"
        >
          <Copy className="w-3 h-3 mr-1" />
          Kopyala
        </button>
      </div>
    </div>
  );
};

// Main Component
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'codes'>('campaigns');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  // Clerk user hook
  const { user: clerkUser, isLoaded } = useUser();
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const t = texts[locale] || texts.tr;

  // Toast function
  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => {
      setToast({ message: '', show: false });
    }, 3000);
  };

  // Kullanıcı bilgilerini al
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!isLoaded) return;
      
      if (!clerkUser) {
        setLoading(false);
        return;
      }

      try {
        console.log('Clerk user found:', clerkUser.id);
        
        const { data: profile, error: profileError } = await supabaseProfiles
          .from('myuni_profiles')
          .select('*')
          .eq('clerk_user_id', clerkUser.id)
          .single();
        
        console.log('Profile data:', profile, 'Error:', profileError);
        
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

  // Kampanyaları ve kodları al
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        console.log('Fetching data for user:', currentUser.id);
        
        // Fetch campaigns
        const { data: campaignsData, error: campaignsError } = await supabaseMain
          .from('campaigns')
          .select('*')
          .eq('influencer_id', currentUser.id)
          .order('created_at', { ascending: false });
        
        console.log('Fetched campaigns:', campaignsData, 'Error:', campaignsError);
        
        // Fetch discount codes with campaign info and commission
        const { data: codesData, error: codesError } = await supabaseMain
          .from('discount_codes')
          .select(`
            *,
            campaign:campaigns(*)
          `)
          .eq('influencer_id', currentUser.id)
          .order('created_at', { ascending: false });
        
        console.log('Fetched codes:', codesData, 'Error:', codesError);
        
        if (campaignsError) {
          console.error('Error fetching campaigns:', campaignsError);
          setCampaigns([]);
        } else {
          setCampaigns(campaignsData || []);
        }

        if (codesError) {
          console.error('Error fetching codes:', codesError);
          setDiscountCodes([]);
        } else {
          // Eğer commission alanı yoksa varsayılan 15; tek kullanım max_usage=1
          const processedCodes = (codesData || []).map((code) => ({
            ...code,
            commission: code.commission || 15,
            is_one_time: Number(code.max_usage) === 1,
          }));
          setDiscountCodes(processedCodes);
        }
      } catch (error) {
        console.error('Catch error:', error);
        setCampaigns([]);
        setDiscountCodes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Filter data based on active tab and filters
  const getFilteredData = () => {
    if (activeTab === 'campaigns') {
      return campaigns.filter(campaign => {
        if (activeFilter === 'all') return true;
        return campaign.status === activeFilter;
      });
    } else {
      let filtered = discountCodes;
      
      // Filter by campaign if selected
      if (selectedCampaign) {
        filtered = filtered.filter(code => code.campaign_id === selectedCampaign);
      }
      
      // Filter by status
      filtered = filtered.filter(code => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'used') return code.is_used;
        if (activeFilter === 'expired') return !code.is_used && new Date(code.valid_until) < new Date();
        if (activeFilter === 'active') return !code.is_used && new Date(code.valid_until) >= new Date();
        return true;
      });
      
      return filtered;
    }
  };

  // Get counts for filters
  const getStatusCounts = () => {
    if (activeTab === 'campaigns') {
      return {
        all: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        paused: campaigns.filter(c => c.status === 'paused').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        draft: campaigns.filter(c => c.status === 'draft').length
      };
    } else {
      let codes = discountCodes;
      if (selectedCampaign) {
        codes = codes.filter(code => code.campaign_id === selectedCampaign);
      }
      return {
        all: codes.length,
        active: codes.filter(c => !c.is_used && new Date(c.valid_until) >= new Date()).length,
        used: codes.filter(c => c.is_used).length,
        expired: codes.filter(c => !c.is_used && new Date(c.valid_until) < new Date()).length
      };
    }
  };

  const statusCounts = getStatusCounts();

  // Campaign handlers
  const handleViewCodes = (campaign: Campaign) => {
    setSelectedCampaign(campaign.id);
    setActiveTab('codes');
  };

  // Code handlers
  const handleCopyCode = (code: DiscountCode) => {
    navigator.clipboard.writeText(code.code);
    showToast(t.toast.codeCopied);
  };

  // Get campaign codes count
  const getCampaignCodesCount = (campaignId: string) => {
    return discountCodes.filter(code => code.campaign_id === campaignId).length;
  };

  // Calculate overall average commission from discount codes
  const getOverallAvgCommission = () => {
    if (discountCodes.length === 0) return 15;
    const totalCommission = discountCodes.reduce((sum, code) => sum + (code.commission || 15), 0);
    return totalCommission / discountCodes.length;
  };

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mb-8"></div>
            
            <div className="flex space-x-4 mb-8">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-3 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg border overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
                        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-20 mb-3"></div>
                        <div className="flex space-x-2">
                          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-16"></div>
                          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[...Array(2)].map((_, j) => (
                        <div key={j} className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-750 p-4">
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
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

  const filteredData = getFilteredData();

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
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center">
              <Folder className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {campaigns.length}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Toplam Kampanya
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center">
              <Tag className="w-8 h-8 text-[#990000] dark:text-red-400 mr-3" />
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {discountCodes.length}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Toplam Kod
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {discountCodes.filter(c => c.is_used).length}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Kullanılan
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center">
              <Percent className="w-8 h-8 text-[#990000] dark:text-red-400 mr-3" />
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  %{getOverallAvgCommission().toFixed(1)}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Ortalama Komisyon
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="rounded-lg border border-[#990000]/20 bg-[#990000]/5 dark:bg-[#990000]/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {locale === 'en'
                ? 'Create codes and see which emails used them on My Codes.'
                : 'Kod oluşturmak ve hangi e-postaların kullandığını görmek için Kodlarım sayfasını kullanın.'}
            </p>
            <Link
              href={`/${locale}/influencer/codes`}
              className="inline-flex items-center px-3 py-1.5 text-sm rounded-lg bg-[#990000] text-white hover:bg-[#880000] shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {locale === 'en' ? 'My Codes' : 'Kodlarım'}
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex space-x-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => {
                setActiveTab('campaigns');
                setSelectedCampaign(null);
                setActiveFilter('all');
              }}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'campaigns'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Folder className="w-4 h-4 mr-2" />
              {t.tabs.campaigns}
            </button>
            <button
              onClick={() => {
                setActiveTab('codes');
                setActiveFilter('all');
              }}
              className={`flex items-center px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'codes'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <Tag className="w-4 h-4 mr-2" />
              {t.tabs.codes}
            </button>
          </div>
        </div>

        {/* Campaign Filter (only for codes tab) */}
        {activeTab === 'codes' && campaigns.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Kampanyaya Göre Filtrele:
            </label>
            <select
              value={selectedCampaign || ''}
              onChange={(e) => setSelectedCampaign(e.target.value || null)}
              className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
            >
              <option value="">Tüm Kampanyalar</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {activeTab === 'campaigns' ? (
              <>
                <FilterButton
                  active={activeFilter === 'all'}
                  onClick={() => setActiveFilter('all')}
                  count={statusCounts.all}
                >
                  {t.filters.all}
                </FilterButton>
                <FilterButton
                  active={activeFilter === 'active'}
                  onClick={() => setActiveFilter('active')}
                  count={statusCounts.active}
                >
                  {t.filters.active}
                </FilterButton>
                <FilterButton
                  active={activeFilter === 'paused'}
                  onClick={() => setActiveFilter('paused')}
                  count={statusCounts.paused}
                >
                  {t.filters.paused}
                </FilterButton>
                <FilterButton
                  active={activeFilter === 'completed'}
                  onClick={() => setActiveFilter('completed')}
                  count={statusCounts.completed}
                >
                  {t.filters.completed}
                </FilterButton>
                <FilterButton
                  active={activeFilter === 'draft'}
                  onClick={() => setActiveFilter('draft')}
                  count={statusCounts.draft}
                >
                  {t.filters.draft}
                </FilterButton>
              </>
            ) : (
              <>
                <FilterButton
                  active={activeFilter === 'all'}
                  onClick={() => setActiveFilter('all')}
                  count={statusCounts.all}
                >
                  {t.filters.all}
                </FilterButton>
                <FilterButton
                  active={activeFilter === 'active'}
                  onClick={() => setActiveFilter('active')}
                  count={statusCounts.active}
                >
                  {t.filters.active}
                </FilterButton>
                <FilterButton
                  active={activeFilter === 'used'}
                  onClick={() => setActiveFilter('used')}
                  count={statusCounts.used}
                >
                  {t.filters.used}
                </FilterButton>
                <FilterButton
                  active={activeFilter === 'expired'}
                  onClick={() => setActiveFilter('expired')}
                  count={statusCounts.expired}
                >
                  {t.filters.expired}
                </FilterButton>
              </>
            )}
          </div>
        </div>

        {/* Content Grid */}
        {filteredData.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeTab === 'campaigns' ? (
              (filteredData as Campaign[]).map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  locale={locale}
                  t={t}
                  codesCount={getCampaignCodesCount(campaign.id)}
                  onViewCodes={handleViewCodes}
                />
              ))
            ) : (
              (filteredData as DiscountCode[]).map((code) => (
                <DiscountCodeCard
                  key={code.id}
                  code={code}
                  locale={locale}
                  t={t}
                  onCopy={handleCopyCode}
                />
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
              {activeTab === 'campaigns' ? (
                <Folder className="w-8 h-8 text-neutral-500" />
              ) : (
                <Tag className="w-8 h-8 text-neutral-500" />
              )}
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {activeTab === 'campaigns' ? t.empty.campaignsTitle : t.empty.codesTitle}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto">
              {activeTab === 'campaigns' ? t.empty.campaignsSubtitle : t.empty.codesSubtitle}
            </p>
            {activeTab === 'codes' && t.empty.codesAction && (
              <a
                href={`/${locale}/influencer/codes`}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-[#990000] text-white text-sm font-medium hover:bg-[#880000]"
              >
                {t.empty.codesAction}
              </a>
            )}
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-4 flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                {toast.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}