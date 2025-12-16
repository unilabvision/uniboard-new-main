'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, Save, ArrowLeft, X, Check, AlertCircle, Info, RefreshCw, Users, User, ChevronDown, Eye, Sparkles, Wand2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AIBulkCertificate from '@/app/components/certificates/AIBulkCertificate';

// Supabase client
const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg'
});

// Types
interface Organization {
  id: number;
  slug: string;
  name: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  abbreviation?: string;
}

interface CertificateTemplate {
  id: number;
  name: string;
  description?: string;
  background_image: string;
  organization_slug: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  design_settings?: {
    colors: {
      primary: string;
      secondary: string;
      text: string;
    };
    fonts: {
      title: string;
      body: string;
    };
    layout: {
      title_position: { x: number; y: number };
      name_position: { x: number; y: number };
      date_position: { x: number; y: number };
      signature_position: { x: number; y: number };
    };
  };
}

interface CertificateFormData {
  fullname: string;
  coursename: string;
  issuedate: string;
  certificatenumber: string;
  instructor: string;
  duration: string;
  organization_slug: string;
  language: string;
  certificate_title: string;
  provider_text: string;
  instructor_label: string;
  date_label: string;
  certificate_number_label: string;
  total_hours_label: string;
  completion_text: string;
  skills_label: string;
  template_id?: number; // Template ID reference
  description: string;
}

interface MultipleCertificateData {
  recipients: string; // virgülle ayrılmış isimler veya excel'den gelen data
  coursename: string;
  issuedate: string;
  instructor: string;
  duration: string;
  organization_slug: string;
  language: string;
  certificate_title: string;
  provider_text: string;
  instructor_label: string;
  date_label: string;
  certificate_number_label: string;
  total_hours_label: string;
  completion_text: string;
  skills_label: string;
  template_id?: number; // Template ID reference
  description: string;
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
    title: "Yeni Sertifika Oluştur",
    subtitle: "Kurslarınız ve eğitimleriniz için sertifika oluşturun",
    mode: {
      single: "Tekli Sertifika",
      multiple: "Çoklu Sertifika",
      description: {
        single: "Tek bir kişi için sertifika oluşturun",
        multiple: "Birden fazla kişi için toplu sertifika oluşturun"
      }
    },
    multipleInput: {
      method: "Giriş Yöntemi",
      manual: "Manuel Giriş",
      excel: "Excel Dosyası",
      ai: "AI Destekli",
      recipients: "Alıcı İsimleri",
      recipientsPlaceholder: "İsimleri virgül ile ayırın (örn: Ahmet Yılmaz, Ayşe Demir, Mehmet Öz)",
      excelFile: "Excel Dosyası",
      excelPlaceholder: "Excel dosyası seçin (.xlsx, .xls)",
      excelInfo: "Excel dosyasının ilk sütununda alıcı isimleri bulunmalıdır",
      uploadButton: "Dosya Seç",
      selectedFile: "Seçilen dosya:",
      aiAnalysis: "AI Analizi",
      aiSuggestions: "AI Önerileri",
      optimizing: "AI optimize ediyor...",
      analyzing: "AI analiz ediyor..."
    },
    form: {
      sections: {
        templateSelection: "Şablon Seçimi",
        certificateInfo: "Sertifika Bilgileri",
        recipientInfo: "Alıcı Bilgileri",
        organizationInfo: "Kurum Bilgileri"
      },
      fields: {
        template: {
          label: "Sertifika Şablonu",
          placeholder: "Şablon seçin (isteğe bağlı)",
          none: "Şablon Kullanma",
          preview: "Önizleme",
          notFound: "Bu kuruluş için şablon bulunamadı"
        },
        fullname: {
          label: "Alıcı Adı Soyadı",
          placeholder: "Örn: John Doe"
        },
        coursename: {
          label: "Kurs/Program Adı",
          placeholder: "Örn: Python ile Veri Bilimi"
        },
        certificate_title: {
          label: "Sertifika Başlığı",
          placeholder: "Örn: Başarı Sertifikası"
        },
        issuedate: {
          label: "Veriliş Tarihi",
          placeholder: "Örn: 2023-08-15"
        },
        certificatenumber: {
          label: "Sertifika Numarası",
          placeholder: "Otomatik oluşturulacak",
          generate: "Numara Oluştur"
        },
        instructor: {
          label: "Eğitmen/Kurum Adı",
          placeholder: "Örn: Prof. Jane Smith"
        },
        duration: {
          label: "Program Süresi",
          placeholder: "Örn: 40 saat"
        },
        organization: {
          label: "Kurum",
          placeholder: "Kurum seçin",
          notFound: "Kurum bulunamadı"
        },
        language: {
          label: "Dil",
          placeholder: "Sertifika dili seçin"
        },
        provider_text: {
          label: "Sağlayıcı Metni",
          placeholder: "Örn: Tarafından sağlanmıştır"
        },
        instructor_label: {
          label: "Eğitmen Etiketi",
          placeholder: "Örn: Eğitmen"
        },
        date_label: {
          label: "Tarih Etiketi",
          placeholder: "Örn: Veriliş Tarihi"
        },
        certificate_number_label: {
          label: "Sertifika Numarası Etiketi",
          placeholder: "Örn: Sertifika No"
        },
        total_hours_label: {
          label: "Toplam Saat Etiketi",
          placeholder: "Örn: Toplam Süre"
        },
        completion_text: {
          label: "Tamamlama Metni",
          placeholder: "Örn: başarıyla tamamlamıştır"
        },
        skills_label: {
          label: "Yetkinlikler Etiketi",
          placeholder: "Örn: Kazanılan Yetkinlikler"
        },
        description: {
          label: "Açıklama",
          placeholder: "Sertifika ile ilgili açıklama"
        }
      },
      buttons: {
        submit: "Sertifika Oluştur",
        cancel: "İptal",
        back: "Geri Dön",
        generateNumber: "Numara Oluştur",
        uploadLogo: "Logo Yükle"
      },
      validation: {
        required: "Bu alan zorunludur",
        invalid: "Geçersiz değer"
      }
    },
    success: {
      title: "Sertifika Başarıyla Oluşturuldu",
      message: "Sertifika sisteme kaydedildi ve indirilebilir durumda.",
      actions: {
        view: "Sertifikayı Görüntüle",
        download: "Sertifikayı İndir",
        create: "Yeni Sertifika Oluştur",
        back: "Sertifika Listesine Dön"
      }
    },
    error: {
      title: "Hata Oluştu",
      message: "Sertifika oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.",
      action: "Tekrar Dene"
    },
    loading: "İşleminiz gerçekleştiriliyor..."
  },
  en: {
    title: "Create New Certificate",
    subtitle: "Create certificates for your courses and trainings",
    mode: {
      single: "Single Certificate",
      multiple: "Multiple Certificates",
      description: {
        single: "Create a certificate for one person",
        multiple: "Create certificates for multiple people"
      }
    },
    multipleInput: {
      method: "Input Method",
      manual: "Manual Input",
      excel: "Excel File",
      ai: "AI-Powered",
      recipients: "Recipient Names",
      recipientsPlaceholder: "Separate names with commas (e.g. John Doe, Jane Smith, Bob Johnson)",
      excelFile: "Excel File",
      excelPlaceholder: "Select Excel file (.xlsx, .xls)",
      excelInfo: "The first column of the Excel file should contain recipient names",
      uploadButton: "Choose File",
      selectedFile: "Selected file:",
      aiAnalysis: "AI Analysis",
      aiSuggestions: "AI Suggestions",
      optimizing: "AI is optimizing...",
      analyzing: "AI is analyzing..."
    },
    form: {
      sections: {
        templateSelection: "Template Selection",
        certificateInfo: "Certificate Information",
        recipientInfo: "Recipient Information",
        organizationInfo: "Organization Information"
      },
      fields: {
        template: {
          label: "Certificate Template",
          placeholder: "Select template (optional)",
          none: "Don't Use Template",
          preview: "Preview",
          notFound: "No templates found for this organization"
        },
        fullname: {
          label: "Recipient Full Name",
          placeholder: "e.g. John Doe"
        },
        coursename: {
          label: "Course/Program Name",
          placeholder: "e.g. Data Science with Python"
        },
        certificate_title: {
          label: "Certificate Title",
          placeholder: "e.g. Certificate of Achievement"
        },
        issuedate: {
          label: "Issue Date",
          placeholder: "e.g. 2023-08-15"
        },
        certificatenumber: {
          label: "Certificate Number",
          placeholder: "Will be generated automatically",
          generate: "Generate Number"
        },
        instructor: {
          label: "Instructor/Organization Name",
          placeholder: "e.g. Prof. Jane Smith"
        },
        duration: {
          label: "Program Duration",
          placeholder: "e.g. 40 hours"
        },
        organization: {
          label: "Organization",
          placeholder: "Select organization",
          notFound: "No organization found"
        },
        language: {
          label: "Language",
          placeholder: "Select certificate language"
        },
        provider_text: {
          label: "Provider Text",
          placeholder: "e.g. Provided by"
        },
        instructor_label: {
          label: "Instructor Label",
          placeholder: "e.g. Instructor"
        },
        date_label: {
          label: "Date Label",
          placeholder: "e.g. Issue Date"
        },
        certificate_number_label: {
          label: "Certificate Number Label",
          placeholder: "e.g. Certificate No"
        },
        total_hours_label: {
          label: "Total Hours Label",
          placeholder: "e.g. Total Duration"
        },
        completion_text: {
          label: "Completion Text",
          placeholder: "e.g. has successfully completed"
        },
        skills_label: {
          label: "Skills Label",
          placeholder: "e.g. Skills Acquired"
        },
        description: {
          label: "Description",
          placeholder: "Description about the certificate"
        }
      },
      buttons: {
        submit: "Create Certificate",
        cancel: "Cancel",
        back: "Go Back",
        generateNumber: "Generate Number",
        uploadLogo: "Upload Logo"
      },
      validation: {
        required: "This field is required",
        invalid: "Invalid value"
      }
    },
    success: {
      title: "Certificate Created Successfully",
      message: "The certificate has been saved to the system and is ready for download.",
      actions: {
        view: "View Certificate",
        download: "Download Certificate",
        create: "Create New Certificate",
        back: "Return to Certificate List"
      }
    },
    error: {
      title: "Error Occurred",
      message: "An error occurred while creating the certificate. Please try again.",
      action: "Try Again"
    },
    loading: "Processing your request..."
  }
};

