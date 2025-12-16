// Supabase client for browser
const createBrowserSupabaseClient = () => {
  if (typeof window === 'undefined') return null;
  
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
};

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
  
  // Metin alanları
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
  organizations?: {
    name: string;
    primary_color?: string;
    secondary_color?: string;
    logo?: string;
    website?: string;
  };
}

// Varsayılan dil metinleri
const getDefaultTexts = (language: string = 'tr') => {
  const texts = {
    tr: {
      certificate_title: 'Başarı Sertifikası',
      provider_text: 'tarafından sunulan',
      completion_text: 'Eğitimi başarıyla tamamlayarak bu sertifikayı almaya hak kazanmıştır.',
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
      completion_text: 'Has successfully completed the course requirements, thereby earning this certificate of completion.',
      instructor_label: 'INSTRUCTOR/ORGANIZATION',
      date_label: 'ISSUE DATE',
      certificate_number_label: 'CERTIFICATE NO',
      qr_scan_text: 'Scan to verify',
      skills_label: 'Skills Acquired',
      total_hours_label: 'Total',
      grade_label: 'Grade'
    }
  };

  return texts[language as keyof typeof texts] || texts.tr;
};

// Arka plan resmi yükle
const loadBackgroundImage = async (imagePath: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    console.log('Loading background image from:', imagePath);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      console.log('Background image loaded successfully');
      resolve(img);
    };
    img.onerror = (error) => {
      console.error('Background image load error:', error);
      console.error('Failed to load image from:', imagePath);
      reject(new Error(`Arka plan resmi yüklenemedi: ${imagePath}`));
    };
    img.src = imagePath;
  });
};

