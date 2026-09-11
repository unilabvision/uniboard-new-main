/**
 * Katılım sertifikası gönderim yardımcıları (pure + test edilebilir).
 */

export type CertificateTemplateRow = {
  id: number | string;
  name?: string | null;
  organization_slug?: string | null;
};

export type ResolveTemplateResult =
  | {
      ok: true;
      templateId: number;
      name: string;
      organizationSlug: string;
    }
  | {
      ok: false;
      code: 'missing_template_id' | 'template_not_found' | 'missing_org_slug';
      error: string;
      templateId?: number | null;
    };

export type QueueRowForPreview = {
  id?: string;
  status: string;
  eligible_at?: string | null;
  recipient_email?: string | null;
  recipient_name?: string | null;
};

export type QueuePreviewSummary = {
  readyDue: number;
  pendingWait: number;
  failed: number;
  failedDue: number;
  issued: number;
  wouldIssue: number;
  totalInQueue: number;
  dueRecipients: Array<{ id?: string; email: string; name: string }>;
};

export type DryRunIssueResult = {
  dryRun: true;
  canSend: boolean;
  templateId: number | null;
  templateName: string | null;
  organizationSlug: string | null;
  wouldIssue: number;
  recipients: Array<{ id?: string; email: string; name: string }>;
  nextEligibleAt: string | null;
  message: string;
  templateError?: string;
};

/** UI kaydetmeden göndermesin — dirty veya template yoksa engelle. */
export function validateSaveBeforeSend(input: {
  templateId: number | null | undefined;
  dirty?: boolean;
}): { ok: true } | { ok: false; error: string } {
  if (!input.templateId) {
    return {
      ok: false,
      error: 'Gönderim için bir sertifika şablonu seçip ayarları kaydedin.',
    };
  }
  if (input.dirty) {
    return {
      ok: false,
      error: 'Kaydedilmemiş değişiklikler var. Önce ayarları kaydedin.',
    };
  }
  return { ok: true };
}

export function resolveTemplateForIssue(
  templateId: number | null | undefined,
  template: CertificateTemplateRow | null | undefined
): ResolveTemplateResult {
  if (templateId == null || !Number.isFinite(Number(templateId)) || Number(templateId) <= 0) {
    return {
      ok: false,
      code: 'missing_template_id',
      error: 'Önce bir katılım sertifikası şablonu seçip ayarları kaydedin.',
      templateId: templateId ?? null,
    };
  }

  const id = Number(templateId);
  if (!template) {
    return {
      ok: false,
      code: 'template_not_found',
      error: `Şablon bulunamadı (id=${id}). Ayarları kaydedip şablonu yeniden seçin.`,
      templateId: id,
    };
  }

  const orgSlug = String(template.organization_slug || '').trim();
  if (!orgSlug) {
    return {
      ok: false,
      code: 'missing_org_slug',
      error: `“${template.name || 'Şablon'}” kaydında organizasyon slug boş. Sertifikalar → Şablonlar’dan organizasyonu bağlayın.`,
      templateId: id,
    };
  }

  return {
    ok: true,
    templateId: Number(template.id) || id,
    name: String(template.name || 'Şablon'),
    organizationSlug: orgSlug,
  };
}

export function summarizeQueuePreview(
  rows: QueueRowForPreview[],
  nowMs: number = Date.now()
): QueuePreviewSummary {
  let readyDue = 0;
  let pendingWait = 0;
  let failed = 0;
  let failedDue = 0;
  let issued = 0;
  const dueRecipients: QueuePreviewSummary['dueRecipients'] = [];

  for (const row of rows) {
    if (row.status === 'issued') {
      issued += 1;
      continue;
    }

    const eligibleMs = row.eligible_at ? new Date(row.eligible_at).getTime() : 0;
    const due = !row.eligible_at || eligibleMs <= nowMs;

    if (row.status === 'failed') {
      failed += 1;
      if (due) {
        failedDue += 1;
        dueRecipients.push({
          id: row.id,
          email: String(row.recipient_email || '').trim().toLowerCase(),
          name: String(row.recipient_name || '').trim() || '—',
        });
      }
      continue;
    }

    if (!['ready', 'pending'].includes(row.status)) continue;

    if (due) {
      readyDue += 1;
      dueRecipients.push({
        id: row.id,
        email: String(row.recipient_email || '').trim().toLowerCase(),
        name: String(row.recipient_name || '').trim() || '—',
      });
    } else {
      pendingWait += 1;
    }
  }

  return {
    readyDue,
    pendingWait,
    failed,
    failedDue,
    issued,
    wouldIssue: readyDue + failedDue,
    totalInQueue: rows.length,
    dueRecipients,
  };
}

export function buildDryRunIssueResult(input: {
  templateResult: ResolveTemplateResult;
  dueRows: QueueRowForPreview[];
  nextEligibleAt?: string | null;
}): DryRunIssueResult {
  const { templateResult, dueRows, nextEligibleAt = null } = input;

  if (!templateResult.ok) {
    return {
      dryRun: true,
      canSend: false,
      templateId: templateResult.templateId ?? null,
      templateName: null,
      organizationSlug: null,
      wouldIssue: 0,
      recipients: [],
      nextEligibleAt,
      message: templateResult.error,
      templateError: templateResult.error,
    };
  }

  const recipients = dueRows.map((row) => ({
    id: row.id,
    email: String(row.recipient_email || '').trim().toLowerCase(),
    name: String(row.recipient_name || '').trim() || '—',
  }));

  if (recipients.length === 0) {
    return {
      dryRun: true,
      canSend: false,
      templateId: templateResult.templateId,
      templateName: templateResult.name,
      organizationSlug: templateResult.organizationSlug,
      wouldIssue: 0,
      recipients: [],
      nextEligibleAt,
      message: nextEligibleAt
        ? 'Bekleme süresi henüz dolmadı — dry-run: 0 alıcı.'
        : 'Gönderilecek uygun (ödenmiş sertifika paketi) kaydı yok — dry-run: 0 alıcı.',
    };
  }

  return {
    dryRun: true,
    canSend: true,
    templateId: templateResult.templateId,
    templateName: templateResult.name,
    organizationSlug: templateResult.organizationSlug,
    wouldIssue: recipients.length,
    recipients,
    nextEligibleAt,
    message: `Dry-run: ${recipients.length} kişiye “${templateResult.name}” (${templateResult.organizationSlug}) ile gönderilecek.`,
  };
}
