/** Maillerde / dış linklerde localhost veya vercel preview kullanma */

export const DEFAULT_MYUNI_PUBLIC_ORIGIN = 'https://myunilab.net';

function normalizeOrigin(raw: string): string {
  return raw.trim().replace(/\/$/, '');
}

function isUnsafePublicOrigin(value: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0|vercel\.app|vercel\.com/i.test(value);
}

/**
 * Checkout / public site linkleri.
 * Kanonik env: NEXT_PUBLIC_BASE_URL (prod'da https://myunilab.net).
 * Localhost/vercel gelirse atlanır → myunilab.net.
 */
export function getMyuniPublicOrigin(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_MYUNI_BASE_URL,
  ];

  for (const raw of candidates) {
    if (!raw?.trim()) continue;
    const value = normalizeOrigin(raw);
    if (isUnsafePublicOrigin(value)) continue;
    return value.startsWith('http') ? value : `https://${value}`;
  }

  return DEFAULT_MYUNI_PUBLIC_ORIGIN;
}

export function buildEventCertificateCheckoutUrl(
  locale: string,
  applicationId: string,
  eventSlug?: string | null
): string {
  const base = getMyuniPublicOrigin();
  const safeLocale = locale === 'en' ? 'en' : 'tr';
  const qs = new URLSearchParams({ applicationId });
  if (eventSlug) qs.set('eventSlug', eventSlug);
  return `${base}/${safeLocale}/checkout/event-application?${qs.toString()}`;
}
