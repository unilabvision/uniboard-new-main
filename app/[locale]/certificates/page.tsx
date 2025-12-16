'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Award, Search, PlusCircle, 
  Eye, Grid3X3, List,
  Edit2, Trash2, MoreVertical,
  CheckSquare, Square
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Supabase client
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg'
});

// Types
interface Certificate {
  id: number;
  certificatenumber: string;
  fullname: string;
  coursename: string;
  issuedate: string;
  certificateurl?: string;
  organization?: string;
  organization_slug?: string;
  created_at?: string;
  updated_at?: string;
  instructor?: string;
  duration?: string;
  language?: string;
  certificate_title?: string;
  template_id?: number;
  certificate_templates?: {
    id: number;
    name: string;
    background_image: string;
    is_default: boolean;
  };
}

interface Organization {
  id: number;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  organizationSlugs?: string[];
}

// Localized texts
const texts = {
  tr: {
    title: "Sertifika Yönetimi",
    subtitle: "Kurslar, etkinlikler ve eğitimler için sertifikalar oluşturun ve yönetin",
    searchPlaceholder: "Sertifika numarası, isim veya kurs ara...",
    emptyState: {
      title: "Henüz sertifika bulunmuyor",
      subtitle: "Yeni bir sertifika oluşturarak başlayın",
      buttonText: "Sertifika Oluştur"
    },
    createNew: "Yeni Sertifika",
    viewCertificate: "Sertifikayı Görüntüle",
    downloadCertificate: "Sertifikayı İndir",
    editCertificate: "Sertifikayı Düzenle",
    deleteCertificate: "Sertifikayı Sil",
    deleteConfirmTitle: "Sertifikayı Sil",
    deleteConfirmMessage: "Bu sertifikayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
    deleteConfirmButton: "Evet, Sil",
    cancelButton: "İptal",
    deleting: "Siliniyor...",
    deleteSuccess: "Sertifika başarıyla silindi",
    deleteError: "Sertifika silinirken bir hata oluştu",
    bulkDelete: "Seçili Sertifikaları Sil",
    selectAll: "Tümünü Seç",
    deselectAll: "Seçimi Kaldır",
    selectedCount: "seçili",
    bulkDeleteConfirmTitle: "Sertifikaları Sil",
    bulkDeleteConfirmMessage: "Seçili {count} sertifikayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
    certificateDetails: {
      number: "Sertifika No",
      issuedTo: "Alıcı",
      course: "Kurs/Program",
      issueDate: "Veriliş Tarihi",
      organization: "Kurum",
      duration: "Süre",
      instructor: "Eğitmen"
    },
    organization: {
      viewAll: "Tüm Kurumları Gör",
      settings: "Kurum Ayarları"
    },
    loading: "Yükleniyor...",
    error: "Veriler yüklenirken bir hata oluştu"
  },
  en: {
    title: "Certificate Management",
    subtitle: "Create and manage certificates for courses, events, and trainings",
    searchPlaceholder: "Search certificate number, name or course...",
    emptyState: {
      title: "No certificates found",
      subtitle: "Get started by creating a new certificate",
      buttonText: "Create Certificate"
    },
    createNew: "New Certificate",
    viewCertificate: "View Certificate",
    downloadCertificate: "Download Certificate",
    editCertificate: "Edit Certificate",
    deleteCertificate: "Delete Certificate",
    deleteConfirmTitle: "Delete Certificate",
    deleteConfirmMessage: "Are you sure you want to delete this certificate? This action cannot be undone.",
    deleteConfirmButton: "Yes, Delete",
    cancelButton: "Cancel",
    deleting: "Deleting...",
    deleteSuccess: "Certificate deleted successfully",
    deleteError: "An error occurred while deleting the certificate",
    bulkDelete: "Delete Selected Certificates",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    selectedCount: "selected",
    bulkDeleteConfirmTitle: "Delete Certificates",
    bulkDeleteConfirmMessage: "Are you sure you want to delete {count} selected certificates? This action cannot be undone.",
    certificateDetails: {
      number: "Certificate Number",
      issuedTo: "Issued To",
      course: "Course/Program",
      issueDate: "Issue Date",
      organization: "Organization",
      duration: "Duration",
      instructor: "Instructor"
    },
    organization: {
      viewAll: "View All Organizations",
      settings: "Organization Settings"
    },
    loading: "Loading...",
    error: "An error occurred while loading data"
  }
};

