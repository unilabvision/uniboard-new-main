import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/app/lib/certificates/issuance';
import { syncCertificateIssuanceQueue } from '@/app/lib/certificates/syncIssuanceQueue';

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
  return GET(request);
}