// Utility functions
const generateCertificateNumber = (organization?: Organization) => {
  // Use abbreviation if available, otherwise fall back to slug uppercase or default
  const orgPrefix = organization?.abbreviation || 
                   organization?.slug?.toUpperCase() || 
                   'MA';
  
  // Current year
  const year = new Date().getFullYear();
  
  // Generate a 5-digit sequential number based on timestamp
  const timestamp = Date.now();
  const sequential = (timestamp % 100000).toString().padStart(5, '0');
  
  // Generate a 4-digit number based on date and random
  const day = new Date().getDate();
  const month = new Date().getMonth() + 1;
  const dateNumber = (day * 100 + month).toString().padStart(4, '0');
  
  // Generate a 3-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let alphaCode = '';
  for (let i = 0; i < 3; i++) {
    alphaCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Generate a 5-character final code
  const finalChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let finalCode = '';
  for (let i = 0; i < 5; i++) {
    finalCode += finalChars.charAt(Math.floor(Math.random() * finalChars.length));
  }
  
  // Format: TTD2025-64783-2608-8C2-1QRW7
  return `${orgPrefix}${year}-${sequential}-${dateNumber}-${alphaCode}-${finalCode}`;
};

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
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
  required = false,
  disabled = false,
  icon: Icon,
  action,
  actionLabel,
  actionIcon: ActionIcon,
  actionLoading = false,
  options = [],
  rows = 3,
  onFileChange
}: { 
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  action?: () => void;
  actionLabel?: string;
  actionIcon?: React.ComponentType<{ className?: string }>;
  actionLoading?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  onFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-neutral-400" />
          </div>
        )}
        
        {type === 'select' ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
              error 
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
            } ${disabled ? 'bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed' : ''}`}
          >
            <option value="">{placeholder}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <div className="flex">
            <textarea
              id={name}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border ${action ? 'rounded-r-none' : 'rounded-md'} focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
                error 
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
                  : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              } ${disabled ? 'bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed' : ''}`}
            />
            
            {action && (
              <button
                type="button"
                onClick={action}
                disabled={actionLoading || disabled}
                className="px-4 py-2 bg-[#990000] dark:bg-red-500 hover:bg-[#880000] dark:hover:bg-red-600 text-white font-medium rounded-r-md transition-colors disabled:bg-neutral-400 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed flex items-center min-h-[76px]"
                title="AI ile açıklama oluştur"
              >
                {actionLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : ActionIcon ? (
                  <ActionIcon className="w-4 h-4" />
                ) : (
                  actionLabel
                )}
              </button>
            )}
          </div>
        ) : type === 'file' ? (
          <input
            type="file"
            id={name}
            name={name}
            onChange={onFileChange}
            disabled={disabled}
            accept=".xlsx,.xls"
            className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
              error 
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
            } ${disabled ? 'bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed' : ''} file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#990000] file:text-white hover:file:bg-[#880000]`}
          />
        ) : (
          <div className="flex">
            <input
              type={type}
              id={name}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border rounded-md ${action ? 'rounded-r-none' : ''} focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
                error 
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
                  : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
              } ${disabled ? 'bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed' : ''}`}
            />
            
            {action && (
              <button
                type="button"
                onClick={action}
                className="px-4 py-2 bg-[#990000] dark:bg-red-500 hover:bg-[#880000] dark:hover:bg-red-600 text-white font-medium rounded-r-md transition-colors"
              >
                {actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};


// Template Selector Component
const TemplateSelector = ({ 
  templates, 
  selectedTemplate, 
  onSelectTemplate, 
  error,
  t,
  locale
}: {
  templates: CertificateTemplate[];
  selectedTemplate: CertificateTemplate | null;
  onSelectTemplate: (template: CertificateTemplate | null) => void;
  error?: string;
  t: typeof texts.tr;
  locale: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplate | null>(null);

  return (
    <div className="space-y-4">
      {/* Template Selector Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-3 border rounded-md hover:border-neutral-300 dark:hover:border-neutral-500 transition-all flex items-center justify-between bg-white dark:bg-neutral-800 ${
            error 
              ? 'border-red-300 dark:border-red-500' 
              : 'border-neutral-300 dark:border-neutral-600'
          }`}
        >
          <div className="flex items-center space-x-3">
            {selectedTemplate ? (
              <>
                <div className="w-12 h-8 bg-neutral-100 dark:bg-neutral-700 rounded overflow-hidden">
                  {selectedTemplate.background_image ? (
                    <Image
                      src={selectedTemplate.background_image}
                      alt={selectedTemplate.name}
                      width={48}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Award className="w-4 h-4 text-neutral-400" />
                    </div>
                  )}
                </div>
                <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                  {selectedTemplate.name}
                </span>
                {selectedTemplate.is_default && (
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                    Varsayılan
                  </span>
                )}
              </>
            ) : (
              <>
                <div className="w-12 h-8 bg-neutral-100 dark:bg-neutral-700 rounded flex items-center justify-center">
                  <Award className="w-4 h-4 text-neutral-400" />
                </div>
                <span className="text-red-500 dark:text-red-400">
                  Lütfen bir şablon seçin *
                </span>
              </>
            )}
          </div>
          <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Template Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
            {/* Template Options */}
            {templates.length > 0 ? (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer border-b border-neutral-100 dark:border-neutral-700 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-3 flex-1"
                      onClick={() => {
                        onSelectTemplate(template);
                        setIsOpen(false);
                      }}
                    >
                      <div className="w-12 h-8 bg-neutral-100 dark:bg-neutral-700 rounded overflow-hidden">
                        {template.background_image ? (
                          <Image
                            src={template.background_image}
                            alt={template.name}
                            width={48}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Award className="w-4 h-4 text-neutral-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                            {template.name}
                          </span>
                          {template.is_default && (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                              Varsayılan
                            </span>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template);
                      }}
                      className="ml-3 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-600 rounded-md transition-colors"
                      title={t.form.fields.template.preview}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
                <Award className="w-6 h-6 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm mb-3">{t.form.fields.template.notFound}</p>
                <Link
                  href={`/${locale}/certificates/templates/create`}
                  className="inline-flex items-center px-4 py-2 bg-[#990000] dark:bg-red-500 hover:bg-[#880000] dark:hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Şablon Oluştur
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                  {previewTemplate.name}
                </h3>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {previewTemplate.description && (
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  {previewTemplate.description}
                </p>
              )}
              
              <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 aspect-[3/2] flex items-center justify-center">
                {previewTemplate.background_image ? (
                  <Image
                    src={previewTemplate.background_image}
                    alt={previewTemplate.name}
                    width={400}
                    height={267}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                ) : (
                  <div className="text-neutral-400 text-center">
                    <Award className="w-16 h-16 mx-auto mb-2" />
                    <p>Şablon önizlemesi mevcut değil</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 text-sm transition-colors"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    onSelectTemplate(previewTemplate);
                    setPreviewTemplate(null);
                    setIsOpen(false);
                  }}
                  className="px-3 py-2 bg-[#990000] dark:bg-red-500 hover:bg-[#880000] dark:hover:bg-red-600 text-white text-sm rounded-md transition-colors"
                >
                  Bu Şablonu Seç
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

// Main Component
export default function CreateCertificatePage() {
  const [isMultipleMode, setIsMultipleMode] = useState(false);
  const [aiRecipients, setAiRecipients] = useState<string[]>([]);
  const [recipientsWithEmails, setRecipientsWithEmails] = useState<Array<{ name: string; email?: string }>>([]);
  
  const [formData, setFormData] = useState<CertificateFormData>({
    fullname: '',
    coursename: '',
    issuedate: formatDate(new Date()),
    certificatenumber: '',
    instructor: '',
    duration: '',
    organization_slug: '',
    language: 'tr',
    certificate_title: 'Başarı Sertifikası',
    provider_text: 'tarafından sağlanmıştır',
    instructor_label: 'Eğitmen',
    date_label: 'Veriliş Tarihi',
    certificate_number_label: 'Sertifika No',
    total_hours_label: 'Toplam Süre',
    completion_text: 'başarıyla tamamlamıştır',
    skills_label: 'Kazanılan Yetkinlikler',
    description: ''
  });

  const [multipleFormData, setMultipleFormData] = useState<MultipleCertificateData>({
    recipients: '',
    coursename: '',
    issuedate: formatDate(new Date()),
    instructor: '',
    duration: '',
    organization_slug: '',
    language: 'tr',
    certificate_title: 'Başarı Sertifikası',
    provider_text: 'tarafından sağlanmıştır',
    instructor_label: 'Eğitmen',
    date_label: 'Veriliş Tarihi',
    certificate_number_label: 'Sertifika No',
    total_hours_label: 'Toplam Süre',
    completion_text: 'başarıyla tamamlamıştır',
    skills_label: 'Kazanılan Yetkinlikler',
    description: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCertificateNumber, setCreatedCertificateNumber] = useState<string | null>(null);
  const [isBulkCreation, setIsBulkCreation] = useState(false);
  const [createdCertificates, setCreatedCertificates] = useState<Array<{
    id: number;
    fullname: string;
    email?: string;
    certificatenumber: string;
    certificateurl: string;
    coursename: string;
    description?: string;
    organization?: string;
  }>>([]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [customEmailMessage, setCustomEmailMessage] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0, percentage: 0 });
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  
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

  // Fetch organizations and templates
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Check if user has any organization slugs
        if (!currentUser.organizationSlugs || currentUser.organizationSlugs.length === 0) {
          // If no organizations, show empty state
          setOrganizations([]);
          setTemplates([]);
          setLoading(false);
          return;
        }
        
        // Fetch organizations
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .in('slug', currentUser.organizationSlugs || []);
        
        if (orgsError) {
          throw orgsError;
        }
        
        setOrganizations(orgsData || []);
        
        // Fetch templates for user's organizations
        const { data: templatesData, error: templatesError } = await supabase
          .from('certificate_templates')
          .select('*')
          .in('organization_slug', currentUser.organizationSlugs || [])
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });
        
        if (templatesError) {
          // If templates table doesn't exist, just log and continue
          console.log('Templates not available:', templatesError);
          setTemplates([]);
        } else {
          setTemplates(templatesData || []);
        }
        
      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  // Auto-select default template when templates are loaded
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      // First try to find default template
      const defaultTemplate = templates.find(t => t.is_default);
      const templateToSelect = defaultTemplate || templates[0];
      
      setSelectedTemplate(templateToSelect);
      if (isMultipleMode) {
        setMultipleFormData(prev => ({ ...prev, template_id: templateToSelect.id }));
      } else {
        setFormData(prev => ({ ...prev, template_id: templateToSelect.id }));
      }
    }
  }, [templates, selectedTemplate, isMultipleMode]);

  // Handle AI recipients update
  const handleAIRecipientsUpdate = (recipients: string[]) => {
    setAiRecipients(recipients);
  };

  // Handle recipients with emails update
  const handleRecipientsWithEmailsUpdate = (recipients: Array<{ name: string; email?: string }>) => {
    console.log('Received recipients with emails:', recipients);
    setRecipientsWithEmails(recipients);
    // Also update aiRecipients for backward compatibility
    setAiRecipients(recipients.map(r => r.name));
    setMultipleFormData(prev => ({ 
      ...prev, 
      recipients: recipients.join(', ') 
    }));
  };

  // Handle AI field suggestions
  const handleAIFieldSuggestions = (suggestions: Record<string, string>) => {
    setMultipleFormData(prev => ({
      ...prev,
      ...suggestions
    }));
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (isMultipleMode) {
      setMultipleFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };


  // Handle mode switch
  const handleModeSwitch = (mode: boolean) => {
    setIsMultipleMode(mode);
    setErrors({});
    setAiRecipients([]);
  };

  // Handle generate certificate number button
  const handleGenerateNumber = () => {
    // Use the first organization if available
    const organization = organizations[0];
    
    setFormData(prev => ({
      ...prev,
      certificatenumber: generateCertificateNumber(organization)
    }));
  };

  // Handle AI description generation
  const handleGenerateDescription = async () => {
    const currentFormData = isMultipleMode ? multipleFormData : formData;
    const courseName = currentFormData.coursename;
    const instructor = currentFormData.instructor;
    const organization = organizations[0];
    
    if (!courseName.trim()) {
      setErrors(prev => ({ ...prev, coursename: 'Açıklama oluşturmak için önce etkinlik/kurs adını girin' }));
      return;
    }

    try {
      setGeneratingDescription(true);
      
      let prompt;
      
      if (customPrompt.trim()) {
        // Use custom prompt with context
        prompt = `Sertifika açıklaması oluştur. 
        
ETKİNLİK BİLGİLERİ:
        - Etkinlik/Kurs adı: "${courseName}"
        - Eğitmen/Organizatör: "${instructor || organization?.name || 'Kurum'}"
        
        ÖZEL TALİMAT:
        ${customPrompt}
        
        GENEL KURALLAR:
        - Türkçe olsun
        - Profesyonel ve resmi dil kullan
        - Maksimum 250 karakter
        - Sadece açıklamayı döndür, başka bir şey ekleme`;
      } else {
        // Use default prompt
        prompt = `Bir sertifika için kısa ve profesyonel açıklama yazısı oluştur. 
        
ETKİNLİK BİLGİLERİ:
        - Etkinlik/Kurs adı: "${courseName}"
        - Eğitmen/Organizatör: "${instructor || organization?.name || 'Kurum'}"
        
        KURALLLAR:
        - Türkçe olsun
        - Çok kısa ve öz olsun (maksimum 150 karakter)
        - Profesyonel ve resmi dil kullan
        - "hak kazanmıştır" veya "elde etmiştir" ile bitir
        - 1-2 cümle olsun
        - Gereksiz detaylardan kaçın
        
        Örnek formatlar:
        - &quot;[Konu] alanında temel bilgi ve becerileri elde etmiştir.&quot;
        - &quot;[Program] kapsamında gerekli yetkinlikleri kazanmış ve bu sertifikayı hak etmiştir.&quot;
        - &quot;[Eğitim] sürecini başarıyla tamamlayarak ilgili becerileri elde etmiştir.&quot;
        
        Sadece açıklamayı döndür, başka bir şey ekleme:`;
      }
      
      console.log('AI Description Request:', {
        courseName,
        instructor,
        organization: organization?.name
      });
      
      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          maxTokens: 150
        }),
      });
      
      console.log('AI API Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, response.statusText, errorData);
        throw new Error(errorData.error || 'AI yanıtı alınamadı');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'AI yanıtı başarısız');
      }
      
      const generatedDescription = data.response?.trim() || '';
      
      if (generatedDescription) {
        if (isMultipleMode) {
          setMultipleFormData(prev => ({ ...prev, description: generatedDescription }));
        } else {
          setFormData(prev => ({ ...prev, description: generatedDescription }));
        }
        
        // Clear any existing description error
        if (errors.description) {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.description;
            return newErrors;
          });
        }
      }
    } catch (error) {
      console.error('AI açıklama oluşturma hatası:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Full error:', error);
      
      setErrors(prev => ({ 
        ...prev, 
        description: `AI açıklaması oluşturulamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` 
      }));
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Template selection is required
    if (!selectedTemplate) {
      newErrors.template = 'Şablon seçimi zorunludur';
    }
    
    if (isMultipleMode) {
      // Multiple mode validation
      if (!multipleFormData.coursename) newErrors.coursename = t.form.validation.required;
      if (!multipleFormData.issuedate) newErrors.issuedate = t.form.validation.required;
      if (!multipleFormData.description) newErrors.description = t.form.validation.required;
      if (organizations.length === 0) newErrors.organization = 'Kurum erişimi bulunamadı';
      
      // Validate recipients input
      if (aiRecipients.length === 0) {
        if (!multipleFormData.recipients.trim()) {
          newErrors.recipients = 'En az bir alıcı gerekli (AI veya manuel giriş)';
        }
      }
    } else {
      // Single mode validation
      if (!formData.fullname) newErrors.fullname = t.form.validation.required;
      if (!formData.coursename) newErrors.coursename = t.form.validation.required;
      if (!formData.issuedate) newErrors.issuedate = t.form.validation.required;
      if (!formData.description) newErrors.description = t.form.validation.required;
      if (organizations.length === 0) newErrors.organization = 'Kurum erişimi bulunamadı';
      
      // Auto generate certificate number if missing
      if (!formData.certificatenumber) {
        const organization = organizations[0];
        setFormData(prev => ({
          ...prev,
          certificatenumber: generateCertificateNumber(organization)
        }));
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (isMultipleMode) {
        // Handle multiple certificate creation
        let recipients: string[] = [];
        
        // Use AI recipients if available, otherwise fall back to manual input
        if (aiRecipients.length > 0) {
          recipients = aiRecipients;
        } else {
          // Parse comma-separated names from manual input
          recipients = multipleFormData.recipients
            .split(',')
            .map(name => name.trim())
            .filter(name => name.length > 0);
        }
        
        if (recipients.length === 0) {
          setError('Geçerli alıcı bulunamadı');
          return;
        }
        
        // Create certificates for all recipients (email will be matched after creation)
        const certificatesToCreate = recipients.map(fullname => {
          const organization = organizations[0];
          const orgSlug = organization?.slug || '';
          const certificateNumber = generateCertificateNumber(organization);
          const certificateUrl = `https://certificates.myunilab.net/${orgSlug}/${certificateNumber}`;
          
          // Create certificate data (DO NOT include email - it's not in the database schema)
          const certificateBaseData = {
            coursename: multipleFormData.coursename,
            issuedate: multipleFormData.issuedate,
            instructor: multipleFormData.instructor,
            duration: multipleFormData.duration,
            language: multipleFormData.language,
            certificate_title: multipleFormData.certificate_title,
            provider_text: multipleFormData.provider_text,
            instructor_label: multipleFormData.instructor_label,
            date_label: multipleFormData.date_label,
            certificate_number_label: multipleFormData.certificate_number_label,
            total_hours_label: multipleFormData.total_hours_label,
            completion_text: multipleFormData.completion_text,
            skills_label: multipleFormData.skills_label,
            description: multipleFormData.description
          };
          
          return {
            ...certificateBaseData,
            fullname,
            organization_slug: orgSlug,
            certificatenumber: certificateNumber,
            certificateurl: certificateUrl,
            template_id: selectedTemplate?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        });
        
        console.log('Multiple certificates data to insert:', {
          count: certificatesToCreate.length,
          sample: certificatesToCreate[0],
          allData: certificatesToCreate
        });
        
        // Insert all certificates
        const { data, error: insertError } = await supabase
          .from('certificates')
          .insert(certificatesToCreate)
          .select();
        
        console.log('Multiple certificates insert result:', { data, error: insertError });
        
        if (insertError) {
          console.error('Multiple certificates insert error details:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
            full: insertError
          });
          throw new Error(`Supabase error: ${insertError.message || 'Unknown database error'}`);
        }
        
        // Success! Store created certificates and match with email info from Excel
        setSuccess(true);
        setIsBulkCreation(true);
        
        // Store certificates and match emails from recipientsWithEmails (from Excel upload)
        console.log('Matching emails for certificates. recipientsWithEmails:', recipientsWithEmails);
        console.log('Created certificates data:', data);
        console.log('Organizations:', organizations);
        console.log('Organization name:', organizations[0]?.name);
        const certificatesData = data.map((cert: {
          id: number;
          fullname: string;
          certificatenumber: string;
          certificateurl: string;
          coursename: string;
          description?: string;
          instructor?: string;
        }) => {
          // Find matching email from recipientsWithEmails (from Excel column selection)
          const recipientWithEmail = recipientsWithEmails.find(r => r.name === cert.fullname);
          const orgName = organizations[0]?.name || cert.instructor || 'Kurum';
          console.log(`Certificate: ${cert.fullname}, Organization: ${orgName}, Found email: ${recipientWithEmail?.email || 'none'}`);
          return {
            id: cert.id,
            fullname: cert.fullname || '',
            email: recipientWithEmail?.email || undefined, // Email from Excel, not from database
            certificatenumber: cert.certificatenumber,
            certificateurl: cert.certificateurl,
            coursename: cert.coursename,
            description: cert.description,
            organization: orgName
          };
        });
        console.log('Final certificates data with emails:', certificatesData);
        setCreatedCertificates(certificatesData);
        
      } else {
        // Handle single certificate creation
        const orgSlug = organizations[0]?.slug || '';
        const certificateUrl = `https://certificates.myunilab.net/${orgSlug}/${formData.certificatenumber}`;
        
        const certificateData = {
          ...formData,
          organization_slug: orgSlug,
          certificateurl: certificateUrl,
          template_id: selectedTemplate?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Certificate data to insert:', certificateData);
        
        const { data, error: insertError } = await supabase
          .from('certificates')
          .insert([certificateData])
          .select();
        
        console.log('Supabase insert result:', { data, error: insertError });
        
        if (insertError) {
          console.error('Supabase insert error details:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
            full: insertError
          });
          throw new Error(`Supabase error: ${insertError.message || 'Unknown database error'}`);
        }
        
        // Success! Store single certificate
        setSuccess(true);
        setIsBulkCreation(false);
        setCreatedCertificateNumber(formData.certificatenumber);
        
        // Get organization name
        const orgName = organizations[0]?.name || formData.instructor || 'Kurum';
        console.log('Single certificate - Organization:', orgName, 'Organizations:', organizations);
        
        // Store single certificate
        setCreatedCertificates([{
          id: data?.[0]?.id || 0,
          fullname: formData.fullname || '',
          email: undefined, // Single certificate doesn't have email in form
          certificatenumber: formData.certificatenumber,
          certificateurl: certificateUrl,
          coursename: formData.coursename,
          description: formData.description,
          organization: orgName
        }]);
      }
      
    } catch (error: unknown) {
      console.error('Error creating certificate:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        stringified: JSON.stringify(error, null, 2)
      });
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-96 mb-8"></div>
            
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-48 mb-4"></div>
              
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-2"></div>
                    <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-48 mb-4"></div>
              
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-32 mb-2"></div>
                    <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
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

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {t.success.title}
            </h2>
            
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
              {t.success.message}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              {(createdCertificateNumber || isBulkCreation) && (
                <Link 
                  href={
                    isBulkCreation 
                      ? `https://dashboard.myunilab.net/${locale}/certificates`
                      : `https://certificates.myunilab.net/${createdCertificateNumber}`
                  }
                  target={isBulkCreation ? undefined : "_blank"}
                  rel={isBulkCreation ? undefined : "noopener noreferrer"}
                  className="w-full sm:w-auto px-6 py-3 bg-[#990000] dark:bg-red-500 hover:bg-[#880000] dark:hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                >
                  {t.success.actions.view}
                </Link>
              )}
              
              <Link 
                href={`/${locale}/certificates/create`}
                className="w-full sm:w-auto px-6 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
              >
                {t.success.actions.create}
              </Link>
              
              <Link 
                href={`/${locale}/certificates`}
                className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                {t.success.actions.back}
              </Link>
            </div>

            {/* Email Sending Section */}
            {createdCertificates.length > 0 && (
              <div className="mt-8 p-6 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                {!emailSent ? (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                          {locale === 'tr' ? 'Sertifikaları E-posta ile Gönder' : 'Send Certificates via Email'}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {locale === 'tr' 
                            ? `${createdCertificates.length} sertifika oluşturuldu. Alıcılara otomatik olarak e-posta gönderebilirsiniz.`
                            : `${createdCertificates.length} certificates created. You can automatically send emails to recipients.`
                          }
                        </p>
                      </div>
                      {!showEmailForm && (
                        <button
                          onClick={() => setShowEmailForm(true)}
                          className="px-6 py-2.5 bg-[#990000] dark:bg-red-500 hover:bg-[#880000] dark:hover:bg-red-600 text-white font-medium rounded-md transition-colors"
                        >
                          {locale === 'tr' ? 'E-posta Gönder' : 'Send Email'}
                        </button>
                      )}
                    </div>

                    {showEmailForm && (
                      <div className="space-y-5 bg-neutral-50 dark:bg-neutral-900/50 p-5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        {/* Progress Bar */}
                        {sendingEmails && emailProgress.total > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {locale === 'tr' ? 'Gönderiliyor' : 'Sending'}
                              </span>
                              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                {emailProgress.sent} / {emailProgress.total} ({emailProgress.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2.5">
                              <div 
                                className="bg-[#990000] dark:bg-red-500 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${emailProgress.percentage}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Custom Message */}
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            {locale === 'tr' ? 'Özel Mesaj (İsteğe bağlı)' : 'Custom Message (Optional)'}
                          </label>
                          <textarea
                            value={customEmailMessage}
                            onChange={(e) => setCustomEmailMessage(e.target.value)}
                            placeholder={locale === 'tr' 
                              ? 'Sertifika alıcılarına göndermek istediğiniz özel mesajı buraya yazabilirsiniz...'
                              : 'You can write a custom message to send to certificate recipients here...'}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent resize-none text-sm"
                            rows={4}
                            disabled={sendingEmails}
                          />
                        </div>

                        {/* Email List */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                              {locale === 'tr' ? 'Alıcı Listesi' : 'Recipient List'}
                            </label>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              {createdCertificates.filter(c => c.email && c.email.trim() !== '').length} / {createdCertificates.length} {locale === 'tr' ? 'e-posta mevcut' : 'emails available'}
                            </span>
                          </div>
                          
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {createdCertificates.map((cert, index) => {
                              const hasEmail = cert.email && cert.email.trim() !== '';
                              return (
                                <div 
                                  key={cert.id} 
                                  className={`p-3 rounded-md border transition-colors ${
                                    hasEmail 
                                      ? 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700' 
                                      : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 flex items-center justify-center text-xs font-medium">
                                      {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1.5">
                                        {cert.fullname}
                                      </div>
                                      <input
                                        type="email"
                                        value={cert.email || ''}
                                        onChange={(e) => {
                                          const updated = [...createdCertificates];
                                          updated[index].email = e.target.value;
                                          setCreatedCertificates(updated);
                                        }}
                                        placeholder={locale === 'tr' ? 'E-posta adresi' : 'Email address'}
                                        className="w-full px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-[#990000] focus:border-[#990000] text-sm"
                                        disabled={sendingEmails}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                          <button
                            onClick={async () => {
                              const certificatesToSend = createdCertificates.filter(cert => cert.email && cert.email.trim() !== '');
                              
                              if (certificatesToSend.length === 0) {
                                setEmailError(locale === 'tr' 
                                  ? 'En az bir sertifika için e-posta adresi girmelisiniz.'
                                  : 'You must enter at least one email address for certificates.');
                                return;
                              }

                              setSendingEmails(true);
                              setEmailError(null);
                              setEmailProgress({ sent: 0, total: certificatesToSend.length, percentage: 0 });
                              
                              try {
                                // Her email'i sırayla gönder ve progress'i güncelle
                                let sentCount = 0;
                                const errors: string[] = [];

                                for (const cert of certificatesToSend) {
                                  try {
                                    const response = await fetch('/api/certificates/send-emails', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        certificates: [cert],
                                        customMessage: customEmailMessage,
                                        locale
                                      }),
                                      // Debug: log the certificate data being sent
                                      // console.log('Sending certificate:', cert);
                                    });

                                    const result = await response.json();

                                    if (result.success && result.sent > 0) {
                                      sentCount++;
                                    } else {
                                      errors.push(`${cert.fullname}: ${result.error || 'Gönderilemedi'}`);
                                    }
                                  } catch (error: unknown) {
                                    const errorMessage = error instanceof Error ? error.message : 'Hata';
                                    errors.push(`${cert.fullname}: ${errorMessage}`);
                                  }

                                  // Progress güncelle
                                  const percentage = Math.round((sentCount / certificatesToSend.length) * 100);
                                  setEmailProgress({ 
                                    sent: sentCount, 
                                    total: certificatesToSend.length, 
                                    percentage 
                                  });
                                }

                                if (sentCount > 0) {
                                  setEmailSent(true);
                                  setShowEmailForm(false);
                                } else {
                                  setEmailError(locale === 'tr' 
                                    ? 'Hiçbir e-posta gönderilemedi. Lütfen tekrar deneyin.'
                                    : 'No emails were sent. Please try again.');
                                }

                                if (errors.length > 0) {
                                  console.warn('Email sending errors:', errors);
                                }
                              } catch (error: unknown) {
                                const errorMessage = error instanceof Error ? error.message : (locale === 'tr' ? 'Mail gönderme hatası' : 'Email sending error');
                                setEmailError(errorMessage);
                              } finally {
                                setSendingEmails(false);
                              }
                            }}
                            disabled={sendingEmails || createdCertificates.filter(c => c.email && c.email.trim() !== '').length === 0}
                            className="flex-1 px-5 py-2.5 bg-[#990000] dark:bg-red-500 hover:bg-[#880000] dark:hover:bg-red-600 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingEmails 
                              ? (locale === 'tr' ? 'Gönderiliyor...' : 'Sending...')
                              : (locale === 'tr' 
                                  ? `${createdCertificates.filter(c => c.email && c.email.trim() !== '').length} E-postayı Gönder`
                                  : `Send ${createdCertificates.filter(c => c.email && c.email.trim() !== '').length} Emails`)
                            }
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowEmailForm(false);
                              setCustomEmailMessage('');
                              setEmailError(null);
                              setEmailProgress({ sent: 0, total: 0, percentage: 0 });
                            }}
                            disabled={sendingEmails}
                            className="px-5 py-2.5 bg-neutral-200 dark:bg-neutral-600 hover:bg-neutral-300 dark:hover:bg-neutral-500 text-neutral-700 dark:text-neutral-300 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {locale === 'tr' ? 'İptal' : 'Cancel'}
                          </button>
                        </div>

                        {emailError && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
                            {emailError}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-green-700 dark:text-green-400 block text-sm">
                        {locale === 'tr' ? 'E-postalar başarıyla gönderildi' : 'Emails sent successfully'}
                      </span>
                      <span className="text-xs text-green-600 dark:text-green-500">
                        {locale === 'tr' 
                          ? `${emailProgress.sent || createdCertificates.filter(c => c.email && c.email.trim() !== '').length} alıcıya e-posta gönderildi`
                          : `Emails sent to ${emailProgress.sent || createdCertificates.filter(c => c.email && c.email.trim() !== '').length} recipients`
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full break-words">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link 
                href={`/${locale}/certificates`} 
                className="mr-4 p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {t.title}
                </h1>
                <div className="w-8 h-px bg-[#990000] dark:bg-red-500 mt-2"></div>
              </div>
            </div>
            <span className="inline-flex items-center text-xs bg-[#990000] dark:bg-red-500 text-white px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3 mr-1" />
              MyUNI AI
            </span>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t.subtitle}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="mb-4">
          <div className="flex bg-neutral-100 dark:bg-neutral-700 rounded-md p-1">
            <button
              type="button"
              onClick={() => handleModeSwitch(false)}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                !isMultipleMode 
                  ? 'bg-white dark:bg-neutral-600 shadow-sm text-[#990000] dark:text-red-400' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              {t.mode.single}
            </button>
            
            <button
              type="button"
              onClick={() => handleModeSwitch(true)}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-colors ${
                isMultipleMode 
                  ? 'bg-white dark:bg-neutral-600 shadow-sm text-[#990000] dark:text-red-400' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              {t.mode.multiple}
            </button>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Organization check */}
        {organizations.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" />
              <div>
                <span className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                  Henüz kurumunuz bulunmuyor
                </span>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Sertifika oluşturmak için önce kurum bilgilerinizi eklemeniz gerekmektedir.
                </p>
                <div className="mt-2">
                  <Link 
                    href={`/${locale}/certificates/settings`} 
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-900/40 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors"
                  >
                    Kurum Ekle
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            {/* Template Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                {t.form.sections.templateSelection}
              </h3>
              <TemplateSelector 
                templates={templates}
                selectedTemplate={selectedTemplate}
                onSelectTemplate={(template) => {
                  setSelectedTemplate(template);
                  if (isMultipleMode) {
                    setMultipleFormData(prev => ({ ...prev, template_id: template?.id }));
                  } else {
                    setFormData(prev => ({ ...prev, template_id: template?.id }));
                  }
                  // Clear template error when selecting a template
                  if (errors.template) {
                    const newErrors = { ...errors };
                    delete newErrors.template;
                    setErrors(newErrors);
                  }
                }}
                error={errors.template}
                t={t}
                locale={locale}
              />
            </div>

            {/* Recipient Info */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                {t.form.sections.recipientInfo}
              </h3>
                {isMultipleMode ? (
                  <>
                    {/* AI-Powered Bulk Certificate Component */}
                    <div className="mb-4">
                      <div className="flex items-center mb-3">
                        <Sparkles className="w-4 h-4 text-[#990000] dark:text-red-400 mr-2" />
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          AI Destekli Toplu Sertifika
                        </h4>
                        <span className="ml-2 text-xs bg-[#990000] dark:bg-red-500 text-white px-2 py-0.5 rounded-full">
                          Yeni
                        </span>
                      </div>
                      
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600 mb-3">
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          Excel dosyanızı yükleyin, AI otomatik olarak alıcıları tespit etsin ve sertifika alanları için öneriler versin.
                        </p>
                      </div>

                      <AIBulkCertificate
                        onRecipientsUpdate={handleAIRecipientsUpdate}
                        onRecipientsWithEmailsUpdate={handleRecipientsWithEmailsUpdate}
                        onFieldSuggestions={handleAIFieldSuggestions}
                        courseName={multipleFormData.coursename}
                        error={errors.recipients || errors.excelFile}
                        disabled={submitting}
                      />
                    </div>

                    {/* Recipients Preview */}
                    {aiRecipients.length > 0 && (
                      <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600">
                        <div className="flex items-center mb-2">
                          <Check className="w-4 h-4 text-[#990000] dark:text-red-400 mr-2" />
                          <h5 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {aiRecipients.length} alıcı tespit edildi
                          </h5>
                        </div>
                        <div className="max-h-24 overflow-y-auto">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                            {aiRecipients.slice(0, 9).map((recipient, index) => (
                              <div key={index} className="text-xs text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-800 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-600">
                                {index + 1}. {recipient}
                              </div>
                            ))}
                            {aiRecipients.length > 9 && (
                              <div className="text-xs text-neutral-500 dark:text-neutral-500 italic px-2 py-1">
                                ... ve {aiRecipients.length - 9} kişi daha
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Single mode inputs
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                      label={t.form.fields.fullname.label}
                      name="fullname"
                      placeholder={t.form.fields.fullname.placeholder}
                      value={formData.fullname}
                      onChange={handleChange}
                      error={errors.fullname}
                      required
                    />
                    
                    <FormInput
                      label={t.form.fields.certificatenumber.label}
                      name="certificatenumber"
                      placeholder={t.form.fields.certificatenumber.placeholder}
                      value={formData.certificatenumber}
                      onChange={handleChange}
                      error={errors.certificatenumber}
                      action={handleGenerateNumber}
                      actionLabel={t.form.fields.certificatenumber.generate}
                    />
                  </div>
                )}
            </div>
            
            {/* Course Info */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                {t.form.sections.certificateInfo}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label={t.form.fields.coursename.label}
                  name="coursename"
                  placeholder={t.form.fields.coursename.placeholder}
                  value={isMultipleMode ? multipleFormData.coursename : formData.coursename}
                  onChange={handleChange}
                  error={errors.coursename}
                  required
                />
                
                <FormInput
                  label={t.form.fields.certificate_title.label}
                  name="certificate_title"
                  placeholder={t.form.fields.certificate_title.placeholder}
                  value={isMultipleMode ? multipleFormData.certificate_title : formData.certificate_title}
                  onChange={handleChange}
                  error={errors.certificate_title}
                />
                
                <FormInput
                  label={t.form.fields.instructor.label}
                  name="instructor"
                  placeholder={t.form.fields.instructor.placeholder}
                  value={isMultipleMode ? multipleFormData.instructor : formData.instructor}
                  onChange={handleChange}
                  error={errors.instructor}
                />
                
                <FormInput
                  label={t.form.fields.duration.label}
                  name="duration"
                  placeholder={t.form.fields.duration.placeholder}
                  value={isMultipleMode ? multipleFormData.duration : formData.duration}
                  onChange={handleChange}
                  error={errors.duration}
                />
                
                <FormInput
                  label={t.form.fields.issuedate.label}
                  name="issuedate"
                  type="date"
                  value={isMultipleMode ? multipleFormData.issuedate : formData.issuedate}
                  onChange={handleChange}
                  error={errors.issuedate}
                  required
                />
                
                <FormInput
                  label={t.form.fields.language.label}
                  name="language"
                  type="select"
                  placeholder={t.form.fields.language.placeholder}
                  value={isMultipleMode ? multipleFormData.language : formData.language}
                  onChange={handleChange}
                  error={errors.language}
                  options={[
                    { value: 'tr', label: 'Türkçe' },
                    { value: 'en', label: 'English' }
                  ]}
                />
              </div>
              
              {/* Description field - spans full width */}
              <div className="col-span-1 md:col-span-2">
                <FormInput
                  label={t.form.fields.description.label}
                  name="description"
                  type="textarea"
                  placeholder={t.form.fields.description.placeholder}
                  value={isMultipleMode ? multipleFormData.description : formData.description}
                  onChange={handleChange}
                  error={errors.description}
                  required
                  rows={3}
                  disabled={submitting}
                />
                
                {/* AI Custom Prompt Accordion */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                    className="flex items-center justify-between w-full p-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    disabled={submitting || generatingDescription}
                  >
                    <div className="flex items-center">
                      <Sparkles className="w-4 h-4 text-[#990000] dark:text-red-400 mr-2" />
                      <span>AI ile Açıklama Oluştur</span>
                      {customPrompt && (
                        <span className="ml-2 px-2 py-0.5 bg-[#990000] dark:bg-red-500 text-white text-xs rounded-full">
                          Özel Talimat Aktif
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${showCustomPrompt ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Accordion Content */}
                  {showCustomPrompt && (
                    <div className="mt-2 p-3 border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                              Özel Talimat
                            </label>
                            <button
                              type="button"
                              onClick={() => setCustomPrompt('')}
                              className={`text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors ${customPrompt ? 'visible' : 'invisible'}`}
                            >
                              Temizle
                            </button>
                          </div>
                          <input
                            type="text"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Örn: 'Daha teknik bir dil kullan' veya 'Başarı vurgusu yap' veya 'Kısa ve öz olsun'"
                            className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 placeholder-neutral-400 focus:ring-2 focus:ring-[#990000] focus:border-transparent transition-colors"
                            disabled={submitting || generatingDescription}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && customPrompt.trim()) {
                                e.preventDefault();
                                handleGenerateDescription();
                              }
                            }}
                          />
                          
                          {/* Apply Button */}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              Özel talimat ile açıklama oluşturun. Boş bırakırsanız standart format kullanılır.
                            </p>
                            <button
                              type="button"
                              onClick={handleGenerateDescription}
                              disabled={submitting || generatingDescription}
                              className="ml-3 px-3 py-1 bg-[#990000] dark:bg-red-500 hover:bg-[#880000] dark:hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors disabled:bg-neutral-300 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed flex items-center"
                            >
                              {generatingDescription ? (
                                <>
                                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                  Oluşturuluyor...
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-3 h-3 mr-1" />
                                  Açıklama Oluştur
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* AI Prompt Preview */}
                        {customPrompt && (
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md">
                            <div className="flex items-start">
                              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                                  Aktif Talimat
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                  &quot;{customPrompt}&quot;
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Example Prompts */}
                        <div>
                          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Örnek Talimatlar:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {[
                              'Daha teknik bir dil kullan',
                              'Başarı vurgusu yap', 
                              'Kısa ve öz olsun',
                              'Modern ve dinamik ton',
                              'Akademik dil tercih et'
                            ].map((example) => (
                              <button
                                key={example}
                                type="button"
                                onClick={() => setCustomPrompt(example)}
                                className="px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                                disabled={submitting || generatingDescription}
                              >
                                {example}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Organization Info */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                {t.form.sections.organizationInfo}
              </h3>
              {organizations.length > 0 ? (
                <div className="flex items-center p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 bg-[#990000] dark:bg-red-500">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">Kurum</div>
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {organizations[0]?.name || 'Kurum Adı'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                  {t.form.fields.organization.notFound}
                </div>
              )}
            </div>
            
            {/* Form Footer */}
            <div className="flex justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <Link
                href={`/${locale}/certificates`}
                className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 text-sm font-medium transition-colors"
              >
                {t.form.buttons.cancel}
              </Link>
              
              <button
                type="submit"
                disabled={submitting || organizations.length === 0 || !selectedTemplate}
                className="px-4 py-2 bg-[#990000] dark:bg-red-500 hover:bg-[#880000] dark:hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors disabled:bg-neutral-400 dark:disabled:bg-neutral-700 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t.loading}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t.form.buttons.submit}
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
