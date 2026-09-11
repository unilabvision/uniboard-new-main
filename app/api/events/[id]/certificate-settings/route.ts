import { NextRequest, NextResponse } from 'next/server';
import { requireEventCertificateToolsUser } from '@/app/api/events/_helpers';
import {
  CERTIFICATE_ISSUANCE_TABLE,
  getCertificatesServiceSupabase,
} from '@/app/lib/certificates/issuance';
import { isCertificateEligible } from '@/app/lib/certificates/syncIssuanceQueue';
import { summarizeQueuePreview } from '@/app/lib/events/certificateIssue';
import {
  loadEventCertificateSettings,
  saveEventCertificateSettings,
} from '@/app/lib/events/certificateSettings';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';

type RouteContext = { params: Promise<{ id: string }> };

async function loadQueueAndPaidPreview(eventId: string) {
  const supabase = getCertificatesServiceSupabase();
  const nowIso = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from(CERTIFICATE_ISSUANCE_TABLE)
    .select('id, status, eligible_at, recipient_email, recipient_name')
    .eq('kind', 'event_participation')
    .eq('event_id', eventId)
    .in('status', ['ready', 'pending', 'failed', 'issued'])
    .limit(3000);

  if (error) {
    console.error('Certificate queue preview error:', error.message);
  }

  const summary = summarizeQueuePreview(rows || []);

  // Başvurulardan ödenmiş sertifika paketi sayısı (kuyruk dışı doğrulama)
  let paidCertificateApps = 0;
  let pendingCertificateApps = 0;
  const { data: apps } = await supabase
    .from(siteApplicationsDb.applications)
    .select('id, submission_data')
    .eq('event_id', eventId)
    .limit(3000);

  for (const app of apps || []) {
    const sub =
      app.submission_data && typeof app.submission_data === 'object'
        ? (app.submission_data as Record<string, unknown>)
        : {};
    if (sub.registration_tier !== 'certificate') continue;
    if (isCertificateEligible(sub)) paidCertificateApps += 1;
    else if (sub.payment_status === 'pending') pendingCertificateApps += 1;
  }

  return {
    ...summary,
    paidCertificateApps,
    pendingCertificateApps,
    asOf: nowIso,
    // Panel listesinde ilk 20 due alıcı
    sampleDue: summary.dueRecipients.slice(0, 20),
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireEventCertificateToolsUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const settings = await loadEventCertificateSettings(authResult.supabase, id);

    const { data: templates } = await authResult.supabase
      .from('certificate_templates')
      .select('id, name, organization_slug, is_default')
      .order('name', { ascending: true });

    const queue = await loadQueueAndPaidPreview(id);

    return NextResponse.json({
      settings,
      templates: templates || [],
      queue,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Load failed' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireEventCertificateToolsUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json();
    const settings = await saveEventCertificateSettings(authResult.supabase, id, {
      template_id:
        body.template_id === null || body.template_id === ''
          ? null
          : body.template_id != null
            ? Number(body.template_id)
            : undefined,
      certificate_description:
        body.certificate_description !== undefined
          ? body.certificate_description == null
            ? null
            : String(body.certificate_description)
          : undefined,
      certificate_auto_issue:
        body.certificate_auto_issue !== undefined
          ? Boolean(body.certificate_auto_issue)
          : undefined,
      certificate_delay_minutes:
        body.certificate_delay_minutes !== undefined
          ? Number(body.certificate_delay_minutes)
          : undefined,
    });

    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error('Event certificate settings PATCH error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Save failed' },
      { status: 500 }
    );
  }
}
