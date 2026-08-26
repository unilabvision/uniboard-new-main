import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import {
  buildCourseImageStoragePath,
  validateCourseImageFile,
  type CourseImageKind,
} from '@/app/lib/lms/courseMedia';

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_KINDS = new Set<CourseImageKind>(['banner', 'thumbnail']);

/**
 * POST – Upload course banner or thumbnail to shared storage (myunilab.net reads same URLs).
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireLmsContentAdmin();
    if (authResult.error || !authResult.supabase) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.status }
      );
    }

    const { id: courseId } = await context.params;

    const { data: course, error: courseError } = await authResult.supabase
      .from('myuni_courses')
      .select('id, slug')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 500 });
    }
    if (!course) {
      return NextResponse.json({ error: 'Kurs bulunamadı' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const kindRaw = String(formData.get('kind') || 'banner').trim() as CourseImageKind;
    const persist = String(formData.get('persist') || 'true') !== 'false';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
    }

    if (!ALLOWED_KINDS.has(kindRaw)) {
      return NextResponse.json(
        { error: 'Geçersiz görsel türü (banner | thumbnail)' },
        { status: 400 }
      );
    }

    const validationError = validateCourseImageFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { bucket, objectPath } = buildCourseImageStoragePath(
      kindRaw,
      file.name,
      course.slug
    );
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await authResult.supabase.storage
      .from(bucket)
      .upload(objectPath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      console.error('Course media upload error:', uploadError);
      return NextResponse.json(
        {
          error:
            uploadError.message ||
            'Görsel yüklenemedi. Storage bucket/policy ayarlarını kontrol edin.',
        },
        { status: 500 }
      );
    }

    const { data: publicData } = authResult.supabase.storage
      .from(bucket)
      .getPublicUrl(objectPath);

    if (!publicData?.publicUrl) {
      return NextResponse.json(
        { error: 'Yükleme tamamlandı ancak genel URL alınamadı' },
        { status: 500 }
      );
    }

    const url = publicData.publicUrl;
    const column = kindRaw === 'thumbnail' ? 'thumbnail_url' : 'banner_url';

    if (persist) {
      const { error: updateError } = await authResult.supabase
        .from('myuni_courses')
        .update({
          [column]: url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', courseId);

      if (updateError) {
        console.error('Course media URL persist error:', updateError);
        return NextResponse.json(
          {
            error: updateError.message || 'Görsel yüklendi fakat kursa kaydedilemedi',
            url,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      url,
      bucket,
      path: objectPath,
      kind: kindRaw,
      persisted: persist,
    });
  } catch (err) {
    console.error('Course media upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
