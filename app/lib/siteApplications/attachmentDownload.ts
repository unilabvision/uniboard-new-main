import type { SupabaseClient } from '@supabase/supabase-js';
import { SITE_APPLICATION_STORAGE_BUCKET } from './config';
import { parseAttachmentStorageRef } from './files';

const DEFAULT_EXPIRATION_SECONDS = Number(
  process.env.NEXT_PUBLIC_SITE_APPLICATIONS_SIGNED_URL_TTL || 300
);

export async function getSiteApplicationAttachmentUrl(
  supabase: SupabaseClient,
  storageRef?: string | null
): Promise<string | null> {
  if (!storageRef?.trim()) return null;

  const normalized = storageRef.trim();
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  const { bucket, path } = parseAttachmentStorageRef(normalized);
  if (!bucket || !path) return null;

  const expiresIn = DEFAULT_EXPIRATION_SECONDS > 0 ? DEFAULT_EXPIRATION_SECONDS : 300;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

  if (error) throw error;
  if (data?.signedUrl) return data.signedUrl;

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
  return publicData?.publicUrl ?? null;
}

export async function removeSiteApplicationAttachment(
  supabase: SupabaseClient,
  storageRef?: string | null
): Promise<void> {
  if (!storageRef?.trim()) return;
  const { bucket, path } = parseAttachmentStorageRef(storageRef.trim());
  if (!bucket || !path) return;
  await supabase.storage.from(bucket).remove([path]);
}

export { SITE_APPLICATION_STORAGE_BUCKET };
