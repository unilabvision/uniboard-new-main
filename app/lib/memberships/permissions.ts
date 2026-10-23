export const MEMBERSHIPS_MODULE_KEY = 'memberships';

export const MEMBERSHIPS_CAPABILITIES = [
  'view',
  'edit',
  'publish',
  'passes',
  'audit',
] as const;

export type MembershipsCapability = (typeof MEMBERSHIPS_CAPABILITIES)[number];

export const MEMBERSHIPS_CAPABILITY_LABELS: Record<
  MembershipsCapability,
  { tr: string; en: string }
> = {
  view: { tr: 'Paketleri görüntüleme', en: 'View plans' },
  edit: { tr: 'Taslak ve fiyat düzenleme', en: 'Edit drafts and prices' },
  publish: { tr: 'MyUNI üzerinde yayınlama', en: 'Publish on MyUNI' },
  passes: { tr: 'Üyelik haklarını görüntüleme', en: 'View membership passes' },
  audit: { tr: 'İşlem geçmişini görüntüleme', en: 'View audit history' },
};

export function hasMembershipsAccess(moduleKeys: string[], isSuperAdmin: boolean) {
  return isSuperAdmin || moduleKeys.includes(MEMBERSHIPS_MODULE_KEY);
}
