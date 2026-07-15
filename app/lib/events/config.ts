export const eventsDb = {
  events: 'myuni_events',
} as const;

export const PUBLIC_SITE_BASE =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://myunilab.net';

export const EVENT_TYPES = [
  'workshop',
  'seminar',
  'conference',
  'meetup',
  'webinar',
] as const;

export const EVENT_STATUSES = [
  'upcoming',
  'ongoing',
  'completed',
  'cancelled',
] as const;

/** myunilab.net etkinlik detay banner ölçüsü (Supabase ile aynı olmalı). */
export const EVENT_BANNER_WIDTH = 1920;
export const EVENT_BANNER_HEIGHT = 600;
export const EVENT_BANNER_ASPECT_CLASS = 'aspect-[1920/600]';

/** Liste / kart küçük görseli için önerilen ölçü. */
export const EVENT_THUMBNAIL_WIDTH = 800;
export const EVENT_THUMBNAIL_HEIGHT = 450;

/** Supabase Storage — myunilab bucket altında etkinlik görselleri. */
export const EVENT_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_EVENTS_STORAGE_BUCKET || 'myunilab';
export const EVENT_STORAGE_FOLDER = 'events';
export const EVENT_IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const EVENT_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export function getPublicEventPath(locale: string, slug: string): string {
  const segment = locale === 'en' ? 'event' : 'etkinlik';
  return `/${locale}/${segment}/${slug}`;
}

export function getPublicEventUrl(locale: string, slug: string): string {
  return `${PUBLIC_SITE_BASE}${getPublicEventPath(locale, slug)}`;
}

export function getPublicEventApplicationPath(locale: string, slug: string): string {
  const segment = locale === 'en' ? 'event' : 'etkinlik';
  return `/${locale}/${segment}/${slug}/basvuru`;
}

export function slugifyEventTitle(value: string): string {
  const trMap: Record<string, string> = {
    ç: 'c',
    Ç: 'c',
    ğ: 'g',
    Ğ: 'g',
    ı: 'i',
    İ: 'i',
    ö: 'o',
    Ö: 'o',
    ş: 's',
    Ş: 's',
    ü: 'u',
    Ü: 'u',
  };

  const normalized = value
    .trim()
    .split('')
    .map((ch) => trMap[ch] ?? ch)
    .join('');

  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function parseBooleanField(value: unknown, defaultValue = false): boolean {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  if (value == null) return defaultValue;
  return Boolean(value);
}

function toIsoDateTime(value: string, fieldLabel: string): string {
  if (!value?.trim()) {
    throw new Error(`${fieldLabel} is required`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldLabel}`);
  }
  return date.toISOString();
}

function toIsoDateTimeOptional(value: string): string | null {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export { toIsoDateTime, toIsoDateTimeOptional };
