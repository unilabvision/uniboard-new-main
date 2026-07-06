import { certificatesSupabase as supabase } from '@/app/_services/certificatesSupabaseClient';

// Template design settings interface
interface TemplateDesignSettings {
  fonts: {
    body: string;
    name: string;
    title: string;
  };
  colors: {
    name: string;
    text: string;
    primary: string;
    secondary: string;
    institution: string;
    certificate_no: string;
    course_name: string;
    date: string;
    signature: string;
    description: string;
    title: string;
  };
  layout: {
    date_position: PositionConfig;
    name_position: PositionConfig;
    title_position: PositionConfig;
    signature_position: PositionConfig;
    description_position: PositionConfig;
    institution_position: PositionConfig;
    certificate_no_position: PositionConfig;
    course_name_position: PositionConfig;
  };
  font_sizes: {
    date: number;
    name: number;
    title: number;
    signature: number;
    institution: number;
    certificate_no: number;
    description: number;
    course_name: number;
  };
}

interface PositionConfig {
  x: number;
  y: number;
  align: 'left' | 'center' | 'right';
  enabled: boolean;
  x_manual: number;
  y_manual: number;
}

interface CertificateTemplate {
  id: number;
  name: string;
  description: string | null;
  background_image: string;
  organization_slug: string;
  is_default: boolean;
  design_settings: string | TemplateDesignSettings; // JSON string or object
  created_at: string;
  updated_at: string;
}

interface Certificate {
  id: number;
  fullname: string;
  coursename: string;
  certificatenumber: string;
  issuedate: string;
  organization?: string;
  instructor?: string;
  duration?: string;
  instructor_bio?: string;
  organization_description?: string;
  skills?: string[];
  grade?: string;
  totalHours?: string;
  course_logo?: string;
  language?: string;
  certificate_title?: string;
  provider_text?: string;
  completion_text?: string;
  instructor_label?: string;
  date_label?: string;
  certificate_number_label?: string;
  qr_scan_text?: string;
  skills_label?: string;
  total_hours_label?: string;
  grade_label?: string;
  organization_slug?: string;
  template_id?: number;
  description?: string;
  signature?: string;
  course_name_position?: any;
}

// Varsayılan dil metinleri
const getDefaultTexts = (language: string = 'tr') => {
  const texts = {
    tr: {
      certificate_title: 'Başarı Sertifikası',
      provider_text: 'tarafından sunulan',
      completion_text: 'Eğitimi videolarını tamamlayarak ve sınavdan geçerli notu alarak bu sertifikayı almaya hak kazanmıştır.',
      instructor_label: 'EĞİTMEN/KURUM',
      date_label: 'VERİLİŞ TARİHİ',
      certificate_number_label: 'SERTİFİKA NO',
      qr_scan_text: 'Doğrulama için tarayın',
      skills_label: 'Kazanılan Yetenekler',
      total_hours_label: 'Toplam',
      grade_label: 'Başarı Notu'
    },
    en: {
      certificate_title: 'Certificate of Achievement',
      provider_text: 'provided by',
      completion_text: 'Successfully completed the course requirements and achieved a passing grade, thereby earning this certificate of completion.',
      instructor_label: 'INSTRUCTOR/ORGANIZATION',
      date_label: 'ISSUE DATE',
      certificate_number_label: 'CERTIFICATE NO',
      qr_scan_text: 'Scan to verify',
      skills_label: 'Skills Acquired',
      total_hours_label: 'Total',
      grade_label: 'Grade'
    },
    global: {
      certificate_title: 'Certificate of Completion',
      provider_text: 'issued by',
      completion_text: 'Has successfully completed all course modules and assessments and is hereby awarded this certificate.',
      instructor_label: 'INSTRUCTOR',
      date_label: 'DATE ISSUED',
      certificate_number_label: 'CERTIFICATE ID',
      qr_scan_text: 'Scan to authenticate',
      skills_label: 'Competencies Gained',
      total_hours_label: 'Duration',
      grade_label: 'Final Score'
    }
  };

  return texts[language as keyof typeof texts] || texts.tr;
};

// Template'i veritabanından getir
export const getCertificateTemplate = async (organizationSlug: string, templateId?: number): Promise<CertificateTemplate | null> => {
  try {
    console.log('Template aranıyor:', { organizationSlug, templateId });
    
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

    console.log('Template bulundu:', data ? { 
      id: data.id, 
      name: data.name,
      design_settings_type: typeof data.design_settings,
      design_settings_length: data.design_settings ? (typeof data.design_settings === 'string' ? data.design_settings.length : 'object') : 'null'
    } : null);
    return data;
  } catch (error) {
    console.error('Template getirme hatası:', error);
    return null;
  }
};

