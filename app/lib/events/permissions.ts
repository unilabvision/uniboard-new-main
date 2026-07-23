export const EVENTS_MODULE_KEY = 'events';

const LEGACY_KEYS = ['etkinlik', 'etkinlikler'] as const;

/** Etkinlik paneli seçilebilir yetenekleri */
export const EVENTS_CAPABILITIES = [
  'edit',
  'registrations',
  'forms',
  'ops',
] as const;

export type EventsCapability = (typeof EVENTS_CAPABILITIES)[number];

export const EVENTS_CAPABILITY_LABELS: Record<
  EventsCapability,
  { tr: string; en: string }
> = {
  edit: {
    tr: 'Etkinlik düzenleme (oluştur / düzenle)',
    en: 'Edit events (create / update)',
  },
  registrations: {
    tr: 'Kayıtlar (liste / detay)',
    en: 'Registrations (list / detail)',
  },
  forms: {
    tr: 'Formlar ve sertifika paketi',
    en: 'Forms and certificate packages',
  },
  ops: {
    tr: 'Operasyon (Excel, hatırlatma, ödeme maili)',
    en: 'Ops (Excel, reminders, payment emails)',
  },
};

export function isEventsCapability(value: unknown): value is EventsCapability {
  return (
    typeof value === 'string' &&
    (EVENTS_CAPABILITIES as readonly string[]).includes(value)
  );
}

/** null/undefined/empty → tam yetki (geriye dönük uyumluluk) */
export function normalizeEventsCapabilities(
  raw: unknown
): EventsCapability[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const filtered = raw.filter(isEventsCapability);
  return filtered.length === 0 ? null : filtered;
}

export function parseEventsCapabilitiesInput(
  raw: unknown
): EventsCapability[] {
  if (!Array.isArray(raw)) {
    return [...EVENTS_CAPABILITIES];
  }
  const filtered = raw.filter(isEventsCapability);
  return filtered.length > 0 ? filtered : [...EVENTS_CAPABILITIES];
}

export function hasEventsAccess(
  moduleKeys: string[],
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  return moduleKeys.some(
    (key) =>
      key === EVENTS_MODULE_KEY ||
      (LEGACY_KEYS as readonly string[]).includes(key)
  );
}

/**
 * Yeteneği kontrol et.
 * - Süper admin: her zaman true
 * - capabilities null/empty (eski satırlar): tam yetki
 */
export function hasEventsCapability(
  capabilities: EventsCapability[] | null | undefined,
  required: EventsCapability,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  if (capabilities == null || capabilities.length === 0) return true;
  return capabilities.includes(required);
}
