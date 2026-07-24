import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';

/**
 * Lesson note / URL / resource module — service role write.
 * POST { lesson_id, title, content, content_type?, file_url?, order_index? }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json().catch(() => ({}));
  const lessonId = String(body.lesson_id || '').trim();
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  const fileUrl = body.file_url ? String(body.file_url).trim() : null;

  if (!lessonId || !title) {
    return NextResponse.json({ error: 'lesson_id and title are required' }, { status: 400 });
  }

  const contentType = ['markdown', 'html', 'text'].includes(body.content_type)
    ? body.content_type
    : 'text';

  const orderIndex =
    typeof body.order_index === 'number' && Number.isFinite(body.order_index)
      ? body.order_index
      : 0;

  // Replace existing notes for this lesson (single-module model)
  await authResult.supabase.from('myuni_notes').delete().eq('lesson_id', lessonId);

  const { data, error } = await authResult.supabase
    .from('myuni_notes')
    .insert([
      {
        lesson_id: lessonId,
        title,
        content: content || fileUrl || '',
        content_type: contentType,
        file_url: fileUrl,
        order_index: orderIndex,
        is_ai_generated: false,
      },
    ])
    .select('*')
    .single();

  if (error) {
    console.error('[lms/notes] insert:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await authResult.supabase
    .from('myuni_course_lessons')
    .update({ lesson_type: 'notes', updated_at: new Date().toISOString() })
    .eq('id', lessonId);

  return NextResponse.json({ note: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json().catch(() => ({}));
  const lessonId = String(body.lesson_id || '').trim();
  if (!lessonId) {
    return NextResponse.json({ error: 'lesson_id is required' }, { status: 400 });
  }

  const { error } = await authResult.supabase
    .from('myuni_notes')
    .delete()
    .eq('lesson_id', lessonId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
