import type { SiteApplicationFormFieldInput } from '@/app/types/siteApplicationForms';
import { getSiteApplicationPublicPath, toAbsoluteMyuniUrl } from './config';

export type SiteApplicationFormType = 'team' | 'event' | 'course';

export const TEAM_FORM_LEGACY_SLUGS = {
  tr: 'ekip-basvuru',
  en: 'team-application',
} as const;

/** Neutral placeholders — each org sets its own job/volunteer title in the panel. */
export const TEAM_FORM_DEFAULT_TITLES = {
  tr: '',
  en: '',
} as const;

export const TEAM_FORM_DEFAULT_SUBTITLES = {
  tr: '',
  en: '',
} as const;

export const EVENT_FORM_LEGACY_SLUGS = {
  tr: 'etkinlik-basvuru',
  en: 'event-application',
} as const;

export const COURSE_FORM_LEGACY_SLUGS = {
  tr: 'kurs-basvuru',
  en: 'course-application',
} as const;

const EVENT_FORM_HINT = /(?:^|[\s_-])(etkinlik|event)(?:[\s_-]|$)/i;
const TEAM_FORM_HINT = /(?:^|[\s_-])(ekip|team)(?:[\s_-]|$)/i;
const COURSE_FORM_HINT = /(?:^|[\s_-])(kurs|course)(?:[\s_-]|$)/i;

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

function isLegacyCourseFormSlug(slug?: string | null): boolean {
  if (!slug) return false;
  const normalized = slug.trim().toLowerCase();
  return (
    normalized === COURSE_FORM_LEGACY_SLUGS.tr ||
    normalized === COURSE_FORM_LEGACY_SLUGS.en ||
    normalized.startsWith('kurs-') ||
    normalized.startsWith('course-') ||
    normalized.includes('kurs-basvuru') ||
    normalized.includes('course-application')
  );
}

export function inferFormType(form: {
  event_id?: string | null;
  course_id?: string | null;
  form_type?: string | null;
  slug_tr?: string | null;
  slug_en?: string | null;
  title_tr?: string | null;
  title_en?: string | null;
}): SiteApplicationFormType {
  if (form.course_id) return 'course';
  if (form.event_id) return 'event';
  if (isLegacyCourseFormSlug(form.slug_tr) || isLegacyCourseFormSlug(form.slug_en)) {
    return 'course';
  }
  if (isLegacyEventFormSlug(form.slug_tr) || isLegacyEventFormSlug(form.slug_en)) {
    return 'event';
  }

  const blob = `${form.slug_tr || ''} ${form.slug_en || ''} ${form.title_tr || ''} ${form.title_en || ''}`;
  const hasCourseHint = COURSE_FORM_HINT.test(blob);
  const hasEventHint = EVENT_FORM_HINT.test(blob);
  const hasTeamHint = TEAM_FORM_HINT.test(blob);

  if (hasCourseHint) return 'course';
  if (hasEventHint) return 'event';
  if (hasTeamHint) return 'team';

  if (form.form_type === 'team' || form.form_type === 'event' || form.form_type === 'course') {
    return form.form_type;
  }

  return 'team';
}

/** True when this row belongs in Event Management, not Site Applications (team). */
export function isEventApplicationForm(form: {
  event_id?: string | null;
  course_id?: string | null;
  form_type?: string | null;
  slug_tr?: string | null;
  slug_en?: string | null;
  title_tr?: string | null;
  title_en?: string | null;
}): boolean {
  return inferFormType(form) === 'event';
}

export function isCourseApplicationForm(form: {
  event_id?: string | null;
  course_id?: string | null;
  form_type?: string | null;
  slug_tr?: string | null;
  slug_en?: string | null;
  title_tr?: string | null;
  title_en?: string | null;
}): boolean {
  return inferFormType(form) === 'course';
}

export function getTeamFormPublicPath(locale: string, slug: string): string {
  if (slug === TEAM_FORM_LEGACY_SLUGS.tr || slug === TEAM_FORM_LEGACY_SLUGS.en) {
    return `/${locale}/${slug}`;
  }
  return getSiteApplicationPublicPath(locale, slug);
}

