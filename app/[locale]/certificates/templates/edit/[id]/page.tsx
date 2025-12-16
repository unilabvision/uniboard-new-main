'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Palette, Image, Eye, Save, 
  ArrowLeft, HelpCircle, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from 'next/navigation';
import { generateDashboardCertificatePreview } from '@/utils/dashboardCertificateGenerator';
import FileUpload from '@/app/components/ui/FileUpload';
import { uploadFileToSupabase, validateFile } from '@/app/_services/fileUploadService';

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
      title: string;
      name: string;
      description: string;
      institution: string;
      certificate_no: string;
      date: string;
      signature: string;
    };
    fonts: {
      title: string;
      body: string;
      name: string;
      description: string;
      institution: string;
      certificate_no: string;
      date: string;
      signature: string;
      course_name: string;
    };
    font_sizes: {
      title: number;
      name: number;
      description: number;
      institution: number;
      certificate_no: number;
      date: number;
      signature: number;
      course_name: number;
    };
    layout: {
      title_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      name_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      description_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      institution_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      certificate_no_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      date_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      signature_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      course_name_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
    };
  };
}

interface TemplateFormData {
  name: string;
  description: string;
  organization_slug: string;
  background_image: string;
  is_default: boolean;
  design_settings: {
    colors: {
      primary: string;
      secondary: string;
      text: string;
      title: string;
      name: string;
      description: string;
      institution: string;
      certificate_no: string;
      date: string;
      signature: string;
      course_name: string;
    };
    fonts: {
      title: string;
      body: string;
      name: string;
      description: string;
      institution: string;
      certificate_no: string;
      date: string;
      signature: string;
      course_name: string;
    };
    font_sizes: {
      title: number;
      name: number;
      description: number;
      institution: number;
      certificate_no: number;
      date: number;
      signature: number;
      course_name: number;
    };
    layout: {
      title_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      name_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      description_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      institution_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      certificate_no_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      date_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      signature_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
      course_name_position: { x: number; y: number; enabled?: boolean; align?: 'left' | 'center' | 'right'; x_manual?: number; y_manual?: number };
    };
  };
}

// Localized texts
const texts = {
  tr: {
    title: "Şablonu Düzenle",
    subtitle: "Sertifika şablonunu düzenleyin ve güncelleyin",
    basicInfo: "Temel Bilgiler",
    designSettings: "Tasarım Ayarları",
    preview: "Önizleme",
    templateName: "Şablon Adı",
    templateNamePlaceholder: "Örn: Mezuniyet Sertifikası Şablonu",
    description: "Açıklama",
    descriptionPlaceholder: "Bu şablon hakkında kısa bir açıklama yazın...",
    organization: "Kuruluş",
    selectOrganization: "Kuruluş seçin",
    backgroundImage: "Arka Plan Görseli",
    backgroundImagePlaceholder: "Arka plan görseli URL'si girin",
    uploadImage: "Görsel Yükle",
    setAsDefault: "Bu şablonu varsayılan yap",
    defaultTemplateHelp: "Varsayılan şablon, yeni sertifikalar oluştururken otomatik olarak seçilir",
    colors: "Renkler",
    primaryColor: "Ana Renk",
    secondaryColor: "İkincil Renk",
    textColor: "Yazı Rengi",
    fonts: "Yazı Tipleri",
    titleFont: "Başlık Yazı Tipi",
    bodyFont: "Gövde Yazı Tipi",
    nameFont: "İsim Yazı Tipi",
    descriptionFont: "Açıklama Yazı Tipi",
    institutionFont: "Kurum/Eğitmen Yazı Tipi", 
    certificateNoFont: "Sertifika No Yazı Tipi",
    dateFont: "Tarih Yazı Tipi",
    signatureFont: "İmza Yazı Tipi",
    courseNameFont: "Kurs Adı Yazı Tipi",
    fontSizes: "Yazı Boyutları",
    titleSize: "Başlık Boyutu (px)",
    nameSize: "İsim Boyutu (px)",
    descriptionSize: "Açıklama Boyutu (px)",
    institutionSize: "Kurum/Eğitmen Boyutu (px)",
    certificateNoSize: "Sertifika No Boyutu (px)",
    dateSize: "Tarih Boyutu (px)",
    signatureSize: "İmza Boyutu (px)",
    courseNameSize: "Kurs Adı Boyutu (px)",
    layout: "Yerleşim",
    titlePosition: "Başlık Pozisyonu",
    namePosition: "İsim Pozisyonu",
    descriptionPosition: "Açıklama Pozisyonu",
    institutionPosition: "Kurum/Eğitmen Pozisyonu",
    certificateNoPosition: "Sertifika No Pozisyonu",
    datePosition: "Tarih Pozisyonu",
    signaturePosition: "İmza Pozisyonu",
    courseNamePosition: "Kurs Adı Pozisyonu",
    positionX: "X Pozisyonu (%)",
    positionY: "Y Pozisyonu (%)",
    previewTemplate: "Şablon Önizlemesi",
    sampleCertificate: "Örnek Sertifika",
    sampleName: "Hacer Melis Özdenizkaya",
    sampleCourse: "Web Geliştirme Bootcamp",
    sampleDescription: "Bu sertifika, yukarıda adı geçen kişinin belirtilen kursu başarıyla tamamladığını onaylar.",
    sampleInstitution: "Uniboard Eğitim",
    sampleCertificateNo: "UNI-2025-0001",
    sampleDate: "28 Ağustos 2025",
    sampleInstructor: "Dr. Mehmet ÖZDEMİR",
    save: "Şablonu Güncelle",
    cancel: "İptal",
    saving: "Güncelleniyor...",
    saved: "Güncellendi",
    error: "Hata",
    success: "Başarılı",
    templateUpdated: "Şablon başarıyla güncellendi",
    templateUpdateError: "Şablon güncellenirken bir hata oluştu",
    templateNotFound: "Şablon bulunamadı",
    requiredFields: "Lütfen tüm gerekli alanları doldurun",
    invalidUrl: "Geçerli bir URL girin",
    resetToDefaults: "Varsayılanlara Sıfırla",
    fontOptions: {
      serif: "Serif (Times New Roman)",
      sans_serif: "Sans Serif (Arial)",
      monospace: "Monospace (Courier)",
      custom: "Özel Font"
    },
    help: {
      backgroundImage: "PNG, JPG veya SVG formatında, en az 1920x1080 piksel önerilen boyut",
      colors: "Renkleri hex formatında (#RRGGBB) girin veya renk seçiciyi kullanın",
      layout: "Pozisyonlar yüzde değerleridir (0-100). 0,0 sol üst köşe, 100,100 sağ alt köşedir",
      defaultTemplate: "Her kuruluş için sadece bir varsayılan şablon olabilir"
    },
    loading: "Şablon yükleniyor...",
    unauthorized: "Bu şablonu düzenleme yetkiniz yok"
  },
  en: {
    title: "Edit Template",
    subtitle: "Edit and update the certificate template",
    basicInfo: "Basic Information",
    designSettings: "Design Settings",
    preview: "Preview",
    templateName: "Template Name",
    templateNamePlaceholder: "e.g. Graduation Certificate Template",
    description: "Description",
    descriptionPlaceholder: "Write a brief description about this template...",
    organization: "Organization",
    selectOrganization: "Select organization",
    backgroundImage: "Background Image",
    backgroundImagePlaceholder: "Enter background image URL",
    uploadImage: "Upload Image",
    setAsDefault: "Set as default template",
    defaultTemplateHelp: "Default template will be automatically selected when creating new certificates",
    colors: "Colors",
    primaryColor: "Primary Color",
    secondaryColor: "Secondary Color",
    textColor: "Text Color",
    fonts: "Fonts",
    titleFont: "Title Font",
    bodyFont: "Body Font",
    nameFont: "Name Font",
    descriptionFont: "Description Font",
    institutionFont: "Institution/Instructor Font",
    certificateNoFont: "Certificate No Font",
    dateFont: "Date Font",
    signatureFont: "Signature Font",
    courseNameFont: "Course Name Font",
    fontSizes: "Font Sizes",
    titleSize: "Title Size (px)",
    nameSize: "Name Size (px)",
    descriptionSize: "Description Size (px)",
    institutionSize: "Institution/Instructor Size (px)",
    certificateNoSize: "Certificate No Size (px)",
    dateSize: "Date Size (px)",
    signatureSize: "Signature Size (px)",
    courseNameSize: "Course Name Size (px)",
    layout: "Layout",
    titlePosition: "Title Position",
    namePosition: "Name Position",
    descriptionPosition: "Description Position",
    institutionPosition: "Institution/Instructor Position",
    certificateNoPosition: "Certificate No Position",
    datePosition: "Date Position",
    signaturePosition: "Signature Position",
    courseNamePosition: "Course Name Position",
    positionX: "X Position (%)",
    positionY: "Y Position (%)",
    previewTemplate: "Template Preview",
    sampleCertificate: "Sample Certificate",
    sampleName: "John DOE",
    sampleCourse: "Web Development Bootcamp",
    sampleDescription: "This certificate confirms that the above-named person has successfully completed the specified course.",
    sampleInstitution: "Uniboard Education",
    sampleCertificateNo: "UNI-2025-0001",
    sampleDate: "August 28, 2025",
    sampleInstructor: "Dr. Michael JOHNSON",
    save: "Update Template",
    cancel: "Cancel",
    saving: "Updating...",
    saved: "Updated",
    error: "Error",
    success: "Success",
    templateUpdated: "Template updated successfully",
    templateUpdateError: "An error occurred while updating template",
    templateNotFound: "Template not found",
    requiredFields: "Please fill in all required fields",
    invalidUrl: "Please enter a valid URL",
    resetToDefaults: "Reset to Defaults",
    fontOptions: {
      serif: "Serif (Times New Roman)",
      sans_serif: "Sans Serif (Arial)",
      monospace: "Monospace (Courier)",
      custom: "Custom Font"
    },
    help: {
      backgroundImage: "PNG, JPG or SVG format, minimum 1920x1080 pixels recommended",
      colors: "Enter colors in hex format (#RRGGBB) or use color picker",
      layout: "Positions are percentage values (0-100). 0,0 is top-left, 100,100 is bottom-right",
      defaultTemplate: "Only one default template per organization is allowed"
    },
    loading: "Loading template...",
    unauthorized: "You don't have permission to edit this template"
  }
};