// Utility functions
const formatDate = (dateString: string, locale: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Bulk Delete Confirmation Modal
const BulkDeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  count,
  isDeleting,
  t 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  isDeleting: boolean;
  t: typeof texts.tr;
}) => {
  if (!isOpen) return null;

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
                {t.bulkDeleteConfirmTitle}
              </h3>
            </div>
          </div>
          
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {t.bulkDeleteConfirmMessage.replace('{count}', count.toString())}
          </p>
          
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
              className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isDeleting ? t.deleting : t.deleteConfirmButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  certificate,
  isDeleting,
  t 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  certificate: Certificate | null;
  isDeleting: boolean;
  t: typeof texts.tr;
}) => {
  if (!isOpen || !certificate) return null;

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
                {certificate.coursename}
              </div>
              <div className="text-neutral-600 dark:text-neutral-400">
                {certificate.fullname} - {certificate.certificatenumber}
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

// Components
const CertificateListItem = ({ 
  certificate, 
  locale, 
  organization,
  t,
  onEdit,
  onDelete,
  isSelected,
  onSelect
}: { 
  certificate: Certificate;
  locale: string;
  organization?: Organization;
  t: typeof texts.tr;
  onEdit: (certificate: Certificate) => void;
  onDelete: (certificate: Certificate) => void;
  isSelected?: boolean;
  onSelect?: (certificate: Certificate, selected: boolean) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);

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
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        {onSelect && (
          <div className="flex-shrink-0 mr-3">
            <button
              onClick={() => onSelect(certificate, !isSelected)}
              className="p-1 text-neutral-400 hover:text-[#990000] dark:hover:text-neutral-200 transition-colors"
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-[#990000] dark:text-red-400" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 truncate">
                {certificate.coursename}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {certificate.organization || organization?.name || 'Kurum Adı'}
              </p>
            </div>
            
            <div className="text-xs text-neutral-500 dark:text-neutral-400 text-right">
              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                {certificate.fullname}
              </div>
              <div className="font-mono">
                {certificate.certificatenumber}
              </div>
              <div>
                {formatDate(certificate.issuedate, locale)}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-4">
          <a 
            href={`https://certificates.myunilab.net/${certificate.organization_slug}/${certificate.certificatenumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-neutral-400 hover:text-[#990000] dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            title={t.viewCertificate}
          >
            <Eye className="w-4 h-4" />
          </a>
          
          <button
            onClick={() => onEdit(certificate)}
            className="p-1.5 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            title={t.editCertificate}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          <div className="relative menu-container">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-lg z-10">
                <button
                  onClick={() => {
                    onDelete(certificate);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center text-sm"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  {t.deleteCertificate}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CertificateCard = ({ 
  certificate, 
  locale, 
  organization,
  t,
  onEdit,
  onDelete,
  isSelected,
  onSelect
}: { 
  certificate: Certificate;
  locale: string;
  organization?: Organization;
  t: typeof texts.tr;
  onEdit: (certificate: Certificate) => void;
  onDelete: (certificate: Certificate) => void;
  isSelected?: boolean;
  onSelect?: (certificate: Certificate, selected: boolean) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);

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
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        {onSelect && (
          <div className="flex-shrink-0 mr-3">
            <button
              onClick={() => onSelect(certificate, !isSelected)}
              className="p-1 text-neutral-400 hover:text-[#990000] dark:hover:text-neutral-200 transition-colors"
            >
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-[#990000] dark:text-red-400" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-1">
            {certificate.coursename}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
            {certificate.organization || organization?.name || 'Kurum Adı'}
          </p>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          <a 
            href={`https://certificates.myunilab.net/${certificate.organization_slug}/${certificate.certificatenumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-neutral-400 hover:text-[#990000] dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            title={t.viewCertificate}
          >
            <Eye className="w-4 h-4" />
          </a>
          
          <button
            onClick={() => onEdit(certificate)}
            className="p-1.5 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            title={t.editCertificate}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          
          <div className="relative menu-container">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 shadow-lg z-10">
                <button
                  onClick={() => {
                    onDelete(certificate);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center text-sm"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  {t.deleteCertificate}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex justify-between">
          <span>{certificate.fullname}</span>
          <span>{formatDate(certificate.issuedate, locale)}</span>
        </div>
        <div className="font-mono text-neutral-600 dark:text-neutral-300 mt-1">
          {certificate.certificatenumber}
        </div>
      </div>
    </div>
  );
};




// Main Component
export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('date-desc');
  
  // Infinite scroll states
  const [displayedCertificates, setDisplayedCertificates] = useState<Certificate[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 12; // Show 12 items initially and load 12 more each time

  
  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<Certificate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk delete states
  const [selectedCertificates, setSelectedCertificates] = useState<Set<number>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Clerk user hook
  const { user: clerkUser, isLoaded } = useUser();
  const locale = 'tr'; // You can get this from params or context
  const t = texts[locale] || texts.tr;



  // Set current user
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!isLoaded) return;
      
      if (!clerkUser) {
        setLoading(false);
        return;
      }

      try {
        // Initialize basic user info
        setCurrentUser({
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.firstName || 'Kullanıcı',
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          organizationSlugs: []
        });
        
        // Fetch user's organization access from the database
        const { data, error } = await supabase
          .from('user_module_access')
          .select(`
            *,
            organizations:organization_id (
              slug
            )
          `)
          .eq('clerk_user_id', clerkUser.id)
          .eq('module_key', 'certificates')
          .eq('is_enabled', true);
        
        if (error) {
          console.error('Error fetching user module access:', error);
          return;
        }
        
        // Extract organization slugs from the join result
        const orgSlugs = data
          ?.filter(item => item.organizations?.slug)
          .map(item => item.organizations.slug) || [];
        
        // Update current user with organization slugs
        setCurrentUser(prev => ({
          ...(prev || {
            id: clerkUser.id,
            name: clerkUser.fullName || clerkUser.firstName || 'Kullanıcı',
            email: clerkUser.emailAddresses[0]?.emailAddress || ''
          }),
          organizationSlugs: orgSlugs
        }));
      } catch (error) {
        console.error('Error getting user profile:', error);
      }
    };

    getCurrentUser();
  }, [clerkUser, isLoaded]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Check if user has any organization slugs
        if (!currentUser.organizationSlugs || currentUser.organizationSlugs.length === 0) {
          // If no organizations, show empty state
          setOrganizations([]);
          setCertificates([]);
          setLoading(false);
          return;
        }
        
        // Fetch organizations first
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .in('slug', currentUser.organizationSlugs);
        
        if (orgsError) {
          throw orgsError;
        }
        
        setOrganizations(orgsData || []);
        
        // Fetch certificates with template information
        const { data: certsData, error: certsError } = await supabase
          .from('certificates')
          .select(`
            *,
            certificate_templates:template_id (
              id,
              name,
              background_image,
              is_default
            )
          `)
          .in('organization_slug', currentUser.organizationSlugs)
          .order('created_at', { ascending: false });
        
        if (certsError) {
          throw certsError;
        }
        
        setCertificates(certsData || []);
        
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);



  // Get unique courses with their certificate counts
  const getCoursesWithCounts = () => {
    const courseCount = certificates.reduce((acc, cert) => {
      acc[cert.coursename] = (acc[cert.coursename] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(courseCount)
      .map(([courseName, count]) => ({ courseName, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  };

  // Get filtered data
  const getFilteredData = useCallback(() => {
    let filtered = certificates;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(cert => 
        cert.certificatenumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.coursename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply course filter
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(cert => cert.coursename === selectedCourse);
    }
    
    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at || b.issuedate).getTime() - new Date(a.created_at || a.issuedate).getTime();
        case 'date-asc':
          return new Date(a.created_at || a.issuedate).getTime() - new Date(b.created_at || b.issuedate).getTime();
        case 'name-asc':
          return a.fullname.localeCompare(b.fullname, 'tr', { sensitivity: 'base' });
        case 'name-desc':
          return b.fullname.localeCompare(a.fullname, 'tr', { sensitivity: 'base' });
        case 'course-asc':
          return a.coursename.localeCompare(b.coursename, 'tr', { sensitivity: 'base' });
        case 'course-desc':
          return b.coursename.localeCompare(a.coursename, 'tr', { sensitivity: 'base' });
        default:
          return new Date(b.created_at || b.issuedate).getTime() - new Date(a.created_at || a.issuedate).getTime();
      }
    });
    
    return filtered;
  }, [certificates, searchQuery, selectedCourse, sortBy]);

  // Update displayed certificates when filters change
  const updateDisplayedCertificates = useCallback(() => {
    const filteredData = getFilteredData();
    const initialItems = filteredData.slice(0, itemsPerPage);
    setDisplayedCertificates(initialItems);
    setHasMore(filteredData.length > itemsPerPage);
  }, [getFilteredData, itemsPerPage]);

  // Load more certificates for infinite scroll
  const loadMoreCertificates = useCallback(() => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    const filteredData = getFilteredData();
    const currentCount = displayedCertificates.length;
    const nextItems = filteredData.slice(currentCount, currentCount + itemsPerPage);
    
    // Small delay for visual feedback
    setTimeout(() => {
      setDisplayedCertificates(prev => [...prev, ...nextItems]);
      setHasMore(currentCount + nextItems.length < filteredData.length);
      setIsLoadingMore(false);
    }, 50); // Fast response for button mode
  }, [isLoadingMore, displayedCertificates.length, getFilteredData, itemsPerPage]);

  // Update displayed certificates when filters change
  useEffect(() => {
    updateDisplayedCertificates();
  }, [updateDisplayedCertificates]);


  // Get matching organization for a certificate
  const getOrganizationForCertificate = (cert: Certificate) => {
    return organizations.find(org => org.slug === cert.organization_slug);
  };

  // Handle edit certificate
  const handleEditCertificate = (certificate: Certificate) => {
    // Redirect to edit page - you'll need to create this page
    window.location.href = `/${locale}/certificates/edit/${certificate.id}`;
  };

  // Handle delete certificate
  const handleDeleteCertificate = (certificate: Certificate) => {
    setCertificateToDelete(certificate);
    setShowDeleteModal(true);
  };

  // Confirm delete certificate
  const confirmDeleteCertificate = async () => {
    if (!certificateToDelete) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', certificateToDelete.id);
      
      if (error) {
        throw error;
      }
      
      // Remove certificate from local state
      setCertificates(prev => prev.filter(cert => cert.id !== certificateToDelete.id));
      
      // Close modal
      setShowDeleteModal(false);
      setCertificateToDelete(null);
      
      // Show success message (you can implement a toast notification system)
      alert(t.deleteSuccess);
      
    } catch (error: unknown) {
      console.error('Error deleting certificate:', error);
      alert(t.deleteError + ': ' + (error instanceof Error ? error.message : 'An error occurred'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setCertificateToDelete(null);
    }
  };

  // Handle certificate selection
  const handleSelectCertificate = (certificate: Certificate, selected: boolean) => {
    setSelectedCertificates(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(certificate.id);
      } else {
        newSet.delete(certificate.id);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    const filtered = getFilteredData();
    if (selectedCertificates.size === filtered.length && filtered.length > 0) {
      setSelectedCertificates(new Set());
    } else {
      setSelectedCertificates(new Set(filtered.map(cert => cert.id)));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedCertificates.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  // Confirm bulk delete
  const confirmBulkDelete = async () => {
    if (selectedCertificates.size === 0) return;
    
    setIsBulkDeleting(true);
    
    try {
      const idsToDelete = Array.from(selectedCertificates);
      const { error } = await supabase
        .from('certificates')
        .delete()
        .in('id', idsToDelete);
      
      if (error) {
        throw error;
      }
      
      // Remove certificates from local state
      setCertificates(prev => prev.filter(cert => !selectedCertificates.has(cert.id)));
      
      // Clear selection
      setSelectedCertificates(new Set());
      setShowBulkDeleteModal(false);
      
      alert(t.deleteSuccess);
      
    } catch (error: unknown) {
      console.error('Error deleting certificates:', error);
      alert(t.deleteError + ': ' + (error instanceof Error ? error.message : 'An error occurred'));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Close bulk delete modal
  const closeBulkDeleteModal = () => {
    if (!isBulkDeleting) {
      setShowBulkDeleteModal(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12 overflow-x-hidden">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full break-words">
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
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-700"></div>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg mr-4"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-48 mb-2"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {[...Array(4)].map((_, j) => (
                        <div key={j}>
                          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24 mb-1"></div>
                          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex justify-between">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
                      <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-32"></div>
                    </div>
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12 overflow-x-hidden">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full break-words">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12 overflow-x-hidden">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full break-words">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {t.title}
              </h1>
              <div className="w-8 h-px bg-[#990000] mt-2"></div>
            </div>
            <Link 
              href={`/${locale}/certificates/create`} 
              className="flex items-center px-3 py-1.5 bg-[#990000] hover:bg-[#880000] text-white text-sm font-medium rounded-md transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              {t.createNew}
            </Link>
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

        {/* Bulk Actions Bar */}
        {selectedCertificates.size > 0 && (
          <div className="mb-4 p-3 bg-[#990000] dark:bg-red-500 text-white rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedCertificates.size} {t.selectedCount}
              </span>
              <button
                onClick={handleSelectAll}
                className="text-sm underline hover:no-underline opacity-90 hover:opacity-100"
              >
                {selectedCertificates.size === getFilteredData().length && getFilteredData().length > 0 ? t.deselectAll : t.selectAll}
              </button>
            </div>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-1.5 bg-white dark:bg-neutral-800 text-[#990000] dark:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4 inline mr-1" />
              {t.bulkDelete}
            </button>
          </div>
        )}

        {/* Simple Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {selectedCertificates.size === 0 && (
              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                {selectedCertificates.size === getFilteredData().length && getFilteredData().length > 0 ? t.deselectAll : t.selectAll}
              </button>
            )}
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm px-3 py-1.5 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
            >
              <option value="all">Tüm Kurslar</option>
              {getCoursesWithCounts().map(({ courseName }) => (
                <option key={courseName} value={courseName}>
                  {courseName}
                </option>
              ))}
            </select>
            
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {selectedCourse === 'all' ? 
                `${getFilteredData().length} sertifika` : 
                `${getCoursesWithCounts().find(c => c.courseName === selectedCourse)?.count || 0} sertifika`
              }
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm px-3 py-1.5 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
            >
              <option value="date-desc">En Yeni</option>
              <option value="date-asc">En Eski</option>
              <option value="name-asc">A-Z</option>
              <option value="name-desc">Z-A</option>
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
        {certificates.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Award className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {currentUser.organizationSlugs && currentUser.organizationSlugs.length > 0 ? 
                t.emptyState.title : 
                "Erişiminiz olan kurum bulunmuyor"
              }
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {currentUser.organizationSlugs && currentUser.organizationSlugs.length > 0 ? 
                t.emptyState.subtitle : 
                "Sertifika oluşturabilmek için önce bir kuruma erişim almanız gerekiyor"
              }
            </p>
            {currentUser.organizationSlugs && currentUser.organizationSlugs.length > 0 ? (
              <Link 
                href={`/${locale}/certificates/create`} 
                className="inline-flex items-center px-4 py-2 bg-[#990000] hover:bg-[#880000] text-white text-sm font-medium rounded-md transition-colors"
              >
                <PlusCircle className="w-4 h-4 mr-1" />
                {t.emptyState.buttonText}
              </Link>
            ) : (
              <div className="text-amber-600 dark:text-amber-400 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 inline-block rounded-md text-sm">
                Sistem yöneticisiyle iletişime geçerek kurum erişimi talep edebilirsiniz
              </div>
            )}
          </div>
        ) : displayedCertificates.length === 0 ? (
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
                setSelectedCourse('all');
                setSortBy('date-desc');
              }}
              className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 text-sm font-medium rounded-md transition-colors"
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          // Certificate cards/list with pagination
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {displayedCertificates.map((certificate: Certificate) => (
                  <CertificateCard 
                    key={certificate.id}
                    certificate={certificate}
                    locale={locale}
                    organization={getOrganizationForCertificate(certificate)}
                    t={t}
                    onEdit={handleEditCertificate}
                    onDelete={handleDeleteCertificate}
                    isSelected={selectedCertificates.has(certificate.id)}
                    onSelect={handleSelectCertificate}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {displayedCertificates.map((certificate: Certificate) => (
                  <CertificateListItem 
                    key={certificate.id}
                    certificate={certificate}
                    locale={locale}
                    organization={getOrganizationForCertificate(certificate)}
                    t={t}
                    onEdit={handleEditCertificate}
                    onDelete={handleDeleteCertificate}
                    isSelected={selectedCertificates.has(certificate.id)}
                    onSelect={handleSelectCertificate}
                  />
                ))}
              </div>
            )}
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-start py-6">
                <button
                  onClick={loadMoreCertificates}
                  disabled={isLoadingMore}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#990000] hover:bg-[#880000] disabled:bg-neutral-400 text-white text-sm font-medium rounded-md transition-colors"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Yükleniyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Daha Fazla Yükle</span>
                      <span className="text-xs opacity-75">({displayedCertificates.length}/{getFilteredData().length})</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            {/* End of results indicator */}
            {!hasMore && displayedCertificates.length > 0 && (
              <div className="text-center py-8">
                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                  Tüm sertifikalar gösterildi ({displayedCertificates.length} sertifika)
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteCertificate}
        certificate={certificateToDelete}
        isDeleting={isDeleting}
        t={t}
      />

      {/* Bulk Delete Confirmation Modal */}
      <BulkDeleteConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={closeBulkDeleteModal}
        onConfirm={confirmBulkDelete}
        count={selectedCertificates.size}
        isDeleting={isBulkDeleting}
        t={t}
      />
    </div>
  );
}