// Massive Bioinformatics için özel sertifika oluşturma
export const generateMassiveBioinformaticsCertificateCanvas = async (
  data: Certificate,
  backgroundImageUrl?: string
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas bağlamı kullanılamıyor');

  try {
    // Arka plan resmini yükle - sadece database'den gelen URL kullan
    if (!backgroundImageUrl) {
      console.log('No background image URL provided, using fallback');
      throw new Error('Background image URL gerekli');
    }
    
    console.log('Attempting to load Massive Bioinformatics background:', backgroundImageUrl);
    const backgroundImg = await loadBackgroundImage(backgroundImageUrl);
    
    // Canvas boyutlarını arka plan resmine göre ayarla
    canvas.width = backgroundImg.width;
    canvas.height = backgroundImg.height;
    
    // Arka plan resmini çiz
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    
    // İsim için konum - konumu başlangıç noktası olarak ayarlıyoruz
    const nameX = canvas.width / 8.5; // 8 ile 9 arasında bir değer
    const nameY = canvas.height / 2 - 70; // Dikey ortanın biraz üstü, hafif aşağı kaydırıldı
    
    // İsmi ekle
    ctx.fillStyle = '#0A2463'; // Koyu lacivert renk
    ctx.font = '600 82px system-ui, -apple-system, sans-serif'; // Font oldukça büyütüldü (56px->72px)
    ctx.textAlign = 'left'; // Sola yaslı metin
    ctx.textBaseline = 'middle';
    ctx.fillText(data.fullname, nameX, nameY);
    
    // Tarih için konum - biraz daha aşağı ve sola
    const dateX = canvas.width / 5.5; // Biraz daha sağa kaydırıldı (1/6'dan 1/5'e)
    const dateY = canvas.height * 0.82; // Sayfanın alt kısmında biraz daha aşağı
    
    // Tarihi ekle
    let formattedDate;
    const dateObj = new Date(data.issuedate);
    if (data.language === 'en') {
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
    
    ctx.fillStyle = '#4B5563'; // Gri metin rengi
    ctx.font = '500 32px system-ui, -apple-system, sans-serif'; // Font büyütüldü (28px->32px)
    ctx.textAlign = 'left'; // Sola yaslı metin
    ctx.textBaseline = 'middle';
    ctx.fillText(formattedDate, dateX, dateY);
    
  } catch (error) {
    // Arka plan resmi yüklenemezse Massive Bioinformatics için özel tasarım oluştur
    console.error('Massive Bioinformatics sertifika şablonu yüklenemedi:', error);
    
    canvas.width = 1700;
    canvas.height = 1200;
    
    // Massive Bioinformatics tarzında arka plan oluştur
    // Gradient arka plan
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f8fafc'); // açık gri-beyaz
    gradient.addColorStop(0.5, '#e2e8f0'); // orta gri
    gradient.addColorStop(1, '#cbd5e1'); // koyu gri
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Çerçeve ve kenarlık
    ctx.strokeStyle = '#1A5276'; // Koyu mavi
    ctx.lineWidth = 12;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);
    
    // İç çerçeve
    ctx.strokeStyle = '#0A2463'; // Lacivert
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 80, canvas.width - 160, canvas.height - 160);
    
    // Başlık - büyük ve merkezde
    ctx.fillStyle = '#1A5276';
    ctx.font = '700 70px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MASSIVE BIOINFORMATICS', canvas.width / 2, 200);
    
    // Alt başlık
    ctx.fillStyle = '#0A2463';
    ctx.font = '600 48px system-ui, -apple-system, sans-serif';
    ctx.fillText('SERTİFİKA', canvas.width / 2, 280);
    
    // İsim - sol başlangıç noktasından, büyük font
    const nameX = canvas.width / 8.5;
    const nameY = canvas.height / 2 - 20;
    
    ctx.fillStyle = '#0A2463'; // Koyu lacivert renk
    ctx.font = '600 82px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left'; // Sola yaslı metin
    ctx.textBaseline = 'middle';
    ctx.fillText(data.fullname, nameX, nameY);
    
    // Kurs bilgisi (eğer varsa)
    if (data.coursename) {
      ctx.fillStyle = '#4B5563';
      ctx.font = '500 36px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(data.coursename, nameX, nameY + 80);
    }
    
    // Tarih - aşağı ve sola konumlandırıldı
    const dateX = canvas.width / 5.5;
    const dateY = canvas.height * 0.82;
    
    ctx.fillStyle = '#4B5563';
    ctx.font = '500 32px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    let formattedDate;
    const dateObj = new Date(data.issuedate);
    if (data.language === 'en') {
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
    ctx.fillText(formattedDate, dateX, dateY);
    
    // Sertifika numarası (eğer varsa)
    if (data.certificatenumber) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '400 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Sertifika No: ${data.certificatenumber}`, canvas.width - 100, canvas.height - 100);
    }
  }
  
  return canvas;
};

