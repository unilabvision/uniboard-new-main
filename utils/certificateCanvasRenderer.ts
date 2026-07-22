export interface PositionConfig {
  x: number;
  y: number;
  align?: 'left' | 'center' | 'right';
  enabled?: boolean;
  x_manual?: number;
  y_manual?: number;
}

export interface TemplateDesignSettings {
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

export interface CertificateRenderData {
  fullname: string;
  coursename: string;
  certificatenumber: string;
  issuedate: string;
  organization?: string;
  instructor?: string;
  language?: string;
  certificate_title?: string;
  completion_text?: string;
  description?: string;
  certificate_number_label?: string;
}

const REFERENCE_WIDTH = 1700;
const REFERENCE_HEIGHT = 1200;

export const parseDesignSettings = (
  designSettings: unknown
): TemplateDesignSettings => {
  if (typeof designSettings === 'object' && designSettings !== null) {
    return designSettings as TemplateDesignSettings;
  }

  if (typeof designSettings === 'string') {
    const trimmed = designSettings.trim();
    if (!trimmed) {
      throw new Error('Template design settings bulunamadı veya geçersiz format');
    }
    return JSON.parse(trimmed) as TemplateDesignSettings;
  }

  throw new Error('Template design settings bulunamadı veya geçersiz format');
};

export const getFontFamily = (fontType: string): string => {
  const fontMap: Record<string, string> = {
    sans_serif: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    monospace: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    cursive: 'cursive',
    fantasy: 'fantasy',
  };

  return fontMap[fontType] || fontMap.sans_serif;
};

export const calculatePosition = (
  config: PositionConfig | undefined,
  canvasWidth: number,
  canvasHeight: number
) => {
  if (!config || config.enabled === false) {
    return null;
  }

  return {
    x: Math.round((config.x / 100) * canvasWidth),
    y: Math.round((config.y / 100) * canvasHeight),
    align: config.align || 'center',
  };
};

export const getFontScale = (canvasWidth: number, canvasHeight: number): number =>
  Math.min(canvasWidth / REFERENCE_WIDTH, canvasHeight / REFERENCE_HEIGHT);

export const formatCertificateDate = (issuedate: string, language?: string): string => {
  const dateObj = new Date(issuedate);
  if (language === 'en' || language === 'global') {
    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return dateObj.toLocaleDateString('tr-TR', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const drawMultilineText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number
) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const testLine = `${currentLine} ${words[i]}`;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  const lineHeight = fontSize * 1.2;
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
};

export const renderCertificateFields = (
  ctx: CanvasRenderingContext2D,
  data: CertificateRenderData,
  designSettings: TemplateDesignSettings,
  canvasWidth: number,
  canvasHeight: number
) => {
  const colors = designSettings.colors || ({} as TemplateDesignSettings['colors']);
  const fontSizes = designSettings.font_sizes || ({} as TemplateDesignSettings['font_sizes']);
  const layout = designSettings.layout || ({} as TemplateDesignSettings['layout']);
  const fonts = designSettings.fonts || { body: 'sans_serif', name: 'sans_serif', title: 'sans_serif' };
  const fontScale = getFontScale(canvasWidth, canvasHeight);
  const nameFont = getFontFamily(fonts.name);
  const titleFont = getFontFamily(fonts.title);
  const bodyFont = getFontFamily(fonts.body);
  const institutionName = data.organization || '';

  const namePos = calculatePosition(layout.name_position, canvasWidth, canvasHeight);
  if (namePos) {
    ctx.fillStyle = colors.name || colors.text;
    ctx.font = `600 ${Math.round((fontSizes.name || 18) * fontScale)}px ${nameFont}`;
    ctx.textAlign = namePos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(data.fullname, namePos.x, namePos.y);
  }

  const datePos = calculatePosition(layout.date_position, canvasWidth, canvasHeight);
  if (datePos) {
    ctx.fillStyle = colors.date || colors.secondary;
    ctx.font = `500 ${Math.round((fontSizes.date || 14) * fontScale)}px ${bodyFont}`;
    ctx.textAlign = datePos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(formatCertificateDate(data.issuedate, data.language), datePos.x, datePos.y);
  }

  const titlePos = calculatePosition(layout.title_position, canvasWidth, canvasHeight);
  if (titlePos) {
    ctx.fillStyle = colors.title || colors.primary;
    ctx.font = `600 ${Math.round((fontSizes.title || 24) * fontScale)}px ${titleFont}`;
    ctx.textAlign = titlePos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(data.certificate_title || '', titlePos.x, titlePos.y);
  }

  const institutionPos = calculatePosition(layout.institution_position, canvasWidth, canvasHeight);
  if (institutionPos && institutionName) {
    ctx.fillStyle = colors.institution || colors.text;
    ctx.font = `500 ${Math.round((fontSizes.institution || 14) * fontScale)}px ${bodyFont}`;
    ctx.textAlign = institutionPos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(institutionName, institutionPos.x, institutionPos.y);
  }

  const certNoPos = calculatePosition(layout.certificate_no_position, canvasWidth, canvasHeight);
  if (certNoPos && data.certificatenumber) {
    const label =
      (data.certificate_number_label || '').trim() ||
      (data.language === 'en' || data.language === 'global' ? 'Certificate No' : 'Sertifika No');
    const certNoText = `${label}: ${data.certificatenumber}`;
    ctx.fillStyle = colors.certificate_no || colors.secondary;
    ctx.font = `500 ${Math.round((fontSizes.certificate_no || 14) * fontScale)}px ${bodyFont}`;
    ctx.textAlign = certNoPos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(certNoText, certNoPos.x, certNoPos.y);
  }

  const descriptionPos = calculatePosition(layout.description_position, canvasWidth, canvasHeight);
  if (descriptionPos) {
    const descriptionText =
      data.description || data.completion_text || 'Bu sertifika başarılı tamamlamayı belirtir.';
    const descriptionFontSize = Math.round(
      (fontSizes.description || fontSizes.institution || 14) * fontScale
    );

    ctx.fillStyle = colors.description || colors.text;
    ctx.font = `400 ${descriptionFontSize}px ${bodyFont}`;
    ctx.textAlign = descriptionPos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    drawMultilineText(
      ctx,
      descriptionText,
      descriptionPos.x,
      descriptionPos.y,
      canvasWidth * 0.78,
      descriptionFontSize
    );
  }

  const courseNamePos = calculatePosition(layout.course_name_position, canvasWidth, canvasHeight);
  if (courseNamePos && data.coursename) {
    const courseNameFontSize = Math.round((fontSizes.course_name || fontSizes.title || 18) * fontScale);

    ctx.fillStyle = colors.course_name || colors.text;
    ctx.font = `600 ${courseNameFontSize}px ${titleFont}`;
    ctx.textAlign = courseNamePos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    drawMultilineText(
      ctx,
      data.coursename,
      courseNamePos.x,
      courseNamePos.y,
      canvasWidth * 0.6,
      courseNameFontSize
    );
  }

  const signaturePos = calculatePosition(layout.signature_position, canvasWidth, canvasHeight);
  if (signaturePos && data.instructor) {
    ctx.fillStyle = colors.signature || colors.text;
    ctx.font = `500 ${Math.round((fontSizes.signature || 14) * fontScale)}px ${bodyFont}`;
    ctx.textAlign = signaturePos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(data.instructor, signaturePos.x, signaturePos.y);
  }
};

export const loadBackgroundImage = async (imageUrl: string): Promise<HTMLImageElement> => {
  if (typeof window === 'undefined') {
    throw new Error('Browser environment gerekli');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Arka plan resmi yüklenemedi: ${imageUrl}`));
    img.src = imageUrl;
  });
};
