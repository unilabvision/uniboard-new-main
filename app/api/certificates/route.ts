import { NextRequest, NextResponse } from 'next/server';
import {
  requireCertificatesCapability,
  requireCertificatesModuleUser,
} from '@/app/lib/certificates/access';
import { CERTIFICATE_ISSUANCE_TABLE } from '@/app/lib/certificates/issuance';
import { resolveCertificateOrganizationSlugs } from '@/app/lib/certificates/organizationScope';

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

export async function GET() {
  const authResult = await requireCertificatesModuleUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const allowedSlugs = await resolveCertificateOrganizationSlugs({
      supabase: authResult.supabase,
      clerkUserId: authResult.userId,
      isSuperAdmin: authResult.isSuperAdmin,
    });
    if (allowedSlugs && allowedSlugs.length === 0) {
      return NextResponse.json({ certificates: [], organizations: [], total: 0 });
    }

    let organizationQuery = authResult.supabase
      .from('organizations')
      .select('id, slug, name, description, logo, primary_color, secondary_color')
      .order('name', { ascending: true });
    if (allowedSlugs) organizationQuery = organizationQuery.in('slug', allowedSlugs);
    const { data: organizations, error: organizationsError } = await organizationQuery;
    if (organizationsError) throw new Error(organizationsError.message);

    const certificates: Array<Record<string, unknown>> = [];
    const pageSize = 1000;
    const maxRows = 10000;
    for (let offset = 0; offset < maxRows; offset += pageSize) {
      let query = authResult.supabase
        .from('certificates')
        .select(`
          *,
          certificate_templates:template_id (
            id,
            name,
            background_image,
            is_default
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (allowedSlugs) query = query.in('organization_slug', allowedSlugs);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      certificates.push(...((data ?? []) as Array<Record<string, unknown>>));
      if (!data || data.length < pageSize) break;
    }

    return NextResponse.json({
      certificates,
      organizations: organizations ?? [],
      total: certificates.length,
      truncated: certificates.length >= maxRows,
    });
  } catch (error) {
    console.error('Certificate list error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Certificate list failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Preferred: require explicit `delete` capability.
  // Backward-compat: the app historically used `create` for certificate writes
  // (capability key may not exist yet), so allow `create` as a legacy alias.
  let authResult = await requireCertificatesCapability('delete');
  if (authResult.error || !authResult.supabase) {
    const legacy = await requireCertificatesCapability('create');
    if (legacy.error || !legacy.supabase) {
      return NextResponse.json(
        { error: authResult.error || legacy.error || 'Unauthorized' },
        { status: authResult.status || legacy.status }
      );
    }
    authResult = legacy;
  }

  const body = await request.json().catch(() => ({}));
  const ids = parseIds(body);
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }

  const allowedSlugs = await resolveCertificateOrganizationSlugs({
    // service supabase client injected by requireCertificatesCapability
    supabase: authResult.supabase,
    clerkUserId: authResult.userId,
    isSuperAdmin: authResult.isSuperAdmin,
  });

  if (allowedSlugs && allowedSlugs.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let query = authResult.supabase.from('certificates').select('id');
  query = query.in('id', ids);
  if (allowedSlugs) {
    query = query.in('organization_slug', allowedSlugs);
  }

  const { data: existing, error: loadError } = await query;

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
