import type { CertificateIssuanceKind } from '@/app/lib/certificates/issuance';

export type IssuanceFieldTexts = {
  certificate_title: string;
  provider_text: string;
  instructor_label: string;
  date_label: string;
  certificate_number_label: string;
  total_hours_label: string;
  completion_text: string;
  skills_label: string;
  descriptionFor: (sourceName: string) => string;
};

export type IssuanceCertificateFieldInput = {
  kind: CertificateIssuanceKind;
  locale: string;
  recipientName: string;
  sourceName: string;
  certificateTitle?: string | null;
  description?: string | null;
  instructor?: string | null;
  duration?: string | null;
  templateId: number;
  organizationSlug: string;
};

export function getIssuanceFieldTexts(
  locale: string,
  kind: CertificateIssuanceKind
): IssuanceFieldTexts {
  const isEnglish = locale === 'en';

  if (kind === 'event_participation') {
    return {
      certificate_title: isEnglish ? 'Certificate of Participation' : 'Katılım Sertifikası',
      provider_text: isEnglish ? 'provided by' : 'tarafından sağlanmıştır',
      instructor_label: isEnglish ? 'Instructor' : 'Eğitmen',
      date_label: isEnglish ? 'Issue Date' : 'Veriliş Tarihi',
      certificate_number_label: isEnglish ? 'Certificate No' : 'Sertifika No',
      total_hours_label: isEnglish ? 'Total Hours' : 'Toplam Süre',
      completion_text: isEnglish
        ? 'has successfully participated in this event.'
        : 'etkinliğine katılım',
      skills_label: isEnglish ? 'Skills' : 'Kazanılan Yetkinlikler',
      descriptionFor: (eventName) =>
        isEnglish ? `Participation in ${eventName}` : `${eventName} etkinliğine katılım`,
    };
  }

  return {
    certificate_title: isEnglish ? 'Certificate of Achievement' : 'Başarı Sertifikası',
    provider_text: isEnglish ? 'provided by' : 'tarafından sağlanmıştır',
    instructor_label: isEnglish ? 'Instructor' : 'Eğitmen',
    date_label: isEnglish ? 'Issue Date' : 'Veriliş Tarihi',
    certificate_number_label: isEnglish ? 'Certificate No' : 'Sertifika No',
    total_hours_label: isEnglish ? 'Total Hours' : 'Toplam Süre',
    completion_text: isEnglish
      ? 'has successfully completed the course.'
      : 'kursunu başarıyla tamamladı',
    skills_label: isEnglish ? 'Skills' : 'Kazanılan Yetkinlikler',
    descriptionFor: (courseName) =>
      isEnglish
        ? `Successfully completed ${courseName}`
        : `${courseName} kursunu başarıyla tamamladı`,
  };
}

export function buildIssuanceCertificateFields(input: IssuanceCertificateFieldInput) {
  const fieldTexts = getIssuanceFieldTexts(input.locale, input.kind);

  return {
    fullname: input.recipientName,
    coursename: input.sourceName,
    certificate_title: input.certificateTitle || fieldTexts.certificate_title,
    description: input.description?.trim() || fieldTexts.descriptionFor(input.sourceName),
    instructor: input.instructor?.trim() || '',
    duration: input.duration?.trim() || '',
    language: input.locale === 'en' ? 'en' : 'tr',
    provider_text: fieldTexts.provider_text,
    instructor_label: fieldTexts.instructor_label,
    date_label: fieldTexts.date_label,
    certificate_number_label: fieldTexts.certificate_number_label,
    total_hours_label: fieldTexts.total_hours_label,
    completion_text: fieldTexts.completion_text,
    skills_label: fieldTexts.skills_label,
    template_id: input.templateId,
    organization_slug: input.organizationSlug,
  };
}
