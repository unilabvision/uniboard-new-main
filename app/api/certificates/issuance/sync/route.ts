import { NextRequest, NextResponse } from 'next/server';
import { requireCertificatesCapability } from '@/app/lib/certificates/access';
import { isCronAuthorized } from '@/app/lib/certificates/issuance';
import {
  syncCertificateIssuanceQueue,
  syncEventCertificateIssuanceQueue,
} from '@/app/lib/certificates/syncIssuanceQueue';

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncCertificateIssuanceQueue();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('Certificate issuance sync error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireCertificatesCapability('issuance');
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : '';
    const kind = body.kind === 'course_achievement' ? 'course_achievement' : 'event_participation';
    const result =
      kind === 'event_participation' && eventId
        ? await syncEventCertificateIssuanceQueue(eventId)
        : await syncCertificateIssuanceQueue();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('Certificate issuance manual sync error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
