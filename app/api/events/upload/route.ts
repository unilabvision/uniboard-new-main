import { NextRequest, NextResponse } from 'next/server';
import {
  buildEventImageStoragePath,
  validateEventImageFile,
  type EventImageKind,
} from '@/app/lib/events/storage';
import { requireEventsModuleUser } from '@/app/api/events/_helpers';
import { IMMUTABLE_ASSET_CACHE_SECONDS } from '@/app/lib/storage/cachePolicy';
import { hasValidImageSignature } from '@/app/lib/storage/imageValidation';
import { optimizeImageForStorage } from '@/app/lib/storage/optimizeImage';
import {
  EVENT_BANNER_HEIGHT,
  EVENT_BANNER_WIDTH,
  EVENT_THUMBNAIL_HEIGHT,
  EVENT_THUMBNAIL_WIDTH,
} from '@/app/lib/events/config';

const ALLOWED_KINDS = new Set<EventImageKind>(['thumbnail', 'banner']);

export async function POST(request: NextRequest) {
  try {
    const access = await requireEventsModuleUser();
    if (access.error || !access.supabase) {
      return NextResponse.json(
        { error: access.error || 'Unauthorized' },
        { status: access.status }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const kindRaw = String(formData.get('kind') || '').trim() as EventImageKind;
    const eventSlug = String(formData.get('eventSlug') || '').trim() || null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
    }

    if (!ALLOWED_KINDS.has(kindRaw)) {
      return NextResponse.json(
        { error: 'Geçersiz görsel türü (thumbnail | banner)' },
        { status: 400 }
      );
    }

    const validationError = validateEventImageFile({
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
      maxWidth: kindRaw === 'banner' ? EVENT_BANNER_WIDTH : EVENT_THUMBNAIL_WIDTH,
      maxHeight: kindRaw === 'banner' ? EVENT_BANNER_HEIGHT : EVENT_THUMBNAIL_HEIGHT,
    });
    const { bucket, objectPath } = buildEventImageStoragePath(
      kindRaw,
      image.fileName,
      eventSlug
    );
    const { error: uploadError } = await access.supabase.storage
      .from(bucket)
      .upload(objectPath, image.buffer, {
        cacheControl: IMMUTABLE_ASSET_CACHE_SECONDS,
        upsert: false,
        contentType: image.contentType,
      });

    if (uploadError) {
      console.error('Event image upload error:', uploadError);
      return NextResponse.json(
        {
          error:
            uploadError.message ||
            'Görsel yüklenemedi. Storage bucket/policy ayarlarını kontrol edin.',
        },
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
      bucket,
      path: objectPath,
      kind: kindRaw,
    });
  } catch (err) {
    console.error('Event upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
