import { NextRequest, NextResponse } from 'next/server';
import {
  buildMentorshipImageStoragePath,
  validateMentorshipImageFile,
  type MentorshipImageKind,
} from '@/app/lib/mentorship/storage';
import { requireMentorshipCapability } from '@/app/api/mentorship/_helpers';
import { IMMUTABLE_ASSET_CACHE_SECONDS } from '@/app/lib/storage/cachePolicy';
import { hasValidImageSignature } from '@/app/lib/storage/imageValidation';
import { optimizeImageForStorage } from '@/app/lib/storage/optimizeImage';
import {
  MENTORSHIP_BANNER_HEIGHT,
  MENTORSHIP_BANNER_WIDTH,
} from '@/app/lib/mentorship/config';

const ALLOWED_KINDS = new Set<MentorshipImageKind>(['thumbnail', 'banner', 'mentor']);

export async function POST(request: NextRequest) {
  try {
    const access = await requireMentorshipCapability('edit');
    if (access.error || !access.supabase) {
      return NextResponse.json(
        { error: access.error || 'Unauthorized' },
        { status: access.status }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const kindRaw = String(formData.get('kind') || '').trim() as MentorshipImageKind;
    const slug = String(formData.get('slug') || '').trim() || null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
    }

    if (!ALLOWED_KINDS.has(kindRaw)) {
      return NextResponse.json(
        { error: 'Geçersiz görsel türü (thumbnail | banner | mentor)' },
        { status: 400 }
      );
    }

    const validationError = validateMentorshipImageFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(originalBuffer, file.type)) {
      return NextResponse.json({ error: 'Dosya içeriği geçerli bir görsel değil' }, { status: 400 });
    }
    const image = await optimizeImageForStorage({
      buffer: originalBuffer,
      fileName: file.name,
      mimeType: file.type,
      maxWidth: kindRaw === 'banner' ? MENTORSHIP_BANNER_WIDTH : 800,
      maxHeight: kindRaw === 'banner' ? MENTORSHIP_BANNER_HEIGHT : 800,
    });
    const { bucket, objectPath } = buildMentorshipImageStoragePath(
      kindRaw,
      image.fileName,
      slug
    );
    const { error: uploadError } = await access.supabase.storage
      .from(bucket)
      .upload(objectPath, image.buffer, {
        cacheControl: IMMUTABLE_ASSET_CACHE_SECONDS,
        upsert: false,
        contentType: image.contentType,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || 'Görsel yüklenemedi' },
        { status: 500 }
      );
    }

    const { data: publicData } = access.supabase.storage
      .from(bucket)
      .getPublicUrl(objectPath);

    if (!publicData?.publicUrl) {
      return NextResponse.json(
        { error: 'Yükleme tamamlandı ancak genel URL alınamadı' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: publicData.publicUrl,
      path: objectPath,
      bucket,
    });
  } catch (err) {
    console.error('Mentorship upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
