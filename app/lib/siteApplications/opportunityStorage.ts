import {
  EVENT_IMAGE_MAX_BYTES,
  EVENT_IMAGE_MIME_TYPES,
  EVENT_STORAGE_BUCKET,
} from '@/app/lib/events/config';

export const OPPORTUNITY_STORAGE_FOLDER = 'opportunities';
export const OPPORTUNITY_BANNER_WIDTH = 1920;
export const OPPORTUNITY_BANNER_HEIGHT = 600;
export const OPPORTUNITY_BANNER_ASPECT_CLASS = 'aspect-[1920/600]';
export const OPPORTUNITY_IMAGE_MAX_BYTES = EVENT_IMAGE_MAX_BYTES;
export const OPPORTUNITY_IMAGE_MIME_TYPES = EVENT_IMAGE_MIME_TYPES;
export const OPPORTUNITY_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_OPPORTUNITIES_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_EVENTS_STORAGE_BUCKET ||
  EVENT_STORAGE_BUCKET;

export function formatOpportunityImageSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function sanitizeOpportunityImageName(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return base.slice(0, 120) || 'image';
}

export function validateOpportunityImageFile(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (!file.size || file.size <= 0) return 'Dosya boş olamaz.';
  if (file.size > OPPORTUNITY_IMAGE_MAX_BYTES) {
    return `Dosya boyutu en fazla ${formatOpportunityImageSize(OPPORTUNITY_IMAGE_MAX_BYTES)} olabilir.`;
  }
  const mime = (file.type || '').toLowerCase();
  if (
    mime &&
    !(OPPORTUNITY_IMAGE_MIME_TYPES as readonly string[]).includes(mime) &&
    !mime.startsWith('image/')
  ) {
    return 'Sadece görsel dosyaları (JPEG, PNG, WebP, GIF) yüklenebilir.';
  }
  return null;
}

export function buildOpportunityImageStoragePath(
  fileName: string,
  opportunitySlug?: string | null
): { bucket: string; objectPath: string } {
  const safeName = sanitizeOpportunityImageName(fileName);
  const safeSlug =
    (opportunitySlug || 'draft').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'draft';
  const ext = safeName.includes('.')
    ? safeName.split('.').pop()?.toLowerCase() || 'jpg'
    : 'jpg';
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const objectPath = `${OPPORTUNITY_STORAGE_FOLDER}/banner/${safeSlug}/${stamp}.${ext}`;
  return {
    bucket: OPPORTUNITY_STORAGE_BUCKET,
    objectPath,
  };
}
