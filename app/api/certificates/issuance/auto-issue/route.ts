import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/app/lib/certificates/issuance';
import { autoIssueDueEventCertificates } from '@/app/lib/certificates/autoIssueDue';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await autoIssueDueEventCertificates();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('Certificate auto-issue error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Auto-issue failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
