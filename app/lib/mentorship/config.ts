import { getMyuniPublicOrigin } from '@/app/lib/siteApplications/publicUrls';

/**
 * Mentörlük tabloları — public.mentorships* (sql/mentorships.sql)
 */
export const mentorshipDb = {
  mentorships: 'mentorships',
  applications: 'mentorship_applications',
  statusHistory: 'mentorship_application_status_history',
} as const;

export const PUBLIC_SITE_BASE = getMyuniPublicOrigin();

export const MENTORSHIP_TYPES = [
  'general',
  'career',
  'academic',
  'technical',
  'entrepreneurship',
] as const;

export const MENTORSHIP_MODES = ['online', 'hybrid', 'onsite'] as const;

export const MENTORSHIP_APPLICATION_STATUSES = [
  'pending',
  'under_review',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export const MENTORSHIP_BANNER_WIDTH = 1920;
export const MENTORSHIP_BANNER_HEIGHT = 600;
export const MENTORSHIP_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_MENTORSHIP_STORAGE_BUCKET || 'myunilab';
export const MENTORSHIP_STORAGE_FOLDER = 'mentorships';
export const MENTORSHIP_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const MENTORSHIP_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

/** myunilab.net — /tr/mentorluk/{slug} */
export function getPublicMentorshipPath(locale: string, slug: string): string {
  const segment = locale === 'en' ? 'mentorship' : 'mentorluk';
  return `/${locale}/${segment}/${slug}`;
}

export function getPublicMentorshipUrl(locale: string, slug: string): string {
  return `${PUBLIC_SITE_BASE}${getPublicMentorshipPath(locale, slug)}`;
}

export function getPublicMentorshipListPath(locale: string): string {
  const segment = locale === 'en' ? 'mentorship' : 'mentorluk';
  return `/${locale}/${segment}`;
}

export function getPublicMentorshipListUrl(locale: string): string {
  return `${PUBLIC_SITE_BASE}${getPublicMentorshipListPath(locale)}`;
}

export function getPublicMentorshipApplicationPath(
  locale: string,
  slug: string
): string {
  const segment = locale === 'en' ? 'mentorship' : 'mentorluk';
  return `/${locale}/${segment}/${slug}/basvuru`;
}

export function getPublicMentorshipApplicationUrl(
  locale: string,
  slug: string
): string {
  return `${PUBLIC_SITE_BASE}${getPublicMentorshipApplicationPath(locale, slug)}`;
}

export function slugifyMentorshipTitle(value: string): string {
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

export function getLocalizedJson(
  value: unknown,
  locale: string,
  fallback = ''
): string {
  if (typeof value === 'string') return value.trim() || fallback;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, string>;
    const lang = locale === 'en' ? 'en' : 'tr';
    return (obj[lang] || obj.tr || obj.en || Object.values(obj).find(Boolean) || fallback).trim();
  }
  return fallback;
}