// Arka plan resmi yükle
const loadBackgroundImage = async (imageUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    // Browser environment kontrolü
    if (typeof window === 'undefined') {
      reject(new Error('Browser environment gerekli'));
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      console.log('Arka plan resmi yüklendi:', { width: img.width, height: img.height, src: imageUrl });
      resolve(img);
    };
    
    img.onerror = (error) => {
      console.error('Arka plan resmi yüklenemedi:', { imageUrl, error });
      reject(new Error(`Arka plan resmi yüklenemedi: ${imageUrl}`));
    };
    
    img.src = imageUrl;
  });
};

// Font ailesini belirle
const getFontFamily = (fontType: string): string => {
  const fontMap: { [key: string]: string } = {
    'sans_serif': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'serif': 'Georgia, "Times New Roman", serif',
    'monospace': 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    'cursive': 'cursive',
    'fantasy': 'fantasy'
  };
  
  return fontMap[fontType] || fontMap['sans_serif'];
};

// Çok satırlı metin çizme fonksiyonu (ana sistemle uyumlu)
const drawMultilineText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  align: CanvasTextAlign = 'left'
) => {
  const words = text.split(' ');
  let lines: string[] = [];
  let currentLine = words[0] || '';
  
  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  
  // Satırları çiz
  const lineHeight = fontSize * 1.2;
  lines.forEach((line, index) => {
    const lineY = y + (index * lineHeight);
    ctx.fillText(line, x, lineY);
  });
};

// Pozisyon hesaplama - dashboard preview için optimize edilmiş
const calculatePosition = (config: PositionConfig, canvasWidth: number, canvasHeight: number) => {
  if (config.enabled !== false) {
    // Dashboard preview'da daha küçük canvas boyutu göz önünde bulundurularak ölçekleme
    const scaleX = canvasWidth / 1700; // Standart genişlik referansı
    const scaleY = canvasHeight / 1200; // Standart yükseklik referansı
    
    const x = Math.round((config.x / 100) * canvasWidth);
    const y = Math.round((config.y / 100) * canvasHeight);
    
    console.log('Dashboard pozisyon hesaplandı:', { 
      original: { x: config.x, y: config.y }, 
      calculated: { x, y }, 
      canvas: { width: canvasWidth, height: canvasHeight },
      scale: { x: scaleX, y: scaleY },
      align: config.align 
    });
    
    return {
      x,
      y,
      align: config.align
    };
  }
  return null;
};

