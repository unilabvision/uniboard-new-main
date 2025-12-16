'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, ArrowLeft, Save, RefreshCw,
  Check, X, Settings as SettingsIcon,
  Award, Video, Database, Plus, Edit, Trash2,
  Home, Users
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

interface KurumHome {
  id?: string;
  institution_key: string;
  herosection?: Record<string, unknown>;
  featuredfilter?: Record<string, unknown>;
  studysection?: Record<string, unknown>;
  blogsection?: Record<string, unknown>;
  eventlistfilter?: Record<string, unknown>;
  whychoosesection?: Record<string, unknown>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface PersonalizedEducation {
  id?: number;
  question_key: string;
  question_title?: { en: string; tr: string };
  question_subtitle?: { en: string; tr: string };
  options?: Record<string, unknown>[];
  is_active: boolean;
  sort_order: number;
  is_multiple_choice: boolean;
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
        advanced: "Gelişmiş Ayarlar",
        database: "Veritabanı Yönetimi",
        kurumHome: "Kurum Ana Sayfa",
        personalizedEducation: "Kişiselleştirilmiş Eğitim"
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
        },
        institutionKey: {
          label: "Kurum Anahtarı",
          placeholder: "Kurum anahtarını girin",
          helper: "Kurum için benzersiz anahtar"
        },
        questionKey: {
          label: "Soru Anahtarı",
          placeholder: "Soru anahtarını girin",
          helper: "Soru için benzersiz anahtar"
        },
        questionTitle: {
          label: "Soru Başlığı",
          placeholder: "Soru başlığını girin",
          helper: "Çok dilli soru başlığı"
        },
        questionSubtitle: {
          label: "Soru Alt Başlığı",
          placeholder: "Soru alt başlığını girin",
          helper: "Çok dilli soru alt başlığı"
        },
        sortOrder: {
          label: "Sıralama",
          placeholder: "Sıralama numarası",
          helper: "Düşük sayı önce görünür"
        }
      },
      buttons: {
        save: "Kaydet",
        cancel: "İptal",
        reset: "Sıfırla",
        add: "Ekle",
        edit: "Düzenle",
        delete: "Sil",
        create: "Oluştur",
        update: "Güncelle"
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
        advanced: "Advanced Settings",
        database: "Database Management",
        kurumHome: "Institution Homepage",
        personalizedEducation: "Personalized Education"
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
        },
        institutionKey: {
          label: "Institution Key",
          placeholder: "Enter institution key",
          helper: "Unique key for the institution"
        },
        questionKey: {
          label: "Question Key",
          placeholder: "Enter question key",
          helper: "Unique key for the question"
        },
        questionTitle: {
          label: "Question Title",
          placeholder: "Enter question title",
          helper: "Multilingual question title"
        },
        questionSubtitle: {
          label: "Question Subtitle",
          placeholder: "Enter question subtitle",
          helper: "Multilingual question subtitle"
        },
        sortOrder: {
          label: "Sort Order",
          placeholder: "Sort number",
          helper: "Lower numbers appear first"
        }
      },
      buttons: {
        save: "Save",
        cancel: "Cancel",
        reset: "Reset",
        add: "Add",
        edit: "Edit",
        delete: "Delete",
        create: "Create",
        update: "Update"
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

  // Database management states
  const [kurumHomeData, setKurumHomeData] = useState<KurumHome[]>([]);
  const [personalizedEducationData, setPersonalizedEducationData] = useState<PersonalizedEducation[]>([]);
  const [showKurumHomeModal, setShowKurumHomeModal] = useState(false);
  const [showPersonalizedEducationModal, setShowPersonalizedEducationModal] = useState(false);
  const [editingKurumHome, setEditingKurumHome] = useState<KurumHome | null>(null);
  const [editingPersonalizedEducation, setEditingPersonalizedEducation] = useState<PersonalizedEducation | null>(null);
  const [kurumHomeForm, setKurumHomeForm] = useState<Partial<KurumHome>>({
    institution_key: '',
    is_active: true
  });
  const [personalizedEducationForm, setPersonalizedEducationForm] = useState<Partial<PersonalizedEducation>>({
    question_key: '',
    question_title: { en: '', tr: '' },
    question_subtitle: { en: '', tr: '' },
    options: [],
    is_active: true,
    sort_order: 0,
    is_multiple_choice: false
  });
  const [newOption, setNewOption] = useState({
    label: { en: '', tr: '' },
    value: '',
    description: { en: '', tr: '' }
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
          .eq('module_key', 'lms-2')
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

  // Load database data
  useEffect(() => {
    const loadDatabaseData = async () => {
      try {
        // Load kurum home data
        const { data: kurumHome, error: kurumHomeError } = await supabase
          .from('myuni_kurum_home')
          .select('*')
          .order('created_at', { ascending: false });

        if (kurumHomeError) {
          console.error('Error loading kurum home data:', kurumHomeError);
        } else {
          setKurumHomeData(kurumHome || []);
        }

        // Load personalized education data
        const { data: personalizedEducation, error: personalizedEducationError } = await supabase
          .from('myuni_kurum_personalized_education')
          .select('*')
          .order('sort_order', { ascending: true });

        if (personalizedEducationError) {
          console.error('Error loading personalized education data:', personalizedEducationError);
        } else {
          setPersonalizedEducationData(personalizedEducation || []);
        }
      } catch (error) {
        console.error('Error loading database data:', error);
      }
    };

    if (currentUser) {
      loadDatabaseData();
    }
  }, [currentUser]);

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

  // Database management functions
  const handleKurumHomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      if (editingKurumHome) {
        // Update existing record
        const { error } = await supabase
          .from('myuni_kurum_home')
          .update(kurumHomeForm)
          .eq('id', editingKurumHome.id);
        
        if (error) throw error;
        showToast('Kurum ana sayfa güncellendi');
      } else {
        // Create new record
        const { error } = await supabase
          .from('myuni_kurum_home')
          .insert([kurumHomeForm]);
        
        if (error) throw error;
        showToast('Kurum ana sayfa oluşturuldu');
      }
      
      // Refresh data
      const { data } = await supabase
        .from('myuni_kurum_home')
        .select('*')
        .order('created_at', { ascending: false });
      setKurumHomeData(data || []);
      
      // Reset form and close modal
      setKurumHomeForm({ institution_key: '', is_active: true });
      setShowKurumHomeModal(false);
      setEditingKurumHome(null);
      
    } catch (error) {
      console.error('Error saving kurum home:', error);
      showToast('Hata oluştu', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePersonalizedEducationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      if (editingPersonalizedEducation) {
        // Update existing record
        const { error } = await supabase
          .from('myuni_kurum_personalized_education')
          .update(personalizedEducationForm)
          .eq('id', editingPersonalizedEducation.id);
        
        if (error) throw error;
        showToast('Kişiselleştirilmiş eğitim güncellendi');
      } else {
        // Create new record
        const { error } = await supabase
          .from('myuni_kurum_personalized_education')
          .insert([personalizedEducationForm]);
        
        if (error) throw error;
        showToast('Kişiselleştirilmiş eğitim oluşturuldu');
      }
      
      // Refresh data
      const { data } = await supabase
        .from('myuni_kurum_personalized_education')
        .select('*')
        .order('sort_order', { ascending: true });
      setPersonalizedEducationData(data || []);
      
      // Reset form and close modal
      setPersonalizedEducationForm({
        question_key: '',
        question_title: { en: '', tr: '' },
        question_subtitle: { en: '', tr: '' },
        options: [],
        is_active: true,
        sort_order: 0,
        is_multiple_choice: false
      });
      setShowPersonalizedEducationModal(false);
      setEditingPersonalizedEducation(null);
      
    } catch (error) {
      console.error('Error saving personalized education:', error);
      showToast('Hata oluştu', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKurumHome = async (id: string) => {
    const record = kurumHomeData.find(item => item.id === id);
    const institutionKey = record?.institution_key || 'bu kayıt';
    
    if (!confirm(`"${institutionKey}" kurum ana sayfa kaydını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) return;
    
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('myuni_kurum_home')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      showToast(`"${institutionKey}" kurum ana sayfa kaydı başarıyla silindi`);
      
      // Refresh data
      const { data } = await supabase
        .from('myuni_kurum_home')
        .select('*')
        .order('created_at', { ascending: false });
      setKurumHomeData(data || []);
      
    } catch (error) {
      console.error('Error deleting kurum home:', error);
      showToast('Kurum ana sayfa kaydı silinirken hata oluştu', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePersonalizedEducation = async (id: number) => {
    const record = personalizedEducationData.find(item => item.id === id);
    const questionKey = record?.question_key || 'bu kayıt';
    
    if (!confirm(`"${questionKey}" kişiselleştirilmiş eğitim kaydını silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) return;
    
    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('myuni_kurum_personalized_education')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      showToast(`"${questionKey}" kişiselleştirilmiş eğitim kaydı başarıyla silindi`);
      
      // Refresh data
      const { data } = await supabase
        .from('myuni_kurum_personalized_education')
        .select('*')
        .order('sort_order', { ascending: true });
      setPersonalizedEducationData(data || []);
      
    } catch (error) {
      console.error('Error deleting personalized education:', error);
      showToast('Kişiselleştirilmiş eğitim kaydı silinirken hata oluştu', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditKurumHome = (item: KurumHome) => {
    setEditingKurumHome(item);
    setKurumHomeForm(item);
    setShowKurumHomeModal(true);
  };

  const handleEditPersonalizedEducation = (item: PersonalizedEducation) => {
    setEditingPersonalizedEducation(item);
    setPersonalizedEducationForm(item);
    setShowPersonalizedEducationModal(true);
  };

  // Options management functions
  const handleAddOption = () => {
    if (!newOption.label.tr || !newOption.label.en || !newOption.value) {
      showToast('Lütfen tüm alanları doldurun', 'error');
      return;
    }

    const currentOptions = personalizedEducationForm.options || [];
    setPersonalizedEducationForm(prev => ({
      ...prev,
      options: [...currentOptions, { ...newOption }]
    }));

    setNewOption({
      label: { en: '', tr: '' },
      value: '',
      description: { en: '', tr: '' }
    });
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = personalizedEducationForm.options || [];
    const updatedOptions = currentOptions.filter((_: unknown, i: number) => i !== index);
    setPersonalizedEducationForm(prev => ({
      ...prev,
      options: updatedOptions
    }));
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
              href={`/${locale}/lms-2`} 
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

            {/* Database Management */}
            <FormSection title={t.form.sections.database} icon={Database}>
              <div className="space-y-8">
                {/* Kurum Home Management */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
                      <Home className="w-5 h-5 mr-2 text-[#990000]" />
                      {t.form.sections.kurumHome}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingKurumHome(null);
                        setKurumHomeForm({ institution_key: '', is_active: true });
                        setShowKurumHomeModal(true);
                      }}
                      className="px-4 py-2 bg-[#990000] text-white rounded-lg hover:bg-[#880000] transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t.form.buttons.add}
                    </button>
                  </div>
                  
                  <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                    {kurumHomeData.length === 0 ? (
                      <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">
                        Henüz kurum ana sayfa kaydı yok
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {kurumHomeData.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-600">
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                {item.institution_key}
                              </p>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                {item.is_active ? 'Aktif' : 'Pasif'} • {new Date(item.created_at || '').toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditKurumHome(item)}
                                className="p-2 text-neutral-500 hover:text-[#990000] transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteKurumHome(item.id!)}
                                className="p-2 text-neutral-500 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Personalized Education Management */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-[#990000]" />
                      {t.form.sections.personalizedEducation}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPersonalizedEducation(null);
                        setPersonalizedEducationForm({
                          question_key: '',
                          question_title: { en: '', tr: '' },
                          question_subtitle: { en: '', tr: '' },
                          options: [],
                          is_active: true,
                          sort_order: 0,
                          is_multiple_choice: false
                        });
                        setNewOption({
                          label: { en: '', tr: '' },
                          value: '',
                          description: { en: '', tr: '' }
                        });
                        setShowPersonalizedEducationModal(true);
                      }}
                      className="px-4 py-2 bg-[#990000] text-white rounded-lg hover:bg-[#880000] transition-colors flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t.form.buttons.add}
                    </button>
                  </div>
                  
                  <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                    {personalizedEducationData.length === 0 ? (
                      <p className="text-neutral-500 dark:text-neutral-400 text-center py-4">
                        Henüz kişiselleştirilmiş eğitim kaydı yok
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {personalizedEducationData.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-600">
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                {item.question_key}
                              </p>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Sıra: {item.sort_order} • {item.is_active ? 'Aktif' : 'Pasif'} • {new Date(item.created_at || '').toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditPersonalizedEducation(item)}
                                className="p-2 text-neutral-500 hover:text-[#990000] transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePersonalizedEducation(item.id!)}
                                className="p-2 text-neutral-500 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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

        {/* Kurum Home Modal */}
        {showKurumHomeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    {editingKurumHome ? 'Kurum Ana Sayfa Düzenle' : 'Yeni Kurum Ana Sayfa'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowKurumHomeModal(false);
                      setEditingKurumHome(null);
                      setKurumHomeForm({ institution_key: '', is_active: true });
                    }}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleKurumHomeSubmit} className="space-y-4">
                  <FormInput
                    label={t.form.fields.institutionKey.label}
                    name="institution_key"
                    value={kurumHomeForm.institution_key || ''}
                    onChange={(e) => setKurumHomeForm(prev => ({ ...prev, institution_key: e.target.value }))}
                    placeholder={t.form.fields.institutionKey.placeholder}
                    helper={t.form.fields.institutionKey.helper}
                    required
                  />
                  
                  <FormCheckbox
                    label="Aktif"
                    name="is_active"
                    checked={kurumHomeForm.is_active || false}
                    onChange={(e) => setKurumHomeForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowKurumHomeModal(false);
                        setEditingKurumHome(null);
                        setKurumHomeForm({ institution_key: '', is_active: true });
                      }}
                      className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                    >
                      {t.form.buttons.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-[#990000] text-white rounded-lg hover:bg-[#880000] disabled:opacity-50"
                    >
                      {submitting ? 'Kaydediliyor...' : (editingKurumHome ? t.form.buttons.update : t.form.buttons.create)}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Personalized Education Modal */}
        {showPersonalizedEducationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    {editingPersonalizedEducation ? 'Kişiselleştirilmiş Eğitim Düzenle' : 'Yeni Kişiselleştirilmiş Eğitim'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowPersonalizedEducationModal(false);
                      setEditingPersonalizedEducation(null);
                      setPersonalizedEducationForm({
                        question_key: '',
                        question_title: { en: '', tr: '' },
                        question_subtitle: { en: '', tr: '' },
                        options: [],
                        is_active: true,
                        sort_order: 0,
                        is_multiple_choice: false
                      });
                    }}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handlePersonalizedEducationSubmit} className="space-y-4">
                  <FormInput
                    label={t.form.fields.questionKey.label}
                    name="question_key"
                    value={personalizedEducationForm.question_key || ''}
                    onChange={(e) => setPersonalizedEducationForm(prev => ({ ...prev, question_key: e.target.value }))}
                    placeholder={t.form.fields.questionKey.placeholder}
                    helper={t.form.fields.questionKey.helper}
                    required
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Soru Başlığı (TR)
                      </label>
                      <input
                        type="text"
                        value={personalizedEducationForm.question_title?.tr || ''}
                        onChange={(e) => setPersonalizedEducationForm(prev => ({ 
                          ...prev, 
                          question_title: { 
                            en: prev.question_title?.en || '', 
                            tr: e.target.value 
                          }
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                        placeholder="Türkçe soru başlığı"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Soru Başlığı (EN)
                      </label>
                      <input
                        type="text"
                        value={personalizedEducationForm.question_title?.en || ''}
                        onChange={(e) => setPersonalizedEducationForm(prev => ({ 
                          ...prev, 
                          question_title: { 
                            en: e.target.value,
                            tr: prev.question_title?.tr || ''
                          }
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                        placeholder="English question title"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Soru Alt Başlığı (TR)
                      </label>
                      <input
                        type="text"
                        value={personalizedEducationForm.question_subtitle?.tr || ''}
                        onChange={(e) => setPersonalizedEducationForm(prev => ({ 
                          ...prev, 
                          question_subtitle: { 
                            en: prev.question_subtitle?.en || '',
                            tr: e.target.value
                          }
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                        placeholder="Türkçe soru alt başlığı"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Soru Alt Başlığı (EN)
                      </label>
                      <input
                        type="text"
                        value={personalizedEducationForm.question_subtitle?.en || ''}
                        onChange={(e) => setPersonalizedEducationForm(prev => ({ 
                          ...prev, 
                          question_subtitle: { 
                            en: e.target.value,
                            tr: prev.question_subtitle?.tr || ''
                          }
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                        placeholder="English question subtitle"
                      />
                    </div>
                  </div>
                  
                  <FormInput
                    label={t.form.fields.sortOrder.label}
                    name="sort_order"
                    type="number"
                    value={personalizedEducationForm.sort_order || 0}
                    onChange={(e) => setPersonalizedEducationForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder={t.form.fields.sortOrder.placeholder}
                    helper={t.form.fields.sortOrder.helper}
                  />
                  
                  <FormCheckbox
                    label="Aktif"
                    name="is_active"
                    checked={personalizedEducationForm.is_active || false}
                    onChange={(e) => setPersonalizedEducationForm(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  
                  <FormCheckbox
                    label="Çoklu Seçim"
                    name="is_multiple_choice"
                    checked={personalizedEducationForm.is_multiple_choice || false}
                    onChange={(e) => setPersonalizedEducationForm(prev => ({ ...prev, is_multiple_choice: e.target.checked }))}
                  />
                  
                  {/* Options Management */}
                  <div className="border-t border-neutral-200 dark:border-neutral-600 pt-4">
                    <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                      Seçenekler
                    </h4>
                    
                    {/* Add New Option */}
                    <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 mb-4">
                      <h5 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                        Yeni Seçenek Ekle
                      </h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Seçenek Başlığı (TR)
                          </label>
                          <input
                            type="text"
                            value={newOption.label.tr}
                            onChange={(e) => setNewOption(prev => ({ 
                              ...prev, 
                              label: { ...prev.label, tr: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                            placeholder="Türkçe seçenek başlığı"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Seçenek Başlığı (EN)
                          </label>
                          <input
                            type="text"
                            value={newOption.label.en}
                            onChange={(e) => setNewOption(prev => ({ 
                              ...prev, 
                              label: { ...prev.label, en: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                            placeholder="English option label"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Seçenek Açıklaması (TR)
                          </label>
                          <input
                            type="text"
                            value={newOption.description.tr}
                            onChange={(e) => setNewOption(prev => ({ 
                              ...prev, 
                              description: { ...prev.description, tr: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                            placeholder="Türkçe seçenek açıklaması"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Seçenek Açıklaması (EN)
                          </label>
                          <input
                            type="text"
                            value={newOption.description.en}
                            onChange={(e) => setNewOption(prev => ({ 
                              ...prev, 
                              description: { ...prev.description, en: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                            placeholder="English option description"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                          Seçenek Değeri
                        </label>
                        <input
                          type="text"
                          value={newOption.value}
                          onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                          placeholder="Seçenek değeri (örn: management, finance)"
                        />
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="px-4 py-2 bg-[#990000] text-white rounded-lg hover:bg-[#880000] transition-colors flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Seçenek Ekle
                      </button>
                    </div>
                    
                    {/* Existing Options */}
                    {personalizedEducationForm.options && personalizedEducationForm.options.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          Mevcut Seçenekler ({personalizedEducationForm.options.length})
                        </h5>
                        {personalizedEducationForm.options.map((option: Record<string, unknown>, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-600">
                            <div className="flex-1">
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                {(option.label as { tr?: string; en?: string })?.tr || (option.label as { tr?: string; en?: string })?.en || 'Başlık yok'}
                              </p>
                              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Değer: {String(option.value)} • {(option.description as { tr?: string; en?: string })?.tr || (option.description as { tr?: string; en?: string })?.en || 'Açıklama yok'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(index)}
                              className="p-2 text-neutral-500 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPersonalizedEducationModal(false);
                        setEditingPersonalizedEducation(null);
                        setPersonalizedEducationForm({
                          question_key: '',
                          question_title: { en: '', tr: '' },
                          question_subtitle: { en: '', tr: '' },
                          options: [],
                          is_active: true,
                          sort_order: 0,
                          is_multiple_choice: false
                        });
                        setNewOption({
                          label: { en: '', tr: '' },
                          value: '',
                          description: { en: '', tr: '' }
                        });
                      }}
                      className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                    >
                      {t.form.buttons.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-[#990000] text-white rounded-lg hover:bg-[#880000] disabled:opacity-50"
                    >
                      {submitting ? 'Kaydediliyor...' : (editingPersonalizedEducation ? t.form.buttons.update : t.form.buttons.create)}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

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