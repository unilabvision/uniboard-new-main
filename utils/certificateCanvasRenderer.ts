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
    description?: string;
    institution?: string;
    certificate_no?: string;
    date?: string;
    signature?: string;
    course_name?: string;
    duration?: string;
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
    duration: string;
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
    duration_position: PositionConfig;
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
    duration: number;
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
  duration?: string;
}

const REFERENCE_WIDTH = 1700;
const REFERENCE_HEIGHT = 1200;

const DEFAULT_POSITION = (x: number, y: number, align: PositionConfig['align'] = 'center'): PositionConfig => ({
  x,
  y,
  align,
  enabled: true,
  x_manual: x,
  y_manual: y,
});

export const DEFAULT_DESIGN_SETTINGS: TemplateDesignSettings = {
  fonts: {
    body: 'sans_serif',
    name: 'sans_serif',
    title: 'serif',
    description: 'sans_serif',
    institution: 'sans_serif',
    certificate_no: 'sans_serif',
    date: 'sans_serif',
    signature: 'sans_serif',
    course_name: 'sans_serif',
    duration: 'sans_serif',
  },
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
    course_name: '#333333',
    duration: '#666666',
  },
  font_sizes: {
    title: 48,
    name: 42,
    description: 28,
    institution: 24,
    certificate_no: 20,
    date: 24,
    signature: 24,
    course_name: 36,
    duration: 20,
  },
  layout: {
    // Merkez: başlık / isim / kurs / açıklama
    title_position: DEFAULT_POSITION(50, 18),
    name_position: DEFAULT_POSITION(50, 38),
    course_name_position: DEFAULT_POSITION(50, 46),
    description_position: DEFAULT_POSITION(50, 56),
    // Sol meta (şablon görselindeki Sertifika No / Tarih / Süre etiketlerinin değeri)
    institution_position: { ...DEFAULT_POSITION(38, 71.5, 'left'), enabled: false },
    certificate_no_position: DEFAULT_POSITION(38, 71.5, 'left'),
    date_position: DEFAULT_POSITION(38, 77.5, 'left'),
    duration_position: DEFAULT_POSITION(38, 83.5, 'left'),
    // Sağ: imza
    signature_position: DEFAULT_POSITION(76, 83.5, 'center'),
  },
};

/** Eski varsayılan (sağda sertifika no + solda dağınık meta) → sol/sağ dengeli yerleşim */
const approxPos = (a: number | undefined, b: number, tol = 2.5) =>
  typeof a === 'number' && Math.abs(a - b) <= tol;

export const isLegacyScatteredMetaLayout = (
  layout: Partial<TemplateDesignSettings['layout']> | null | undefined
): boolean => {
  if (!layout) return false;
  const cert = layout.certificate_no_position;
  const date = layout.date_position;
  const duration = layout.duration_position;
  const institution = layout.institution_position;
  const signature = layout.signature_position;

  const certOnRight =
    approxPos(cert?.x ?? cert?.x_manual, 70) ||
    approxPos(cert?.x ?? cert?.x_manual, 85) ||
    approxPos(cert?.x ?? cert?.x_manual, 90);
  const dateOnFarLeft =
    approxPos(date?.x ?? date?.x_manual, 20) || approxPos(date?.x ?? date?.x_manual, 8.9);
  const durationLegacy =
    !duration ||
    approxPos(duration?.x ?? duration?.x_manual, 20) ||
    approxPos(duration?.x ?? duration?.x_manual, 8.9);
  const institutionLegacy =
    !institution ||
    approxPos(institution?.x ?? institution?.x_manual, 30) ||
    approxPos(institution?.x ?? institution?.x_manual, 23.5);
  const signatureRightish =
    !signature ||
    approxPos(signature?.x ?? signature?.x_manual, 80) ||
    approxPos(signature?.x ?? signature?.x_manual, 70);

  return Boolean(certOnRight && dateOnFarLeft && durationLegacy && institutionLegacy && signatureRightish);
};