// Dashboard preview için optimize edilmiş sertifika oluşturma
export const generateDashboardPreviewCanvas = async (
  data: Certificate,
  template: CertificateTemplate,
  previewWidth: number = 600,
  previewHeight: number = 450
): Promise<HTMLCanvasElement> => {
  // Browser environment kontrolü
  if (typeof window === 'undefined') {
    throw new Error('Browser environment gerekli');
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas bağlamı kullanılamıyor');

  try {
    console.log('Dashboard preview sertifika oluşturuluyor:', {
      template_name: template.name,
      background_image: template.background_image,
      preview_size: { width: previewWidth, height: previewHeight }
    });
    
    // Template design settings'i parse et
    let designSettings: TemplateDesignSettings;
    
    if (typeof template.design_settings === 'object' && template.design_settings !== null) {
      designSettings = template.design_settings as TemplateDesignSettings;
    } else if (typeof template.design_settings === 'string') {
      try {
        designSettings = JSON.parse(template.design_settings);
      } catch (parseError) {
        console.error('Design settings parse hatası:', parseError);
        throw new Error('Template design settings parse edilemedi');
      }
    } else {
      throw new Error('Template design settings bulunamadı veya geçersiz format');
    }
    
    // Canvas boyutlarını preview boyutuna ayarla
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    
    console.log('Preview canvas boyutları ayarlandı:', { width: canvas.width, height: canvas.height });
    
    // Arka plan resmini yükle
    console.log('Arka plan resmi yükleniyor:', template.background_image);
    const backgroundImg = await loadBackgroundImage(template.background_image);
    
    // Arka plan resmini preview boyutuna ölçeklendir ve çiz
    ctx.drawImage(backgroundImg, 0, 0, previewWidth, previewHeight);
    console.log('Arka plan resmi preview boyutuna ölçeklendirildi');
    
    // Font ailelerini ayarla
    const nameFont = getFontFamily(designSettings.fonts.name);
    const titleFont = getFontFamily(designSettings.fonts.title);
    const bodyFont = getFontFamily(designSettings.fonts.body);
    
    // Renkleri ayarla
    const colors = designSettings.colors;
    const fontSizes = designSettings.font_sizes;
    
    // Preview için font boyutlarını ölçeklendir
    const fontScale = Math.min(previewWidth / 1700, previewHeight / 1200);
    
    // İsim pozisyonu
    const namePos = calculatePosition(designSettings.layout.name_position, canvas.width, canvas.height);
    if (namePos && designSettings.layout.name_position.enabled !== false) {
      ctx.fillStyle = colors.name;
      ctx.font = `600 ${Math.round(fontSizes.name * fontScale)}px ${nameFont}`;
      ctx.textAlign = namePos.align as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      
      ctx.fillText(data.fullname, namePos.x, namePos.y);
      console.log('Preview isim çizildi:', { text: data.fullname, x: namePos.x, y: namePos.y });
    }
    
    // Tarih pozisyonu
    const datePos = calculatePosition(designSettings.layout.date_position, canvas.width, canvas.height);
    if (datePos && designSettings.layout.date_position.enabled !== false) {
      ctx.fillStyle = colors.date;
      ctx.font = `500 ${Math.round(fontSizes.date * fontScale)}px ${bodyFont}`;
      ctx.textAlign = datePos.align as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      
      // Tarihi formatla
      let formattedDate;
      const dateObj = new Date(data.issuedate);
      if (data.language === 'en' || data.language === 'global') {
        formattedDate = dateObj.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      } else {
        formattedDate = dateObj.toLocaleDateString('tr-TR', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      ctx.fillText(formattedDate, datePos.x, datePos.y);
      console.log('Preview tarih çizildi:', { text: formattedDate, x: datePos.x, y: datePos.y });
    }
    
    // Başlık pozisyonu
    const titlePos = calculatePosition(designSettings.layout.title_position, canvas.width, canvas.height);
    if (titlePos && designSettings.layout.title_position.enabled !== false) {
      ctx.fillStyle = colors.title;
      ctx.font = `600 ${Math.round(fontSizes.title * fontScale)}px ${titleFont}`;
      ctx.textAlign = titlePos.align as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      
      ctx.fillText(data.certificate_title || '', titlePos.x, titlePos.y);
      console.log('Preview başlık çizildi:', { text: data.certificate_title, x: titlePos.x, y: titlePos.y });
    }
    
    // Kurum pozisyonu
    const institutionPos = calculatePosition(designSettings.layout.institution_position, canvas.width, canvas.height);
    if (institutionPos && designSettings.layout.institution_position.enabled !== false) {
      ctx.fillStyle = colors.institution;
      ctx.font = `500 ${Math.round(fontSizes.institution * fontScale)}px ${bodyFont}`;
      ctx.textAlign = institutionPos.align as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      
      ctx.fillText(data.organization || '', institutionPos.x, institutionPos.y);
      console.log('Preview kurum çizildi:', { text: data.organization, x: institutionPos.x, y: institutionPos.y });
    }
    
    // Sertifika numarası pozisyonu
    const certNoPos = calculatePosition(designSettings.layout.certificate_no_position, canvas.width, canvas.height);
    if (certNoPos && designSettings.layout.certificate_no_position.enabled !== false) {
      ctx.fillStyle = colors.certificate_no;
      ctx.font = `500 ${Math.round(fontSizes.certificate_no * fontScale)}px ${bodyFont}`;
      ctx.textAlign = certNoPos.align as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      
      ctx.fillText(data.certificatenumber, certNoPos.x, certNoPos.y);
      console.log('Preview sertifika numarası çizildi:', { text: data.certificatenumber, x: certNoPos.x, y: certNoPos.y });
    }
    
    // Açıklama pozisyonu (ana sistemle uyumlu çok satırlı metin)
    const descriptionPos = calculatePosition(designSettings.layout.description_position, canvas.width, canvas.height);
    if (descriptionPos && designSettings.layout.description_position.enabled !== false) {
      ctx.fillStyle = colors.description;
      const descriptionFontSize = Math.round((fontSizes.description || fontSizes.institution) * fontScale);
      ctx.font = `400 ${descriptionFontSize}px ${bodyFont}`;
      ctx.textAlign = descriptionPos.align as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      
      // Açıklama metnini çok satırlı olarak göster (ana sistem metoduyla)
      const descriptionText = data.description || data.completion_text || 'Bu sertifika başarılı tamamlamayı belirtir.';
      const maxWidth = canvas.width * 0.6; // Canvas genişliğinin %60'ı
      
      drawMultilineText(ctx, descriptionText, descriptionPos.x, descriptionPos.y, maxWidth, descriptionFontSize, descriptionPos.align);
      console.log('Preview açıklama çizildi (çok satırlı):', { text: descriptionText, x: descriptionPos.x, y: descriptionPos.y });
    }
    
    // Kurs adı pozisyonu (ana sistemle uyumlu çok satırlı metin)
    const courseNamePos = calculatePosition(designSettings.layout.course_name_position, canvas.width, canvas.height);
    if (courseNamePos && designSettings.layout.course_name_position.enabled !== false && data.coursename) {
      ctx.fillStyle = colors.course_name || colors.text;
      const courseNameFontSize = Math.round((fontSizes.course_name || fontSizes.title) * fontScale);
      ctx.font = `600 ${courseNameFontSize}px ${titleFont}`;
      ctx.textAlign = courseNamePos.align as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      
      // Kurs adını çok satırlı olarak göster (ana sistem metoduyla)
      const maxWidth = canvas.width * 0.6; // Canvas genişliğinin %60'ı
      
      drawMultilineText(ctx, data.coursename, courseNamePos.x, courseNamePos.y, maxWidth, courseNameFontSize, courseNamePos.align);
      console.log('Preview kurs adı çizildi (çok satırlı):', { text: data.coursename, x: courseNamePos.x, y: courseNamePos.y });
    }
    
    // İmza pozisyonu
    const signaturePos = calculatePosition(designSettings.layout.signature_position, canvas.width, canvas.height);
    if (signaturePos && designSettings.layout.signature_position.enabled !== false) {
      ctx.fillStyle = colors.signature;
      ctx.font = `500 ${Math.round(fontSizes.signature * fontScale)}px ${bodyFont}`;
      ctx.textAlign = signaturePos.align as CanvasTextAlign;
      ctx.textBaseline = 'middle';
      
      const signatureText = data.instructor || '';
      if (signatureText) {
        ctx.fillText(signatureText, signaturePos.x, signaturePos.y);
        console.log('Preview imza çizildi:', { text: signatureText, x: signaturePos.x, y: signaturePos.y });
      }
    }
    
  } catch (error) {
    console.error('Dashboard preview sertifika oluşturma hatası:', error);
    
    // Hata durumunda basit bir preview
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

// Sample data generator for preview
export const generateSampleCertificateData = (language: string = 'tr'): Certificate => {
  const defaultTexts = getDefaultTexts(language);
  
  return {
    id: 1,
    fullname: language === 'en' ? 'Sample Name (Preview)' : 'Örnek İsim (Önizleme)',
    coursename: language === 'en' ? 'Sample Course Name (Preview Only)' : 'Örnek Etkinlik Adı (Sadece Önizleme)',
    certificatenumber: 'PREVIEW-001',
    issuedate: new Date().toISOString(),
    organization: 'Uniboard Eğitim',
    instructor: language === 'en' ? 'Sample Instructor (Preview)' : 'Örnek Eğitmen (Önizleme)',
    language: language,
    certificate_title: defaultTexts.certificate_title,
    provider_text: defaultTexts.provider_text,
    completion_text: defaultTexts.completion_text,
    instructor_label: defaultTexts.instructor_label,
    date_label: defaultTexts.date_label,
    certificate_number_label: defaultTexts.certificate_number_label,
    qr_scan_text: defaultTexts.qr_scan_text,
    skills_label: defaultTexts.skills_label,
    total_hours_label: defaultTexts.total_hours_label,
    grade_label: defaultTexts.grade_label,
    description: language === 'en' 
      ? 'This is a sample description for preview purposes only. The actual certificate content will be different.'
      : 'Bu sadece önizleme amaçlı örnek bir açıklamadır. Gerçek sertifika içeriği farklı olacaktır.'
  };
};

// Main function for dashboard preview
export const generateDashboardCertificatePreview = async (
  templateData: any,
  previewWidth: number = 600,
  previewHeight: number = 450,
  language: string = 'tr'
): Promise<HTMLCanvasElement> => {
  try {
    console.log('Dashboard sertifika önizlemesi oluşturuluyor:', {
      template_name: templateData.name,
      preview_size: { width: previewWidth, height: previewHeight },
      language
    });

    // Sample certificate data oluştur
    const sampleData = generateSampleCertificateData(language);
    
    // Template'i uygun formata çevir
    const template: CertificateTemplate = {
      id: templateData.id || 1,
      name: templateData.name || 'Preview Template',
      description: templateData.description || null,
      background_image: templateData.background_image || '',
      organization_slug: templateData.organization_slug || 'default',
      is_default: templateData.is_default || false,
      design_settings: templateData.design_settings,
      created_at: templateData.created_at || new Date().toISOString(),
      updated_at: templateData.updated_at || new Date().toISOString()
    };
    
    // Dashboard preview canvas oluştur
    return await generateDashboardPreviewCanvas(sampleData, template, previewWidth, previewHeight);
    
  } catch (error) {
    console.error('Dashboard önizleme hatası:', error);
    
    // Fallback preview
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
