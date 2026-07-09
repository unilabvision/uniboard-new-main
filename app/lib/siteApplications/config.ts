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

/** Maksimum ek dosya boyutu (50 MB) */
export const SITE_APPLICATION_MAX_FILE_BYTES = 50 * 1024 * 1024;

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
