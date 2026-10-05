import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import {
  buildNoteStoragePath,
  createNoteStorageRef,
  LMS_NOTE_STORAGE_BUCKET,
  validateNoteFile,
} from '@/app/lib/lms/noteStorage';

export async function POST(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json().catch(() => null);
  const lessonId = String(body?.lesson_id || '').trim();
  const fileName = String(body?.file_name || '').trim();
  const fileSize = Number(body?.file_size);
  const mimeType = String(body?.mime_type || 'text/plain').trim();

  if (!lessonId || !fileName || !Number.isFinite(fileSize)) {
    return NextResponse.json({ error: 'Geçersiz dosya bilgisi.' }, { status: 400 });
  }

  const validationError = validateNoteFile({ name: fileName, size: fileSize });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { data: lesson, error: lessonError } = await authResult.supabase
    .from('myuni_course_lessons')
    .select('id')
    .eq('id', lessonId)
    .maybeSingle();

  if (lessonError) {
    return NextResponse.json({ error: lessonError.message }, { status: 500 });
  }
  if (!lesson) {
    return NextResponse.json({ error: 'Ders bulunamadı.' }, { status: 404 });
  }

  const objectPath = buildNoteStoragePath(lessonId, fileName);
  const { data, error } = await authResult.supabase.storage
    .from(LMS_NOTE_STORAGE_BUCKET)
    .createSignedUploadUrl(objectPath);

  if (error || !data?.signedUrl) {
    console.error('[lms/notes/upload-url]', error?.message);
    return NextResponse.json(
      { error: 'Not dosyası için yükleme adresi oluşturulamadı.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    storageRef: createNoteStorageRef(objectPath),
    mimeType,
  });
}