export const balancedMetaLayout = (): Pick<
  TemplateDesignSettings['layout'],
  | 'institution_position'
  | 'certificate_no_position'
  | 'date_position'
  | 'duration_position'
  | 'signature_position'
> => ({
  institution_position: { ...DEFAULT_DESIGN_SETTINGS.layout.institution_position },
  certificate_no_position: { ...DEFAULT_DESIGN_SETTINGS.layout.certificate_no_position },
  date_position: { ...DEFAULT_DESIGN_SETTINGS.layout.date_position },
  duration_position: { ...DEFAULT_DESIGN_SETTINGS.layout.duration_position },
  signature_position: { ...DEFAULT_DESIGN_SETTINGS.layout.signature_position },
});

function asFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizePosition(
  raw: Partial<PositionConfig> | null | undefined,
  fallback: PositionConfig
): PositionConfig {
  if (!raw || typeof raw !== 'object') return { ...fallback };
  const x = asFiniteNumber(raw.x, fallback.x);
  const y = asFiniteNumber(raw.y, fallback.y);
  const xManual = asFiniteNumber(raw.x_manual, x);
  const yManual = asFiniteNumber(raw.y_manual, y);
  return {
    x,
    y,
    x_manual: xManual,
    y_manual: yManual,
    align: raw.align === 'left' || raw.align === 'right' || raw.align === 'center' ? raw.align : fallback.align,
    enabled: raw.enabled !== false,
  };
}

/** Eksik/eski şablon ayarlarını güvenli varsayılanlarla birleştir — katılım ayarlarını değiştirmez. */
export const normalizeDesignSettings = (
  partial: Partial<TemplateDesignSettings> | null | undefined
): TemplateDesignSettings => {
  const fonts = { ...DEFAULT_DESIGN_SETTINGS.fonts, ...(partial?.fonts || {}) };
  const colors = { ...DEFAULT_DESIGN_SETTINGS.colors, ...(partial?.colors || {}) };
  const font_sizes = { ...DEFAULT_DESIGN_SETTINGS.font_sizes, ...(partial?.font_sizes || {}) };
  const layoutSrc = partial?.layout || ({} as TemplateDesignSettings['layout']);
  const legacyMeta = isLegacyScatteredMetaLayout(layoutSrc);
  const balanced = balancedMetaLayout();

  return {
    fonts,
    colors,
    font_sizes,
    layout: {
      title_position: layoutSrc.title_position
        ? normalizePosition(layoutSrc.title_position, DEFAULT_DESIGN_SETTINGS.layout.title_position)
        : { ...DEFAULT_DESIGN_SETTINGS.layout.title_position, enabled: false },
      name_position: layoutSrc.name_position
        ? normalizePosition(layoutSrc.name_position, DEFAULT_DESIGN_SETTINGS.layout.name_position)
        : { ...DEFAULT_DESIGN_SETTINGS.layout.name_position, enabled: false },
      description_position: layoutSrc.description_position
        ? normalizePosition(
            layoutSrc.description_position,
            DEFAULT_DESIGN_SETTINGS.layout.description_position
          )
        : { ...DEFAULT_DESIGN_SETTINGS.layout.description_position, enabled: false },
      institution_position: legacyMeta
        ? { ...balanced.institution_position }
        : layoutSrc.institution_position
          ? normalizePosition(
              layoutSrc.institution_position,
              DEFAULT_DESIGN_SETTINGS.layout.institution_position
            )
          : { ...DEFAULT_DESIGN_SETTINGS.layout.institution_position, enabled: false },
      certificate_no_position: legacyMeta
        ? { ...balanced.certificate_no_position }
        : layoutSrc.certificate_no_position
          ? normalizePosition(
              layoutSrc.certificate_no_position,
              DEFAULT_DESIGN_SETTINGS.layout.certificate_no_position
            )
          : { ...DEFAULT_DESIGN_SETTINGS.layout.certificate_no_position, enabled: false },
      date_position: legacyMeta
        ? { ...balanced.date_position }
        : layoutSrc.date_position
          ? normalizePosition(layoutSrc.date_position, DEFAULT_DESIGN_SETTINGS.layout.date_position)
          : { ...DEFAULT_DESIGN_SETTINGS.layout.date_position, enabled: false },
      signature_position: legacyMeta
        ? { ...balanced.signature_position }
        : layoutSrc.signature_position
          ? normalizePosition(
              layoutSrc.signature_position,
              DEFAULT_DESIGN_SETTINGS.layout.signature_position
            )
          : { ...DEFAULT_DESIGN_SETTINGS.layout.signature_position, enabled: false },
      course_name_position: layoutSrc.course_name_position
        ? normalizePosition(
            layoutSrc.course_name_position,
            DEFAULT_DESIGN_SETTINGS.layout.course_name_position
          )
        : { ...DEFAULT_DESIGN_SETTINGS.layout.course_name_position, enabled: false },
      duration_position: legacyMeta || !layoutSrc.duration_position
        ? {
            ...balanced.duration_position,
            enabled: layoutSrc.duration_position?.enabled !== false,
          }
        : normalizePosition(
            layoutSrc.duration_position,
            DEFAULT_DESIGN_SETTINGS.layout.duration_position
          ),
    },
  };
};

