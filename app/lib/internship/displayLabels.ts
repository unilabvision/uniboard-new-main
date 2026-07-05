import { COMPANY_ROLE_LABELS } from '@/app/lib/internship/permissions';
import type { CompanyUserRole } from '@/app/types/internship';

const GRADE_LABELS: Record<string, { tr: string; en: string }> = {
  university_1: { tr: '1. Sınıf', en: '1st Year' },
  university_2: { tr: '2. Sınıf', en: '2nd Year' },
  university_3: { tr: '3. Sınıf', en: '3rd Year' },
  university_4: { tr: '4. Sınıf', en: '4th Year' },
  graduate: { tr: 'Mezun', en: 'Graduate' },
  prep: { tr: 'Hazırlık', en: 'Prep Year' },
  high_school: { tr: 'Lise', en: 'High School' },
};

const SOURCE_LABELS: Record<string, { tr: string; en: string }> = {
  website: { tr: 'Web sitesi', en: 'Website' },
  linkedin: { tr: 'LinkedIn', en: 'LinkedIn' },
  referral: { tr: 'Referans', en: 'Referral' },
  event: { tr: 'Etkinlik', en: 'Event' },
  campus: { tr: 'Kampüs', en: 'Campus' },
  email: { tr: 'E-posta', en: 'Email' },
  social: { tr: 'Sosyal medya', en: 'Social media' },
  other: { tr: 'Diğer', en: 'Other' },
};

const WORK_MODE_LABELS: Record<string, { tr: string; en: string }> = {
  remote: { tr: 'Uzaktan', en: 'Remote' },
  hybrid: { tr: 'Hibrit', en: 'Hybrid' },
  onsite: { tr: 'Ofiste', en: 'On-site' },
  on_site: { tr: 'Ofiste', en: 'On-site' },
  office: { tr: 'Ofiste', en: 'On-site' },
};

const STATUS_LABELS: Record<string, { tr: string; en: string }> = {
  pending: { tr: 'Bekliyor', en: 'Pending' },
  under_review: { tr: 'İncelemede', en: 'Under Review' },
  interview: { tr: 'Mülakat', en: 'Interview' },
  accepted: { tr: 'Kabul Edildi', en: 'Accepted' },
  rejected: { tr: 'Reddedildi', en: 'Rejected' },
};

function pickLocaleLabel(
  map: Record<string, { tr: string; en: string }>,
  value: string,
  locale: string
): string | null {
  const entry = map[value.toLowerCase().trim()];
  if (!entry) return null;
  return locale === 'tr' ? entry.tr : entry.en;
}

function humanizeToken(value: string): string {
  return value
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function formatApplicationGrade(
  grade: string | null | undefined,
  locale: string
): string {
  if (!grade?.trim()) return '—';
  return pickLocaleLabel(GRADE_LABELS, grade, locale) ?? humanizeToken(grade);
}

export function formatApplicationSource(
  source: string | null | undefined,
  locale: string
): string {
  if (!source?.trim()) {
    return locale === 'tr' ? 'Belirtilmemiş' : 'Not specified';
  }
  return pickLocaleLabel(SOURCE_LABELS, source, locale) ?? humanizeToken(source);
}

export function formatWorkMode(
  mode: string | null | undefined,
  locale: string
): string {
  if (!mode?.trim()) return '—';
  return pickLocaleLabel(WORK_MODE_LABELS, mode, locale) ?? humanizeToken(mode);
}

export function formatApplicationStatus(
  status: string | null | undefined,
  locale: string
): string {
  if (!status?.trim()) return '—';
  return pickLocaleLabel(STATUS_LABELS, status, locale) ?? humanizeToken(status);
}

export function formatReviewerRole(
  role: string | null | undefined,
  locale: string
): string {
  if (!role?.trim()) return '—';
  const labels = COMPANY_ROLE_LABELS[role as CompanyUserRole];
  if (labels) return locale === 'tr' ? labels.tr : labels.en;
  return humanizeToken(role);
}

export function formatOpportunityFallback(
  locale: string
): string {
  return locale === 'tr' ? 'Bilinmeyen fırsat' : 'Unknown opportunity';
}

export function formatLoadError(locale: string): string {
  return locale === 'tr'
    ? 'Veriler yüklenirken bir sorun oluştu.'
    : 'Something went wrong while loading data.';
}
