'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { 
  Search, 
  Filter,
  ChevronDown,
  Eye,
  Download,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Briefcase,
  Calendar,
  GraduationCap,
  Mail,
  RefreshCw,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useSearchParams } from 'next/navigation';
import { getCvDownloadUrl } from '../utils/cvDownload';

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
  source: string;
}

// Localized texts
const texts = {
  tr: {
    title: "Staj Başvuruları",
    subtitle: "Tüm başvuruları görüntüleyin ve yönetin",
    searchPlaceholder: "İsim, email veya okul ara...",
    filterByStatus: "Duruma Göre Filtrele",
    allStatuses: "Tüm Durumlar",
    sortBy: "Sırala",
    sortOptions: {
      newest: "En Yeni",
      oldest: "En Eski",
      nameAsc: "İsim (A-Z)",
      nameDesc: "İsim (Z-A)"
    },
    statusLabels: {
      pending: "Bekliyor",
      under_review: "İncelemede",
      interview: "Mülakat",
      accepted: "Kabul Edildi",
      rejected: "Reddedildi"
    },
    columns: {
      applicant: "Başvuran",
      position: "Pozisyon",
      school: "Okul",
      status: "Durum",
      date: "Tarih",
      actions: "İşlemler"
    },
    noResults: "Sonuç bulunamadı",
    noResultsDesc: "Farklı arama kriterleri deneyin",
    clearFilters: "Filtreleri Temizle",
    loading: "Yükleniyor...",
    error: "Bir hata oluştu",
    viewDetails: "Detayları Gör",
    downloadCV: "CV İndir",
    refresh: "Yenile",
    showing: "Gösterilen",
    of: "/",
    results: "sonuç",
    perPage: "Sayfa başına",
    page: "Sayfa",
    previous: "Önceki",
    next: "Sonraki"
  },
  en: {
    title: "Internship Applications",
    subtitle: "View and manage all applications",
    searchPlaceholder: "Search name, email or school...",
    filterByStatus: "Filter by Status",
    allStatuses: "All Statuses",
    sortBy: "Sort by",
    sortOptions: {
      newest: "Newest",
      oldest: "Oldest",
      nameAsc: "Name (A-Z)",
      nameDesc: "Name (Z-A)"
    },
    statusLabels: {
      pending: "Pending",
      under_review: "Under Review",
      interview: "Interview",
      accepted: "Accepted",
      rejected: "Rejected"
    },
    columns: {
      applicant: "Applicant",
      position: "Position",
      school: "School",
      status: "Status",
      date: "Date",
      actions: "Actions"
    },
    noResults: "No results found",
    noResultsDesc: "Try different search criteria",
    clearFilters: "Clear Filters",
    loading: "Loading...",
    error: "An error occurred",
    viewDetails: "View Details",
    downloadCV: "Download CV",
    refresh: "Refresh",
    showing: "Showing",
    of: "of",
    results: "results",
    perPage: "Per page",
    page: "Page",
    previous: "Previous",
    next: "Next"
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

// Status icon helper
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return Clock;
    case 'under_review':
      return FileText;
    case 'interview':
      return Briefcase;
    case 'accepted':
      return CheckCircle;
    case 'rejected':
      return XCircle;
    default:
      return Clock;
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

// Main Component
export default function ApplicationsListPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale;
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const searchParams = useSearchParams();
  
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Dropdown states
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const { user: clerkUser, isLoaded } = useUser();

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!isLoaded || !clerkUser) return;
    
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('internship_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setApplications(data || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, clerkUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter and sort applications
  useEffect(() => {
    let filtered = [...applications];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        `${app.first_name} ${app.last_name}`.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.school?.toLowerCase().includes(query) ||
        app.position?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'nameAsc':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, locale);
        case 'nameDesc':
          return `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.last_name}`, locale);
        default:
          return 0;
      }
    });
    
    setFilteredApplications(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [applications, searchQuery, statusFilter, sortBy, locale]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowStatusDropdown(false);
        setShowSortDropdown(false);
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentApplications = filteredApplications.slice(startIndex, endIndex);

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('newest');
  };

  const handleDownloadCv = async (application: InternshipApplication) => {
    if (!application.cv_storage_path) {
      alert(locale === 'tr' ? 'CV kaydı bulunamadı.' : 'No CV file is attached.');
      return;
    }

    try {
      setDownloadingId(application.id);
      const url = await getCvDownloadUrl(supabase, application.cv_storage_path);

      if (!url) {
        throw new Error('Missing CV URL');
      }

      window.open(url, '_blank', 'noopener');
    } catch (err) {
      console.error('Error downloading CV:', err);
      alert(locale === 'tr'
        ? 'CV indirilirken bir hata oluştu. Lütfen tekrar deneyin.'
        : 'Unable to download the CV. Please try again.');
    } finally {
      setDownloadingId(null);
      setActiveMenuId(null);
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
            <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {t.title}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                {t.subtitle}
              </p>
              <div className="w-12 h-1 bg-[#990000] mt-3 rounded"></div>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t.refresh}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setShowStatusDropdown(!showStatusDropdown);
                  setShowSortDropdown(false);
                }}
                className="flex items-center justify-between gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors min-w-[180px]"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>
                    {statusFilter === 'all' 
                      ? t.allStatuses 
                      : t.statusLabels[statusFilter as keyof typeof t.statusLabels]
                    }
                  </span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setShowStatusDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors first:rounded-t-lg ${
                      statusFilter === 'all' ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                    }`}
                  >
                    {t.allStatuses}
                  </button>
                  {(['pending', 'under_review', 'interview', 'accepted', 'rejected'] as const).map((status) => {
                    const Icon = getStatusIcon(status);
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center gap-2 last:rounded-b-lg ${
                          statusFilter === status ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {t.statusLabels[status]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Sort */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowStatusDropdown(false);
                }}
                className="flex items-center justify-between gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors min-w-[150px]"
              >
                <span>{t.sortOptions[sortBy as keyof typeof t.sortOptions]}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-20">
                  {(['newest', 'oldest', 'nameAsc', 'nameDesc'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        sortBy === option ? 'bg-neutral-100 dark:bg-neutral-700' : ''
                      }`}
                    >
                      {t.sortOptions[option]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Active filters indicator */}
          {(searchQuery || statusFilter !== 'all') && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {t.showing} {filteredApplications.length} {t.of} {applications.length} {t.results}
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-[#990000] hover:text-[#770000] dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                {t.clearFilters}
              </button>
            </div>
          )}
        </div>

        {/* Applications Table */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {currentApplications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {t.noResults}
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                {t.noResultsDesc}
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-sm font-medium rounded-lg transition-colors"
              >
                {t.clearFilters}
              </button>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        {t.columns.applicant}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        {t.columns.position}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider hidden md:table-cell">
                        {t.columns.school}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        {t.columns.status}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider hidden sm:table-cell">
                        {t.columns.date}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        {t.columns.actions}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {currentApplications.map((application) => {
                      const StatusIcon = getStatusIcon(application.status);
                      return (
                        <tr key={application.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#990000] to-[#660000] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {application.first_name?.[0]}{application.last_name?.[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                  {application.first_name} {application.last_name}
                                </div>
                                <div className="text-sm text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {application.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900 dark:text-neutral-100">
                              {application.position || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                            <div className="flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400">
                              <GraduationCap className="w-4 h-4" />
                              <span className="truncate max-w-[200px]">{application.school}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                              <StatusIcon className="w-3 h-3" />
                              {t.statusLabels[application.status as keyof typeof t.statusLabels]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                            <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                              <Calendar className="w-4 h-4" />
                              {formatDate(application.created_at, locale)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/${locale}/internship/applications/${application.id}`}
                                className="p-2 text-neutral-400 hover:text-[#990000] dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                title={t.viewDetails}
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              
                              {application.cv_file_name && (
                                <button
                                  onClick={() => handleDownloadCv(application)}
                                  disabled={downloadingId === application.id}
                                  className="p-2 text-neutral-400 hover:text-[#990000] dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={downloadingId === application.id ? (locale === 'tr' ? 'İndiriliyor...' : 'Downloading...') : t.downloadCV}
                                >
                                  <Download className={`w-4 h-4 ${downloadingId === application.id ? 'animate-pulse' : ''}`} />
                                </button>
                              )}
                              
                              <div className="relative dropdown-container">
                                <button
                                  onClick={() => setActiveMenuId(activeMenuId === application.id ? null : application.id)}
                                  className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                
                                {activeMenuId === application.id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-20">
                                    <Link
                                      href={`/${locale}/internship/applications/${application.id}`}
                                      className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors rounded-t-lg"
                                    >
                                      <Eye className="w-4 h-4" />
                                      {t.viewDetails}
                                    </Link>
                                    {application.cv_file_name && (
                                      <button
                                        onClick={() => handleDownloadCv(application)}
                                        disabled={downloadingId === application.id}
                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors rounded-b-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Download className={`w-4 h-4 ${downloadingId === application.id ? 'animate-pulse' : ''}`} />
                                        {downloadingId === application.id
                                          ? (locale === 'tr' ? 'İndiriliyor...' : 'Downloading...')
                                          : t.downloadCV}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <span>{t.showing}</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {startIndex + 1}-{Math.min(endIndex, filteredApplications.length)}
                  </span>
                  <span>{t.of}</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {filteredApplications.length}
                  </span>
                  <span>{t.results}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg text-sm focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                      {t.page} {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
