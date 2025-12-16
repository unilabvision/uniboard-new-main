'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, Save, ArrowLeft, X, Check, AlertCircle, Info, RefreshCw, Users, User, ChevronDown, Eye, Sparkles
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
const generateCertificateNumber = (organizationSlug: string = '') => {
  // Get first two letters of organization slug in uppercase
  const orgPrefix = organizationSlug.substring(0, 2).toUpperCase() || 'MA';
  
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
  
  // Format: MA2025-64783-2608-8C2-1QRW7
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
          <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border rounded-md focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
              error 
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
                : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
            } ${disabled ? 'bg-neutral-100 dark:bg-neutral-700 cursor-not-allowed' : ''}`}
          />
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
  t 
}: {
  templates: CertificateTemplate[];
  selectedTemplate: CertificateTemplate | null;
  onSelectTemplate: (template: CertificateTemplate | null) => void;
  error?: string;
  t: typeof texts.tr;
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
                <p className="text-sm">{t.form.fields.template.notFound}</p>
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
    skills_label: 'Kazanılan Yetkinlikler'
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
    skills_label: 'Kazanılan Yetkinlikler'
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
  const [createdCertificateId, setCreatedCertificateId] = useState<number | null>(null);
  
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
    // Use the first organization's slug if available
    const orgSlug = organizations[0]?.slug || '';
    
    setFormData(prev => ({
      ...prev,
      certificatenumber: generateCertificateNumber(orgSlug)
    }));
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
      if (organizations.length === 0) newErrors.organization = 'Kurum erişimi bulunamadı';
      
      // Auto generate certificate number if missing
      if (!formData.certificatenumber) {
        const orgSlug = organizations[0]?.slug || '';
        setFormData(prev => ({
          ...prev,
          certificatenumber: generateCertificateNumber(orgSlug)
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
        
        // Create certificates for all recipients
        const certificatesToCreate = recipients.map(fullname => {
          const orgSlug = organizations[0]?.slug || '';
          const certificateNumber = generateCertificateNumber(orgSlug);
          const certificateUrl = `https://certificates.myunilab.net/${orgSlug}/${certificateNumber}`;
          
          return {
            ...multipleFormData,
            fullname,
            organization_slug: orgSlug,
            certificatenumber: certificateNumber,
            certificateurl: certificateUrl,
            template_id: selectedTemplate?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        });
        
        // Insert all certificates
        const { data, error: insertError } = await supabase
          .from('certificates')
          .insert(certificatesToCreate)
          .select();
        
        if (insertError) {
          throw insertError;
        }
        
        // Success!
        setSuccess(true);
        setCreatedCertificateId(data?.[0]?.id || null);
        
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
        
        const { data, error: insertError } = await supabase
          .from('certificates')
          .insert([certificateData])
          .select();
        
        if (insertError) {
          throw insertError;
        }
        
        // Success!
        setSuccess(true);
        setCreatedCertificateId(data?.[0]?.id || null);
      }
      
    } catch (error: unknown) {
      console.error('Error creating certificate:', error);
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
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {createdCertificateId && (
                <Link 
                  href={`/${locale}/certificates/${createdCertificateId}`}
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12 overflow-x-hidden">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-20 2xl:px-24 w-full break-words">
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
