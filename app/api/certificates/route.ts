import { NextRequest, NextResponse } from 'next/server';
import { requireCertificatesCapability } from '@/app/lib/certificates/access';
import { CERTIFICATE_ISSUANCE_TABLE } from '@/app/lib/certificates/issuance';

function parseIds(body: unknown): number[] {
  if (!body || typeof body !== 'object') return [];
  const raw = (body as { ids?: unknown; id?: unknown }).ids ?? (body as { id?: unknown }).id;
  const list = Array.isArray(raw) ? raw : [raw];
  return [
    ...new Set(
      list
        .map((value) => Number(value))
        .filter((id) => Number.isFinite(id) && id > 0)
    ),
  ];
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireCertificatesCapability('create');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json(
      { error: authResult.error || 'Unauthorized' },
      { status: authResult.status }
    );
  }

  const body = await request.json().catch(() => ({}));
  const ids = parseIds(body);
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }

  const { data: existing, error: loadError } = await authResult.supabase
    .from('certificates')
    .select('id')
    .in('id', ids);

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }

  const foundIds = (existing || []).map((row) => Number(row.id));
  if (foundIds.length === 0) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  const nowIso = new Date().toISOString();
  const { error: queueError } = await authResult.supabase
    .from(CERTIFICATE_ISSUANCE_TABLE)
    .update({
      status: 'skipped',
      issued_certificate_id: null,
      issued_certificatenumber: null,
      email_sent_at: null,
      error: 'Certificate deleted',
      updated_at: nowIso,
    })
    .in('issued_certificate_id', foundIds);

  if (queueError) {
    console.warn('Certificate delete: queue unlink warning:', queueError.message);
  }

  const { data: deleted, error: deleteError } = await authResult.supabase
    .from('certificates')
    .delete()
    .in('id', foundIds)
    .select('id');

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deleted: (deleted || []).length,
    ids: (deleted || []).map((row) => row.id),
  });
}
