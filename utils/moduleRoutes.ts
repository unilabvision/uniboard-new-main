// Modül key → gerçek uygulama route'u (veritabanı key'i ile route farklı olabilir)
const modulePathOverrides: Record<string, string> = {
  students: 'lms/progress',
  student: 'lms/progress',
  courses: 'lms',
  analytics: 'analytics',
  reports: 'analytics',
  internship: 'internship/applications',
  staj: 'internship/applications',
  career: 'internship/applications',
  kariyer: 'internship/applications',
  careers: 'internship/applications',
  'site-applications': 'site-applications',
  site_basvurular: 'site-applications',
  'site-basvurular': 'site-applications',
  basvurular: 'site-applications',
  events: 'events',
  etkinlik: 'events',
  etkinlikler: 'events',
  'etkinlik-yonetimi': 'events',
  'event-management': 'events',
  event_management: 'events',
};

export const getModuleHref = (locale: string, moduleKey: string) => {
  const path = modulePathOverrides[moduleKey] ?? moduleKey;
  return `/${locale}/${path}`;
};
