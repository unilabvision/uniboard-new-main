import {
  CertificateRenderData,
  loadBackgroundImage,
  parseDesignSettings,
  renderCertificateFields,
  TemplateDesignSettings,
} from './certificateCanvasRenderer';

interface Certificate extends CertificateRenderData {
  id: number;
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
  organizations?: {
    name: string;
    primary_color?: string;
    secondary_color?: string;
    logo?: string;
    website?: string;
  };
}

interface CertificateTemplate {
  background_image: string;
  design_settings?: string | TemplateDesignSettings | Record<string, unknown>;
}

// Massive Bioinformatics için özel sertifika oluşturma
export const generateMassiveBioinformaticsCertificateCanvas = async (
  data: Certificate,
  backgroundImageUrl?: string
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas bağlamı kullanılamıyor');

  try {
    if (!backgroundImageUrl) {
      throw new Error('Background image URL gerekli');
    }

    const backgroundImg = await loadBackgroundImage(backgroundImageUrl);
    canvas.width = backgroundImg.width;
    canvas.height = backgroundImg.height;
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    const nameX = canvas.width / 8.5;
    const nameY = canvas.height / 2 - 70;

    ctx.fillStyle = '#0A2463';
    ctx.font = '600 82px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.fullname, nameX, nameY);

    const dateX = canvas.width / 5.5;
    const dateY = canvas.height * 0.82;
    const formattedDate =
      data.language === 'en'
        ? new Date(data.issuedate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })
        : new Date(data.issuedate).toLocaleDateString('tr-TR', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });

    ctx.fillStyle = '#4B5563';
    ctx.font = '500 32px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(formattedDate, dateX, dateY);
  } catch (error) {
    console.error('Massive Bioinformatics sertifika şablonu yüklenemedi:', error);

    canvas.width = 1700;
    canvas.height = 1200;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(0.5, '#e2e8f0');
    gradient.addColorStop(1, '#cbd5e1');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1A5276';
    ctx.lineWidth = 12;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    ctx.fillStyle = '#1A5276';
    ctx.font = '700 70px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MASSIVE BIOINFORMATICS', canvas.width / 2, 200);

    ctx.fillStyle = '#0A2463';
    ctx.font = '600 48px system-ui, -apple-system, sans-serif';
    ctx.fillText('SERTİFİKA', canvas.width / 2, 280);

    const nameX = canvas.width / 8.5;
    const nameY = canvas.height / 2 - 20;
    ctx.fillStyle = '#0A2463';
    ctx.font = '600 82px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(data.fullname, nameX, nameY);

    if (data.coursename) {
      ctx.fillStyle = '#4B5563';
      ctx.font = '500 36px system-ui, -apple-system, sans-serif';
      ctx.fillText(data.coursename, nameX, nameY + 80);
    }

    if (data.certificatenumber) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '400 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Sertifika No: ${data.certificatenumber}`, canvas.width - 100, canvas.height - 100);
    }
  }

  return canvas;
};

export const generateCertificateWithTemplate = async (
  data: Certificate,
  template: CertificateTemplate
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas bağlamı kullanılamıyor');

  try {
    const backgroundImg = await loadBackgroundImage(template.background_image);
    canvas.width = backgroundImg.width;
    canvas.height = backgroundImg.height;
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

    const designSettings = parseDesignSettings(template.design_settings);
    const renderData: CertificateRenderData = {
      ...data,
      organization: data.organization || data.organizations?.name,
    };

    renderCertificateFields(ctx, renderData, designSettings, canvas.width, canvas.height);
  } catch (error) {
    console.error('Sertifika şablonu yüklenemedi:', error);

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
  }

  return canvas;
};

export const generateMassiveBioinformaticsCertificate = async (
  data: Certificate,
  backgroundImageUrl?: string
): Promise<HTMLCanvasElement> => {
  return generateMassiveBioinformaticsCertificateCanvas(data, backgroundImageUrl);
};

export const generateCertificate = async (
  data: Certificate,
  template?: CertificateTemplate
): Promise<HTMLCanvasElement> => {
  if (
    data.organizations?.name?.toLowerCase().includes('massive bioinformatics') ||
    data.organization?.toLowerCase().includes('massive bioinformatics')
  ) {
    return generateMassiveBioinformaticsCertificate(data, template?.background_image);
  }

  if (template) {
    return generateCertificateWithTemplate(data, template);
  }

  return generateCertificateWithTemplate(data, {
    background_image: '',
    design_settings: {
      colors: {
        primary: '#990000',
        secondary: '#666666',
        text: '#333333',
        title: '#990000',
        name: '#333333',
        description: '#333333',
        institution: '#666666',
        certificate_no: '#666666',
        date: '#666666',
        signature: '#333333',
        course_name: '#333333',
      },
      fonts: { title: 'serif', body: 'sans_serif', name: 'sans_serif' },
      font_sizes: {
        title: 24,
        name: 18,
        date: 14,
        signature: 14,
        institution: 14,
        certificate_no: 14,
        description: 14,
        course_name: 18,
      },
      layout: {
        title_position: { x: 50, y: 20, enabled: true, align: 'center' },
        name_position: { x: 50, y: 50, enabled: true, align: 'center' },
        date_position: { x: 50, y: 80, enabled: true, align: 'center' },
        signature_position: { x: 50, y: 90, enabled: true, align: 'center' },
        description_position: { x: 50, y: 60, enabled: false, align: 'center' },
        institution_position: { x: 50, y: 70, enabled: false, align: 'center' },
        certificate_no_position: { x: 90, y: 95, enabled: false, align: 'right' },
        course_name_position: { x: 50, y: 40, enabled: false, align: 'center' },
      },
    },
  });
};
