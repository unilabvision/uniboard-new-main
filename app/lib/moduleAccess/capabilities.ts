import { getModuleAccessDefinition } from '@/app/lib/moduleAccess/registry';
import {
  EVENTS_CAPABILITIES,
  EVENTS_CAPABILITY_LABELS,
} from '@/app/lib/events/permissions';

export type ModuleCapabilityDef = {
  key: string;
  labelTr: string;
  labelEn: string;
};

/**
 * Panel yetenekleri — `user_module_access.notes` içinde `uba_caps:[...]` olarak saklanır.
 * Anahtar: registry `primaryModuleKey` (lms → courses).
 */
export const MODULE_CAPABILITIES: Record<string, ModuleCapabilityDef[]> = {
  events: [
    ...EVENTS_CAPABILITIES.map((key) => ({
      key,
      labelTr: EVENTS_CAPABILITY_LABELS[key].tr,
      labelEn: EVENTS_CAPABILITY_LABELS[key].en,
    })),
    {
      key: 'access',
      labelTr: 'Yetkilendirme yönetimi',
      labelEn: 'Access management',
    },
  ],
  'site-applications': [
    {
      key: 'dashboard',
      labelTr: 'Dashboard',
      labelEn: 'Dashboard',
    },
    {
      key: 'applications',
      labelTr: 'Başvurular (liste / durum)',
      labelEn: 'Applications (list / status)',
    },
    {
      key: 'forms',
      labelTr: 'Formlar (takım formları)',
      labelEn: 'Forms (team forms)',
    },
    {
      key: 'access',
      labelTr: 'Yetkilendirme yönetimi',
      labelEn: 'Access management',
    },
  ],
  certificates: [
    {
      key: 'home',
      labelTr: 'Ana sayfa',
      labelEn: 'Home',
    },
    {
      key: 'issuance',
      labelTr: 'Gönderilecekler / sertifika kuyruğu',
      labelEn: 'Issuance queue',
    },
    {
      key: 'create',
      labelTr: 'Yeni sertifika oluştur',
      labelEn: 'Create certificate',
    },
    {
      key: 'templates',
      labelTr: 'Şablonlar',
      labelEn: 'Templates',
    },
    {
      key: 'settings',
      labelTr: 'Organizasyon ayarları',
      labelEn: 'Organization settings',
    },
    {
      key: 'access',
      labelTr: 'Yetkilendirme yönetimi',
      labelEn: 'Access management',
    },
  ],
  internship: [
    {
      key: 'applications',
      labelTr: 'Başvurular',
      labelEn: 'Applications',
    },
    {
      key: 'jobs',
      labelTr: 'Kariyer & fırsatlar',
      labelEn: 'Careers & opportunities',
    },
    {
      key: 'hr',
      labelTr: 'İK özeti',
      labelEn: 'HR overview',
    },
    {
      key: 'matching',
      labelTr: 'AI eşleştirme',
      labelEn: 'AI matching',
    },
    {
      key: 'reviewers',
      labelTr: 'Değerlendirici yönetimi',
      labelEn: 'Reviewer management',
    },
    {
      key: 'stats',
      labelTr: 'İstatistikler',
      labelEn: 'Statistics',
    },
    {
      key: 'settings',
      labelTr: 'Ayarlar',
      labelEn: 'Settings',
    },
    {
      key: 'access',
      labelTr: 'Yetkilendirme yönetimi',
      labelEn: 'Access management',
    },
  ],
  analytics: [
    {
      key: 'overview',
      labelTr: 'Genel bakış',
      labelEn: 'Overview',
    },
    {
      key: 'ledger',
      labelTr: 'Sipariş defteri',
      labelEn: 'Order ledger',
    },
    {
      key: 'sales',
      labelTr: 'Satış özeti',
      labelEn: 'Sales summary',
    },
    {
      key: 'enrollments',
      labelTr: 'Eğitim katılımı',
      labelEn: 'Course enrollments',
    },
    {
      key: 'trends',
      labelTr: 'Trendler',
      labelEn: 'Trends',
    },
    {
      key: 'access',
      labelTr: 'Yetkilendirme yönetimi',
      labelEn: 'Access management',
    },
  ],
  settings: [
    {
      key: 'profile',
      labelTr: 'Profil ayarları',
      labelEn: 'Profile settings',
    },
    {
      key: 'access',
      labelTr: 'Yetkilendirme yönetimi',
      labelEn: 'Access management',
    },
  ],
  influencer: [
    {
      key: 'home',
      labelTr: 'Ana sayfa',
      labelEn: 'Home',
    },
    {
      key: 'codes',
      labelTr: 'Kodlarım',
      labelEn: 'My codes',
    },
    {
      key: 'sales',
      labelTr: 'Satışlarım',
      labelEn: 'My sales',
    },
    {
      key: 'analytics',
      labelTr: 'Performans',
      labelEn: 'Performance',
    },
    {
      key: 'campaigns',
      labelTr: 'Kampanyalarım',
      labelEn: 'My campaigns',
    },
    {
      key: 'docs',
      labelTr: 'Dokümanlarım',
      labelEn: 'My documents',
    },
    {
      key: 'access',
      labelTr: 'Yetkilendirme yönetimi',
      labelEn: 'Access management',
    },
  ],
  /** LMS registry primaryModuleKey */
  courses: [
    {
      key: 'courses',
      labelTr: 'Kurs yönetimi',
      labelEn: 'Course management',
    },
    {
      key: 'create',
      labelTr: 'Kurs oluştur',
      labelEn: 'Create course',
    },
    {
      key: 'progress',
      labelTr: 'İlerleme takibi',
      labelEn: 'Progress tracking',
    },
    {
      key: 'settings',
      labelTr: 'Ayarlar',
      labelEn: 'Settings',
    },
    {
      key: 'access',
      labelTr: 'Yetkilendirme yönetimi',
      labelEn: 'Access management',
    },
  ],
  students: [
    {
      key: 'progress',
      labelTr: 'İlerleme takibi (kurs / öğrenci)',
      labelEn: 'Progress tracking (course / student)',
    },
    {
      key: 'enrollments',
      labelTr: 'Kayıtlar (öğrenci ↔ kurs)',
      labelEn: 'Enrollments (student ↔ course)',
    },
    {
      key: 'my-courses',
      labelTr: 'Öğrenci görünümü (kurslarım)',
      labelEn: 'Learner view (my courses)',
    },
    {
      key: 'access',
      labelTr: 'Yetkilendirme yönetimi',
      labelEn: 'Access management',
    },
  ],
  'lms-2': [
    {
      key: 'home',
      labelTr: 'Ana sayfa',
      labelEn: 'Home',
    },
    {
      key: 'progress',
      labelTr: 'İlerleme takibi',
      labelEn: 'Progress tracking',
    },
    {
      key: 'create',
      labelTr: 'Kurs oluştur',
      labelEn: 'Create course',
    },
    {
      key: 'templates',
      labelTr: 'Kurs şablonları',
      labelEn: 'Course templates',
    },
    {
      key: 'certificates',
      labelTr: 'Sertifikalarım',
      labelEn: 'My certificates',
    },
    {
      key: 'settings',
      labelTr: 'Ayarlar',
      labelEn: 'Settings',
    },
    {
      key: 'access',
      labelTr: 'Yetkilendirme yönetimi',
      labelEn: 'Access management',
    },
  ],
};

