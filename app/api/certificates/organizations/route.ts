import { requireCertificatesModuleUser } from '@/app/lib/certificates/access';
import { resolveCertificateOrganizationSlugs } from '@/app/lib/certificates/organizationScope';

export async function GET() {
  const authResult = await requireCertificatesModuleUser();
  if (authResult.error || !authResult.supabase) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }

  const allowedSlugs = await resolveCertificateOrganizationSlugs({
    supabase: authResult.supabase,
    clerkUserId: authResult.userId,
    isSuperAdmin: authResult.isSuperAdmin,
  });
  if (allowedSlugs && allowedSlugs.length === 0) {
    return Response.json({ organizations: [] });
  }

  let query = authResult.supabase
    .from('organizations')
    .select('id, slug, name')
    .order('name', { ascending: true });
  if (allowedSlugs) query = query.in('slug', allowedSlugs);
  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ organizations: data || [] });
}
