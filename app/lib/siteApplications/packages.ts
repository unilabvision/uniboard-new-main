export type RegistrationPackageId = 'free' | 'certificate';

export interface EventCertificatePackageSettings {
  certificate_enabled: boolean;
  certificate_price: number | null;
  certificate_currency: string;
  certificate_title_tr: string;
  certificate_title_en: string;
  certificate_description_tr: string;
  certificate_description_en: string;
}

export interface PublicRegistrationPackage {
  id: RegistrationPackageId;
  title: string;
  description: string;
  price: number;
  currency: string;
  is_default?: boolean;
  badge?: string | null;
}

export const DEFAULT_PACKAGE_SETTINGS: EventCertificatePackageSettings = {
  certificate_enabled: false,
  certificate_price: null,
  certificate_currency: 'TRY',
  certificate_title_tr: 'Sertifika Paketi',
  certificate_title_en: 'Certificate Package',
  certificate_description_tr: 'Etkinlik sonunda resmi katılım sertifikası alın.',
  certificate_description_en: 'Receive an official participation certificate after the event.',
};

export function normalizePackageSettings(raw: unknown): EventCertificatePackageSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PACKAGE_SETTINGS };
  }
  const row = raw as Record<string, unknown>;
  const priceRaw = row.certificate_price;
  const price =
    priceRaw === null || priceRaw === undefined || priceRaw === ''
      ? null
      : Number(priceRaw);

  return {
    certificate_enabled: Boolean(row.certificate_enabled),
    certificate_price: Number.isFinite(price) ? price : null,
    certificate_currency: String(row.certificate_currency || 'TRY').trim() || 'TRY',
    certificate_title_tr:
      String(row.certificate_title_tr || DEFAULT_PACKAGE_SETTINGS.certificate_title_tr).trim() ||
      DEFAULT_PACKAGE_SETTINGS.certificate_title_tr,
    certificate_title_en:
      String(row.certificate_title_en || DEFAULT_PACKAGE_SETTINGS.certificate_title_en).trim() ||
      DEFAULT_PACKAGE_SETTINGS.certificate_title_en,
    certificate_description_tr:
      String(row.certificate_description_tr || DEFAULT_PACKAGE_SETTINGS.certificate_description_tr).trim() ||
      DEFAULT_PACKAGE_SETTINGS.certificate_description_tr,
    certificate_description_en:
      String(row.certificate_description_en || DEFAULT_PACKAGE_SETTINGS.certificate_description_en).trim() ||
      DEFAULT_PACKAGE_SETTINGS.certificate_description_en,
  };
}

export function parsePackageSettingsFromForm(form: {
  package_settings?: unknown;
}): EventCertificatePackageSettings {
  return normalizePackageSettings(form.package_settings);
}

export function validatePackageSettings(
  settings: EventCertificatePackageSettings,
  options?: { requireEvent?: boolean }
): string | null {
  if (!settings.certificate_enabled) return null;
  if (options?.requireEvent === false) return null;
  if (settings.certificate_price === null || settings.certificate_price < 0) {
    return 'Sertifika paketi aktifken geçerli bir fiyat girin.';
  }
  return null;
}

export function toPublicPackages(
  settings: EventCertificatePackageSettings,
  locale: string
): PublicRegistrationPackage[] {
  const isEn = locale === 'en';
  const currency = settings.certificate_currency || 'TRY';

  const freePackage: PublicRegistrationPackage = {
    id: 'free',
    title: isEn ? 'Free registration' : 'Ücretsiz kayıt',
    description: isEn
      ? 'Register for the event at no cost.'
      : 'Etkinliğe ücretsiz kayıt olun.',
    price: 0,
    currency,
    is_default: true,
    badge: isEn ? 'Free' : 'Ücretsiz',
  };

  if (!settings.certificate_enabled) {
    return [freePackage];
  }

  const certificatePackage: PublicRegistrationPackage = {
    id: 'certificate',
    title: isEn ? settings.certificate_title_en : settings.certificate_title_tr,
    description: isEn
      ? settings.certificate_description_en
      : settings.certificate_description_tr,
    price: settings.certificate_price ?? 0,
    currency,
    badge: isEn ? 'Certificate' : 'Sertifika',
  };

  return [freePackage, certificatePackage];
}

export function formatPackagePrice(price: number, currency: string, locale: string): string {
  if (price <= 0) {
    return locale === 'en' ? 'Free' : 'Ücretsiz';
  }
  try {
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
      style: 'currency',
      currency: currency || 'TRY',
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

export function getSelectedPackageFromSubmission(
  packages: PublicRegistrationPackage[],
  tier: unknown
): PublicRegistrationPackage {
  const id = tier === 'certificate' ? 'certificate' : 'free';
  return packages.find((pkg) => pkg.id === id) ?? packages[0];
}
