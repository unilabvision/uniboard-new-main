import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { deleteSiteApplication } from '@/app/lib/siteApplications/deleteApplication';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Sadece ilgili başvurunun var olup olmadığını kontrol et
  const { data: existing, error: loadError } = await authResult.supabase
    .from(siteApplicationsDb.applications)
    .select('id, form_id')
    .eq('id', id)
    .maybeSingle();

  if (loadError || !existing) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // İsteğe bağlı: form'un gerçekten bir LMS kurs formu olup olmadığını doğrulayabiliriz
  // Ancak admin yetkisi olduğu için ve siteApplications genel delete foksiyonu kullanıldığı için doğrudan silelim
  const result = await deleteSiteApplication(authResult.supabase, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, id });
}
