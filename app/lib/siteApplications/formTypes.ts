import type { SiteApplicationFormFieldInput } from '@/app/types/siteApplicationForms';
import { getSiteApplicationPublicPath } from './config';

export type SiteApplicationFormType = 'team' | 'event';

export const TEAM_FORM_LEGACY_SLUGS = {
  tr: 'ekip-basvuru',
  en: 'team-application',
} as const;

export const TEAM_FORM_DEFAULT_TITLES = {
  tr: 'UNILAB Ekip Başvurusu',
  en: 'UNILAB Team Application',
} as const;

export const TEAM_FORM_DEFAULT_SUBTITLES = {
  tr: 'UNILAB Vision ekibine katılmak için başvurunu gönder.',
  en: 'Apply to join the UNILAB Vision team.',
} as const;

export const EVENT_FORM_LEGACY_SLUGS = {
  tr: 'etkinlik-basvuru',
  en: 'event-application',
} as const;

const EVENT_FORM_HINT = /(?:^|[\s_-])(etkinlik|event)(?:[\s_-]|$)/i;
const TEAM_FORM_HINT = /(?:^|[\s_-])(ekip|team)(?:[\s_-]|$)/i;

function isLegacyEventFormSlug(slug?: string | null): boolean {
  if (!slug) return false;
  const normalized = slug.trim().toLowerCase();
  return (
    normalized === EVENT_FORM_LEGACY_SLUGS.tr ||
    normalized === EVENT_FORM_LEGACY_SLUGS.en ||
    normalized.includes('etkinlik-basvuru') ||
    normalized.includes('event-application')
  );
}

export function inferFormType(form: {
  event_id?: string | null;
  form_type?: string | null;
  slug_tr?: string | null;
  slug_en?: string | null;
  title_tr?: string | null;
  title_en?: string | null;
}): SiteApplicationFormType {
  if (form.form_type === 'team' || form.form_type === 'event') {
    return form.form_type;
  }
  if (form.event_id) return 'event';
  if (isLegacyEventFormSlug(form.slug_tr) || isLegacyEventFormSlug(form.slug_en)) {
    return 'event';
  }

  const blob = `${form.slug_tr || ''} ${form.slug_en || ''} ${form.title_tr || ''} ${form.title_en || ''}`;
  const hasEventHint = EVENT_FORM_HINT.test(blob);
  const hasTeamHint = TEAM_FORM_HINT.test(blob);

  if (hasEventHint && !hasTeamHint) return 'event';
  if (hasTeamHint && !hasEventHint) return 'team';
  if (hasEventHint) return 'event';

  return 'team';
}

export function getTeamFormPublicPath(locale: string, slug: string): string {
  if (slug === TEAM_FORM_LEGACY_SLUGS.tr || slug === TEAM_FORM_LEGACY_SLUGS.en) {
    return `/${locale}/${slug}`;
  }
  return getSiteApplicationPublicPath(locale, slug);
}

export const TEAM_DEFAULT_FIELDS: SiteApplicationFormFieldInput[] = [
  {
    field_key: 'first_name',
    field_type: 'text',
    label_tr: 'Ad',
    label_en: 'First Name',
    required: true,
    order_index: 0,
    is_contact: true,
  },
  {
    field_key: 'last_name',
    field_type: 'text',
    label_tr: 'Soyad',
    label_en: 'Last Name',
    required: true,
    order_index: 1,
    is_contact: true,
  },
  {
    field_key: 'email',
    field_type: 'email',
    label_tr: 'E-posta',
    label_en: 'Email',
    required: true,
    order_index: 2,
    is_contact: true,
  },
  {
    field_key: 'phone',
    field_type: 'tel',
    label_tr: 'Telefon',
    label_en: 'Phone',
    required: false,
    order_index: 3,
    is_contact: true,
  },
  {
    field_key: 'university',
    field_type: 'text',
    label_tr: 'Üniversite / Okul',
    label_en: 'University / School',
    required: false,
    order_index: 4,
  },
  {
    field_key: 'department',
    field_type: 'text',
    label_tr: 'Bölüm',
    label_en: 'Department',
    required: false,
    order_index: 5,
  },
  {
    field_key: 'motivation',
    field_type: 'textarea',
    label_tr: 'Neden UNILAB ekibine katılmak istiyorsunuz?',
    label_en: 'Why do you want to join the UNILAB team?',
    required: true,
    order_index: 6,
  },
  {
    field_key: 'linkedin',
    field_type: 'url',
    label_tr: 'LinkedIn profili',
    label_en: 'LinkedIn profile',
    required: false,
    order_index: 7,
  },
];

export function emptyTeamFormState() {
  return {
    title_tr: TEAM_FORM_DEFAULT_TITLES.tr,
    title_en: TEAM_FORM_DEFAULT_TITLES.en,
    subtitle_tr: TEAM_FORM_DEFAULT_SUBTITLES.tr,
    subtitle_en: TEAM_FORM_DEFAULT_SUBTITLES.en,
    slug_tr: TEAM_FORM_LEGACY_SLUGS.tr,
    slug_en: TEAM_FORM_LEGACY_SLUGS.en,
    success_message_tr: 'Başvurunuz alındı. UNILAB ekibi en kısa sürede sizinle iletişime geçecek.',
    success_message_en: 'Your application has been received. The UNILAB team will contact you soon.',
    is_active: false,
    show_on_website: false,
    allows_attachment: true,
    event_id: '' as string,
  };
}

export function emptyEventFormState() {
  return {
    title_tr: '',
    title_en: '',
    subtitle_tr: '',
    subtitle_en: '',
    slug_tr: '',
    slug_en: '',
    success_message_tr: '',
    success_message_en: '',
    is_active: false,
    show_on_website: false,
    allows_attachment: false,
    event_id: '' as string,
  };
}
