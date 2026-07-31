import { NextRequest, NextResponse } from 'next/server';
import { requireEventsRegistrantToolsUser } from '@/app/api/events/_helpers';
import { issueCertificatesFromQueue } from '@/app/lib/certificates/issueFromQueue';
import {
  CERTIFICATE_ISSUANCE_TABLE,
  getCertificatesServiceSupabase,
} from '@/app/lib/certificates/issuance';
import { syncCertificateIssuanceQueue } from '@/app/lib/certificates/syncIssuanceQueue';
import { loadEventCertificateSettings } from '@/app/lib/events/certificateSettings';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Cron kullanmadan, etkinlik düzenleme ekranından süresi dolmuş katılım
 * sertifikalarını oluşturur ve e-posta ile gönderir.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  const authResult = await requireEventsRegistrantToolsUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const { id: eventId } = await context.params;
  const supabase = getCertificatesServiceSupabase();

  try {
    // Ödeme durumlarını ve eligible_at zamanlarını güncel kuyruğa yansıt.
    await syncCertificateIssuanceQueue();

    const settings = await loadEventCertificateSettings(supabase, eventId);
    if (!settings.template_id) {
      return NextResponse.json(
        { error: 'Önce bir katılım sertifikası şablonu seçin.' },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const { data: rows, error: rowsError } = await supabase
      .from(CERTIFICATE_ISSUANCE_TABLE)
      .select('id, eligible_at')
      .eq('kind', 'event_participation')
      .eq('event_id', eventId)
      .in('status', ['ready', 'pending', 'failed'])
      .lte('eligible_at', nowIso)
      .order('eligible_at', { ascending: true })
      .limit(500);

    if (rowsError) throw new Error(rowsError.message);

    if (!rows?.length) {
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
          : 'Gönderilecek uygun sertifika kaydı bulunamadı.',
        eligibleAt: nextRow?.eligible_at || null,
      });
    }

    const { data: template, error: templateError } = await supabase
      .from('certificate_templates')
      .select('id, name, organization_slug')
      .eq('id', settings.template_id)
      .maybeSingle();

    if (templateError) throw new Error(templateError.message);
    if (!template?.organization_slug) {
      return NextResponse.json(
        { error: 'Seçilen şablon veya şablon organizasyonu bulunamadı.' },
        { status: 400 }
      );
    }

    const { data: organization } = await supabase
      .from('organizations')
      .select('slug, name, abbreviation')
      .eq('slug', template.organization_slug)
      .maybeSingle();

    const result = await issueCertificatesFromQueue({
      queueIds: rows.map((row) => String(row.id)),
      templateId: Number(template.id),
      organizationSlug: template.organization_slug,
      organizationName: organization?.name || template.organization_slug,
      organizationAbbreviation: organization?.abbreviation || undefined,
      description: settings.certificate_description || undefined,
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: `${result.issued} sertifika oluşturuldu, ${result.emailed} e-posta gönderildi.`,
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
