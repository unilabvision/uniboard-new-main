import { NextRequest, NextResponse } from 'next/server';
import { requireCertificatesModuleUser } from '@/app/lib/certificates/access';
import {
  CERTIFICATE_ISSUANCE_TABLE,
  type CertificateIssuanceKind,
  type CertificateIssuanceStatus,
} from '@/app/lib/certificates/issuance';
import { syncCertificateIssuanceQueue } from '@/app/lib/certificates/syncIssuanceQueue';

export async function GET(request: NextRequest) {
  const authResult = await requireCertificatesModuleUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = request.nextUrl;
  const kind = searchParams.get('kind') as CertificateIssuanceKind | null;
  const status = searchParams.get('status') as CertificateIssuanceStatus | null;
  const sync = searchParams.get('sync') === '1';

  if (sync) {
    try {
      await syncCertificateIssuanceQueue();
    } catch (err) {
      console.error('Issuance list sync warning:', err);
    }
  }

  let query = authResult.supabase
    .from(CERTIFICATE_ISSUANCE_TABLE)
    .select('*', { count: 'exact' })
    .order('eligible_at', { ascending: false })
    .limit(200);

  if (kind === 'event_participation' || kind === 'course_achievement') {
    query = query.eq('kind', kind);
  }
  if (status) {
    query = query.eq('status', status);
  } else {
    query = query.in('status', ['ready', 'pending', 'failed']);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: data ?? [],
    total: count ?? 0,
  });
}
