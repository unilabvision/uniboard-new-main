'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, ArrowLeft, Save, RefreshCw,
  Check, X, Settings as SettingsIcon,
  Award, Video
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
interface LMSSettings {
  id?: string;
  organization_slug?: string;
  default_course_duration: number; // in minutes
  default_session_duration: number; // in minutes
  default_timezone: string;
  allow_course_enrollment: boolean;
  require_instructor_approval: boolean;
  max_file_upload_size: number; // in MB
  supported_video_formats: string[];
  default_course_type: 'online' | 'live' | 'hybrid';
  auto_generate_certificates: boolean;
  vimeo_integration_enabled: boolean;
  created_at?: string;
  updated_at?: string;
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
    title: "LMS Ayarları",
    subtitle: "Eğitim yönetim sistemi ayarlarınızı yapılandırın",
    form: {
      sections: {
        general: "Genel Ayarlar",
        courses: "Kurs Ayarları",
        media: "Medya Ayarları",
        certificates: "Sertifika Ayarları",
        advanced: "Gelişmiş Ayarlar"
      },
      fields: {
        defaultCourseDuration: {
          label: "Varsayılan Kurs Süresi",
          placeholder: "Dakika cinsinden",
          helper: "Yeni kurslar için varsayılan süre"
        },
        defaultSessionDuration: {
          label: "Varsayılan Oturum Süresi",
          placeholder: "Dakika cinsinden",
          helper: "Canlı derslerin varsayılan süresi"
        },
        defaultTimezone: {
          label: "Varsayılan Saat Dilimi",
          helper: "Canlı dersler için kullanılacak saat dilimi"
        },
        defaultCourseType: {
          label: "Varsayılan Kurs Türü",
          helper: "Yeni kurslar için varsayılan tür"
        },
        allowCourseEnrollment: {
          label: "Kurs Kaydına İzin Ver",
          helper: "Kullanıcıların kurslara kayıt olabilmesini sağlar"
        },
        requireInstructorApproval: {
          label: "Eğitmen Onayı Gerekli",
          helper: "Kurs kaydı için eğitmen onayı gerekli olsun"
        },
        maxFileUploadSize: {
          label: "Maksimum Dosya Yükleme Boyutu",
          placeholder: "MB cinsinden",
          helper: "Video ve diğer dosyalar için maksimum boyut"
        },
        supportedVideoFormats: {
          label: "Desteklenen Video Formatları",
          helper: "Virgülle ayırarak yazın (örn: mp4,mov,avi)"
        },
        autoGenerateCertificates: {
          label: "Otomatik Sertifika Oluştur",
          helper: "Kurs tamamlandığında otomatik olarak sertifika oluştur"
        },
        vimeoIntegrationEnabled: {
          label: "Vimeo Entegrasyonu",
          helper: "Vimeo video oynatıcı entegrasyonunu etkinleştir"
        }
      },
      buttons: {
        save: "Kaydet",
        cancel: "İptal",
        reset: "Sıfırla"
      },
      validation: {
        required: "Bu alan zorunludur",
        invalid: "Geçersiz değer",
        minValue: "Minimum değer: {min}",
        maxValue: "Maksimum değer: {max}"
      }
    },
    courseTypes: {
      online: "Online",
      live: "Canlı",
      hybrid: "Hibrit"
    },
    timezones: {
      'Europe/Istanbul': 'Türkiye (UTC+3)',
      'Europe/London': 'Londra (UTC+0)',
      'America/New_York': 'New York (UTC-5)',
      'America/Los_Angeles': 'Los Angeles (UTC-8)',
      'Asia/Tokyo': 'Tokyo (UTC+9)'
    },
    notifications: {
      saved: "Ayarlar başarıyla kaydedildi",
      error: "Ayarlar kaydedilirken bir hata oluştu",
      reset: "Ayarlar varsayılan değerlere sıfırlandı"
    },
    loading: "Yükleniyor...",
    saving: "Kaydediliyor..."
  },
  en: {
    title: "LMS Settings",
    subtitle: "Configure your learning management system settings",
    form: {
      sections: {
        general: "General Settings",
        courses: "Course Settings",
        media: "Media Settings",
        certificates: "Certificate Settings",
        advanced: "Advanced Settings"
      },
      fields: {
        defaultCourseDuration: {
          label: "Default Course Duration",
          placeholder: "In minutes",
          helper: "Default duration for new courses"
        },
        defaultSessionDuration: {
          label: "Default Session Duration",
          placeholder: "In minutes",
          helper: "Default duration for live sessions"
        },
        defaultTimezone: {
          label: "Default Timezone",
          helper: "Timezone to use for live sessions"
        },
        defaultCourseType: {
          label: "Default Course Type",
          helper: "Default type for new courses"
        },
        allowCourseEnrollment: {
          label: "Allow Course Enrollment",
          helper: "Enable users to enroll in courses"
        },
        requireInstructorApproval: {
          label: "Require Instructor Approval",
          helper: "Require instructor approval for course enrollment"
        },
        maxFileUploadSize: {
          label: "Maximum File Upload Size",
          placeholder: "In MB",
          helper: "Maximum size for videos and other files"
        },
        supportedVideoFormats: {
          label: "Supported Video Formats",
          helper: "Comma separated (e.g: mp4,mov,avi)"
        },
        autoGenerateCertificates: {
          label: "Auto Generate Certificates",
          helper: "Automatically generate certificates when course is completed"
        },
        vimeoIntegrationEnabled: {
          label: "Vimeo Integration",
          helper: "Enable Vimeo video player integration"
        }
      },
      buttons: {
        save: "Save",
        cancel: "Cancel",
        reset: "Reset"
      },
      validation: {
        required: "This field is required",
        invalid: "Invalid value",
        minValue: "Minimum value: {min}",
        maxValue: "Maximum value: {max}"
      }
    },
    courseTypes: {
      online: "Online",
      live: "Live",
      hybrid: "Hybrid"
    },
    timezones: {
      'Europe/Istanbul': 'Turkey (UTC+3)',
      'Europe/London': 'London (UTC+0)',
      'America/New_York': 'New York (UTC-5)',
      'America/Los_Angeles': 'Los Angeles (UTC-8)',
      'Asia/Tokyo': 'Tokyo (UTC+9)'
    },
    notifications: {
      saved: "Settings saved successfully",
      error: "An error occurred while saving settings",
      reset: "Settings reset to default values"
    },
    loading: "Loading...",
    saving: "Saving..."
  }
};

