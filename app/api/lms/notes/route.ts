import { NextRequest, NextResponse } from 'next/server';
import { gunzipSync } from 'node:zlib';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { sanitizeHtml } from '@/app/lib/lms/htmlContent';

const CONTENT_TYPES = ['markdown', 'html', 'text'] as const;
const GZIP_CONTENT_TYPE = 'application/vnd.myuni.note+gzip';
const MAX_CONTENT_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_BYTES = 4 * 1024 * 1024;
const MAX_DECOMPRESSED_REQUEST_BYTES = MAX_CONTENT_BYTES * 2 + 64 * 1024;
const NOTE_RESPONSE_COLUMNS =
  'id,lesson_id,title,content_type,file_url,order_index,is_ai_generated,created_at,updated_at';

export const maxDuration = 10;

type ContentType = (typeof CONTENT_TYPES)[number];

function isContentType(value: unknown): value is ContentType {
  return typeof value === 'string' && CONTENT_TYPES.includes(value as ContentType);
}

async function readRequestBody(request: NextRequest): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith(GZIP_CONTENT_TYPE)) {
    return request.json();
  }

  const compressed = Buffer.from(await request.arrayBuffer());
  if (compressed.byteLength > MAX_REQUEST_BYTES) {
    throw new Error('Compressed request is too large');
  }

  const decompressed = gunzipSync(compressed, {
    maxOutputLength: MAX_DECOMPRESSED_REQUEST_BYTES,
  });
  return JSON.parse(decompressed.toString('utf8'));
}

/**
 * Lesson note / URL / resource module — service role write.
 * POST { lesson_id, title, content, content_type?, file_url?, order_index? }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: 'request must be at most 4 MB' }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    body = await readRequestBody(request);
  } catch {
    return NextResponse.json(
      { error: 'Invalid or oversized compressed request' },
      { status: 400 }
    );
  }
  const lessonId = String(body.lesson_id || '').trim();
  const title = String(body.title || '').trim();
  const rawContent = String(body.content || '').trim();
  const fileUrl = body.file_url ? String(body.file_url).trim() : null;

  if (!lessonId || !title) {
    return NextResponse.json({ error: 'lesson_id and title are required' }, { status: 400 });
  }
  if (title.length > 500) {
    return NextResponse.json({ error: 'title must be at most 500 characters' }, { status: 400 });
  }
  if (!rawContent && !fileUrl) {
    return NextResponse.json({ error: 'content or file_url is required' }, { status: 400 });
  }
  if (Buffer.byteLength(rawContent, 'utf8') > MAX_CONTENT_BYTES) {
    return NextResponse.json({ error: 'content must be at most 10 MB' }, { status: 413 });
  }

  const contentType: ContentType = isContentType(body.content_type) ? body.content_type : 'text';
  const content = contentType === 'html' ? sanitizeHtml(rawContent) : rawContent;

  const orderIndex =
    typeof body.order_index === 'number' && Number.isFinite(body.order_index)
      ? body.order_index
      : 0;

  const { data: existingNote, error: lookupError } = await authResult.supabase
    .from('myuni_notes')
    .select('id')
    .eq('lesson_id', lessonId)
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error('[lms/notes] lookup:', lookupError.message);
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  const noteValues = {
    lesson_id: lessonId,
    title,
    content: content || fileUrl || '',
    content_type: contentType,
    file_url: fileUrl,
    order_index: orderIndex,
    is_ai_generated: false,
    updated_at: new Date().toISOString(),
  };
  const writeQuery = existingNote
    ? authResult.supabase.from('myuni_notes').update(noteValues).eq('id', existingNote.id)
    : authResult.supabase.from('myuni_notes').insert([noteValues]);
  const { data, error } = await writeQuery.select(NOTE_RESPONSE_COLUMNS).single();

  if (error) {
    console.error('[lms/notes] write:', error.message);
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
