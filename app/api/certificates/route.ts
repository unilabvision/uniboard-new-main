import { NextRequest, NextResponse } from 'next/server';
import { requireCertificatesCapability } from '@/app/lib/certificates/access';
import { CERTIFICATE_ISSUANCE_TABLE } from '@/app/lib/certificates/issuance';
import { decodeCertOrgsFromNotes } from '@/app/lib/moduleAccess/rbac';
import type { SupabaseClient } from '@supabase/supabase-js';

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

async function getAllowedCertificateOrgSlugs(params: {
  // Supabase service-role client
  supabase: SupabaseClient;
  clerkUserId: string | null;
  isSuperAdmin: boolean;
}) {
  const { supabase, clerkUserId, isSuperAdmin } = params;

  // Super admin can delete across orgs.
  if (isSuperAdmin) return null;

  if (!clerkUserId) return [];

  type AccessRow = { organization_id: number | string | null; notes: string | null };
  const { data: accessRows, error } = await supabase
    .from('user_module_access')
    .select('organization_id, notes')
    .eq('clerk_user_id', clerkUserId)
    .eq('module_key', 'certificates')
    .eq('is_enabled', true);

  if (error) {
    console.warn('Certificate delete: failed to load access rows:', error.message);
    return [];
  }

  // 1) New scheme: store allowed certificate org slugs in uba_cert_orgs notes.
  for (const row of (accessRows ?? []) as AccessRow[]) {
    const slugs = decodeCertOrgsFromNotes(row.notes);
    if (slugs && slugs.length > 0) return slugs;
  }

  // 2) Legacy scheme: organization_id join.
  const organizationIds = (accessRows ?? [])
    .map((row) => row.organization_id)
    .map((id) => (typeof id === 'string' ? Number(id) : id))
    .filter((id): id is number => Number.isFinite(id));

  if (organizationIds.length === 0) return [];

  const { data: orgs, error: orgErr } = await supabase
    .from('organizations')
    .select('slug')
    .in('id', organizationIds);

  if (orgErr) {
    console.warn('Certificate delete: failed to resolve legacy orgs:', orgErr.message);
    return [];
  }

  type OrgRow = { slug: string | null };
  return ((orgs ?? []) as OrgRow[]).map((o) => o.slug).filter(Boolean);
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

  const allowedSlugs = await getAllowedCertificateOrgSlugs({
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
