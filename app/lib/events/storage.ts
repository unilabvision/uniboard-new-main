import {
  EVENT_IMAGE_MAX_BYTES,
  EVENT_IMAGE_MIME_TYPES,
  EVENT_STORAGE_BUCKET,
  EVENT_STORAGE_FOLDER,
} from './config';

export type EventImageKind = 'thumbnail' | 'banner';

export function formatEventImageSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function sanitizeEventImageName(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return base.slice(0, 120) || 'image';
}

export function validateEventImageFile(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (!file.size || file.size <= 0) return 'Dosya boş olamaz.';
  if (file.size > EVENT_IMAGE_MAX_BYTES) {
    return `Dosya boyutu en fazla ${formatEventImageSize(EVENT_IMAGE_MAX_BYTES)} olabilir.`;
  }
  const mime = (file.type || '').toLowerCase();
  if (
    mime &&
    !(EVENT_IMAGE_MIME_TYPES as readonly string[]).includes(mime) &&
    !mime.startsWith('image/')
  ) {
    return 'Sadece görsel dosyaları (JPEG, PNG, WebP, GIF) yüklenebilir.';
  }
  return null;
}

export function buildEventImageStoragePath(
  kind: EventImageKind,
  fileName: string,
  eventSlug?: string | null
): { bucket: string; objectPath: string } {
  const safeName = sanitizeEventImageName(fileName);
  const safeSlug = (eventSlug || 'draft')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 60) || 'draft';
  const ext = safeName.includes('.')
    ? safeName.split('.').pop()?.toLowerCase() || 'jpg'
    : 'jpg';
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const objectPath = `${EVENT_STORAGE_FOLDER}/${kind}/${safeSlug}/${stamp}.${ext}`;
  return {
    bucket: EVENT_STORAGE_BUCKET,
    objectPath,
  };
}
