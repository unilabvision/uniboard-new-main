import type { SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_INTERNSHIP_CV_BUCKET || 'myunilab';
const DEFAULT_EXPIRATION_SECONDS = Number(process.env.NEXT_PUBLIC_INTERNSHIP_CV_SIGNED_URL_TTL || 120);

const sanitizePath = (bucket: string, rawPath: string) => {
  const trimmed = rawPath.replace(/^\/+/, '');
  return trimmed.startsWith(`${bucket}/`)
    ? trimmed.slice(bucket.length + 1)
    : trimmed;
};

const isHttpUrl = (value: string) => value.startsWith('http://') || value.startsWith('https://');

const parseStoragePath = (rawPath: string) => {
  if (rawPath.includes('::')) {
    const [bucket, ...rest] = rawPath.split('::');
    return {
      bucket: bucket || DEFAULT_BUCKET,
      path: rest.join('::') || ''
    };
  }

  return {
    bucket: DEFAULT_BUCKET,
    path: rawPath
  };
};

export async function getCvDownloadUrl(
  supabase: SupabaseClient,
  storagePath?: string | null
): Promise<string | null> {
  if (!storagePath) {
    return null;
  }

  const normalized = storagePath.trim();
  if (!normalized) {
    return null;
  }

  if (isHttpUrl(normalized)) {
    return normalized;
  }

  const { bucket, path } = parseStoragePath(normalized);
  if (!bucket || !path) {
    throw new Error('CV storage path is invalid.');
  }

  const cleanPath = sanitizePath(bucket, path);
  const expiresIn = DEFAULT_EXPIRATION_SECONDS > 0 ? DEFAULT_EXPIRATION_SECONDS : 120;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(cleanPath, expiresIn);

  if (error) {
    throw error;
  }

  if (data?.signedUrl) {
    return data.signedUrl;
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(cleanPath);

  return publicUrlData?.publicUrl ?? null;
}