// Genel sertifika oluşturma fonksiyonu (template'e göre)
export const generateCertificateWithTemplate = async (
  data: Certificate,
  template: any
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas bağlamı kullanılamıyor');

  try {
    // Arka plan resmini yükle
    const backgroundImg = await loadBackgroundImage(template.background_image);
    
    // Canvas boyutlarını arka plan resmine göre ayarla
    canvas.width = backgroundImg.width;
    canvas.height = backgroundImg.height;
    
    // Arka plan resmini çiz
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    
    const designSettings = template.design_settings || {};
    const layout = designSettings.layout || {};
    const colors = designSettings.colors || { primary: '#990000', secondary: '#666666', text: '#333333' };
    const fontSizes = designSettings.font_sizes || { title: 24, name: 18, date: 14, signature: 14 };
    const fonts = designSettings.fonts || { title: 'serif', body: 'sans_serif' };

    // Font mapping
    const getFontFamily = (fontType: string) => {
      switch (fontType) {
        case 'serif': return 'serif';
        case 'monospace': return 'monospace';
        default: return 'sans-serif';
      }
    };

    // Title
    if (layout.title_position?.enabled !== false) {
      const pos = layout.title_position;
      ctx.fillStyle = colors.primary;
      ctx.font = `600 ${fontSizes.title}px ${getFontFamily(fonts.title)}`;
      
      const x = (canvas.width * pos.x) / 100;
      const y = (canvas.height * pos.y) / 100;
      
      ctx.textAlign = pos.align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.certificate_title || 'SERTİFİKA', x, y);
    }

    // Name
    if (layout.name_position?.enabled !== false) {
      const pos = layout.name_position;
      ctx.fillStyle = colors.text;
      ctx.font = `600 ${fontSizes.name}px ${getFontFamily(fonts.body)}`;
      
      const x = (canvas.width * pos.x) / 100;
      const y = (canvas.height * pos.y) / 100;
      
      ctx.textAlign = pos.align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.fullname, x, y);
    }

    // Date
    if (layout.date_position?.enabled !== false) {
      const pos = layout.date_position;
      ctx.fillStyle = colors.secondary;
      ctx.font = `500 ${fontSizes.date}px ${getFontFamily(fonts.body)}`;
      
      const x = (canvas.width * pos.x) / 100;
      const y = (canvas.height * pos.y) / 100;
      
      // Format date
      const dateObj = new Date(data.issuedate);
      const formattedDate = data.language === 'en' 
        ? dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : dateObj.toLocaleDateString('tr-TR', { month: 'long', day: 'numeric', year: 'numeric' });
      
      ctx.textAlign = pos.align || 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(formattedDate, x, y);
    }

    // Signature/Instructor
    if (layout.signature_position?.enabled !== false && data.instructor) {
      const pos = layout.signature_position;
      ctx.fillStyle = colors.text;
      ctx.font = `500 ${fontSizes.signature}px ${getFontFamily(fonts.body)}`;
      
      const x = (canvas.width * pos.x) / 100;
      const y = (canvas.height * pos.y) / 100;
      
      ctx.textAlign = pos.align || 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.instructor, x, y);
    }

  } catch (error) {
    console.error('Sertifika şablonu yüklenemedi:', error);
    
    // Fallback simple certificate
    canvas.width = 1200;
    canvas.height = 800;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#990000';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    
    ctx.fillStyle = '#990000';
    ctx.font = '600 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('SERTİFİKA', canvas.width / 2, 200);
    
    ctx.fillStyle = '#333333';
    ctx.font = '600 36px sans-serif';
    ctx.fillText(data.fullname, canvas.width / 2, canvas.height / 2);
    
    const dateObj = new Date(data.issuedate);
    const formattedDate = dateObj.toLocaleDateString('tr-TR');
    ctx.font = '500 24px sans-serif';
    ctx.fillText(formattedDate, canvas.width / 2, canvas.height - 150);
  }
  
  return canvas;
};

// Massive Bioinformatics için özel sertifika oluşturma (wrapper)
export const generateMassiveBioinformaticsCertificate = async (
  data: Certificate, 
  backgroundImageUrl?: string
): Promise<HTMLCanvasElement> => {
  return await generateMassiveBioinformaticsCertificateCanvas(data, backgroundImageUrl);
};

// Sertifika türünü belirle ve uygun fonksiyonu çağır
export const generateCertificate = async (
  data: Certificate, 
  template?: any
): Promise<HTMLCanvasElement> => {
  // Massive Bioinformatics için özel kontrol
  if (data.organizations?.name?.toLowerCase().includes('massive bioinformatics') || 
      data.organization?.toLowerCase().includes('massive bioinformatics')) {
    // Template varsa ondan background image al, yoksa varsayılan kullan
    const backgroundImageUrl = template?.background_image;
    return await generateMassiveBioinformaticsCertificate(data, backgroundImageUrl);
  }
  
  // Template varsa template ile oluştur
  if (template) {
    return await generateCertificateWithTemplate(data, template);
  }
  
  // Varsayılan sertifika
  return await generateCertificateWithTemplate(data, {
    background_image: '',
    design_settings: {
      colors: { primary: '#990000', secondary: '#666666', text: '#333333' },
      fonts: { title: 'serif', body: 'sans_serif' },
      font_sizes: { title: 24, name: 18, date: 14, signature: 14 },
      layout: {
        title_position: { x: 50, y: 20, enabled: true, align: 'center' },
        name_position: { x: 50, y: 50, enabled: true, align: 'center' },
        date_position: { x: 50, y: 80, enabled: true, align: 'center' },
        signature_position: { x: 50, y: 90, enabled: true, align: 'center' }
      }
    }
  });
};
