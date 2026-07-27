import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;

  let body: {
    is_registration_open?: unknown;
    registration_deadline?: unknown;
    clear_deadline_if_expired?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.is_registration_open !== 'boolean' && body.registration_deadline === undefined) {
    return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
  }

  const { data: existing, error: loadError } = await authResult.supabase
    .from('myuni_courses')
    .select('id, is_registration_open, registration_deadline')
    .eq('id', id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: 'Kurs bulunamadı' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.is_registration_open === 'boolean') {
    updates.is_registration_open = body.is_registration_open;
  }

  if (body.registration_deadline !== undefined) {
    if (body.registration_deadline === null || body.registration_deadline === '') {
      updates.registration_deadline = null;
    } else {
      const deadline = new Date(String(body.registration_deadline));
      if (Number.isNaN(deadline.getTime())) {
        return NextResponse.json({ error: 'Geçersiz kayıt son tarihi' }, { status: 400 });
      }
      updates.registration_deadline = deadline.toISOString();
    }
  }

  // Opening registration while deadline is already past would still show "Kayıt Kapalı"
  // on the public site — clear expired deadline unless a new one was provided.
  const opening =
    typeof body.is_registration_open === 'boolean'
      ? body.is_registration_open === true
      : existing.is_registration_open === true;
  const clearIfExpired = body.clear_deadline_if_expired !== false;
  if (
    opening &&
    clearIfExpired &&
    body.registration_deadline === undefined &&
    existing.registration_deadline &&
    new Date(existing.registration_deadline).getTime() <= Date.now()
  ) {
    updates.registration_deadline = null;
  }

  const { data, error } = await authResult.supabase
    .from('myuni_courses')
    .update(updates)
    .eq('id', id)
    .select('id, is_registration_open, registration_deadline')
    .single();

  if (error) {
    console.error('LMS registration update error:', error);
    return NextResponse.json({ error: error.message || 'Kayıt durumu güncellenemedi' }, { status: 500 });
  }

  return NextResponse.json({ success: true, course: data });
}
