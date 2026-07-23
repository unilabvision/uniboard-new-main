import { NextRequest, NextResponse } from 'next/server';
import { requireCertificatesCapability } from '@/app/lib/certificates/access';
import {
  CERTIFICATE_ISSUANCE_TABLE,
  type CertificateIssuanceKind,
  type CertificateIssuanceStatus,
} from '@/app/lib/certificates/issuance';
import {
  resolveLatestEventForIssuance,
  syncCertificateIssuanceQueue,
} from '@/app/lib/certificates/syncIssuanceQueue';

export async function GET(request: NextRequest) {
  const authResult = await requireCertificatesCapability('issuance');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = request.nextUrl;
  const kind = searchParams.get('kind') as CertificateIssuanceKind | null;
  const status = searchParams.get('status') as CertificateIssuanceStatus | null;
  const sync = searchParams.get('sync') === '1';

  let latestEvent: Awaited<ReturnType<typeof resolveLatestEventForIssuance>> = null;
  let syncMeta: unknown = null;

  if (sync) {
    try {
      syncMeta = await syncCertificateIssuanceQueue();
      latestEvent =
        (syncMeta as { events?: { latestEvent?: typeof latestEvent } })?.events
          ?.latestEvent || null;
    } catch (err) {
      console.error('Issuance list sync warning:', err);
    }
  }

  if (!latestEvent && kind === 'event_participation') {
    try {
      latestEvent = await resolveLatestEventForIssuance();
    } catch (err) {
      console.error('Issuance latest event resolve warning:', err);
    }
  }

  let query = authResult.supabase
    .from(CERTIFICATE_ISSUANCE_TABLE)
    .select('*', { count: 'exact' })
    .order('eligible_at', { ascending: false })
    .limit(500);

  if (kind === 'event_participation' || kind === 'course_achievement') {
    query = query.eq('kind', kind);
  }
  if (kind === 'event_participation' && latestEvent?.id) {
    query = query.eq('event_id', latestEvent.id);
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
    latestEvent,
    sync: syncMeta,
  });
}
