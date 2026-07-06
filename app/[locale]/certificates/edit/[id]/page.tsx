'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, Save, ArrowLeft, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { certificatesSupabase as supabase } from '@/app/_services/certificatesSupabaseClient';

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


// Localized texts
const texts = {
  tr: {
    title: "Sertifikayı Düzenle",
    subtitle: "Sertifika bilgilerini güncelleyin",
    backToList: "Sertifika Listesine Dön",
    certificateNumber: "Sertifika Numarası",
    recipientName: "Alıcı Adı Soyadı",
    courseName: "Kurs/Program Adı",
    issueDate: "Veriliş Tarihi",
    instructor: "Eğitmen",
    duration: "Süre",
    language: "Dil",
    certificateTitle: "Sertifika Başlığı",
    organization: "Kurum",
    save: "Kaydet",
    saving: "Kaydediliyor...",
    cancel: "İptal",
    loading: "Yükleniyor...",
    error: "Bir hata oluştu",
    notFound: "Sertifika bulunamadı",
    unauthorized: "Bu sertifikayı düzenleme yetkiniz yok",
    saveSuccess: "Sertifika başarıyla güncellendi",
    saveError: "Sertifika güncellenirken bir hata oluştu",
    required: "Bu alan zorunludur",
    invalidDate: "Geçerli bir tarih giriniz"
  },
  en: {
    title: "Edit Certificate",
    subtitle: "Update certificate information",
    backToList: "Back to Certificate List",
    certificateNumber: "Certificate Number",
    recipientName: "Recipient Name",
    courseName: "Course/Program Name",
    issueDate: "Issue Date",
    instructor: "Instructor",
    duration: "Duration",
    language: "Language",
    certificateTitle: "Certificate Title",
    organization: "Organization",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    loading: "Loading...",
    error: "An error occurred",
    notFound: "Certificate not found",
    unauthorized: "You don't have permission to edit this certificate",
    saveSuccess: "Certificate updated successfully",
    saveError: "An error occurred while updating the certificate",
    required: "This field is required",
    invalidDate: "Please enter a valid date"
  }
};

