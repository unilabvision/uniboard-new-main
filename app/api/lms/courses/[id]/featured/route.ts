import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { revalidatePublicCourseCache } from '@/app/lib/lms/revalidatePublicCourseCache.server';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.is_featured !== 'boolean') {
    return NextResponse.json({ error: 'is_featured boolean olmalı' }, { status: 400 });
  }

  const { id } = await context.params;
  const { data, error } = await authResult.supabase
    .from('myuni_courses')
    .update({ is_featured: body.is_featured })
    .eq('id', id)
    .select('id, is_featured')
    .maybeSingle();

  if (error) {
    console.error('[lms/courses/featured] update failed:', error.message);
    return NextResponse.json({ error: 'Öne çıkarma durumu güncellenemedi' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Kurs bulunamadı' }, { status: 404 });
  }

  await revalidatePublicCourseCache();

  return NextResponse.json({ success: true, course: data });
}
