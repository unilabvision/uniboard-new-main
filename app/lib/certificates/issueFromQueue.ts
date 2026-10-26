import { sendCertificateCompletionEmail } from '@/app/_services/emailService';
import {
  CERTIFICATE_ISSUANCE_TABLE,
  buildCertificatePublicUrl,
  generateCertificateNumber,
  getCertificatesServiceSupabase,
  type CertificateIssuanceRow,
  type OrganizationForNumber,
} from '@/app/lib/certificates/issuance';
import { buildIssuanceCertificateFields } from '@/app/lib/certificates/issuanceFields';

export type IssueRequestItem = {
  queueIds: string[];
  templateId: number;
  organizationSlug: string;
  organizationName?: string;
  organizationAbbreviation?: string;
  instructor?: string;
  duration?: string;
  description?: string;
  customMessage?: string;
  locale?: string;
};

export type IssueResult = {
  issued: number;
  emailed: number;
  failed: number;
  skipped?: number;
  errors: Array<{ id: string; error: string }>;
};

function formatIssueDateForDb(): string {
  // certificates.issuedate — create sayfası ile aynı (YYYY-MM-DD); görüntüleme renderer'da locale ile yapılır
  return new Date().toISOString().split('T')[0];
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
      // Avoid Gmail SMTP 454 "Too many login attempts" on bulk issue.
      await new Promise((r) => setTimeout(r, 1500));

      const courseName =
        row.kind === 'event_participation'
          ? row.event_name || 'Etkinlik'
          : row.course_name || 'Kurs';
      const locale = params.locale || row.locale || 'tr';
      const certificateFields = buildIssuanceCertificateFields({
        kind: row.kind,
        locale,
        recipientName: row.recipient_name,
        sourceName: courseName,
        certificateTitle: row.certificate_title,
        description: params.description,
        instructor: params.instructor,
        duration: params.duration,
        templateId: params.templateId,
        organizationSlug: params.organizationSlug,
      });
      const description = certificateFields.description;
      const certificateUpdates = {
        ...certificateFields,
        updated_at: new Date().toISOString(),
      };

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
            .update(certificateUpdates)
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
          ...certificateFields,
          issuedate: formatIssueDateForDb(),
          certificatenumber,
          certificateurl,
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
      // Keep issued_certificate_id so a retry reuses the cert; mark failed if email
      // did not send so the row stays in the issuance queue.
      const { error: updateError } = await supabase
        .from(CERTIFICATE_ISSUANCE_TABLE)
        .update({
          status: emailResult.success ? 'issued' : 'failed',
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

      if (emailResult.success) {
        result.issued += 1;
        result.emailed += 1;
      } else {
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
