import { sendCertificateCompletionEmail } from '@/app/_services/emailService';
import {
  CERTIFICATE_ISSUANCE_TABLE,
  buildCertificatePublicUrl,
  generateCertificateNumber,
  getCertificatesServiceSupabase,
  type CertificateIssuanceRow,
  type OrganizationForNumber,
} from '@/app/lib/certificates/issuance';

export type IssueRequestItem = {
  queueIds: string[];
  templateId: number;
  organizationSlug: string;
  organizationName?: string;
  organizationAbbreviation?: string;
  instructor?: string;
  description?: string;
  customMessage?: string;
  locale?: string;
};

export type IssueResult = {
  issued: number;
  emailed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
};

function formatIssueDateForDb(): string {
  // certificates.issuedate — create sayfası ile aynı (YYYY-MM-DD); görüntüleme renderer'da locale ile yapılır
  return new Date().toISOString().split('T')[0];
}

function getIssuanceFieldTexts(locale: string, kind: CertificateIssuanceRow['kind']) {
  const isEn = locale === 'en';
  if (kind === 'event_participation') {
    return {
      certificate_title: isEn ? 'Certificate of Participation' : 'Katılım Sertifikası',
      provider_text: isEn ? 'provided by' : 'tarafından sağlanmıştır',
      instructor_label: isEn ? 'Instructor' : 'Eğitmen',
      date_label: isEn ? 'Issue Date' : 'Veriliş Tarihi',
      certificate_number_label: isEn ? 'Certificate No' : 'Sertifika No',
      total_hours_label: isEn ? 'Total Hours' : 'Toplam Süre',
      completion_text: isEn
        ? 'has successfully participated in this event.'
        : 'etkinliğine katılım',
      skills_label: isEn ? 'Skills' : 'Kazanılan Yetkinlikler',
      descriptionFor: (eventName: string) =>
        isEn
          ? `Participation in ${eventName}`
          : `${eventName} etkinliğine katılım`,
    };
  }

  return {
    certificate_title: isEn ? 'Certificate of Achievement' : 'Başarı Sertifikası',
    provider_text: isEn ? 'provided by' : 'tarafından sağlanmıştır',
    instructor_label: isEn ? 'Instructor' : 'Eğitmen',
    date_label: isEn ? 'Issue Date' : 'Veriliş Tarihi',
    certificate_number_label: isEn ? 'Certificate No' : 'Sertifika No',
    total_hours_label: isEn ? 'Total Hours' : 'Toplam Süre',
    completion_text: isEn
      ? 'has successfully completed the course.'
      : 'kursunu başarıyla tamamladı',
    skills_label: isEn ? 'Skills' : 'Kazanılan Yetkinlikler',
    descriptionFor: (courseName: string) =>
      isEn
        ? `Successfully completed ${courseName}`
        : `${courseName} kursunu başarıyla tamamladı`,
  };
}

