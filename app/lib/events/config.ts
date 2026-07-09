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
