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
  /** Dashboard kartı alt metni (DB boşsa kullanılır) */
  descriptionTr?: string;
  descriptionEn?: string;
  managePolicy: ModuleAccessManagePolicy;
}

export const MODULE_ACCESS_REGISTRY: Record<string, ModuleAccessDefinition> = {
  influencer: {
    primaryModuleKey: 'influencer',
    moduleKeys: ['influencer'],
    dashboardPath: 'influencer',
    nameTr: 'Influencer Paneli',
    nameEn: 'Influencer Panel',
    descriptionTr: 'Satış performansınızı ve komisyonlarınızı takip edin.',
    descriptionEn: 'Track your sales performance and commissions.',
    managePolicy: 'moduleHolder',
  },
  settings: {
    primaryModuleKey: 'settings',
    moduleKeys: ['settings', 'admin'],
    dashboardPath: 'settings',
    nameTr: 'Ayarlar',
    nameEn: 'Settings',
    descriptionTr: 'Hesap ve sistem ayarları.',
    descriptionEn: 'Account and system settings.',
    managePolicy: 'superAdminOnly',
  },
  certificates: {
    primaryModuleKey: 'certificates',
    moduleKeys: ['certificates'],
    dashboardPath: 'certificates',
    nameTr: 'Sertifika Sistemi',
    nameEn: 'Certificate System',
    descriptionTr: 'Sertifika oluşturma ve yayınlama.',
    descriptionEn: 'Create and issue certificates.',
    managePolicy: 'moduleHolder',
  },
  lms: {
    primaryModuleKey: 'courses',
    moduleKeys: ['courses', 'lms'],
    dashboardPath: 'lms',
    nameTr: 'Kurs Yönetimi',
    nameEn: 'Course Management',
    descriptionTr: 'Kurslarınızı yönetin ve düzenleyin.',
    descriptionEn: 'Manage and edit your courses.',
    managePolicy: 'moduleHolder',
  },
  students: {
    primaryModuleKey: 'students',
    moduleKeys: ['students', 'student'],
    dashboardPath: 'students',
    nameTr: 'Öğrenci Yönetimi',
    nameEn: 'Student Management',
    descriptionTr: 'Öğrenci kayıtları, kurs eşleşmeleri ve ilerleme takibi.',
    descriptionEn: 'Student enrollments, course matching and progress tracking.',
    managePolicy: 'moduleHolder',
  },
  'lms-2': {
    primaryModuleKey: 'lms-2',
    moduleKeys: ['lms-2'],
    dashboardPath: 'lms-2',
    nameTr: 'Kurumsal Eğitim Paneli',
    nameEn: 'Corporate Training Panel',
    descriptionTr: 'Kurumsal eğitim programlarını ve içeriklerini yönetin.',
    descriptionEn: 'Manage corporate training programs and content.',
    managePolicy: 'moduleHolder',
  },
  internship: {
    primaryModuleKey: 'internship',
    moduleKeys: ['internship', 'staj', 'career', 'kariyer', 'careers'],
    dashboardPath: 'internship',
    nameTr: 'Staj Başvuruları',
    nameEn: 'Internship Applications',
    descriptionTr: 'Staj başvurularını yönetin.',
    descriptionEn: 'Manage internship applications.',
    managePolicy: 'moduleHolder',
  },
  'site-applications': {
    primaryModuleKey: 'site-applications',
    moduleKeys: ['site-applications', 'site_basvurular', 'site-basvurular', 'basvurular'],
    dashboardPath: 'site-applications',
    nameTr: 'Site Başvuruları',
    nameEn: 'Site Applications',
    descriptionTr: 'Etkinlik ve ekip başvurularını yönetin.',
    descriptionEn: 'Manage event and team applications.',
    managePolicy: 'moduleHolder',
  },
  analytics: {
    primaryModuleKey: 'analytics',
    moduleKeys: ['analytics', 'reports'],
    dashboardPath: 'analytics',
    nameTr: 'Analitik Raporları',
    nameEn: 'Analytics Reports',
    descriptionTr: 'Detaylı istatistikler ve performans analizi.',
    descriptionEn: 'Detailed statistics and performance analysis.',
    managePolicy: 'moduleHolder',
  },
  events: {
    primaryModuleKey: 'events',
    moduleKeys: ['events', 'event', 'etkinlik', 'etkinlikler'],
    dashboardPath: 'events',
    nameTr: 'Etkinlik Yönetimi',
    nameEn: 'Event Management',
    descriptionTr: 'Etkinlikleri oluşturun ve myunilab.net üzerinde yayınlayın.',
    descriptionEn: 'Create events and publish them on myunilab.net.',
    managePolicy: 'moduleHolder',
  },
  mentorship: {
    primaryModuleKey: 'mentorship',
    moduleKeys: ['mentorship', 'mentorluk', 'mentorships', 'mentor'],
    dashboardPath: 'mentorship',
    nameTr: 'Mentörlük Paneli',
    nameEn: 'Mentorship Panel',
    descriptionTr: 'Mentörlük duyurularını ve başvurularını yönetin.',
    descriptionEn: 'Manage mentorship announcements and applications.',
    managePolicy: 'moduleHolder',
  },
};

export function getModuleAccessDefinition(moduleKey: string): ModuleAccessDefinition | null {
  if (MODULE_ACCESS_REGISTRY[moduleKey]) {
    return MODULE_ACCESS_REGISTRY[moduleKey];
  }
  return (
    Object.values(MODULE_ACCESS_REGISTRY).find((def) =>
      def.moduleKeys.includes(moduleKey)
    ) ?? null
  );
}

/** DB’de açıklama boşsa registry fallback’ini uygular (örn. lms-2). */
export function withModuleDashboardCopy<
  T extends {
    key: string;
    description_tr?: string | null;
    description_en?: string | null;
  },
>(module: T): T {
  const def = getModuleAccessDefinition(module.key);
  if (!def) return module;
  const tr = String(module.description_tr || '').trim();
  const en = String(module.description_en || '').trim();
  return {
    ...module,
    description_tr: tr || def.descriptionTr || '',
    description_en: en || def.descriptionEn || def.descriptionTr || '',
  };
}

export const MODULE_ACCESS_SLUGS = Object.keys(MODULE_ACCESS_REGISTRY);