export const parseDesignSettings = (
  designSettings: unknown
): TemplateDesignSettings => {
  let parsed: Partial<TemplateDesignSettings> | null = null;

  if (typeof designSettings === 'object' && designSettings !== null) {
    parsed = designSettings as Partial<TemplateDesignSettings>;
  } else if (typeof designSettings === 'string') {
    const trimmed = designSettings.trim();
    if (!trimmed) {
      return { ...DEFAULT_DESIGN_SETTINGS, layout: { ...DEFAULT_DESIGN_SETTINGS.layout } };
    }
    try {
      parsed = JSON.parse(trimmed) as Partial<TemplateDesignSettings>;
    } catch {
      return { ...DEFAULT_DESIGN_SETTINGS, layout: { ...DEFAULT_DESIGN_SETTINGS.layout } };
    }
  } else {
    return { ...DEFAULT_DESIGN_SETTINGS, layout: { ...DEFAULT_DESIGN_SETTINGS.layout } };
  }

  return normalizeDesignSettings(parsed);
};

export const getFontFamily = (fontType: string): string => {
  const fontMap: Record<string, string> = {
    sans_serif: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    monospace: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    cursive:
      '"Brush Script MT", "Segoe Script", "Apple Chancery", "Snell Roundhand", cursive',
    fantasy: '"Copperplate", "Papyrus", "Impact", fantasy',
  };

  if (fontType === 'custom') return fontMap.sans_serif;

  return fontMap[fontType] || fontType || fontMap.sans_serif;
};

