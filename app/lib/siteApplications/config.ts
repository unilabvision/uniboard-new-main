import { getMyuniPublicOrigin } from '@/app/lib/siteApplications/publicUrls';

export const siteApplicationsDb = {
  applications: 'myuni_site_applications',
  statusHistory: 'myuni_site_application_status_history',
  forms: 'myuni_site_application_forms',
  formFields: 'myuni_site_application_form_fields',
} as const;

export type SiteApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'rejected';

export const SITE_APPLICATION_STATUSES: SiteApplicationStatus[] = [
  'pending',
  'under_review',
  'accepted',
  'rejected',
];

export function isEventSiteApplication(app: {
  source?: string | null;
  event_id?: string | null;
  event_name?: string | null;
  submission_data?: Record<string, unknown> | null;
}): boolean {
  if (app.source === 'event_website') return true;
  if (app.event_id) return true;
  if (typeof app.event_name === 'string' && app.event_name.trim()) return true;
  const tier = app.submission_data?.registration_tier;
  if (tier === 'free' || tier === 'certificate') return true;
  return false;
}

/** PostgREST filter fragments for list/stats queries */
export const eventApplicationOrFilter =
  'source.eq.event_website,event_id.not.is.null,event_name.not.is.null';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyTeamApplicationsFilter(query: any) {
  // Ekip = website kaynağı + etkinlik bağlı değil + isim alanı boş
  return query.eq('source', 'website').is('event_id', null).is('event_name', null);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyEventApplicationsFilter(query: any) {
  return query.or(eventApplicationOrFilter);
}

export function getAllowedStatusesForApplication(app: {
  source?: string | null;
}): SiteApplicationStatus[] {
  if (isEventSiteApplication(app)) {
    return ['pending', 'accepted', 'rejected'];
  }
  return SITE_APPLICATION_STATUSES;
}

/** Maksimum ek dosya boyutu — etkinlik formları (50 MB) */
export const SITE_APPLICATION_MAX_FILE_BYTES = 50 * 1024 * 1024;

/**
 * Ekip başvuru formları için daha düşük limit (DB / storage).
 * Field-level `file` + form attachment için geçerlidir.
 */
export const TEAM_APPLICATION_MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Dosyaların saklama süresi (gün) */
export const SITE_APPLICATION_FILE_RETENTION_DAYS = 20;

export const SITE_APPLICATION_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SITE_APPLICATIONS_BUCKET ||
  process.env.NEXT_PUBLIC_INTERNSHIP_CV_BUCKET ||
  'myunilab';

export const SITE_APPLICATION_STORAGE_FOLDER = 'site-applications';

/** Public form URL prefix per locale */
export const SITE_APPLICATION_PUBLIC_PATH = {
  tr: 'basvuru',
  en: 'application',
} as const;

export function getSiteApplicationPublicPath(locale: string, slug: string): string {
  const prefix =
    SITE_APPLICATION_PUBLIC_PATH[locale as keyof typeof SITE_APPLICATION_PUBLIC_PATH] ||
    SITE_APPLICATION_PUBLIC_PATH.tr;
  return `/${locale}/${prefix}/${slug}`;
}

export function getEventApplicationPath(locale: string, eventSlug: string): string {
  const segment = locale === 'en' ? 'event' : 'etkinlik';
  return `/${locale}/${segment}/${eventSlug}/basvuru`;
}

/** Absolute myunilab.net URL for admin “open form” / external consumers */
export function toAbsoluteMyuniUrl(path: string): string {
  const origin = getMyuniPublicOrigin();
  if (!path) return origin;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${normalized}`;
}

export function getAbsoluteSiteApplicationPublicPath(locale: string, slug: string): string {
  return toAbsoluteMyuniUrl(getSiteApplicationPublicPath(locale, slug));
}

export function getAbsoluteEventApplicationPath(locale: string, eventSlug: string): string {
  return toAbsoluteMyuniUrl(getEventApplicationPath(locale, eventSlug));
}

export function slugifyFormValue(value: string): string {
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

/** @deprecated Use inferFormType + getTeamFormPublicPath from formTypes.ts */
export const TEAM_FORM_SLUGS = new Set(['ekip-basvuru', 'team-application']);
