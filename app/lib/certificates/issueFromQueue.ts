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
  locale?: string;
};

export type IssueResult = {
  issued: number;
  emailed: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
};

function formatIssueDate(locale: string): string {
  return new Date().toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
      const title =
        row.certificate_title ||
        (row.kind === 'event_participation' ? 'Katılım Sertifikası' : 'Başarı Sertifikası');
      const locale = params.locale || row.locale || 'tr';
      const certificatenumber = generateCertificateNumber(org);
      // kısa gecikme — aynı ms içinde collision azaltır
      await new Promise((r) => setTimeout(r, 5));
      const certificateurl = buildCertificatePublicUrl(
        params.organizationSlug,
        certificatenumber
      );

      const certificatePayload = {
        fullname: row.recipient_name,
        coursename: courseName,
        issuedate: formatIssueDate(locale),
        instructor: params.instructor || '',
        duration: '',
        language: locale === 'en' ? 'en' : 'tr',
        certificate_title: title,
        provider_text: '',
        instructor_label: '',
        date_label: '',
        certificate_number_label: '',
        total_hours_label: '',
        completion_text: '',
        skills_label: '',
        description:
          params.description ||
          (row.kind === 'event_participation'
            ? `${courseName} etkinliğine katılım`
            : `${courseName} kursunu başarıyla tamamladı`),
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

      const emailResult = await sendCertificateCompletionEmail(
        { name: row.recipient_name, email: row.recipient_email },
        { title: courseName, description: certificatePayload.description },
        created.certificatenumber,
        created.certificateurl || certificateurl,
        locale,
        '',
        org.name || params.organizationSlug
      );

      const nowIso = new Date().toISOString();
      const { error: updateError } = await supabase
        .from(CERTIFICATE_ISSUANCE_TABLE)
        .update({
          status: 'issued',
          issued_certificate_id: created.id,
          issued_certificatenumber: created.certificatenumber,
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
