import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { IMMUTABLE_ASSET_CACHE_SECONDS } from './cachePolicy';

const RESPONSIVE_WIDTHS = [320, 640, 960, 1280, 1920, 2560] as const;
const REQUIRED_OBJECT_NAMES = [
  'original.webp',
  ...RESPONSIVE_WIDTHS.map((width) => `w-${width}.webp`),
];

export type StoredMedia = {
  url: string;
  path: string;
  bucket: string;
  deduplicated: boolean;
  originalBytes: number;
  optimizedBytes: number;
};

type ManagedMediaInput = {
  supabase: SupabaseClient;
  bucket: string;
  folder: string;
  buffer: Buffer;
  maxWidth: number;
  maxHeight: number;
};

type LegacyMediaInput = {
  supabase: SupabaseClient;
  bucket: string;
  path: string;
  buffer: Buffer;
  contentType: string;
};

function sanitizeFolder(folder: string): string {
  return folder
    .split('/')
    .map((part) => part.replace(/[^a-zA-Z0-9_-]/g, '-'))
    .filter(Boolean)
    .slice(0, 6)
    .join('/');
}

function isDuplicateError(message: string): boolean {
  return /already exists|duplicate/i.test(message);
}

async function uploadIfMissing(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    cacheControl: IMMUTABLE_ASSET_CACHE_SECONDS,
    contentType,
    upsert: false,
  });
  if (!error || isDuplicateError(error.message)) return;
  throw new Error(error.message);
}

async function hasCompleteVariantSet(
  supabase: SupabaseClient,
  bucket: string,
  directory: string
): Promise<boolean> {
  const { data, error } = await supabase.storage.from(bucket).list(directory, {
    limit: REQUIRED_OBJECT_NAMES.length,
  });
  if (error) return false;
  const names = new Set((data || []).map((item) => item.name));
  return REQUIRED_OBJECT_NAMES.every((name) => names.has(name));
}

function publicUrl(supabase: SupabaseClient, bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function storeManagedMedia({
  supabase,
  bucket,
  folder,
  buffer,
  maxWidth,
  maxHeight,
}: ManagedMediaInput): Promise<StoredMedia> {
  const optimized = await sharp(buffer, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({
      width: Math.min(maxWidth, 2560),
      height: Math.min(maxHeight, 2560),
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 78, effort: 3, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });

  const checksum = createHash('sha256').update(optimized.data).digest('hex');
  const directory = `${sanitizeFolder(folder)}/${checksum}`;
  const path = `${directory}/original.webp`;
  const deduplicated = await hasCompleteVariantSet(supabase, bucket, directory);

  if (!deduplicated) {
    await uploadIfMissing(supabase, bucket, path, optimized.data, 'image/webp');
    for (const width of RESPONSIVE_WIDTHS) {
      const variant = width >= optimized.info.width
        ? optimized.data
        : await sharp(optimized.data)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 78, effort: 3, smartSubsample: true })
            .toBuffer();
      await uploadIfMissing(
        supabase,
        bucket,
        `${directory}/w-${width}.webp`,
        variant,
        'image/webp'
      );
    }
  }

  return {
    url: publicUrl(supabase, bucket, path),
    path,
    bucket,
    deduplicated,
    originalBytes: buffer.length,
    optimizedBytes: optimized.data.length,
  };
}

export async function storeLegacyMedia({
  supabase,
  bucket,
  path,
  buffer,
  contentType,
}: LegacyMediaInput): Promise<StoredMedia> {
  await uploadIfMissing(supabase, bucket, path, buffer, contentType);
  return {
    url: publicUrl(supabase, bucket, path),
    path,
    bucket,
    deduplicated: false,
    originalBytes: buffer.length,
    optimizedBytes: buffer.length,
  };
}
