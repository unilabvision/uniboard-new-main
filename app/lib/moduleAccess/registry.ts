export type ModuleAccessManagePolicy = 'moduleHolder' | 'superAdminOnly';

export interface ModuleAccessDefinition {
  /** user_module_access.module_key yazılırken kullanılır */
  primaryModuleKey: string;
  /** Listeleme ve revoke için tüm alias anahtarlar */
  moduleKeys: string[];
  /** Davet e-postasındaki panel yolu: `/{locale}/{dashboardPath}` */
  dashboardPath: string;
  nameTr: string;
  nameEn: string;
  managePolicy: ModuleAccessManagePolicy;
}

export const MODULE_ACCESS_REGISTRY: Record<string, ModuleAccessDefinition> = {
  influencer: {
    primaryModuleKey: 'influencer',
    moduleKeys: ['influencer'],
    dashboardPath: 'influencer',
    nameTr: 'Influencer Paneli',
    nameEn: 'Influencer Panel',
    managePolicy: 'moduleHolder',
  },
  settings: {
    primaryModuleKey: 'settings',
    moduleKeys: ['settings', 'admin'],
    dashboardPath: 'settings',
    nameTr: 'Ayarlar',
    nameEn: 'Settings',
    managePolicy: 'superAdminOnly',
  },
  certificates: {
    primaryModuleKey: 'certificates',
    moduleKeys: ['certificates'],
    dashboardPath: 'certificates',
    nameTr: 'Sertifika Sistemi',
    nameEn: 'Certificate System',
    managePolicy: 'moduleHolder',
  },
  lms: {
    primaryModuleKey: 'courses',
    moduleKeys: ['courses', 'lms'],
    dashboardPath: 'lms',
    nameTr: 'Kurs Yönetimi',
    nameEn: 'Course Management',
    managePolicy: 'moduleHolder',
  },
  students: {
    primaryModuleKey: 'students',
    moduleKeys: ['students', 'student'],
    dashboardPath: 'students',
    nameTr: 'Öğrenci Yönetimi',
    nameEn: 'Student Management',
    managePolicy: 'moduleHolder',
  },
  'lms-2': {
    primaryModuleKey: 'lms-2',
    moduleKeys: ['lms-2'],
    dashboardPath: 'lms-2',
    nameTr: 'Kurumsal Eğitim Paneli',
    nameEn: 'Corporate Training Panel',
    managePolicy: 'moduleHolder',
  },
  internship: {
    primaryModuleKey: 'internship',
    moduleKeys: ['internship', 'staj', 'career', 'kariyer', 'careers'],
    dashboardPath: 'internship',
    nameTr: 'Staj Başvuruları',
    nameEn: 'Internship Applications',
    managePolicy: 'moduleHolder',
  },
  'site-applications': {
    primaryModuleKey: 'site-applications',
    moduleKeys: ['site-applications', 'site_basvurular', 'site-basvurular', 'basvurular'],
    dashboardPath: 'site-applications',
    nameTr: 'Site Başvuruları',
    nameEn: 'Site Applications',
    managePolicy: 'moduleHolder',
  },
  analytics: {
    primaryModuleKey: 'analytics',
    moduleKeys: ['analytics', 'reports'],
    dashboardPath: 'analytics',
    nameTr: 'Analitik Raporları',
    nameEn: 'Analytics Reports',
    managePolicy: 'moduleHolder',
  },
  events: {
    primaryModuleKey: 'events',
    moduleKeys: ['events', 'etkinlik', 'etkinlikler'],
    dashboardPath: 'events',
    nameTr: 'Etkinlik Yönetimi',
    nameEn: 'Event Management',
    managePolicy: 'moduleHolder',
  },
};

export function getModuleAccessDefinition(moduleKey: string): ModuleAccessDefinition | null {
  return MODULE_ACCESS_REGISTRY[moduleKey] ?? null;
}

export const MODULE_ACCESS_SLUGS = Object.keys(MODULE_ACCESS_REGISTRY);
