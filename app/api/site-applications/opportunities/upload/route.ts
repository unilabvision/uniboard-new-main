import { NextRequest, NextResponse } from 'next/server';
import {
  buildOpportunityImageStoragePath,
  validateOpportunityImageFile,
} from '@/app/lib/siteApplications/opportunityStorage';
import { requireSiteApplicationsCapability } from '@/app/api/site-applications/access/_helpers';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSiteApplicationsCapability('forms');
    if (authResult.error || !authResult.supabase) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.status }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const slug = String(formData.get('slug') || '').trim() || null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
    }

    const validationError = validateOpportunityImageFile({
      name: file.name,
      size: file.size,
      type: file.type,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { bucket, objectPath } = buildOpportunityImageStoragePath(file.name, slug);
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await authResult.supabase.storage
      .from(bucket)
      .upload(objectPath, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      console.error('Opportunity banner upload error:', uploadError);
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

    return NextResponse.json({
      url: publicData.publicUrl,
      bucket,
      path: objectPath,
    });
  } catch (err) {
    console.error('Opportunity upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
