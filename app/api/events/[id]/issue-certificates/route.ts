import { NextRequest, NextResponse } from 'next/server';
import { requireEventCertificateToolsUser } from '@/app/api/events/_helpers';
import { issueCertificatesFromQueue } from '@/app/lib/certificates/issueFromQueue';
import {
  CERTIFICATE_ISSUANCE_TABLE,
  getCertificatesServiceSupabase,
} from '@/app/lib/certificates/issuance';
import { syncEventCertificateIssuanceQueue } from '@/app/lib/certificates/syncIssuanceQueue';
import {
  buildDryRunIssueResult,
  resolveTemplateForIssue,
} from '@/app/lib/events/certificateIssue';
import { loadEventCertificateSettings } from '@/app/lib/events/certificateSettings';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Cron kullanmadan, etkinlik düzenleme ekranından süresi dolmuş katılım
 * sertifikalarını oluşturur ve e-posta ile gönderir.
 * Body/query: dryRun=true → kimseye mail gitmeden önizleme.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await requireEventCertificateToolsUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const { id: eventId } = await context.params;
  const supabase = getCertificatesServiceSupabase();

  let dryRun = false;
  try {
    const urlDry = new URL(request.url).searchParams.get('dryRun');
    if (urlDry === '1' || urlDry === 'true') dryRun = true;
    const body = await request.json().catch(() => null);
    if (body && typeof body === 'object' && (body as { dryRun?: unknown }).dryRun) {
      dryRun = true;
    }
  } catch {
    // no body
  }

  try {
    // Yalnızca bu etkinlik: ödeme sync + kuyruk (global LMS sync yok).
    await syncEventCertificateIssuanceQueue(eventId);

    const settings = await loadEventCertificateSettings(supabase, eventId);

    const { data: template, error: templateError } = settings.template_id
      ? await supabase
          .from('certificate_templates')
          .select('id, name, organization_slug')
          .eq('id', settings.template_id)
          .maybeSingle()
      : { data: null, error: null };

    if (templateError) throw new Error(templateError.message);

    const templateResult = resolveTemplateForIssue(settings.template_id, template);

    const nowIso = new Date().toISOString();
    const { data: rows, error: rowsError } = await supabase
      .from(CERTIFICATE_ISSUANCE_TABLE)
      .select('id, eligible_at, recipient_email, recipient_name, status')
      .eq('kind', 'event_participation')
      .eq('event_id', eventId)
      .in('status', ['ready', 'pending', 'failed'])
      .lte('eligible_at', nowIso)
      .order('eligible_at', { ascending: true })
      .limit(500);

    if (rowsError) throw new Error(rowsError.message);

    const dueRows = rows || [];

    if (dryRun) {
      let nextEligibleAt: string | null = null;
      if (!dueRows.length) {
        const { data: nextRow } = await supabase
          .from(CERTIFICATE_ISSUANCE_TABLE)
          .select('eligible_at')
          .eq('kind', 'event_participation')
          .eq('event_id', eventId)
          .in('status', ['ready', 'pending', 'failed'])
          .order('eligible_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        nextEligibleAt = nextRow?.eligible_at || null;
      }

      const preview = buildDryRunIssueResult({
        templateResult,
        dueRows,
        nextEligibleAt,
      });
      return NextResponse.json({ success: true, ...preview });
    }

    if (!templateResult.ok) {
      return NextResponse.json({ error: templateResult.error }, { status: 400 });
    }

    if (!dueRows.length) {
      const { data: nextRow } = await supabase
        .from(CERTIFICATE_ISSUANCE_TABLE)
        .select('eligible_at')
        .eq('kind', 'event_participation')
        .eq('event_id', eventId)
        .in('status', ['ready', 'pending', 'failed'])
        .order('eligible_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        issued: 0,
        emailed: 0,
        failed: 0,
        message: nextRow?.eligible_at
          ? 'Bekleme süresi henüz dolmadı.'
          : 'Gönderilecek uygun (ödenmiş sertifika paketi) kaydı bulunamadı.',
        eligibleAt: nextRow?.eligible_at || null,
      });
    }

    const { data: organization } = await supabase
      .from('organizations')
      .select('slug, name, abbreviation')
      .eq('slug', templateResult.organizationSlug)
      .maybeSingle();

    const result = await issueCertificatesFromQueue({
      queueIds: dueRows.map((row) => String(row.id)),
      templateId: templateResult.templateId,
      organizationSlug: templateResult.organizationSlug,
      organizationName: organization?.name || templateResult.organizationSlug,
      organizationAbbreviation: organization?.abbreviation || undefined,
      description: settings.certificate_description || undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
      queued: dueRows.length,
      message:
        result.failed > 0
          ? `${result.issued} e-posta gönderildi, ${result.failed} başarısız (kuyrukta kaldı).`
          : `${result.issued} sertifika oluşturuldu, ${result.emailed} e-posta gönderildi.`,
    });
  } catch (error) {
    console.error('Manual event certificate issue error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Sertifikalar gönderilemedi.',
      },
      { status: 500 }
    );
  }
}