// Main Component
export default function EditTemplatePage() {
  const params = useParams();
  const templateId = params?.id as string;
  
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(4/3); // Default 4:3 ratio
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  
  // Form data
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    organization_slug: '',
    background_image: '',
    is_default: false,
    design_settings: {
      colors: {
        primary: '#990000',
        secondary: '#666666',
        text: '#333333',
        title: '#990000',
        name: '#333333',
        description: '#555555',
        institution: '#666666',
        certificate_no: '#666666',
        date: '#666666',
        signature: '#333333',
        course_name: '#333333'
      },
      fonts: {
        title: 'serif',
        body: 'sans_serif',
        name: 'sans_serif',
        description: 'sans_serif',
        institution: 'sans_serif',
        certificate_no: 'sans_serif',
        date: 'sans_serif',
        signature: 'sans_serif',
        course_name: 'sans_serif'
      },
      font_sizes: {
        title: 24,
        name: 18,
        description: 16,
        institution: 14,
        certificate_no: 12,
        date: 14,
        signature: 14,
        course_name: 20
      },
      layout: {
        title_position: { x: 50, y: 20, enabled: true },
        name_position: { x: 50, y: 40, enabled: true },
        description_position: { x: 50, y: 55, enabled: true },
        institution_position: { x: 30, y: 75, enabled: true },
        certificate_no_position: { x: 70, y: 75, enabled: true },
        date_position: { x: 20, y: 80, enabled: true },
        signature_position: { x: 80, y: 80, enabled: true },
        course_name_position: { x: 50, y: 45, enabled: true }
      }
    }
  });
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Clerk user hook and locale
  const { user: clerkUser, isLoaded } = useUser();
  const locale = 'tr'; // You can get this from params or context
  const t = texts[locale] || texts.tr;
  
  // File upload handlers
  const handleFileSelect = useCallback(async (file: File) => {
    setUploadError('');
    setIsUploading(true);
    
    try {
      // Validate file
      const validation = validateFile(file, 10, ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']);
      if (!validation.isValid) {
        setUploadError(validation.error || 'Geçersiz dosya');
        setIsUploading(false);
        return;
      }
      
      // Upload file to Supabase
      const result = await uploadFileToSupabase(file, 'myunilab', 'certificate-templates', clerkUser?.id);
      
      if (result.success && result.url) {
        setSelectedFile(file);
        setFormData(prev => ({ ...prev, background_image: result.url! }));
        setUploadError('');
        
        // Get image dimensions to calculate aspect ratio
        const img = document.createElement('img');
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          setImageAspectRatio(aspectRatio);
        };
        img.src = result.url!;
      } else {
        setUploadError(result.error || 'Dosya yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError('Dosya yüklenirken beklenmeyen hata oluştu');
    } finally {
      setIsUploading(false);
    }
  }, [clerkUser?.id]);
  
  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    setFormData(prev => ({ ...prev, background_image: '' }));
    setUploadError('');
    setImageAspectRatio(4/3); // Reset to default ratio
  }, []);
  
  // Generate preview function
  const generatePreview = useCallback(async () => {
    if (!formData.background_image || isGeneratingPreview) {
      return;
    }
    
    setIsGeneratingPreview(true);
    try {
      // Calculate preview size based on container aspect ratio
      const containerWidth = 600; // Fixed container width
      const previewHeight = Math.round(containerWidth / imageAspectRatio);
      
      const canvas = await generateDashboardCertificatePreview(
        formData,
        containerWidth,
        previewHeight,
        locale
      );
      
      setPreviewCanvas(canvas);
      
      // Update canvas in the DOM if ref exists
      if (canvasRef.current && canvas) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          canvasRef.current.width = canvas.width;
          canvasRef.current.height = canvas.height;
          ctx.drawImage(canvas, 0, 0);
        }
      }
    } catch (error) {
      console.error('Preview generation error:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [formData, isGeneratingPreview, locale, imageAspectRatio]);
  
  // Update preview when form data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generatePreview();
    }, 500); // Debounce to avoid too many updates
    
    return () => clearTimeout(timeoutId);
  }, [formData.background_image, formData.design_settings, formData.name, formData.organization_slug, generatePreview]);

  // Update aspect ratio when background image URL changes
  useEffect(() => {
    if (formData.background_image && !selectedFile) {
      const img = document.createElement('img');
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        setImageAspectRatio(aspectRatio);
      };
      img.onerror = () => {
        setImageAspectRatio(4/3); // Fallback to default ratio on error
      };
      img.src = formData.background_image;
    } else if (!formData.background_image) {
      setImageAspectRatio(4/3); // Reset to default when no image
    }
  }, [formData.background_image, selectedFile]);

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

  // Fetch template and organizations
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.organizationSlugs?.length || !templateId) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch template
        const { data: templateData, error: templateError } = await supabase
          .from('certificate_templates')
          .select('*')
          .eq('id', templateId)
          .single();
        
        if (templateError) {
          throw new Error(t.templateNotFound);
        }
        
        // Check if user has access to this template's organization
        if (!currentUser.organizationSlugs.includes(templateData.organization_slug)) {
          throw new Error(t.unauthorized);
        }
        
        setTemplate(templateData);
        
        // Set form data from template
        const existingDesignSettings = templateData.design_settings || {};
        const defaultLayout = {
          title_position: { x: 50, y: 20, enabled: true, align: 'center', x_manual: 50, y_manual: 20 },
          name_position: { x: 50, y: 40, enabled: true, align: 'center', x_manual: 50, y_manual: 40 },
          description_position: { x: 50, y: 55, enabled: true, align: 'center', x_manual: 50, y_manual: 55 },
          institution_position: { x: 30, y: 75, enabled: true, align: 'left', x_manual: 30, y_manual: 75 },
          certificate_no_position: { x: 70, y: 75, enabled: true, align: 'right', x_manual: 70, y_manual: 75 },
          date_position: { x: 20, y: 80, enabled: true, align: 'left', x_manual: 20, y_manual: 80 },
          signature_position: { x: 80, y: 80, enabled: true, align: 'center', x_manual: 80, y_manual: 80 }
        };

        // Merge existing layout with defaults, ensuring enabled property exists
        const layout = {
          title_position: {
            x: existingDesignSettings.layout?.title_position?.x ?? defaultLayout.title_position.x,
            y: existingDesignSettings.layout?.title_position?.y ?? defaultLayout.title_position.y,
            enabled: existingDesignSettings.layout?.title_position?.enabled ?? true,
            align: existingDesignSettings.layout?.title_position?.align ?? 'center',
            x_manual: existingDesignSettings.layout?.title_position?.x_manual ?? existingDesignSettings.layout?.title_position?.x ?? defaultLayout.title_position.x,
            y_manual: existingDesignSettings.layout?.title_position?.y_manual ?? existingDesignSettings.layout?.title_position?.y ?? defaultLayout.title_position.y
          },
          name_position: {
            x: existingDesignSettings.layout?.name_position?.x ?? defaultLayout.name_position.x,
            y: existingDesignSettings.layout?.name_position?.y ?? defaultLayout.name_position.y,
            enabled: existingDesignSettings.layout?.name_position?.enabled ?? true,
            align: existingDesignSettings.layout?.name_position?.align ?? 'center',
            x_manual: existingDesignSettings.layout?.name_position?.x_manual ?? existingDesignSettings.layout?.name_position?.x ?? defaultLayout.name_position.x,
            y_manual: existingDesignSettings.layout?.name_position?.y_manual ?? existingDesignSettings.layout?.name_position?.y ?? defaultLayout.name_position.y
          },
          description_position: {
            x: existingDesignSettings.layout?.description_position?.x ?? defaultLayout.description_position.x,
            y: existingDesignSettings.layout?.description_position?.y ?? defaultLayout.description_position.y,
            enabled: existingDesignSettings.layout?.description_position?.enabled ?? true,
            align: existingDesignSettings.layout?.description_position?.align ?? 'center',
            x_manual: existingDesignSettings.layout?.description_position?.x_manual ?? existingDesignSettings.layout?.description_position?.x ?? defaultLayout.description_position.x,
            y_manual: existingDesignSettings.layout?.description_position?.y_manual ?? existingDesignSettings.layout?.description_position?.y ?? defaultLayout.description_position.y
          },
          institution_position: {
            x: existingDesignSettings.layout?.institution_position?.x ?? defaultLayout.institution_position.x,
            y: existingDesignSettings.layout?.institution_position?.y ?? defaultLayout.institution_position.y,
            enabled: existingDesignSettings.layout?.institution_position?.enabled ?? true,
            align: existingDesignSettings.layout?.institution_position?.align ?? 'left',
            x_manual: existingDesignSettings.layout?.institution_position?.x_manual ?? existingDesignSettings.layout?.institution_position?.x ?? defaultLayout.institution_position.x,
            y_manual: existingDesignSettings.layout?.institution_position?.y_manual ?? existingDesignSettings.layout?.institution_position?.y ?? defaultLayout.institution_position.y
          },
          certificate_no_position: {
            x: existingDesignSettings.layout?.certificate_no_position?.x ?? defaultLayout.certificate_no_position.x,
            y: existingDesignSettings.layout?.certificate_no_position?.y ?? defaultLayout.certificate_no_position.y,
            enabled: existingDesignSettings.layout?.certificate_no_position?.enabled ?? true,
            align: existingDesignSettings.layout?.certificate_no_position?.align ?? 'right',
            x_manual: existingDesignSettings.layout?.certificate_no_position?.x_manual ?? existingDesignSettings.layout?.certificate_no_position?.x ?? defaultLayout.certificate_no_position.x,
            y_manual: existingDesignSettings.layout?.certificate_no_position?.y_manual ?? existingDesignSettings.layout?.certificate_no_position?.y ?? defaultLayout.certificate_no_position.y
          },
          date_position: {
            x: existingDesignSettings.layout?.date_position?.x ?? defaultLayout.date_position.x,
            y: existingDesignSettings.layout?.date_position?.y ?? defaultLayout.date_position.y,
            enabled: existingDesignSettings.layout?.date_position?.enabled ?? true,
            align: existingDesignSettings.layout?.date_position?.align ?? 'left',
            x_manual: existingDesignSettings.layout?.date_position?.x_manual ?? existingDesignSettings.layout?.date_position?.x ?? defaultLayout.date_position.x,
            y_manual: existingDesignSettings.layout?.date_position?.y_manual ?? existingDesignSettings.layout?.date_position?.y ?? defaultLayout.date_position.y
          },
          signature_position: {
            x: existingDesignSettings.layout?.signature_position?.x ?? defaultLayout.signature_position.x,
            y: existingDesignSettings.layout?.signature_position?.y ?? defaultLayout.signature_position.y,
            enabled: existingDesignSettings.layout?.signature_position?.enabled ?? true,
            align: existingDesignSettings.layout?.signature_position?.align ?? 'center',
            x_manual: existingDesignSettings.layout?.signature_position?.x_manual ?? existingDesignSettings.layout?.signature_position?.x ?? defaultLayout.signature_position.x,
            y_manual: existingDesignSettings.layout?.signature_position?.y_manual ?? existingDesignSettings.layout?.signature_position?.y ?? defaultLayout.signature_position.y
          },
          course_name_position: {
            x: existingDesignSettings.layout?.course_name_position?.x ?? 50,
            y: existingDesignSettings.layout?.course_name_position?.y ?? 45,
            enabled: existingDesignSettings.layout?.course_name_position?.enabled ?? true,
            align: existingDesignSettings.layout?.course_name_position?.align ?? 'center',
            x_manual: existingDesignSettings.layout?.course_name_position?.x_manual ?? existingDesignSettings.layout?.course_name_position?.x ?? 50,
            y_manual: existingDesignSettings.layout?.course_name_position?.y_manual ?? existingDesignSettings.layout?.course_name_position?.y ?? 45
          }
        };

        setFormData({
          name: templateData.name,
          description: templateData.description || '',
          organization_slug: templateData.organization_slug,
          background_image: templateData.background_image,
          is_default: templateData.is_default,
          design_settings: {
            colors: existingDesignSettings.colors || {
              primary: '#990000',
              secondary: '#666666',
              text: '#333333',
              title: '#990000',
              name: '#333333',
              description: '#555555',
              institution: '#666666',
              certificate_no: '#666666',
              date: '#666666',
              signature: '#333333',
              course_name: '#333333'
            },
            fonts: existingDesignSettings.fonts || {
              title: 'serif',
              body: 'sans_serif',
              name: 'sans_serif',
              description: 'sans_serif',
              institution: 'sans_serif',
              certificate_no: 'sans_serif',
              date: 'sans_serif',
              signature: 'sans_serif',
              course_name: 'sans_serif'
            },
            font_sizes: existingDesignSettings.font_sizes || {
              title: 24,
              name: 18,
              description: 16,
              institution: 14,
              certificate_no: 12,
              date: 14,
              signature: 14,
              course_name: 20
            },
            layout: layout
          }
        });
        
        // Fetch organizations
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .in('slug', currentUser.organizationSlugs);
        
        if (orgsError) {
          throw orgsError;
        }
        
        setOrganizations(orgsData || []);
        
      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, templateId, t.templateNotFound, t.unauthorized]);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t.requiredFields;
    }
    
    if (!formData.organization_slug) {
      newErrors.organization_slug = t.requiredFields;
    }
    
    if (!formData.background_image.trim()) {
      newErrors.background_image = t.requiredFields;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !template) {
      return;
    }
    
    // Check if we're still uploading a file
    if (isUploading) {
      setError('Lütfen dosya yüklenmesini bekleyin');
      return;
    }
    
    setSaving(true);
    
    try {
      // If setting as default, first remove default from other templates in the same org
      if (formData.is_default && !template.is_default) {
        await supabase
          .from('certificate_templates')
          .update({ is_default: false })
          .eq('organization_slug', formData.organization_slug)
          .neq('id', template.id);
      }
      
      // Prepare update data - only include is_default if it's true
      const updateData: Record<string, unknown> = {
        name: formData.name,
        description: formData.description,
        organization_slug: formData.organization_slug,
        background_image: formData.background_image,
        design_settings: formData.design_settings,
        updated_at: new Date().toISOString()
      };
      
      // Only set is_default if checkbox is checked (to avoid constraint issues)
      if (formData.is_default) {
        updateData.is_default = true;
      } else {
        // Explicitly set to false if unchecked
        updateData.is_default = false;
      }
      
      const { data, error } = await supabase
        .from('certificate_templates')
        .update(updateData)
        .eq('id', template.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update local template state
      setTemplate(data);
      
      // Success - redirect to templates page
      alert(t.templateUpdated);
      window.location.href = `/${locale}/certificates/templates`;
      
    } catch (error: unknown) {
      console.error('Error updating template:', error);
      alert(t.templateUpdateError + ': ' + (error instanceof Error ? error.message : 'An error occurred'));
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setFormData(prev => ({
      ...prev,
      design_settings: {
        colors: {
          primary: '#990000',
          secondary: '#666666',
          text: '#333333',
          title: '#990000',
          name: '#333333',
          description: '#555555',
          institution: '#666666',
          certificate_no: '#666666',
          date: '#666666',
          signature: '#333333',
          course_name: '#333333'
        },
        fonts: {
          title: 'serif',
          body: 'sans_serif',
          name: 'sans_serif',
          description: 'sans_serif',
          institution: 'sans_serif',
          certificate_no: 'sans_serif',
          date: 'sans_serif',
          signature: 'sans_serif',
          course_name: 'sans_serif'
        },
        font_sizes: {
          title: 24,
          name: 18,
          description: 16,
          institution: 14,
          certificate_no: 12,
          date: 14,
          signature: 14,
          course_name: 20
        },
        layout: {
          title_position: { x: 50, y: 20, enabled: true, align: 'center', x_manual: 50, y_manual: 20 },
          name_position: { x: 50, y: 40, enabled: true, align: 'center', x_manual: 50, y_manual: 40 },
          description_position: { x: 50, y: 55, enabled: true, align: 'center', x_manual: 50, y_manual: 55 },
          institution_position: { x: 30, y: 75, enabled: true, align: 'left', x_manual: 30, y_manual: 75 },
          certificate_no_position: { x: 70, y: 75, enabled: true, align: 'right', x_manual: 70, y_manual: 75 },
          date_position: { x: 20, y: 80, enabled: true, align: 'left', x_manual: 20, y_manual: 80 },
          signature_position: { x: 80, y: 80, enabled: true, align: 'center', x_manual: 80, y_manual: 80 },
          course_name_position: { x: 50, y: 45, enabled: true, align: 'center', x_manual: 50, y_manual: 45 }
        }
      }
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
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg p-6">
                  <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-48 mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                    <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
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
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-6 rounded-lg text-center">
            <h2 className="text-xl font-semibold mb-2">{t.error}</h2>
            <p className="mb-4">{error}</p>
            <Link 
              href={`/${locale}/certificates/templates`}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Şablonlara Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Template not found
  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">{t.templateNotFound}</div>
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
              href={`/${locale}/certificates/templates`}
              className="mr-4 p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-neutral-900 dark:text-neutral-100">
                {t.title}
              </h1>
              <div className="w-12 h-px bg-[#990000] mt-2"></div>
            </div>
          </div>
          <p className="text-base text-neutral-600 dark:text-neutral-400 max-w-2xl">
            {t.subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2 text-[#990000]" />
                {t.basicInfo}
              </h2>
              
              <div className="space-y-4">
                {/* Template Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.templateName} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t.templateNamePlaceholder}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.description}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={t.descriptionPlaceholder}
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                  />
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.organization} *
                  </label>
                  <select
                    value={formData.organization_slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization_slug: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-[#990000] focus:border-transparent ${
                      errors.organization_slug ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  >
                    <option value="">{t.selectOrganization}</option>
                    {organizations.map(org => (
                      <option key={org.slug} value={org.slug}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  {errors.organization_slug && (
                    <p className="text-red-500 text-sm mt-1">{errors.organization_slug}</p>
                  )}
                </div>

                {/* Background Image */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    {t.backgroundImage} *
                    <span className="group relative">
                      <HelpCircle className="w-4 h-4 inline-block ml-1 text-neutral-400 cursor-help" />
                      <span className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {t.help.backgroundImage}
                      </span>
                    </span>
                  </label>
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    onFileRemove={handleFileRemove}
                    currentFile={selectedFile}
                    currentUrl={formData.background_image}
                    accept="image/*"
                    maxSize={10}
                    disabled={isUploading || saving}
                    error={errors.background_image || uploadError}
                    placeholder="Arka plan görseli seçin veya buraya sürükleyin"
                  />
                  {isUploading && (
                    <div className="mt-2 flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm">Dosya yükleniyor...</p>
                    </div>
                  )}
                </div>

                {/* Default Template */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="w-4 h-4 text-[#990000] bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded focus:ring-[#990000] focus:ring-2"
                  />
                  <label htmlFor="is_default" className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
                    {t.setAsDefault}
                    <span className="group relative">
                      <HelpCircle className="w-4 h-4 inline-block ml-1 text-neutral-400 cursor-help" />
                      <span className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {t.help.defaultTemplate}
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Design Settings */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="w-5 h-5 mr-2 text-[#990000]" />
                  {t.designSettings}
                </h2>
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="flex items-center px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {t.resetToDefaults}
                </button>
              </div>

              <div className="space-y-6">
                {/* Fonts */}
                <div>
                  <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                    {t.fonts}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        {t.titleFont}
                      </label>
                      <select
                        value={formData.design_settings.fonts.title}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            fonts: {
                              ...prev.design_settings.fonts,
                              title: e.target.value
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="serif">{t.fontOptions.serif}</option>
                        <option value="sans_serif">{t.fontOptions.sans_serif}</option>
                        <option value="monospace">{t.fontOptions.monospace}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        {t.nameFont}
                      </label>
                      <select
                        value={formData.design_settings.fonts.name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            fonts: {
                              ...prev.design_settings.fonts,
                              name: e.target.value
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="serif">{t.fontOptions.serif}</option>
                        <option value="sans_serif">{t.fontOptions.sans_serif}</option>
                        <option value="monospace">{t.fontOptions.monospace}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        {t.descriptionFont}
                      </label>
                      <select
                        value={formData.design_settings.fonts.description}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            fonts: {
                              ...prev.design_settings.fonts,
                              description: e.target.value
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="serif">{t.fontOptions.serif}</option>
                        <option value="sans_serif">{t.fontOptions.sans_serif}</option>
                        <option value="monospace">{t.fontOptions.monospace}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        {t.institutionFont}
                      </label>
                      <select
                        value={formData.design_settings.fonts.institution}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            fonts: {
                              ...prev.design_settings.fonts,
                              institution: e.target.value
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="serif">{t.fontOptions.serif}</option>
                        <option value="sans_serif">{t.fontOptions.sans_serif}</option>
                        <option value="monospace">{t.fontOptions.monospace}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        {t.certificateNoFont}
                      </label>
                      <select
                        value={formData.design_settings.fonts.certificate_no}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            fonts: {
                              ...prev.design_settings.fonts,
                              certificate_no: e.target.value
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="serif">{t.fontOptions.serif}</option>
                        <option value="sans_serif">{t.fontOptions.sans_serif}</option>
                        <option value="monospace">{t.fontOptions.monospace}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        {t.dateFont}
                      </label>
                      <select
                        value={formData.design_settings.fonts.date}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            fonts: {
                              ...prev.design_settings.fonts,
                              date: e.target.value
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="serif">{t.fontOptions.serif}</option>
                        <option value="sans_serif">{t.fontOptions.sans_serif}</option>
                        <option value="monospace">{t.fontOptions.monospace}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        {t.signatureFont}
                      </label>
                      <select
                        value={formData.design_settings.fonts.signature}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            fonts: {
                              ...prev.design_settings.fonts,
                              signature: e.target.value
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="serif">{t.fontOptions.serif}</option>
                        <option value="sans_serif">{t.fontOptions.sans_serif}</option>
                        <option value="monospace">{t.fontOptions.monospace}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        {t.courseNameFont}
                      </label>
                      <select
                        value={formData.design_settings.fonts.course_name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            fonts: {
                              ...prev.design_settings.fonts,
                              course_name: e.target.value
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      >
                        <option value="serif">{t.fontOptions.serif}</option>
                        <option value="sans_serif">{t.fontOptions.sans_serif}</option>
                        <option value="monospace">{t.fontOptions.monospace}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Element Configurations */}
                <div className="space-y-6">
                  {/* Title Element */}
                  <div className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                        {t.titlePosition}
                      </h3>
                      <input
                        type="checkbox"
                        id="enable_title"
                        checked={formData.design_settings.layout.title_position.enabled !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            layout: {
                              ...prev.design_settings.layout,
                              title_position: {
                                ...prev.design_settings.layout.title_position,
                                enabled: e.target.checked
                              }
                            }
                          }
                        }))}
                        className="w-4 h-4 text-[#990000] bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded focus:ring-[#990000] focus:ring-2"
                      />
                    </div>
                    {formData.design_settings.layout.title_position.enabled !== false && (
                      <div className="space-y-4">
                        {/* Title Color */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Renk
                          </label>
                          <input
                            type="color"
                            value={formData.design_settings.colors.title}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                colors: {
                                  ...prev.design_settings.colors,
                                  title: e.target.value
                                }
                              }
                            }))}
                            className="w-20 h-10 border border-neutral-300 dark:border-neutral-600 rounded cursor-pointer"
                          />
                        </div>
                        
                        {/* Title Font Size */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            {t.titleSize}
                          </label>
                          <input
                            type="number"
                            min="8"
                            max="72"
                            value={formData.design_settings.font_sizes.title}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                font_sizes: {
                                  ...prev.design_settings.font_sizes,
                                  title: Number(e.target.value)
                                }
                              }
                            }))}
                            className="w-20 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          />
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Metin Hizalama
                          </label>
                          <select
                            value={formData.design_settings.layout.title_position.align || 'center'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                layout: {
                                  ...prev.design_settings.layout,
                                  title_position: {
                                    ...prev.design_settings.layout.title_position,
                                    align: e.target.value as 'left' | 'center' | 'right'
                                  }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          >
                            <option value="left">Sol</option>
                            <option value="center">Orta</option>
                            <option value="right">Sağ</option>
                          </select>
                        </div>

                        {/* Manual Position Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              X Pozisyonu (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.title_position.x}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      title_position: {
                                        ...prev.design_settings.layout.title_position,
                                        x: value,
                                        x_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              Y Pozisyonu (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.title_position.y}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      title_position: {
                                        ...prev.design_settings.layout.title_position,
                                        y: value,
                                        y_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                        </div>
                        
                        {/* Title Position */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionX}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.title_position.x}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.title_position.x}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    title_position: {
                                      ...prev.design_settings.layout.title_position,
                                      x: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionY}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.title_position.y}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.title_position.y}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    title_position: {
                                      ...prev.design_settings.layout.title_position,
                                      y: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Name Element */}
                  <div className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                        {t.namePosition}
                      </h3>
                      <input
                        type="checkbox"
                        id="enable_name"
                        checked={formData.design_settings.layout.name_position.enabled !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            layout: {
                              ...prev.design_settings.layout,
                              name_position: {
                                ...prev.design_settings.layout.name_position,
                                enabled: e.target.checked
                              }
                            }
                          }
                        }))}
                        className="w-4 h-4 text-[#990000] bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded focus:ring-[#990000] focus:ring-2"
                      />
                    </div>
                    {formData.design_settings.layout.name_position.enabled !== false && (
                      <div className="space-y-4">
                        {/* Name Color */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Renk
                          </label>
                          <input
                            type="color"
                            value={formData.design_settings.colors.name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                colors: {
                                  ...prev.design_settings.colors,
                                  name: e.target.value
                                }
                              }
                            }))}
                            className="w-20 h-10 border border-neutral-300 dark:border-neutral-600 rounded cursor-pointer"
                          />
                        </div>
                        
                        {/* Name Font Size */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            {t.nameSize}
                          </label>
                          <input
                            type="number"
                            min="8"
                            max="100"
                            value={formData.design_settings.font_sizes.name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                font_sizes: {
                                  ...prev.design_settings.font_sizes,
                                  name: Number(e.target.value)
                                }
                              }
                            }))}
                            className="w-20 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          />
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Metin Hizalama
                          </label>
                          <select
                            value={formData.design_settings.layout.name_position.align || 'center'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                layout: {
                                  ...prev.design_settings.layout,
                                  name_position: {
                                    ...prev.design_settings.layout.name_position,
                                    align: e.target.value as 'left' | 'center' | 'right'
                                  }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          >
                            <option value="left">Sol</option>
                            <option value="center">Orta</option>
                            <option value="right">Sağ</option>
                          </select>
                        </div>

                        {/* Manual Position Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              X Pozisyonu (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.name_position.x}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      name_position: {
                                        ...prev.design_settings.layout.name_position,
                                        x: value,
                                        x_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              Y Pozisyonu (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.name_position.y}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      name_position: {
                                        ...prev.design_settings.layout.name_position,
                                        y: value,
                                        y_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                        </div>
                        
                        {/* Name Position */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionX}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.name_position.x}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.name_position.x}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    name_position: {
                                      ...prev.design_settings.layout.name_position,
                                      x: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionY}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.name_position.y}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.name_position.y}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    name_position: {
                                      ...prev.design_settings.layout.name_position,
                                      y: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description Element */}
                  <div className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                        {t.descriptionPosition}
                      </h3>
                      <input
                        type="checkbox"
                        id="enable_description"
                        checked={formData.design_settings.layout.description_position.enabled !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            layout: {
                              ...prev.design_settings.layout,
                              description_position: {
                                ...prev.design_settings.layout.description_position,
                                enabled: e.target.checked
                              }
                            }
                          }
                        }))}
                        className="w-4 h-4 text-[#990000] bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded focus:ring-[#990000] focus:ring-2"
                      />
                    </div>
                    {formData.design_settings.layout.description_position.enabled !== false && (
                      <div className="space-y-4">
                        {/* Description Color */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Renk
                          </label>
                          <input
                            type="color"
                            value={formData.design_settings.colors.description}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                colors: {
                                  ...prev.design_settings.colors,
                                  description: e.target.value
                                }
                              }
                            }))}
                            className="w-20 h-10 border border-neutral-300 dark:border-neutral-600 rounded cursor-pointer"
                          />
                        </div>
                        
                        {/* Description Font Size */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            {t.descriptionSize}
                          </label>
                          <input
                            type="number"
                            min="8"
                            max="72"
                            value={formData.design_settings.font_sizes.description}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                font_sizes: {
                                  ...prev.design_settings.font_sizes,
                                  description: Number(e.target.value)
                                }
                              }
                            }))}
                            className="w-20 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          />
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Metin Hizalama
                          </label>
                          <select
                            value={formData.design_settings.layout.description_position.align || 'center'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                layout: {
                                  ...prev.design_settings.layout,
                                  description_position: {
                                    ...prev.design_settings.layout.description_position,
                                    align: e.target.value as 'left' | 'center' | 'right'
                                  }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          >
                            <option value="left">Sol</option>
                            <option value="center">Orta</option>
                            <option value="right">Sağ</option>
                          </select>
                        </div>

                        {/* Manual Position Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              X Pozisyonu (Manuel)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.description_position.x_manual || formData.design_settings.layout.description_position.x}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      description_position: {
                                        ...prev.design_settings.layout.description_position,
                                        x: value,
                                        x_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              Y Pozisyonu (Manuel)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.description_position.y_manual || formData.design_settings.layout.description_position.y}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      description_position: {
                                        ...prev.design_settings.layout.description_position,
                                        y: value,
                                        y_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                        </div>
                        
                        {/* Description Position */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionX}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.description_position.x}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.description_position.x}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    description_position: {
                                      ...prev.design_settings.layout.description_position,
                                      x: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionY}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.description_position.y}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.description_position.y}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    description_position: {
                                      ...prev.design_settings.layout.description_position,
                                      y: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Course Name Element */}
                  <div className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                        {t.courseNamePosition}
                      </h3>
                      <input
                        type="checkbox"
                        id="enable_course_name"
                        checked={formData.design_settings.layout.course_name_position.enabled !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            layout: {
                              ...prev.design_settings.layout,
                              course_name_position: {
                                ...prev.design_settings.layout.course_name_position,
                                enabled: e.target.checked
                              }
                            }
                          }
                        }))}
                        className="w-4 h-4 text-[#990000] bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded focus:ring-[#990000] focus:ring-2"
                      />
                    </div>
                    {formData.design_settings.layout.course_name_position.enabled !== false && (
                      <div className="space-y-4">
                        {/* Course Name Color */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Renk
                          </label>
                          <input
                            type="color"
                            value={formData.design_settings.colors.course_name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                colors: {
                                  ...prev.design_settings.colors,
                                  course_name: e.target.value
                                }
                              }
                            }))}
                            className="w-20 h-10 border border-neutral-300 dark:border-neutral-600 rounded cursor-pointer"
                          />
                        </div>
                        
                        {/* Course Name Font Size */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            {t.courseNameSize}
                          </label>
                          <input
                            type="number"
                            min="8"
                            max="72"
                            value={formData.design_settings.font_sizes.course_name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                font_sizes: {
                                  ...prev.design_settings.font_sizes,
                                  course_name: Number(e.target.value)
                                }
                              }
                            }))}
                            className="w-20 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          />
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Metin Hizalama
                          </label>
                          <select
                            value={formData.design_settings.layout.course_name_position.align || 'left'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                layout: {
                                  ...prev.design_settings.layout,
                                  course_name_position: {
                                    ...prev.design_settings.layout.course_name_position,
                                    align: e.target.value as 'left' | 'center' | 'right'
                                  }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          >
                            <option value="left">Sol</option>
                            <option value="center">Orta</option>
                            <option value="right">Sağ</option>
                          </select>
                        </div>

                        {/* Manual Position Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              X Pozisyonu (Manuel)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.course_name_position.x_manual || formData.design_settings.layout.course_name_position.x}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      course_name_position: {
                                        ...prev.design_settings.layout.course_name_position,
                                        x: value,
                                        x_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              Y Pozisyonu (Manuel)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.course_name_position.y_manual || formData.design_settings.layout.course_name_position.y}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      course_name_position: {
                                        ...prev.design_settings.layout.course_name_position,
                                        y: value,
                                        y_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                        </div>

                        {/* Course Name Position */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionX}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.course_name_position.x}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.course_name_position.x}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    course_name_position: {
                                      ...prev.design_settings.layout.course_name_position,
                                      x: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionY}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.course_name_position.y}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.course_name_position.y}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    course_name_position: {
                                      ...prev.design_settings.layout.course_name_position,
                                      y: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Institution Element */}
                  <div className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                        {t.institutionPosition}
                      </h3>
                      <input
                        type="checkbox"
                        id="enable_institution"
                        checked={formData.design_settings.layout.institution_position.enabled !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            layout: {
                              ...prev.design_settings.layout,
                              institution_position: {
                                ...prev.design_settings.layout.institution_position,
                                enabled: e.target.checked
                              }
                            }
                          }
                        }))}
                        className="w-4 h-4 text-[#990000] bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded focus:ring-[#990000] focus:ring-2"
                      />
                    </div>
                    {formData.design_settings.layout.institution_position.enabled !== false && (
                      <div className="space-y-4">
                        {/* Institution Color */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Renk
                          </label>
                          <input
                            type="color"
                            value={formData.design_settings.colors.institution}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                colors: {
                                  ...prev.design_settings.colors,
                                  institution: e.target.value
                                }
                              }
                            }))}
                            className="w-20 h-10 border border-neutral-300 dark:border-neutral-600 rounded cursor-pointer"
                          />
                        </div>
                        
                        {/* Institution Font Size */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            {t.institutionSize}
                          </label>
                          <input
                            type="number"
                            min="8"
                            max="72"
                            value={formData.design_settings.font_sizes.institution}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                font_sizes: {
                                  ...prev.design_settings.font_sizes,
                                  institution: Number(e.target.value)
                                }
                              }
                            }))}
                            className="w-20 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          />
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Metin Hizalama
                          </label>
                          <select
                            value={formData.design_settings.layout.institution_position.align || 'left'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                layout: {
                                  ...prev.design_settings.layout,
                                  institution_position: {
                                    ...prev.design_settings.layout.institution_position,
                                    align: e.target.value as 'left' | 'center' | 'right'
                                  }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          >
                            <option value="left">Sol</option>
                            <option value="center">Orta</option>
                            <option value="right">Sağ</option>
                          </select>
                        </div>

                        {/* Manual Position Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              X Pozisyonu (Manuel)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.institution_position.x_manual || formData.design_settings.layout.institution_position.x}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      institution_position: {
                                        ...prev.design_settings.layout.institution_position,
                                        x: value,
                                        x_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              Y Pozisyonu (Manuel)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.institution_position.y_manual || formData.design_settings.layout.institution_position.y}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      institution_position: {
                                        ...prev.design_settings.layout.institution_position,
                                        y: value,
                                        y_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                        </div>
                        
                        {/* Institution Position */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionX}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.institution_position.x}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.institution_position.x}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    institution_position: {
                                      ...prev.design_settings.layout.institution_position,
                                      x: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionY}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.institution_position.y}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.institution_position.y}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    institution_position: {
                                      ...prev.design_settings.layout.institution_position,
                                      y: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Certificate No Element */}
                  <div className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                        {t.certificateNoPosition}
                      </h3>
                      <input
                        type="checkbox"
                        id="enable_certificate_no"
                        checked={formData.design_settings.layout.certificate_no_position.enabled !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            layout: {
                              ...prev.design_settings.layout,
                              certificate_no_position: {
                                ...prev.design_settings.layout.certificate_no_position,
                                enabled: e.target.checked
                              }
                            }
                          }
                        }))}
                        className="w-4 h-4 text-[#990000] bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded focus:ring-[#990000] focus:ring-2"
                      />
                    </div>
                    {formData.design_settings.layout.certificate_no_position.enabled !== false && (
                      <div className="space-y-4">
                        {/* Certificate No Color */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Renk
                          </label>
                          <input
                            type="color"
                            value={formData.design_settings.colors.certificate_no}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                colors: {
                                  ...prev.design_settings.colors,
                                  certificate_no: e.target.value
                                }
                              }
                            }))}
                            className="w-20 h-10 border border-neutral-300 dark:border-neutral-600 rounded cursor-pointer"
                          />
                        </div>
                        
                        {/* Certificate No Font Size */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            {t.certificateNoSize}
                          </label>
                          <input
                            type="number"
                            min="8"
                            max="72"
                            value={formData.design_settings.font_sizes.certificate_no}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                font_sizes: {
                                  ...prev.design_settings.font_sizes,
                                  certificate_no: Number(e.target.value)
                                }
                              }
                            }))}
                            className="w-20 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          />
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Metin Hizalama
                          </label>
                          <select
                            value={formData.design_settings.layout.certificate_no_position.align || 'right'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                layout: {
                                  ...prev.design_settings.layout,
                                  certificate_no_position: {
                                    ...prev.design_settings.layout.certificate_no_position,
                                    align: e.target.value as 'left' | 'center' | 'right'
                                  }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          >
                            <option value="left">Sol</option>
                            <option value="center">Orta</option>
                            <option value="right">Sağ</option>
                          </select>
                        </div>

                        {/* Manual Position Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              X Pozisyonu (Manuel)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.certificate_no_position.x_manual || formData.design_settings.layout.certificate_no_position.x}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      certificate_no_position: {
                                        ...prev.design_settings.layout.certificate_no_position,
                                        x: value,
                                        x_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              Y Pozisyonu (Manuel)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.certificate_no_position.y_manual || formData.design_settings.layout.certificate_no_position.y}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      certificate_no_position: {
                                        ...prev.design_settings.layout.certificate_no_position,
                                        y: value,
                                        y_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                        </div>
                        
                        {/* Certificate No Position */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionX}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.certificate_no_position.x}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.certificate_no_position.x}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    certificate_no_position: {
                                      ...prev.design_settings.layout.certificate_no_position,
                                      x: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionY}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.certificate_no_position.y}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.certificate_no_position.y}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    certificate_no_position: {
                                      ...prev.design_settings.layout.certificate_no_position,
                                      y: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date Element */}
                  <div className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                        {t.datePosition}
                      </h3>
                      <input
                        type="checkbox"
                        id="enable_date"
                        checked={formData.design_settings.layout.date_position.enabled !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            layout: {
                              ...prev.design_settings.layout,
                              date_position: {
                                ...prev.design_settings.layout.date_position,
                                enabled: e.target.checked
                              }
                            }
                          }
                        }))}
                        className="w-4 h-4 text-[#990000] bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded focus:ring-[#990000] focus:ring-2"
                      />
                    </div>
                    {formData.design_settings.layout.date_position.enabled !== false && (
                      <div className="space-y-4">
                        {/* Date Color */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Renk
                          </label>
                          <input
                            type="color"
                            value={formData.design_settings.colors.date}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                colors: {
                                  ...prev.design_settings.colors,
                                  date: e.target.value
                                }
                              }
                            }))}
                            className="w-20 h-10 border border-neutral-300 dark:border-neutral-600 rounded cursor-pointer"
                          />
                        </div>
                        
                        {/* Date Font Size */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            {t.dateSize}
                          </label>
                          <input
                            type="number"
                            min="8"
                            max="72"
                            value={formData.design_settings.font_sizes.date}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                font_sizes: {
                                  ...prev.design_settings.font_sizes,
                                  date: Number(e.target.value)
                                }
                              }
                            }))}
                            className="w-20 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          />
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Metin Hizalama
                          </label>
                          <select
                            value={formData.design_settings.layout.date_position.align || 'left'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                layout: {
                                  ...prev.design_settings.layout,
                                  date_position: {
                                    ...prev.design_settings.layout.date_position,
                                    align: e.target.value as 'left' | 'center' | 'right'
                                  }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          >
                            <option value="left">Sol</option>
                            <option value="center">Orta</option>
                            <option value="right">Sağ</option>
                          </select>
                        </div>

                        {/* Manual Position Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              X Pozisyonu (Manuel)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.date_position.x_manual || formData.design_settings.layout.date_position.x}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      date_position: {
                                        ...prev.design_settings.layout.date_position,
                                        x: value,
                                        x_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              Y Pozisyonu (Manuel)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.date_position.y_manual || formData.design_settings.layout.date_position.y}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      date_position: {
                                        ...prev.design_settings.layout.date_position,
                                        y: value,
                                        y_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                        </div>
                        
                        {/* Date Position */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionX}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.date_position.x}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.date_position.x}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    date_position: {
                                      ...prev.design_settings.layout.date_position,
                                      x: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionY}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.date_position.y}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.date_position.y}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    date_position: {
                                      ...prev.design_settings.layout.date_position,
                                      y: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Signature Element */}
                  <div className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                        {t.signaturePosition}
                      </h3>
                      <input
                        type="checkbox"
                        id="enable_signature"
                        checked={formData.design_settings.layout.signature_position.enabled !== false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          design_settings: {
                            ...prev.design_settings,
                            layout: {
                              ...prev.design_settings.layout,
                              signature_position: {
                                ...prev.design_settings.layout.signature_position,
                                enabled: e.target.checked
                              }
                            }
                          }
                        }))}
                        className="w-4 h-4 text-[#990000] bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 rounded focus:ring-[#990000] focus:ring-2"
                      />
                    </div>
                    {formData.design_settings.layout.signature_position.enabled !== false && (
                      <div className="space-y-4">
                        {/* Signature Color */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Renk
                          </label>
                          <input
                            type="color"
                            value={formData.design_settings.colors.signature}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                colors: {
                                  ...prev.design_settings.colors,
                                  signature: e.target.value
                                }
                              }
                            }))}
                            className="w-20 h-10 border border-neutral-300 dark:border-neutral-600 rounded cursor-pointer"
                          />
                        </div>
                        
                        {/* Signature Font Size */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            {t.signatureSize}
                          </label>
                          <input
                            type="number"
                            min="8"
                            max="72"
                            value={formData.design_settings.font_sizes.signature}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                font_sizes: {
                                  ...prev.design_settings.font_sizes,
                                  signature: Number(e.target.value)
                                }
                              }
                            }))}
                            className="w-20 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          />
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                            Metin Hizalama
                          </label>
                          <select
                            value={formData.design_settings.layout.signature_position.align || 'center'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              design_settings: {
                                ...prev.design_settings,
                                layout: {
                                  ...prev.design_settings.layout,
                                  signature_position: {
                                    ...prev.design_settings.layout.signature_position,
                                    align: e.target.value as 'left' | 'center' | 'right'
                                  }
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                          >
                            <option value="left">Sol</option>
                            <option value="center">Orta</option>
                            <option value="right">Sağ</option>
                          </select>
                        </div>

                        {/* Manual Position Inputs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              X Pozisyonu (Manuel)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.signature_position.x_manual || formData.design_settings.layout.signature_position.x}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      signature_position: {
                                        ...prev.design_settings.layout.signature_position,
                                        x: value,
                                        x_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                              Y Pozisyonu (Manuel)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={formData.design_settings.layout.signature_position.y_manual || formData.design_settings.layout.signature_position.y}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  design_settings: {
                                    ...prev.design_settings,
                                    layout: {
                                      ...prev.design_settings.layout,
                                      signature_position: {
                                        ...prev.design_settings.layout.signature_position,
                                        y: value,
                                        y_manual: value
                                      }
                                    }
                                  }
                                }))
                              }}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm"
                            />
                          </div>
                        </div>
                        
                        {/* Signature Position */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionX}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.signature_position.x}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.signature_position.x}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    signature_position: {
                                      ...prev.design_settings.layout.signature_position,
                                      x: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                {t.positionY}
                              </label>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formData.design_settings.layout.signature_position.y}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.5"
                              value={formData.design_settings.layout.signature_position.y}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                design_settings: {
                                  ...prev.design_settings,
                                  layout: {
                                    ...prev.design_settings.layout,
                                    signature_position: {
                                      ...prev.design_settings.layout.signature_position,
                                      y: Number(e.target.value)
                                    }
                                  }
                                }
                              }))}
                              className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Link
                href={`/${locale}/certificates/templates`}
                className="flex-1 px-6 py-3 text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-lg transition-colors text-center font-medium"
              >
                {t.cancel}
              </Link>
              <button
                type="submit"
                disabled={saving || isUploading}
                className="flex-1 px-6 py-3 bg-[#990000] hover:bg-[#880000] text-white rounded-lg transition-colors font-medium flex items-center justify-center disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t.saving}
                  </>
                ) : isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Dosya Yükleniyor...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    {t.save}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-[#990000]" />
                  {t.previewTemplate}
                </h2>
                <button
                  type="button"
                  onClick={generatePreview}
                  disabled={isGeneratingPreview || !formData.background_image}
                  className="px-3 py-1 text-sm bg-[#990000] hover:bg-[#880000] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPreview ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Yenile'
                  )}
                </button>
              </div>
              
              {/* Certificate Preview */}
              <div 
                className="relative bg-neutral-100 dark:bg-neutral-700 rounded-lg overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-600"
                style={{ 
                  aspectRatio: imageAspectRatio,
                  minHeight: '300px',
                  maxHeight: '500px'
                }}
              >
                {formData.background_image ? (
                  <div className="w-full h-full relative">
                    {/* Canvas Preview */}
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full"
                      style={{ display: previewCanvas ? 'block' : 'none' }}
                    />
                    
                    {/* Loading state */}
                    {isGeneratingPreview && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="text-white text-center">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm">Önizleme oluşturuluyor...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Fallback image if canvas fails */}
                    {!previewCanvas && !isGeneratingPreview && (
                      <NextImage 
                        src={formData.background_image} 
                        alt="Preview"
                        width={400}
                        height={300}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400">
                    <div className="text-center">
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
                      <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Arka plan görseli yükleyin</p>
                      <p className="text-xs mt-1">Önizleme otomatik olarak oluşturulacak</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Preview Info */}
              <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                <p><strong>Şablon:</strong> {formData.name || 'Şablon Adı'}</p>
                <p><strong>Kurs:</strong> {t.sampleCourse}</p>
                <p><strong>Kuruluş:</strong> {organizations.find(org => org.slug === formData.organization_slug)?.name || 'Kuruluş'}</p>
                {template && (
                  <>
                    <p><strong>Oluşturulma:</strong> {new Date(template.created_at).toLocaleDateString('tr-TR')}</p>
                    <p><strong>Son Güncelleme:</strong> {new Date(template.updated_at).toLocaleDateString('tr-TR')}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
