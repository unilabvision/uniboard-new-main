/**
 * Ana dashboard kart sırası.
 * Bilinmeyen key’ler listenin sonuna (settings’ten önce) eklenir.
 */
export const DASHBOARD_MODULE_ORDER: string[] = [
  'influencer',
  'mentorship',
  'mentorluk',
  'mentorships',
  'mentor',
  'certificates',
  'courses',
  'lms',
  // Öğrenci Yönetimi ↔ Kurumsal Eğitim yer değişimi
  'students',
  'student',
  'internship',
  'staj',
  'career',
  'kariyer',
  'careers',
  'site-applications',
  'site_basvurular',
  'site-basvurular',
  'basvurular',
  'events',
  'event',
  'etkinlik',
  'etkinlikler',
  'analytics',
  'reports',
  'lms-2',
  // Ayarlar en sonda (Mentörlük ile yer değiştirildi)
  'settings',
  'admin',
];

const orderIndex = new Map(
  DASHBOARD_MODULE_ORDER.map((key, index) => [key, index])
);

/**
 * Dashboard kartlarını tercih edilen sıraya dizer.
 * Ayarlar ↔ Mentörlük yer değişimi bu listede tanımlı.
 */
export function sortDashboardModules<T extends { key: string }>(modules: T[]): T[] {
  return [...modules].sort((a, b) => {
    const ai = orderIndex.has(a.key)
      ? (orderIndex.get(a.key) as number)
      : DASHBOARD_MODULE_ORDER.length - 2;
    const bi = orderIndex.has(b.key)
      ? (orderIndex.get(b.key) as number)
      : DASHBOARD_MODULE_ORDER.length - 2;
    if (ai !== bi) return ai - bi;
    return a.key.localeCompare(b.key);
  });
}
