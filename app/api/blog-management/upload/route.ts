import { NextRequest, NextResponse } from 'next/server';
import {
  BLOG_IMAGE_HEIGHT,
  BLOG_IMAGE_MAX_BYTES,
  BLOG_IMAGE_TYPES,
  BLOG_IMAGE_WIDTH,
  BLOG_STORAGE_BUCKET,
  BLOG_STORAGE_FOLDER,
  slugifyBlogTitle,
} from '@/app/lib/blog/config';
import { IMMUTABLE_ASSET_CACHE_SECONDS } from '@/app/lib/storage/cachePolicy';
import { hasValidImageSignature } from '@/app/lib/storage/imageValidation';
import { optimizeImageForStorage } from '@/app/lib/storage/optimizeImage';
import { requireBlogCapability } from '../_helpers';

export async function POST(request: NextRequest) {
  const access = await requireBlogCapability('edit');
  if (access.error || !access.supabase) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const slug = slugifyBlogTitle(String(formData.get('slug') || 'blog')) || 'blog';
    if (!(file instanceof File)) return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
    if (file.size > BLOG_IMAGE_MAX_BYTES) return NextResponse.json({ error: 'Görsel en fazla 5 MB olabilir' }, { status: 400 });
    if (!(BLOG_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json({ error: 'Yalnızca JPG, PNG veya WebP yükleyebilirsiniz' }, { status: 400 });
    }

    const original = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(original, file.type)) {
      return NextResponse.json({ error: 'Dosya içeriği geçerli bir görsel değil' }, { status: 400 });
    }
    const image = await optimizeImageForStorage({
      buffer: original,
      fileName: file.name,
      mimeType: file.type,
      maxWidth: BLOG_IMAGE_WIDTH,
      maxHeight: BLOG_IMAGE_HEIGHT,
    });
    const uniqueName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${image.fileName}`;
    const path = `${BLOG_STORAGE_FOLDER}/${slug}/${uniqueName}`;
    const { error } = await access.supabase.storage
      .from(BLOG_STORAGE_BUCKET)
      .upload(path, image.buffer, {
        cacheControl: IMMUTABLE_ASSET_CACHE_SECONDS,
        contentType: image.contentType,
        upsert: false,
      });
    if (error) throw error;
    const { data } = access.supabase.storage.from(BLOG_STORAGE_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path, bucket: BLOG_STORAGE_BUCKET });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Görsel yüklenemedi' }, { status: 500 });
  }
}
