export const SITE_APPLICATIONS_MODULE_KEY = 'site-applications';

/** Eski modül anahtarları — geriye dönük uyumluluk */
const LEGACY_MODULE_KEYS = [
  'site_basvurular',
  'site-basvurular',
  'basvurular',
] as const;

export function hasSiteApplicationsAccess(
  moduleKeys: string[],
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  return moduleKeys.some(
    (key) =>
      key === SITE_APPLICATIONS_MODULE_KEY ||
      (LEGACY_MODULE_KEYS as readonly string[]).includes(key)
  );
}