export const calculatePosition = (
  config: PositionConfig | undefined,
  canvasWidth: number,
  canvasHeight: number
) => {
  if (!config || config.enabled === false) {
    return null;
  }

  const manualX =
    typeof config.x_manual === 'number' && Number.isFinite(config.x_manual)
      ? config.x_manual
      : undefined;
  const manualY =
    typeof config.y_manual === 'number' && Number.isFinite(config.y_manual)
      ? config.y_manual
      : undefined;

  const x = asFiniteNumber(manualX ?? config.x, 50);
  const y = asFiniteNumber(manualY ?? config.y, 50);

  return {
    x: Math.round((x / 100) * canvasWidth),
    y: Math.round((y / 100) * canvasHeight),
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
  const normalized = normalizeDesignSettings(designSettings);
  const colors = normalized.colors;
  const fontSizes = normalized.font_sizes;
  const layout = normalized.layout;
  const fonts = normalized.fonts;
  const fontScale = getFontScale(canvasWidth, canvasHeight);
  const nameFont = getFontFamily(fonts.name);
  const titleFont = getFontFamily(fonts.title);
  const descriptionFont = getFontFamily(fonts.description || fonts.body);
  const institutionFont = getFontFamily(fonts.institution || fonts.body);
  const certNoFont = getFontFamily(fonts.certificate_no || fonts.body);
  const dateFont = getFontFamily(fonts.date || fonts.body);
  const signatureFont = getFontFamily(fonts.signature || fonts.body);
  const courseNameFont = getFontFamily(fonts.course_name || fonts.title);
  const durationFont = getFontFamily(fonts.duration || fonts.date || fonts.body);
  const institutionName = data.organization || '';

  const maxTextWidth = (
    pos: { x: number; align: string },
    preferredRatio = 0.58
  ) => {
    const margin = canvasWidth * 0.04;
    if (pos.align === 'left') {
      return Math.max(40, Math.min(canvasWidth * preferredRatio, canvasWidth - pos.x - margin));
    }
    if (pos.align === 'right') {
      return Math.max(40, Math.min(canvasWidth * preferredRatio, pos.x - margin));
    }
    return canvasWidth * preferredRatio;
  };

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
    ctx.font = `500 ${Math.round((fontSizes.date || 14) * fontScale)}px ${dateFont}`;
    ctx.textAlign = datePos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(formatCertificateDate(data.issuedate, data.language), datePos.x, datePos.y);
  }

  const durationPos = calculatePosition(layout.duration_position, canvasWidth, canvasHeight);
  const durationValue = String(data.duration || '').trim();
  if (durationPos && durationValue) {
    // Şablon görselinde "Süre :" etiketi varsa sadece değeri çiz (çift etiket olmasın)
    ctx.fillStyle = colors.duration || colors.secondary;
    ctx.font = `500 ${Math.round((fontSizes.duration || fontSizes.date || 14) * fontScale)}px ${durationFont}`;
    ctx.textAlign = durationPos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(durationValue, durationPos.x, durationPos.y);
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
    ctx.font = `500 ${Math.round((fontSizes.institution || 14) * fontScale)}px ${institutionFont}`;
    ctx.textAlign = institutionPos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(institutionName, institutionPos.x, institutionPos.y);
  }

  const certNoPos = calculatePosition(layout.certificate_no_position, canvasWidth, canvasHeight);
  if (certNoPos && data.certificatenumber) {
    // Etiket yalnızca açıkça verilmişse; aksi halde şablon görselindeki "Sertifika No :" ile çakışmaz
    const label = (data.certificate_number_label || '').trim();
    const certNoText = label ? `${label}: ${data.certificatenumber}` : data.certificatenumber;
    ctx.fillStyle = colors.certificate_no || colors.secondary;
    ctx.font = `500 ${Math.round((fontSizes.certificate_no || 14) * fontScale)}px ${certNoFont}`;
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
    ctx.font = `400 ${descriptionFontSize}px ${descriptionFont}`;
    ctx.textAlign = descriptionPos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    drawMultilineText(
      ctx,
      descriptionText,
      descriptionPos.x,
      descriptionPos.y,
      maxTextWidth(descriptionPos, 0.55),
      descriptionFontSize
    );
  }

  const courseNamePos = calculatePosition(layout.course_name_position, canvasWidth, canvasHeight);
  if (courseNamePos && data.coursename) {
    const courseNameFontSize = Math.round((fontSizes.course_name || fontSizes.title || 18) * fontScale);

    ctx.fillStyle = colors.course_name || colors.text;
    ctx.font = `600 ${courseNameFontSize}px ${courseNameFont}`;
    ctx.textAlign = courseNamePos.align as CanvasTextAlign;
    ctx.textBaseline = 'middle';
    drawMultilineText(
      ctx,
      data.coursename,
      courseNamePos.x,
      courseNamePos.y,
      maxTextWidth(courseNamePos, 0.55),
      courseNameFontSize
    );
  }

  const signaturePos = calculatePosition(layout.signature_position, canvasWidth, canvasHeight);
  if (signaturePos && data.instructor) {
    ctx.fillStyle = colors.signature || colors.text;
    ctx.font = `500 ${Math.round((fontSizes.signature || 14) * fontScale)}px ${signatureFont}`;
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