export default function EditCertificatePage() {
  const router = useRouter();
  const params = useParams();
  const { user: clerkUser, isLoaded } = useUser();
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userOrgSlugs, setUserOrgSlugs] = useState<string[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    certificatenumber: '',
    fullname: '',
    coursename: '',
    issuedate: '',
    instructor: '',
    duration: '',
    language: 'tr',
    certificate_title: ''
  });
  
  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const locale = (params.locale as string) || 'tr';
  const certificateId = params.id as string;
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Get user organization access
  useEffect(() => {
    const getUserOrganizations = async () => {
      if (!isLoaded || !clerkUser) return;
      
      try {
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
        
        const orgSlugs = data
          ?.filter(item => item.organizations?.slug)
          .map(item => item.organizations.slug) || [];
        
        setUserOrgSlugs(orgSlugs);
      } catch (error) {
        console.error('Error getting user organizations:', error);
      }
    };

    getUserOrganizations();
  }, [clerkUser, isLoaded]);

  // Fetch certificate and organizations
  useEffect(() => {
    const fetchData = async () => {
      if (!certificateId || userOrgSlugs.length === 0) return;
      
      try {
        setLoading(true);
        
        // Fetch certificate
        const { data: certData, error: certError } = await supabase
          .from('certificates')
          .select('*')
          .eq('id', certificateId)
          .single();
        
        if (certError) {
          if (certError.code === 'PGRST116') {
            setError(t.notFound);
          } else {
            throw certError;
          }
          return;
        }
        
        // Check if user has access to this certificate's organization
        if (!userOrgSlugs.includes(certData.organization_slug)) {
          setError(t.unauthorized);
          return;
        }
        
        setCertificate(certData);
        
        // Set form data
        setFormData({
          certificatenumber: certData.certificatenumber || '',
          fullname: certData.fullname || '',
          coursename: certData.coursename || '',
          issuedate: certData.issuedate ? certData.issuedate.split('T')[0] : '',
          instructor: certData.instructor || '',
          duration: certData.duration || '',
          language: certData.language || 'tr',
          certificate_title: certData.certificate_title || ''
        });
        
        // Fetch the organization name for display
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('name')
          .eq('slug', certData.organization_slug)
          .single();
        
        if (!orgError && orgData) {
          // Update certificate with organization name for display
          setCertificate(prev => ({
            ...prev!,
            organization: orgData.name
          }));
        }
        
      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [certificateId, userOrgSlugs, t.notFound, t.unauthorized]);

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.certificatenumber.trim()) {
      newErrors.certificatenumber = t.required;
    }
    
    if (!formData.fullname.trim()) {
      newErrors.fullname = t.required;
    }
    
    if (!formData.coursename.trim()) {
      newErrors.coursename = t.required;
    }
    
    if (!formData.issuedate) {
      newErrors.issuedate = t.required;
    } else {
      const date = new Date(formData.issuedate);
      if (isNaN(date.getTime())) {
        newErrors.issuedate = t.invalidDate;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      const updateData = {
        ...formData,
        organization_slug: certificate?.organization_slug, // Keep original organization
        certificateurl: certificate?.certificateurl, // Keep original URL (auto-generated)
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('certificates')
        .update(updateData)
        .eq('id', certificateId);
      
      if (error) {
        throw error;
      }
      
      // Show success message (you can implement a toast notification system)
      alert(t.saveSuccess);
      
      // Redirect back to certificates list
      router.push(`/${locale}/certificates`);
      
    } catch (error: unknown) {
      console.error('Error updating certificate:', error);
      alert(t.saveError + ': ' + (error instanceof Error ? error.message : 'An error occurred'));
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mb-8"></div>
            
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-2"></div>
                    <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  </div>
                ))}
              </div>
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-6 rounded-lg text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t.error}</h3>
            <p className="mb-4">{error}</p>
            <Link 
              href={`/${locale}/certificates`}
              className="inline-flex items-center px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backToList}
            </Link>
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
          <div className="flex items-center mb-4">
            <Link 
              href={`/${locale}/certificates`}
              className="flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              {t.backToList}
            </Link>
          </div>
          
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#990000]/10 rounded-lg flex items-center justify-center mr-4">
              <Award className="w-6 h-6 text-[#990000]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100">
                {t.title}
              </h1>
              <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 mt-1">
                {t.subtitle}
              </p>
            </div>
          </div>
          <div className="w-12 sm:w-16 h-px bg-[#990000] mt-4"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Certificate Number */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t.certificateNumber} *
                </label>
                <input
                  type="text"
                  value={formData.certificatenumber}
                  onChange={(e) => handleInputChange('certificatenumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
                    errors.certificatenumber ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                  placeholder="CRT-2024-001"
                />
                {errors.certificatenumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.certificatenumber}</p>
                )}
              </div>

              {/* Organization - Read Only */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t.organization}
                </label>
                <div className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                  {certificate?.organization || 'Kurum Bilgisi Yükleniyor...'}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Bu alan değiştirilemez
                </p>
              </div>

              {/* Recipient Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t.recipientName} *
                </label>
                <input
                  type="text"
                  value={formData.fullname}
                  onChange={(e) => handleInputChange('fullname', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
                    errors.fullname ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                  placeholder="Hacer Melisnur Yılmaz"
                />
                {errors.fullname && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullname}</p>
                )}
              </div>

              {/* Course Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t.courseName} *
                </label>
                <input
                  type="text"
                  value={formData.coursename}
                  onChange={(e) => handleInputChange('coursename', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
                    errors.coursename ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                  placeholder="Web Tasarım Eğitimi"
                />
                {errors.coursename && (
                  <p className="text-red-500 text-sm mt-1">{errors.coursename}</p>
                )}
              </div>

              {/* Issue Date */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t.issueDate} *
                </label>
                <input
                  type="date"
                  value={formData.issuedate}
                  onChange={(e) => handleInputChange('issuedate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
                    errors.issuedate ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                />
                {errors.issuedate && (
                  <p className="text-red-500 text-sm mt-1">{errors.issuedate}</p>
                )}
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t.language}
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Instructor */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t.instructor}
                </label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => handleInputChange('instructor', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                  placeholder="Dr. Mehmet Kaya"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t.duration}
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                  placeholder="40 Saat"
                />
              </div>

              {/* Certificate Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {t.certificateTitle}
                </label>
                <input
                  type="text"
                  value={formData.certificate_title}
                  onChange={(e) => handleInputChange('certificate_title', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                  placeholder="Katılım Sertifikası"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-4 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
              <Link
                href={`/${locale}/certificates`}
                className="w-full sm:w-auto px-6 py-3 text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-lg transition-colors text-center mb-3 sm:mb-0"
              >
                {t.cancel}
              </Link>
              
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-[#990000] hover:bg-[#880000] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t.saving}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t.save}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
