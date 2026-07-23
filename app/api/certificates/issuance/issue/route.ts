import { NextRequest, NextResponse } from 'next/server';
import { requireCertificatesCapability } from '@/app/lib/certificates/access';
import { issueCertificatesFromQueue } from '@/app/lib/certificates/issueFromQueue';

export async function POST(request: NextRequest) {
  const authResult = await requireCertificatesCapability('issuance');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json();
    const queueIds = Array.isArray(body.queueIds) ? body.queueIds.map(String) : [];
    const templateId = Number(body.templateId);
    const organizationSlug = String(body.organizationSlug || '').trim();

    if (!queueIds.length) {
      return NextResponse.json({ error: 'queueIds required' }, { status: 400 });
    }
    if (!Number.isFinite(templateId) || templateId <= 0) {
      return NextResponse.json({ error: 'templateId required' }, { status: 400 });
    }
    if (!organizationSlug) {
      return NextResponse.json({ error: 'organizationSlug required' }, { status: 400 });
    }

    const result = await issueCertificatesFromQueue({
      queueIds,
      templateId,
      organizationSlug,
      organizationName: body.organizationName ? String(body.organizationName) : undefined,
      organizationAbbreviation: body.organizationAbbreviation
        ? String(body.organizationAbbreviation)
        : undefined,
      instructor: body.instructor ? String(body.instructor) : undefined,
      description: body.description ? String(body.description) : undefined,
      customMessage: body.customMessage ? String(body.customMessage) : undefined,
      locale: body.locale === 'en' ? 'en' : 'tr',
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('Certificate issue error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Issue failed' },
      { status: 500 }
    );
  }
}
