import {
  CompanyUserRole,
  INTERNSHIP_PLATFORM_MODULE_KEYS,
  type InternshipReviewer,
} from '@/app/types/internship';

export { INTERNSHIP_PLATFORM_MODULE_KEYS };

/** Platform HR kullanıcıları — ileride mevcut bir tablodan okunabilir */
export const COMPANY_ROLE_LABELS: Record<
  CompanyUserRole,
  { tr: string; en: string }
> = {
  company_admin: { tr: 'Şirket Yöneticisi', en: 'Company Admin' },
  hr_manager: { tr: 'İK Yöneticisi', en: 'HR Manager' },
  hr_reviewer: { tr: 'İK Değerlendirici', en: 'HR Reviewer' },
  viewer: { tr: 'Görüntüleyici', en: 'Viewer' },
};

export function hasPlatformInternshipAccess(
  moduleKeys: string[],
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  return moduleKeys.some((key) =>
    (INTERNSHIP_PLATFORM_MODULE_KEYS as readonly string[]).includes(key)
  );
}

/** Pozisyon stringinden basit anahtar kelime listesi */
export function keywordsFromPosition(position: string | null | undefined): string[] {
  if (!position || typeof position !== 'string') return [];
  return position
    .split(/[\s,/|+-]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 2);
}

/** internship_reviewers satırından UI yetkileri */
export function reviewerPermissions(
  reviewer: InternshipReviewer | null,
  isSuperAdmin = false
) {
  if (isSuperAdmin) {
    return { canVote: true, canChangeStatus: true, canAddNotes: true };
  }
  if (!reviewer || !reviewer.is_active) {
    return { canVote: false, canChangeStatus: false, canAddNotes: false };
  }
  return {
    canVote: reviewer.can_vote,
    canChangeStatus: reviewer.can_change_status,
    canAddNotes: reviewer.can_add_notes,
  };
}
