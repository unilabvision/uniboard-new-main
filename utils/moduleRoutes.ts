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
};

export const getModuleHref = (locale: string, moduleKey: string) => {
  const path = modulePathOverrides[moduleKey] ?? moduleKey;
  return `/${locale}/${path}`;
};
