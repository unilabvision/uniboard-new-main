'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, ArrowLeft, Building, Search, PlusCircle, 
  Download, Eye, ArrowUpRight, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { checkOrganizationAccess, checkMassiveBioinformaticsAccess } from '../../../../_services/organizationAccessService';

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
}

interface Organization {
  id: number;
  slug: string;
  name: string;
  description?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  website?: string;
}

// Localized texts
const texts = {
  tr: {
    title: "Kurum Sertifikaları",
    subtitle: "Kurumunuzun tüm sertifikalarını görüntüleyin ve yönetin",
    searchPlaceholder: "Sertifika numarası, isim veya kurs ara...",
    filters: {
      all: "Tümü",
      recent: "Son Eklenenler"
    },
    emptyState: {
      title: "Henüz sertifika bulunmuyor",
      subtitle: "Bu kurum için henüz sertifika oluşturulmamış",
      buttonText: "Sertifika Oluştur"
    },
    createNew: "Yeni Sertifika",
    viewCertificate: "Sertifikayı Görüntüle",
    downloadCertificate: "Sertifikayı İndir",
    backToAll: "Tüm Sertifikalara Dön",
    organizationDetails: {
      website: "Web Sitesi",
      certificates: "Toplam Sertifika"
    },
    loading: "Yükleniyor...",
    error: "Veriler yüklenirken bir hata oluştu",
    notFound: "Kurum bulunamadı"
  },
  en: {
    title: "Organization Certificates",
    subtitle: "View and manage all certificates for your organization",
    searchPlaceholder: "Search certificate number, name or course...",
    filters: {
      all: "All",
      recent: "Recently Added"
    },
    emptyState: {
      title: "No certificates found",
      subtitle: "No certificates have been created for this organization yet",
      buttonText: "Create Certificate"
    },
    createNew: "New Certificate",
    viewCertificate: "View Certificate",
    downloadCertificate: "Download Certificate",
    backToAll: "Back to All Certificates",
    organizationDetails: {
      website: "Website",
      certificates: "Total Certificates"
    },
    loading: "Loading...",
    error: "An error occurred while loading data",
    notFound: "Organization not found"
  }
};