// Form input component
const FormInput = ({ 
  label, 
  name, 
  type = 'text', 
  placeholder, 
  value, 
  onChange,
  error,
  helper,
  required = false,
  disabled = false,
  min,
  max
}: { 
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  error?: string;
  helper?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
}) => {
  return (
    <div className="mb-4">
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
          error 
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
            : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
        } ${disabled ? 'bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed' : ''}`}
      />
      
      {error ? (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : helper ? (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {helper}
        </p>
      ) : null}
    </div>
  );
};

// Form select component
const FormSelect = ({ 
  label, 
  name, 
  value, 
  onChange,
  options,
  error,
  helper,
  required = false,
  disabled = false
}: { 
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  error?: string;
  helper?: string;
  required?: boolean;
  disabled?: boolean;
}) => {
  return (
    <div className="mb-4">
      <label 
        htmlFor={name} 
        className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
          error 
            ? 'border-red-300 text-red-900 focus:ring-red-500'
            : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
        } ${disabled ? 'bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed' : ''}`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error ? (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : helper ? (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {helper}
        </p>
      ) : null}
    </div>
  );
};

// Form checkbox component
const FormCheckbox = ({ 
  label, 
  name, 
  checked, 
  onChange,
  helper,
  disabled = false
}: { 
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helper?: string;
  disabled?: boolean;
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-start">
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="mt-1 w-4 h-4 text-[#990000] bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded focus:ring-[#990000] focus:ring-2 disabled:opacity-50"
        />
        <div className="ml-3">
          <label 
            htmlFor={name} 
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
          </label>
          {helper && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {helper}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Form section component
const FormSection = ({ title, icon: Icon, children }: { 
  title: string; 
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center mb-4 pb-2 border-b border-neutral-200 dark:border-neutral-700">
        <Icon className="w-5 h-5 text-[#990000] mr-2" />
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
};

// Toast Notification Component
const Toast = ({
  message,
  type = 'success',
  isVisible,
  onClose
}: {
  message: string;
  type?: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className={`p-4 rounded-lg shadow-lg flex items-center space-x-3 ${
        type === 'success' 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}>
        <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
          type === 'success' 
            ? 'bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-400'
        }`}>
          {type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
        </div>
        <div className={type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
          {message}
        </div>
        <button
          onClick={onClose}
          className={`ml-auto ${
            type === 'success' 
              ? 'text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
              : 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Main Component
export default function LMSSettingsPage() {
  const [settings, setSettings] = useState<LMSSettings>({
    default_course_duration: 60,
    default_session_duration: 60,
    default_timezone: 'Europe/Istanbul',
    allow_course_enrollment: true,
    require_instructor_approval: false,
    max_file_upload_size: 100,
    supported_video_formats: ['mp4', 'mov', 'avi', 'webm'],
    default_course_type: 'online',
    auto_generate_certificates: true,
    vimeo_integration_enabled: true
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  
  // Clerk user hook
  const { user: clerkUser, isLoaded } = useUser();
  const locale = 'tr'; // You can get this from params or context
  const t = texts[locale as keyof typeof texts] || texts.tr;

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
          .eq('module_key', 'lms')
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
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();
  }, [clerkUser, isLoaded]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
        ? parseInt(value) || 0
        : name === 'supported_video_formats' 
        ? value.split(',').map(format => format.trim())
        : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields
    if (!settings.default_course_duration || settings.default_course_duration < 1) {
      newErrors.default_course_duration = t.form.validation.minValue.replace('{min}', '1');
    }
    if (!settings.default_session_duration || settings.default_session_duration < 1) {
      newErrors.default_session_duration = t.form.validation.minValue.replace('{min}', '1');
    }
    if (!settings.max_file_upload_size || settings.max_file_upload_size < 1) {
      newErrors.max_file_upload_size = t.form.validation.minValue.replace('{min}', '1');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({
      show: true,
      message,
      type
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      // In a real application, you would save these settings to your database
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToast(t.notifications.saved);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast(t.notifications.error, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form to defaults
  const handleReset = () => {
    setSettings({
      default_course_duration: 60,
      default_session_duration: 60,
      default_timezone: 'Europe/Istanbul',
      allow_course_enrollment: true,
      require_instructor_approval: false,
      max_file_upload_size: 100,
      supported_video_formats: ['mp4', 'mov', 'avi', 'webm'],
      default_course_type: 'online',
      auto_generate_certificates: true,
      vimeo_integration_enabled: true
    });
    setErrors({});
    showToast(t.notifications.reset);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mb-8"></div>
            
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="space-y-6">
                {[...Array(6)].map((_, i) => (
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
  if (!clerkUser || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Lütfen giriş yapınız.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link 
              href={`/${locale}/lms`} 
              className="mr-4 p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-medium text-neutral-900 dark:text-neutral-100">
              {t.title}
            </h1>
          </div>
          <p className="text-base text-neutral-600 dark:text-neutral-400">
            {t.subtitle}
          </p>
        </div>

        {/* Settings Form */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <form onSubmit={handleSubmit}>
            {/* General Settings */}
            <FormSection title={t.form.sections.general} icon={SettingsIcon}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label={t.form.fields.defaultCourseDuration.label}
                  name="default_course_duration"
                  type="number"
                  placeholder={t.form.fields.defaultCourseDuration.placeholder}
                  value={settings.default_course_duration}
                  onChange={handleChange}
                  error={errors.default_course_duration}
                  helper={t.form.fields.defaultCourseDuration.helper}
                  required
                  min={1}
                />
                
                <FormInput
                  label={t.form.fields.defaultSessionDuration.label}
                  name="default_session_duration"
                  type="number"
                  placeholder={t.form.fields.defaultSessionDuration.placeholder}
                  value={settings.default_session_duration}
                  onChange={handleChange}
                  error={errors.default_session_duration}
                  helper={t.form.fields.defaultSessionDuration.helper}
                  required
                  min={1}
                />
                
                <FormSelect
                  label={t.form.fields.defaultTimezone.label}
                  name="default_timezone"
                  value={settings.default_timezone}
                  onChange={handleChange}
                  options={Object.entries(t.timezones).map(([value, label]) => ({ value, label }))}
                  helper={t.form.fields.defaultTimezone.helper}
                />
                
                <FormSelect
                  label={t.form.fields.defaultCourseType.label}
                  name="default_course_type"
                  value={settings.default_course_type}
                  onChange={handleChange}
                  options={Object.entries(t.courseTypes).map(([value, label]) => ({ value, label }))}
                  helper={t.form.fields.defaultCourseType.helper}
                />
              </div>
            </FormSection>

            {/* Course Settings */}
            <FormSection title={t.form.sections.courses} icon={BookOpen}>
              <div className="space-y-4">
                <FormCheckbox
                  label={t.form.fields.allowCourseEnrollment.label}
                  name="allow_course_enrollment"
                  checked={settings.allow_course_enrollment}
                  onChange={handleChange}
                  helper={t.form.fields.allowCourseEnrollment.helper}
                />
                
                <FormCheckbox
                  label={t.form.fields.requireInstructorApproval.label}
                  name="require_instructor_approval"
                  checked={settings.require_instructor_approval}
                  onChange={handleChange}
                  helper={t.form.fields.requireInstructorApproval.helper}
                />
              </div>
            </FormSection>

            {/* Media Settings */}
            <FormSection title={t.form.sections.media} icon={Video}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label={t.form.fields.maxFileUploadSize.label}
                  name="max_file_upload_size"
                  type="number"
                  placeholder={t.form.fields.maxFileUploadSize.placeholder}
                  value={settings.max_file_upload_size}
                  onChange={handleChange}
                  error={errors.max_file_upload_size}
                  helper={t.form.fields.maxFileUploadSize.helper}
                  required
                  min={1}
                />
                
                <FormInput
                  label={t.form.fields.supportedVideoFormats.label}
                  name="supported_video_formats"
                  placeholder="mp4,mov,avi,webm"
                  value={settings.supported_video_formats.join(', ')}
                  onChange={handleChange}
                  helper={t.form.fields.supportedVideoFormats.helper}
                />
              </div>
              
              <FormCheckbox
                label={t.form.fields.vimeoIntegrationEnabled.label}
                name="vimeo_integration_enabled"
                checked={settings.vimeo_integration_enabled}
                onChange={handleChange}
                helper={t.form.fields.vimeoIntegrationEnabled.helper}
              />
            </FormSection>

            {/* Certificate Settings */}
            <FormSection title={t.form.sections.certificates} icon={Award}>
              <FormCheckbox
                label={t.form.fields.autoGenerateCertificates.label}
                name="auto_generate_certificates"
                checked={settings.auto_generate_certificates}
                onChange={handleChange}
                helper={t.form.fields.autoGenerateCertificates.helper}
              />
            </FormSection>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                {t.form.buttons.reset}
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-[#990000] hover:bg-[#880000] text-white font-medium rounded-lg transition-colors disabled:bg-neutral-400 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    {t.saving}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {t.form.buttons.save}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Toast Notification */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.show}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      </div>
    </div>
  );
}