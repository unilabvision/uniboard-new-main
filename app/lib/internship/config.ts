/**
 * Supabase LMS DB — kullanıcının kurduğu mevcut tablolar.
 * Yeni tablo eklenmez; yalnızca bu isimler kullanılır.
 */
export const internshipDb = {
  /** Klasik staj başvuru hattı */
  applications: 'internship_applications',
  votes: 'internship_votes',
  statusHistory: 'internship_status_history',
  reviewers: 'internship_reviewers',
  formConfigs: 'internship_form_configs',
  formFields: 'internship_form_fields',

  /** Kariyer / fırsat hattı (Youthall benzeri) */
  opportunities: 'myuni_opportunities',
  opportunityApplications: 'myuni_opportunity_applications',
  opportunityAppStatusHistory: 'myuni_opportunity_application_status_history',
  opportunityCourses: 'myuni_opportunity_courses',
  applicationsGeneric: 'myuni_applications',
  applicationStatusHistory: 'myuni_application_status_history',
  careerTags: 'myuni_career_tags',
  opportunityCareerTags: 'myuni_opportunity_career_tags',
  courseCareerTags: 'myuni_course_career_tags',
} as const;

/** myuni_opportunities kolonları */
export const opportunityColumns = [
  'id',
  'slug',
  'title',
  'description',
  'company_name',
  'location',
  'work_mode',
  'application_deadline',
  'form_config_id',
  'is_active',
  'is_featured',
  'order_index',
  'created_at',
  'updated_at',
] as const;

export type InternshipTableKey = keyof typeof internshipDb;

/** internship_applications — kodda kullanılan kolonlar */
export const applicationColumns = [
  'id',
  'first_name',
  'last_name',
  'email',
  'phone',
  'school',
  'grade',
  'position',
  'motivation',
  'communication',
  'team_experience',
  'status',
  'cv_file_name',
  'cv_storage_path',
  'cv_mime_type',
  'cv_file_size',
  'admin_notes',
  'reviewed_by',
  'reviewed_at',
  'source',
  'created_at',
  'updated_at',
] as const;

/** jsonb veya string name alanından locale'e göre etiket */
export function getLocalizedJsonName(name: unknown, locale: string): string {
  if (typeof name === 'string' && name.trim()) return name.trim();
  if (name && typeof name === 'object' && !Array.isArray(name)) {
    const obj = name as Record<string, string>;
    const lang = locale === 'tr' ? 'tr' : 'en';
    return obj[lang] || obj.tr || obj.en || Object.values(obj).find(Boolean) || '—';
  }
  return '—';
}

export function getCareerTagLabel(tag: { name: unknown; slug: string }, locale: string): string {
  const label = getLocalizedJsonName(tag.name, locale);
  return label !== '—' ? label : tag.slug;
}

/** myuni_opportunities.title (jsonb) + slug fallback */
export function getOpportunityTitle(
  opp: { title?: unknown; slug?: string },
  locale: string
): string {
  const fromTitle = getLocalizedJsonName(opp.title, locale);
  if (fromTitle !== '—') return fromTitle;
  return opp.slug?.trim() || '—';
}

export function getOpportunityDescription(
  opp: { description?: unknown },
  locale: string
): string {
  return getLocalizedJsonName(opp.description, locale);
}

/** @deprecated Bilinmeyen şemalar için — tercih: getCareerTagLabel */
export function pickLabel(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '—';
}

/** @deprecated use getCareerTagLabel */
export function pickTagKeyword(row: Record<string, unknown>): string {
  return pickLabel(row, ['slug', 'name_tr', 'name_en', 'name']);
}