// Certificate details texts - same as main certificates page
const certificateTexts = {
  tr: {
    certificateDetails: {
      number: "Sertifika No",
      issuedTo: "Alıcı",
      course: "Kurs/Program",
      issueDate: "Veriliş Tarihi",
      organization: "Kurum",
      duration: "Süre",
      instructor: "Eğitmen"
    },
    viewCertificate: "Sertifikayı Görüntüle",
    downloadCertificate: "Sertifikayı İndir"
  },
  en: {
    certificateDetails: {
      number: "Certificate Number",
      issuedTo: "Issued To",
      course: "Course/Program",
      issueDate: "Issue Date",
      organization: "Organization",
      duration: "Duration",
      instructor: "Instructor"
    },
    viewCertificate: "View Certificate",
    downloadCertificate: "Download Certificate"
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

// Certificate Card Component
const CertificateCard = ({ 
  certificate, 
  locale, 
  organization
}: { 
  certificate: Certificate;
  locale: string;
  organization: Organization;
}) => {
  const t = certificateTexts[locale as keyof typeof certificateTexts] || certificateTexts.tr;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Header with organization accent color */}
      <div 
        className="h-2" 
        style={{ 
          backgroundColor: organization?.primary_color || '#990000'
        }}
      />
      
      <div className="p-6">
        {/* Certificate icon and title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
              style={{ 
                backgroundColor: `${organization?.primary_color || '#990000'}20`
              }}
            >
              <Award 
                className="w-6 h-6" 
                style={{ 
                  color: organization?.primary_color || '#990000'
                }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">
                {certificate.certificate_title || certificate.coursename}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {certificate.organization || organization?.name || 'Kurum Adı'}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {certificate.certificatenumber && (
              <a 
                href={`https://certificates.myunilab.net/${certificate.organization_slug || organization?.slug}/${certificate.certificatenumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-neutral-500 hover:text-[#990000] dark:text-neutral-400 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                title={t.viewCertificate}
              >
                <Eye className="w-5 h-5" />
              </a>
            )}
            
            {certificate.certificateurl && (
              <a 
                href={certificate.certificateurl} 
                download
                className="p-2 text-neutral-500 hover:text-[#990000] dark:text-neutral-400 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                title={t.downloadCertificate}
              >
                <Download className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
        
        {/* Certificate details */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block">
              {t.certificateDetails.issuedTo}
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {certificate.fullname}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block">
              {t.certificateDetails.issueDate}
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {formatDate(certificate.issuedate, locale)}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 dark:text-neutral-400 block">
              {t.certificateDetails.number}
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100 font-mono">
              {certificate.certificatenumber}
            </span>
          </div>
          {certificate.duration && (
            <div>
              <span className="text-neutral-500 dark:text-neutral-400 block">
                {t.certificateDetails.duration}
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {certificate.duration}
              </span>
            </div>
          )}
        </div>
        
        {/* Instructor info */}
        {certificate.instructor && (
          <div className="text-sm border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
            <span className="text-neutral-500 dark:text-neutral-400 block">
              {t.certificateDetails.instructor}
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {certificate.instructor}
            </span>
          </div>
        )}
      </div>
      
      {/* Footer with action buttons */}
            {/* Footer with action buttons */}
      <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-850 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {certificate.created_at ? formatDate(certificate.created_at, locale) : ''}
        </span>
        
        <div className="flex space-x-2">
          {certificate.certificateurl ? (
            <a
              href={certificate.certificateurl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#990000] hover:bg-[#880000] rounded-md transition-colors"
            >
              {t.viewCertificate}
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </a>
          ) : (
            <Link
              href={`/${locale}/certificates/${certificate.id}`}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#990000] hover:bg-[#880000] rounded-md transition-colors"
            >
              {t.viewCertificate}
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// Organization Info Component
const OrganizationInfo = ({ 
  organization, 
  certificateCount,
  t,
  userRole
}: { 
  organization: Organization;
  certificateCount: number;
  t: typeof texts.tr;
  userRole?: string | null;
}) => {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-8">
      {/* Header with organization accent color */}
      <div 
        className="h-2" 
        style={{ 
          backgroundColor: organization?.primary_color || '#990000'
        }}
      />
      
      <div className="p-6">
        {/* Organization logo and name */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center">
              {organization.logo ? (
                <Image 
                  src={organization.logo} 
                  alt={organization.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-lg object-contain mr-4 bg-white p-1 border border-neutral-200 dark:border-neutral-700"
                />
              ) : (
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center mr-4"
                  style={{ 
                    backgroundColor: `${organization.primary_color || '#990000'}20`
                  }}
                >
                  <Building 
                    className="w-8 h-8" 
                    style={{ 
                      color: organization.primary_color || '#990000'
                    }}
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-xl text-neutral-900 dark:text-neutral-100">
                  {organization.name}
                </h3>
                <div className="flex items-center">
                <span className="text-sm text-neutral-600 dark:text-neutral-400 mr-2">
                  {organization.slug}
                </span>
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: organization.primary_color || '#990000'
                  }}
                />
                
                {/* Display user role if available */}
                {userRole && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full" 
                    style={{
                      backgroundColor: `${organization.primary_color || '#990000'}20`,
                      color: organization.primary_color || '#990000'
                    }}
                  >
                    {userRole === 'admin' ? 'Yönetici' : 
                     userRole === 'manager' ? 'Yetkili' : 
                     userRole === 'member' ? 'Üye' : userRole}
                  </span>
                )}                  {/* Display user role if available */}
                  {userRole && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full" 
                      style={{
                        backgroundColor: `${organization.primary_color || '#990000'}20`,
                        color: organization.primary_color || '#990000'
                      }}
                    >
                      {userRole === 'admin' ? 'Yönetici' : 
                       userRole === 'manager' ? 'Yetkili' : 
                       userRole === 'member' ? 'Üye' : userRole}
                    </span>
                  )}
                </div>
              </div>
            </div>          <div className="ml-0 sm:ml-auto flex flex-wrap gap-3">
            <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
              <span className="text-sm text-neutral-500 dark:text-neutral-400 block">
                {t.organizationDetails.certificates}
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {certificateCount}
              </span>
            </div>
            
            {organization.website && (
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
              >
                <span className="text-sm text-neutral-500 dark:text-neutral-400 block">
                  {t.organizationDetails.website}
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
                  {new URL(organization.website).hostname}
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </span>
              </a>
            )}
          </div>
        </div>
        
        {/* Organization description */}
        {organization.description && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <p className="text-neutral-600 dark:text-neutral-400">
              {organization.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
export default function OrganizationCertificatesPage() {
  const params = useParams();
  const { slug } = params;
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Clerk user hook
  const { user: clerkUser, isLoaded } = useUser();
  const locale = params.locale as string || 'tr';
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Check user access to this organization
  useEffect(() => {
    const checkAccess = async () => {
      if (!isLoaded || !clerkUser) return;
      
      try {
        if (slug === 'massive-bioinformatics') {
          // Special handling for Massive Bioinformatics
          const accessResult = await checkMassiveBioinformaticsAccess(clerkUser.id);
          setHasAccess(accessResult.hasAccess);
          setUserRole(accessResult.role);
        } else if (organization?.id) {
          // Check access for other organizations
          const accessResult = await checkOrganizationAccess(clerkUser.id, organization.id);
          setHasAccess(accessResult.hasAccess);
          setUserRole(accessResult.role);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      }
    };
    
    checkAccess();
  }, [clerkUser, isLoaded, slug, organization?.id]);

  // Fetch organization and certificates
  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        
        // Special handling for Massive Bioinformatics
        if (slug === 'massive-bioinformatics') {
          // Hardcoded Massive Bioinformatics organization data
          const massiveOrg: Organization = {
            id: 1,
            slug: 'massive-bioinformatics',
            name: 'Massive Bioinformatics',
            description: 'Massive Bioinformatics, yaşam bilimleri alanında DNA analizi, biyoinformatik ve veri analizi konularında çözümler sunan bir kuruluştur. Genetik ve genomik alanlarında uzmanlaşmış ekibimiz ile bilim, araştırma ve sağlık sektörlerinde yenilikçi hizmetler sunuyoruz.',
            logo: 'https://massive-bio.com/images/logo.svg',
            primary_color: '#0F4B8F',
            secondary_color: '#4caf50',
            website: 'https://massive-bio.com'
          };
          
          setOrganization(massiveOrg);
          
          // Fetch certificates for Massive Bioinformatics
          const { data: certsData, error: certsError } = await supabase
            .from('certificates')
            .select('*')
            .eq('organization_slug', 'massive-bioinformatics')
            .order('created_at', { ascending: false });
          
          if (certsError) throw certsError;
          
          setCertificates(certsData || []);
        } else {
          // Fetch other organizations dynamically
          const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('slug', slug)
            .single();
          
          if (orgError) {
            throw orgError;
          }
          
          if (!orgData) {
            throw new Error(t.notFound);
          }
          
          setOrganization(orgData);
          
          // Fetch certificates for this organization
          const { data: certsData, error: certsError } = await supabase
            .from('certificates')
            .select('*')
            .eq('organization_slug', slug)
            .order('created_at', { ascending: false });
          
          if (certsError) {
            throw certsError;
          }
          
          setCertificates(certsData || []);
        }
        
      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [slug, t]);

  // Filter certificates based on search
  const getFilteredCertificates = () => {
    if (!searchQuery) return certificates;
    
    return certificates.filter(cert => 
      cert.certificatenumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.coursename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mb-8"></div>
            
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mr-4"></div>
                  <div>
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-40 mb-2"></div>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-8"></div>
            
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
  if (!clerkUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Lütfen giriş yapınız.</div>
      </div>
    );
  }
  
  // Access check
  if (isLoaded && clerkUser && !loading && !hasAccess) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 p-6 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-medium mb-2">Erişim Yetkiniz Bulunmuyor</h3>
                <p className="mb-4">Bu kurumun sertifikalarını görüntülemek için yetkiniz bulunmamaktadır. Erişim talep etmek için yöneticiniz ile iletişime geçebilirsiniz.</p>
                <div className="mt-4">
                  <Link 
                    href={`/${locale}/certificates`} 
                    className="inline-flex items-center px-4 py-2 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t.backToAll}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !organization) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-6 rounded-lg">
            <h3 className="text-lg font-medium mb-2">{t.error}</h3>
            <p>{error || t.notFound}</p>
            <div className="mt-4">
              <Link 
                href={`/${locale}/certificates`} 
                className="inline-flex items-center px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backToAll}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredCertificates = getFilteredCertificates();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              href={`/${locale}/certificates`} 
              className="mr-4 p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-medium text-neutral-900 dark:text-neutral-100">
              {t.title}
            </h1>
          </div>
          <p className="text-base text-neutral-600 dark:text-neutral-400 max-w-2xl">
            {t.subtitle}
          </p>
        </div>

          {/* Organization Info */}
        {organization && (
          <OrganizationInfo 
            organization={organization}
            certificateCount={certificates.length}
            t={t}
            userRole={userRole}
          />
        )}        {/* Search and Action Bar */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
              />
            </div>
            
            {/* Create Button */}
            <Link 
              href={`/${locale}/certificates/create`} 
              className="flex items-center px-4 py-2 bg-[#990000] hover:bg-[#880000] text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {t.createNew}
            </Link>
          </div>
        </div>

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          // Empty state
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Award className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              {t.emptyState.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {t.emptyState.subtitle}
            </p>
            <Link 
              href={`/${locale}/certificates/create`} 
              className="inline-flex items-center px-6 py-3 bg-[#990000] hover:bg-[#880000] text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {t.emptyState.buttonText}
            </Link>
          </div>
        ) : filteredCertificates.length === 0 ? (
          // No search results
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              Aramanıza uygun sonuç bulunamadı
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Farklı arama kriterleri deneyebilirsiniz
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center px-6 py-3 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 font-medium rounded-lg transition-colors"
            >
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          // Certificate cards
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCertificates.map(certificate => (
              <CertificateCard 
                key={certificate.id}
                certificate={certificate}
                locale={locale}
                organization={organization}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
