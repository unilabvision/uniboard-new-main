export const EVENTS_MODULE_KEY = 'events';

const LEGACY_KEYS = ['etkinlik', 'etkinlikler'] as const;

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
