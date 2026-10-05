import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { MAX_NOTE_FILE_BYTES, parseNoteStorageRef } from '@/app/lib/lms/noteStorage';

export async function GET(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const noteId = request.nextUrl.searchParams.get('note_id')?.trim();
  if (!noteId) {
    return NextResponse.json({ error: 'note_id gerekli.' }, { status: 400 });
  }

  const { data: note, error } = await authResult.supabase
    .from('myuni_notes')
    .select('content,file_url')
    .eq('id', noteId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!note) return NextResponse.json({ error: 'Not bulunamadı.' }, { status: 404 });

  const storage = parseNoteStorageRef(note.file_url || '');
  if (!storage) {
    return new NextResponse(note.content || '', { headers: textHeaders() });
  }

  const { data: file, error: downloadError } = await authResult.supabase.storage
    .from(storage.bucket)
    .download(storage.objectPath);

  if (downloadError || !file) {
    console.error('[lms/notes/content]', downloadError?.message);
    return NextResponse.json({ error: 'Not dosyası Storage üzerinden okunamadı.' }, { status: 500 });
  }
  if (file.size > MAX_NOTE_FILE_BYTES) {
    return NextResponse.json({ error: 'Not dosyası boyut sınırını aşıyor.' }, { status: 413 });
  }

  return new NextResponse(await file.text(), { headers: textHeaders() });
}

function textHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}