export async function issueCertificatesFromQueue(
  params: IssueRequestItem
): Promise<IssueResult> {
  const supabase = getCertificatesServiceSupabase();
  const queueIds = [...new Set(params.queueIds.filter(Boolean))];
  const result: IssueResult = { issued: 0, emailed: 0, failed: 0, errors: [] };

  if (queueIds.length === 0) {
    return result;
  }
  if (!params.templateId || !params.organizationSlug?.trim()) {
    throw new Error('templateId and organizationSlug are required');
  }

  const { data: rows, error } = await supabase
    .from(CERTIFICATE_ISSUANCE_TABLE)
    .select('*')
    .in('id', queueIds)
    .in('status', ['ready', 'pending', 'failed']);

  if (error) {
    throw new Error(error.message);
  }

  const org: OrganizationForNumber = {
    slug: params.organizationSlug,
    name: params.organizationName || params.organizationSlug,
    abbreviation: params.organizationAbbreviation || null,
  };

  for (const row of (rows || []) as CertificateIssuanceRow[]) {
    try {
      const courseName =
        row.kind === 'event_participation'
          ? row.event_name || 'Etkinlik'
          : row.course_name || 'Kurs';
      const locale = params.locale || row.locale || 'tr';
      const fieldTexts = getIssuanceFieldTexts(locale, row.kind);
      const title = row.certificate_title || fieldTexts.certificate_title;
      const description =
        params.description?.trim() || fieldTexts.descriptionFor(courseName);

      let certificateId = row.issued_certificate_id;
      let certificatenumber = row.issued_certificatenumber;
      let certificateurl: string | null = null;

      // Listeye geri alınan kayıt: mevcut sertifikayı yeniden kullan, çift kayıt açma
      if (certificateId) {
        const { data: existingCert, error: existingError } = await supabase
          .from('certificates')
          .select('id, certificatenumber, certificateurl, description')
          .eq('id', certificateId)
          .maybeSingle();

        if (existingError) {
          throw new Error(existingError.message);
        }

        if (existingCert) {
          certificatenumber = existingCert.certificatenumber;
          certificateurl =
            existingCert.certificateurl ||
            (certificatenumber
              ? buildCertificatePublicUrl(params.organizationSlug, certificatenumber)
              : null);

          await supabase
            .from('certificates')
            .update({
              fullname: row.recipient_name,
              coursename: courseName,
              certificate_title: title,
              description,
              language: locale === 'en' ? 'en' : 'tr',
              provider_text: fieldTexts.provider_text,
              instructor_label: fieldTexts.instructor_label,
              date_label: fieldTexts.date_label,
              certificate_number_label: fieldTexts.certificate_number_label,
              total_hours_label: fieldTexts.total_hours_label,
              completion_text: fieldTexts.completion_text,
              skills_label: fieldTexts.skills_label,
              template_id: params.templateId,
              organization_slug: params.organizationSlug,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingCert.id);
        } else {
          certificateId = null;
          certificatenumber = null;
        }
      }

      if (!certificateId || !certificatenumber) {
        certificatenumber = generateCertificateNumber(org);
        await new Promise((r) => setTimeout(r, 5));
        certificateurl = buildCertificatePublicUrl(
          params.organizationSlug,
          certificatenumber
        );

        const certificatePayload = {
          fullname: row.recipient_name,
          coursename: courseName,
          issuedate: formatIssueDateForDb(),
          instructor: params.instructor || '',
          duration: '',
          language: locale === 'en' ? 'en' : 'tr',
          certificate_title: title,
          provider_text: fieldTexts.provider_text,
          instructor_label: fieldTexts.instructor_label,
          date_label: fieldTexts.date_label,
          certificate_number_label: fieldTexts.certificate_number_label,
          total_hours_label: fieldTexts.total_hours_label,
          completion_text: fieldTexts.completion_text,
          skills_label: fieldTexts.skills_label,
          description,
          organization_slug: params.organizationSlug,
          certificatenumber,
          certificateurl,
          template_id: params.templateId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: created, error: insertError } = await supabase
          .from('certificates')
          .insert(certificatePayload)
          .select('id, certificatenumber, certificateurl')
          .single();

        if (insertError || !created) {
          throw new Error(insertError?.message || 'Certificate insert failed');
        }

        certificateId = created.id;
        certificatenumber = created.certificatenumber;
        certificateurl = created.certificateurl || certificateurl;
      }

      if (!certificateId || !certificatenumber) {
        throw new Error('Certificate id/number missing after create');
      }

      const publicUrl =
        certificateurl ||
        buildCertificatePublicUrl(params.organizationSlug, certificatenumber);

      const emailResult = await sendCertificateCompletionEmail(
        { name: row.recipient_name, email: row.recipient_email },
        { title: courseName, description },
        certificatenumber,
        publicUrl,
        locale,
        params.customMessage?.trim() || '',
        org.name || params.organizationSlug
      );

      const nowIso = new Date().toISOString();
      const { error: updateError } = await supabase
        .from(CERTIFICATE_ISSUANCE_TABLE)
        .update({
          status: 'issued',
          issued_certificate_id: certificateId,
          issued_certificatenumber: certificatenumber,
          issued_at: nowIso,
          email_sent_at: emailResult.success ? nowIso : null,
          error: emailResult.success ? null : emailResult.error || 'Email failed',
          updated_at: nowIso,
        })
        .eq('id', row.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      result.issued += 1;
      if (emailResult.success) result.emailed += 1;
      else {
        result.failed += 1;
        result.errors.push({
          id: row.id,
          error: emailResult.error || 'Email failed after certificate create',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      result.failed += 1;
      result.errors.push({ id: row.id, error: message });
      await supabase
        .from(CERTIFICATE_ISSUANCE_TABLE)
        .update({
          status: 'failed',
          error: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
    }
  }

  return result;
}
