import { issueCertificatesFromQueue } from '@/app/lib/certificates/issueFromQueue';
import {
  CERTIFICATE_ISSUANCE_TABLE,
  getCertificatesServiceSupabase,
} from '@/app/lib/certificates/issuance';
import { loadEventCertificateSettings } from '@/app/lib/events/certificateSettings';
import { syncCertificateIssuanceQueue } from '@/app/lib/certificates/syncIssuanceQueue';

export type AutoIssueResult = {
  synced: Awaited<ReturnType<typeof syncCertificateIssuanceQueue>>;
  promoted: number;
  issued: number;
  emailed: number;
  failed: number;
  skipped: number;
  errors: Array<{ id: string; error: string }>;
  events: Array<{
    eventId: string;
    eventName: string | null;
    queueCount: number;
    issued: number;
    failed: number;
  }>;
};

/**
 * Süresi dolmuş (eligible_at <= now) ve otomatik gönderimi açık etkinliklerin
 * katılım sertifikalarını şablonla oluşturup e-posta ile iletir.
 */
export async function autoIssueDueEventCertificates(
  options: { limit?: number } = {}
): Promise<AutoIssueResult> {
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500);
  const supabase = getCertificatesServiceSupabase();
  const synced = await syncCertificateIssuanceQueue();

  const nowIso = new Date().toISOString();

  // pending → ready: süresi dolan satırları yükselt
  const { data: pendingDue } = await supabase
    .from(CERTIFICATE_ISSUANCE_TABLE)
    .select('id')
    .eq('kind', 'event_participation')
    .eq('status', 'pending')
    .lte('eligible_at', nowIso)
    .limit(limit);

  let promoted = 0;
  if (pendingDue?.length) {
    const { error } = await supabase
      .from(CERTIFICATE_ISSUANCE_TABLE)
      .update({ status: 'ready', updated_at: nowIso })
      .in(
        'id',
        pendingDue.map((row) => row.id)
      );
    if (!error) promoted = pendingDue.length;
  }

  const { data: dueRows, error: dueError } = await supabase
    .from(CERTIFICATE_ISSUANCE_TABLE)
    .select('*')
    .eq('kind', 'event_participation')
    .in('status', ['ready', 'failed'])
    .lte('eligible_at', nowIso)
    .not('event_id', 'is', null)
    .order('eligible_at', { ascending: true })
    .limit(limit);

  if (dueError) {
    throw new Error(dueError.message);
  }

  const rows = dueRows || [];
  const byEvent = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!row.event_id) continue;
    const list = byEvent.get(row.event_id) || [];
    list.push(row);
    byEvent.set(row.event_id, list);
  }

  const result: AutoIssueResult = {
    synced,
    promoted,
    issued: 0,
    emailed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    events: [],
  };

  for (const [eventId, eventRows] of byEvent) {
    const settings = await loadEventCertificateSettings(supabase, eventId);
    if (!settings.certificate_auto_issue) {
      result.skipped += eventRows.length;
      continue;
    }
    if (!settings.template_id) {
      result.skipped += eventRows.length;
      result.errors.push({
        id: eventId,
        error: 'Otomatik gönderim açık ama sertifika şablonu seçilmemiş',
      });
      continue;
    }

    const { data: template } = await supabase
      .from('certificate_templates')
      .select('id, name, organization_slug')
      .eq('id', settings.template_id)
      .maybeSingle();

    if (!template?.organization_slug) {
      result.skipped += eventRows.length;
      result.errors.push({
        id: eventId,
        error: `Şablon bulunamadı veya organizasyon yok (template_id=${settings.template_id})`,
      });
      continue;
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('slug, name, abbreviation')
      .eq('slug', template.organization_slug)
      .maybeSingle();

    const issueResult = await issueCertificatesFromQueue({
      queueIds: eventRows.map((row) => String(row.id)),
      templateId: Number(template.id),
      organizationSlug: template.organization_slug,
      organizationName: org?.name || template.organization_slug,
      organizationAbbreviation: org?.abbreviation || undefined,
      description: settings.certificate_description || undefined,
    });

    result.issued += issueResult.issued;
    result.emailed += issueResult.emailed;
    result.failed += issueResult.failed;
    result.errors.push(...issueResult.errors);
    result.events.push({
      eventId,
      eventName: eventRows[0]?.event_name || null,
      queueCount: eventRows.length,
      issued: issueResult.issued,
      failed: issueResult.failed,
    });
  }

  return result;
}