export function resolveCapabilitiesPrimaryKey(moduleSlugOrPrimary: string): string {
  const def = getModuleAccessDefinition(moduleSlugOrPrimary);
  return def?.primaryModuleKey ?? moduleSlugOrPrimary;
}

export function getModuleCapabilityDefs(
  moduleSlugOrPrimary: string
): ModuleCapabilityDef[] {
  const primary = resolveCapabilitiesPrimaryKey(moduleSlugOrPrimary);
  return MODULE_CAPABILITIES[primary] ?? MODULE_CAPABILITIES[moduleSlugOrPrimary] ?? [];
}

export function getModuleCapabilityKeys(moduleSlugOrPrimary: string): string[] {
  return getModuleCapabilityDefs(moduleSlugOrPrimary).map((d) => d.key);
}

export function labelForModuleCapability(
  moduleSlugOrPrimary: string,
  key: string,
  locale: string
): string {
  const def = getModuleCapabilityDefs(moduleSlugOrPrimary).find((d) => d.key === key);
  if (!def) return key;
  return locale === 'tr' ? def.labelTr : def.labelEn;
}

/**
 * Grant body parse — seviye tavanı olmadan ham filtre.
 * Modülde tanımlı yetenek yoksa `undefined`.
 * Varsa boş/geçersiz input → tüm yetenekler (seviye clamp ayrı yapılır).
 */
export function parseModuleCapabilitiesInput(
  moduleSlugOrPrimary: string,
  raw: unknown
): string[] | undefined {
  const defs = getModuleCapabilityDefs(moduleSlugOrPrimary);
  if (defs.length === 0) return undefined;

  const allKeys = defs.map((d) => d.key);
  const allowed = new Set(allKeys);

  if (!Array.isArray(raw)) return allKeys;

  const filtered = raw.filter(
    (c): c is string => typeof c === 'string' && allowed.has(c)
  );
  return filtered.length > 0 ? filtered : allKeys;
}

/** null/empty → tam yetki (eski satırlar) */
export function hasModuleCapability(
  capabilities: string[] | null | undefined,
  required: string,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  if (capabilities == null || capabilities.length === 0) return true;
  return capabilities.includes(required);
}