export function getAbsoluteTeamFormPublicPath(locale: string, slug: string): string {
  return toAbsoluteMyuniUrl(getTeamFormPublicPath(locale, slug));
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
    field_key: 'position',
    field_type: 'text',
    label_tr: 'Başvurulan pozisyon / alan',
    label_en: 'Position / area applied for',
    required: false,
    order_index: 6,
  },
  {
    field_key: 'motivation',
    field_type: 'textarea',
    label_tr: 'Neden başvuruyorsunuz? / Kısa motivasyon',
    label_en: 'Why are you applying? / Short motivation',
    required: true,
    order_index: 7,
  },
  {
    field_key: 'linkedin',
    field_type: 'url',
    label_tr: 'LinkedIn / Portfolyo URL',
    label_en: 'LinkedIn / Portfolio URL',
    required: false,
    order_index: 8,
  },
];

export const EVENT_DEFAULT_FIELDS: SiteApplicationFormFieldInput[] = [
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
    field_key: 'message',
    field_type: 'textarea',
    label_tr: 'Mesajınız',
    label_en: 'Your message',
    required: false,
    order_index: 4,
  },
];

export const COURSE_DEFAULT_FIELDS: SiteApplicationFormFieldInput[] = [
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
    field_key: 'motivation',
    field_type: 'textarea',
    label_tr: 'Bu kursa neden katılmak istiyorsunuz?',
    label_en: 'Why do you want to join this course?',
    required: true,
    order_index: 4,
  },
];

export function getDefaultFieldsForFormType(
  type: SiteApplicationFormType
): SiteApplicationFormFieldInput[] {
  if (type === 'team') return TEAM_DEFAULT_FIELDS;
  if (type === 'course') return COURSE_DEFAULT_FIELDS;
  return EVENT_DEFAULT_FIELDS;
}

export function buildEventFormSlugs(eventSlug: string): { slug_tr: string; slug_en: string } {
  const normalized = eventSlug.trim().toLowerCase();
  return {
    slug_tr: `etkinlik-${normalized}`,
    slug_en: `event-${normalized}`,
  };
}

export function buildCourseFormSlugs(courseSlug: string): { slug_tr: string; slug_en: string } {
  const normalized = courseSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return {
    slug_tr: `kurs-${normalized}`,
    slug_en: `course-${normalized}`,
  };
}

export function emptyTeamFormState() {
  return {
    title_tr: '',
    title_en: '',
    subtitle_tr: '',
    subtitle_en: '',
    slug_tr: '',
    slug_en: '',
    success_message_tr: 'Başvurunuz alındı. En kısa sürede sizinle iletişime geçilecektir.',
    success_message_en: 'Your application has been received. We will contact you soon.',
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
    // Required by myunilab.net public event form APIs alongside is_active
    show_on_website: true,
    allows_attachment: false,
    event_id: '' as string,
  };
}

export function emptyCourseFormState(courseTitle = '', courseSlug = '') {
  const slugs = courseSlug ? buildCourseFormSlugs(courseSlug) : { slug_tr: '', slug_en: '' };
  return {
    title_tr: courseTitle ? `${courseTitle} Başvurusu` : '',
    title_en: courseTitle ? `${courseTitle} Application` : '',
    subtitle_tr: 'Kursa katılmak için formu doldurun.',
    subtitle_en: 'Fill out the form to apply for this course.',
    slug_tr: slugs.slug_tr,
    slug_en: slugs.slug_en,
    success_message_tr: 'Başvurunuz alındı. En kısa sürede sizinle iletişime geçilecektir.',
    success_message_en: 'Your application has been received. We will contact you soon.',
    is_active: false,
    show_on_website: true,
    allows_attachment: false,
    course_id: '' as string,
  };
}

export function getPublicCourseApplicationPath(locale: string, courseSlug: string): string {
  const segment = locale === 'en' ? 'course' : 'kurs';
  const action = locale === 'en' ? 'application' : 'basvuru';
  return `/${locale}/${segment}/${courseSlug}/${action}`;
}

export function getAbsoluteCourseApplicationPath(locale: string, courseSlug: string): string {
  return toAbsoluteMyuniUrl(getPublicCourseApplicationPath(locale, courseSlug));
}
