import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';

/**
 * Course section (bölüm) CRUD — service role, bypasses anon RLS.
 * POST   { course_id, title, description?, order_index? }
 * PATCH  { id, title?, description?, order_index?, is_active?, updates?: [{id, order_index}] }
 * DELETE { id }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json().catch(() => ({}));
  const courseId = String(body.course_id || '').trim();
  const title = String(body.title || '').trim();

  if (!courseId || !title) {
    return NextResponse.json({ error: 'course_id and title are required' }, { status: 400 });
  }

  const orderIndex =
    typeof body.order_index === 'number' && Number.isFinite(body.order_index)
      ? body.order_index
      : 0;

  const { data, error } = await authResult.supabase
    .from('myuni_course_sections')
    .insert([
      {
        course_id: courseId,
        title,
        description: String(body.description || ''),
        order_index: orderIndex,
        is_active: body.is_active !== false,
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('[lms/sections] insert:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ section: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json().catch(() => ({}));

  // Bulk reorder
  if (Array.isArray(body.updates)) {
    for (const row of body.updates) {
      if (!row?.id) continue;
      const { error } = await authResult.supabase
        .from('myuni_course_sections')
        .update({
          order_index: row.order_index,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ success: true });
  }

  const id = String(body.id || '').trim();
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.description !== undefined) updates.description = body.description;
  if (body.order_index !== undefined) updates.order_index = body.order_index;
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

  const { data, error } = await authResult.supabase
    .from('myuni_course_sections')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ section: data });
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id || request.nextUrl.searchParams.get('id') || '').trim();
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await authResult.supabase
    .from('myuni_course_sections')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
