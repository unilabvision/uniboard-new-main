import {
  EVENT_IMAGE_MAX_BYTES,
  EVENT_IMAGE_MIME_TYPES,
  EVENT_STORAGE_BUCKET,
} from '@/app/lib/events/config';

export type CourseImageKind = 'banner' | 'thumbnail';

/** myunilab.net kurs detay banner ölçüsü (CourseMainContent). */
export const COURSE_BANNER_WIDTH = 1920;
export const COURSE_BANNER_HEIGHT = 600;
export const COURSE_BANNER_ASPECT_CLASS = 'aspect-[1920/600]';

/** Liste / kart kapak görseli. */
export const COURSE_THUMBNAIL_WIDTH = 800;
export const COURSE_THUMBNAIL_HEIGHT = 450;
export const COURSE_THUMBNAIL_ASPECT_CLASS = 'aspect-[16/9]';

export const COURSE_IMAGE_MAX_BYTES = EVENT_IMAGE_MAX_BYTES;
export const COURSE_IMAGE_MIME_TYPES = EVENT_IMAGE_MIME_TYPES;
export const COURSE_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_COURSES_STORAGE_BUCKET ||
  process.env.NEXT_PUBLIC_EVENTS_STORAGE_BUCKET ||
  EVENT_STORAGE_BUCKET;
export const COURSE_STORAGE_FOLDER = 'courses';

export function formatCourseImageSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function sanitizeCourseImageName(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return base.slice(0, 120) || 'image';
}

export function validateCourseImageFile(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (!file.size || file.size <= 0) return 'Dosya boş olamaz.';
  if (file.size > COURSE_IMAGE_MAX_BYTES) {
    return `Dosya boyutu en fazla ${formatCourseImageSize(COURSE_IMAGE_MAX_BYTES)} olabilir.`;
  }
  const mime = (file.type || '').toLowerCase();
  if (
    mime &&
    !(COURSE_IMAGE_MIME_TYPES as readonly string[]).includes(mime) &&
    !mime.startsWith('image/')
  ) {
    return 'Sadece görsel dosyaları (JPEG, PNG, WebP, GIF) yüklenebilir.';
  }
  return null;
}

export function buildCourseImageStoragePath(
  kind: CourseImageKind,
  fileName: string,
  courseSlug?: string | null
): { bucket: string; objectPath: string } {
  const safeName = sanitizeCourseImageName(fileName);
  const safeSlug =
    (courseSlug || 'draft').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'draft';
  const ext = safeName.includes('.')
    ? safeName.split('.').pop()?.toLowerCase() || 'jpg'
    : 'jpg';
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const folder = kind === 'thumbnail' ? 'thumbnail' : 'banner';
  const objectPath = `${COURSE_STORAGE_FOLDER}/${folder}/${safeSlug}/${stamp}.${ext}`;
  return {
    bucket: COURSE_STORAGE_BUCKET,
    objectPath,
  };
}
