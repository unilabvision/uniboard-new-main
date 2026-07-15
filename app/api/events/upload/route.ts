import { NextRequest, NextResponse } from 'next/server';
import {
  buildEventImageStoragePath,
  validateEventImageFile,
  type EventImageKind,
} from '@/app/lib/events/storage';
import { requireEventsModuleUser } from '@/app/api/events/_helpers';

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

    const { bucket, objectPath } = buildEventImageStoragePath(
      kindRaw,
      file.name,
      eventSlug
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await access.supabase.storage
      .from(bucket)
      .upload(objectPath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
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
