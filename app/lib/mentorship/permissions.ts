export const MENTORSHIP_MODULE_KEY = 'mentorship';

const LEGACY_KEYS = ['mentorluk', 'mentorships', 'mentor'] as const;

export const MENTORSHIP_CAPABILITIES = [
  'edit',
  'applications',
  'access',
] as const;

export type MentorshipCapability = (typeof MENTORSHIP_CAPABILITIES)[number];

export const MENTORSHIP_CAPABILITY_LABELS: Record<
  MentorshipCapability,
  { tr: string; en: string }
> = {
  edit: {
    tr: 'Duyuru düzenleme (oluştur / yayınla)',
    en: 'Edit announcements (create / publish)',
  },
  applications: {
    tr: 'Başvurular (liste / durum)',
    en: 'Applications (list / status)',
  },
  access: {
    tr: 'Yetkilendirme yönetimi',
    en: 'Access management',
  },
};

export function isMentorshipCapability(
  value: unknown
): value is MentorshipCapability {
  return (
    typeof value === 'string' &&
    (MENTORSHIP_CAPABILITIES as readonly string[]).includes(value)
  );
}

export function hasMentorshipAccess(
  moduleKeys: string[],
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  return moduleKeys.some(
    (key) =>
      key === MENTORSHIP_MODULE_KEY ||
      (LEGACY_KEYS as readonly string[]).includes(key)
  );
}

export function hasMentorshipCapability(
  capabilities: MentorshipCapability[] | null | undefined,
  required: MentorshipCapability,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  if (capabilities == null || capabilities.length === 0) return true;
  return capabilities.includes(required);
}
