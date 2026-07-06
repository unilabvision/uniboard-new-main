import { certificatesSupabase as supabase } from '@/app/_services/certificatesSupabaseClient';
import {
  CertificateRenderData,
  loadBackgroundImage,
  parseDesignSettings,
  renderCertificateFields,
  TemplateDesignSettings,
} from './certificateCanvasRenderer';

interface CertificateTemplate {
  id: number;
  name: string;
  description: string | null;
  background_image: string;
  organization_slug: string;
  is_default: boolean;
  design_settings: string | TemplateDesignSettings;
  created_at: string;
  updated_at: string;
}

interface Certificate extends CertificateRenderData {
  id: number;
  duration?: string;
  instructor_bio?: string;
  organization_description?: string;
  skills?: string[];
  grade?: string;
  totalHours?: string;
  course_logo?: string;
  provider_text?: string;
  instructor_label?: string;
  date_label?: string;
  certificate_number_label?: string;
  qr_scan_text?: string;
  skills_label?: string;
  total_hours_label?: string;
  grade_label?: string;
  organization_slug?: string;
  template_id?: number;
  signature?: string;
}

const getDefaultTexts = (language: string = 'tr') => {
  const texts = {
    tr: {
      certificate_title: 'Başarı Sertifikası',
      completion_text:
        'Eğitimi videolarını tamamlayarak ve sınavdan geçerli notu alarak bu sertifikayı almaya hak kazanmıştır.',
    },
    en: {
      certificate_title: 'Certificate of Achievement',
      completion_text:
        'Successfully completed the course requirements and achieved a passing grade, thereby earning this certificate of completion.',
    },
    global: {
      certificate_title: 'Certificate of Completion',
      completion_text:
        'Has successfully completed all course modules and assessments and is hereby awarded this certificate.',
    },
  };

  return texts[language as keyof typeof texts] || texts.tr;
};

export const getCertificateTemplate = async (
  organizationSlug: string,
  templateId?: number
): Promise<CertificateTemplate | null> => {
  try {
    let query = supabase
      .from('certificate_templates')
      .select('*')
      .eq('organization_slug', organizationSlug);

    if (templateId) {
      query = query.eq('id', templateId);
    } else {
      query = query.eq('is_default', true);
    }

    const { data, error } = await query.single();
    if (error) {
      console.error('Template bulunamadı:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Template getirme hatası:', error);
    return null;
  }
};

export const generateDashboardPreviewCanvas = async (
  data: Certificate,
  template: CertificateTemplate,
  previewWidth: number = 600,
  previewHeight: number = 450
): Promise<HTMLCanvasElement> => {
  if (typeof window === 'undefined') {
    throw new Error('Browser environment gerekli');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas bağlamı kullanılamıyor');

  try {
    const designSettings = parseDesignSettings(template.design_settings);
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    const backgroundImg = await loadBackgroundImage(template.background_image);
    ctx.drawImage(backgroundImg, 0, 0, previewWidth, previewHeight);
    renderCertificateFields(ctx, data, designSettings, canvas.width, canvas.height);
  } catch (error) {
    console.error('Dashboard preview sertifika oluşturma hatası:', error);

    canvas.width = previewWidth;
    canvas.height = previewHeight;
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#dc3545';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    ctx.fillStyle = '#dc3545';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Önizleme Yüklenemedi', canvas.width / 2, canvas.height / 2 - 10);

    ctx.font = '400 12px system-ui, sans-serif';
    ctx.fillText('Şablon ayarlarını kontrol edin', canvas.width / 2, canvas.height / 2 + 10);
  }

  return canvas;
};

export const generateSampleCertificateData = (language: string = 'tr'): Certificate => {
  const defaultTexts = getDefaultTexts(language);

  return {
    id: 1,
    fullname: language === 'en' ? 'Sample Name (Preview)' : 'Örnek İsim (Önizleme)',
    coursename:
      language === 'en' ? 'Sample Course Name (Preview Only)' : 'Örnek Etkinlik Adı (Sadece Önizleme)',
    certificatenumber: 'PREVIEW-001',
    issuedate: new Date().toISOString(),
    organization: 'Uniboard Eğitim',
    instructor: language === 'en' ? 'Sample Instructor (Preview)' : 'Örnek Eğitmen (Önizleme)',
    language,
    certificate_title: defaultTexts.certificate_title,
    completion_text: defaultTexts.completion_text,
    description:
      language === 'en'
        ? 'This is a sample description for preview purposes only. The actual certificate content will be different.'
        : 'Bu sadece önizleme amaçlı örnek bir açıklamadır. Gerçek sertifika içeriği farklı olacaktır.',
  };
};

export const generateDashboardCertificatePreview = async (
  templateData: any,
  previewWidth: number = 600,
  previewHeight: number = 450,
  language: string = 'tr'
): Promise<HTMLCanvasElement> => {
  try {
    const sampleData = generateSampleCertificateData(language);
    const template: CertificateTemplate = {
      id: templateData.id || 1,
      name: templateData.name || 'Preview Template',
      description: templateData.description || null,
      background_image: templateData.background_image || '',
      organization_slug: templateData.organization_slug || 'default',
      is_default: templateData.is_default || false,
      design_settings: templateData.design_settings || '{}',
      created_at: templateData.created_at || new Date().toISOString(),
      updated_at: templateData.updated_at || new Date().toISOString(),
    };

    return generateDashboardPreviewCanvas(sampleData, template, previewWidth, previewHeight);
  } catch (error) {
    console.error('Dashboard önizleme hatası:', error);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (ctx) {
      canvas.width = previewWidth;
      canvas.height = previewHeight;
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#6c757d';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.fillStyle = '#6c757d';
      ctx.font = '400 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Önizleme Hazırlanıyor...', canvas.width / 2, canvas.height / 2);
    }

    return canvas;
  }
};
