import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import {
  hasPdfSignature,
  MAX_RESOURCE_PDF_BYTES,
  parseResourceStorageRef,
} from '@/app/lib/lms/resourceStorage';

export async function POST(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json().catch(() => null);
  const storage = parseResourceStorageRef(String(body?.storage_ref || ''));
  if (!storage) {
    return NextResponse.json({ error: 'Geçersiz PDF konumu.' }, { status: 400 });
  }

  const { data: file, error: downloadError } = await authResult.supabase.storage
    .from(storage.bucket)
    .download(storage.objectPath);

  if (downloadError || !file) {
    console.error('[lms/resources/finalize] download:', downloadError?.message);
    return NextResponse.json({ error: 'Yüklenen PDF doğrulanamadı.' }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isValid =
    bytes.byteLength > 0 &&
    bytes.byteLength <= MAX_RESOURCE_PDF_BYTES &&
    hasPdfSignature(bytes.subarray(0, 5));

  if (!isValid) {
    const { error: removeError } = await authResult.supabase.storage
      .from(storage.bucket)
      .remove([storage.objectPath]);
    if (removeError) console.error('[lms/resources/finalize] cleanup:', removeError.message);
    return NextResponse.json(
      { error: 'Dosya geçerli bir PDF değil veya 5 MB sınırını aşıyor.' },
      { status: 400 }
    );
  }

  const { data } = authResult.supabase.storage
    .from(storage.bucket)
    .getPublicUrl(storage.objectPath);

  return NextResponse.json({ url: data.publicUrl });
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const body = await request.json().catch(() => null);
  const storage = parseResourceStorageRef(String(body?.storage_ref || ''));
  if (!storage) {
    return NextResponse.json({ error: 'Geçersiz PDF konumu.' }, { status: 400 });
  }

  const { error } = await authResult.supabase.storage
    .from(storage.bucket)
    .remove([storage.objectPath]);
  if (error) {
    console.error('[lms/resources/finalize] delete:', error.message);
    return NextResponse.json({ error: 'PDF temizlenemedi.' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
