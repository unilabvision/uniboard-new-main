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
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { isCertificateEligible } from '@/app/lib/certificates/syncIssuanceQueue';

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

function readSubmission(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

type EventCertificateLinkInput = {
  row: CertificateIssuanceRow;
  submission: Record<string, unknown>;
  certificateId: number;
  certificateNumber: string;
  certificateUrl: string;
  organizationName: string;
  instructor: string;
  duration: string;
};

async function linkEventCertificateToUser(
  supabase: ReturnType<typeof getCertificatesServiceSupabase>,
  input: EventCertificateLinkInput
) {
  const userId =
    typeof input.submission.certificate_user_id === 'string'
      ? input.submission.certificate_user_id.trim()
      : '';
  if (input.row.kind !== 'event_participation' || !input.row.event_id || !userId) return;

  const payload = {
    certificate_number: input.certificateNumber,
    user_id: userId,
    event_id: input.row.event_id,
    student_full_name: input.row.recipient_name,
    event_name: input.row.event_name || 'Etkinlik',
    organizer_name: input.instructor,
    event_duration: input.duration,
    organization_name: input.organizationName,
    organization_description: '',
    organizer_bio: '',
    certificate_url: input.certificateUrl,
    certificate_metadata: {
      source: 'uniboard_issuance',
      source_id: input.row.source_id,
      public_certificate_id: input.certificateId,
    },
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: existingError } = await supabase
    .from('myuni_event_certificates')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', input.row.event_id)
    .eq('is_active', true)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  const query = existing?.id
    ? supabase.from('myuni_event_certificates').update(payload).eq('id', existing.id)
    : supabase.from('myuni_event_certificates').insert(payload);
  const { error } = await query;
  if (error) throw new Error(error.message);
}

function formatIssueDateForDb(): string {
  // certificates.issuedate — create sayfası ile aynı (YYYY-MM-DD); görüntüleme renderer'da locale ile yapılır
  return new Date().toISOString().split('T')[0];
}

export async function issueCertificatesFromQueue(
  params: IssueRequestItem
): Promise<IssueResult> {
  const supabase = getCertificatesServiceSupabase();
  const queueIds = [...new Set(params.queueIds.filter(Boolean))];
  const result: IssueResult = { issued: 0, emailed: 0, failed: 0, skipped: 0, errors: [] };

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

  const applicationIds = (rows || [])
    .filter((row) => row.source_type === 'site_application')
    .map((row) => row.source_id);
  const applicationsById = new Map<string, Record<string, unknown>>();

  if (applicationIds.length > 0) {
    const { data: applications, error: applicationsError } = await supabase
      .from(siteApplicationsDb.applications)
      .select('id, submission_data')
      .in('id', applicationIds);

    if (applicationsError) {
      throw new Error(applicationsError.message);
    }
    for (const application of applications || []) {
      applicationsById.set(String(application.id), readSubmission(application.submission_data));
    }
  }

  for (const row of (rows || []) as CertificateIssuanceRow[]) {
    try {
      if (row.source_type === 'site_application') {
        const submission = applicationsById.get(row.source_id);
        if (!submission || !isCertificateEligible(submission)) {
          const message = 'Certificate package payment is no longer valid';
          await supabase
            .from(CERTIFICATE_ISSUANCE_TABLE)
            .update({ status: 'skipped', error: message, updated_at: new Date().toISOString() })
            .eq('id', row.id);
          result.skipped = (result.skipped || 0) + 1;
          continue;
        }
      }

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

      const sourceSubmission = applicationsById.get(row.source_id) || {};
      await linkEventCertificateToUser(supabase, {
        row,
        submission: sourceSubmission,
        certificateId,
        certificateNumber: certificatenumber,
        certificateUrl: publicUrl,
        organizationName: org.name || params.organizationSlug,
        instructor: params.instructor?.trim() || '',
        duration: params.duration?.trim() || '',
      });

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
