import {
  SITE_APPLICATION_FILE_RETENTION_DAYS,
  SITE_APPLICATION_MAX_FILE_BYTES,
  SITE_APPLICATION_STORAGE_BUCKET,
  SITE_APPLICATION_STORAGE_FOLDER,
} from './config';

const BLOCKED_EXTENSIONS = new Set([
  'exe',
  'bat',
  'cmd',
  'com',
  'msi',
  'scr',
  'ps1',
  'vbs',
  'js',
  'jar',
  'sh',
]);

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function sanitizeFileName(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return base.slice(0, 180) || 'attachment';
}

export function validateAttachmentFile(file: File): string | null {
  if (file.size <= 0) {
    return 'Dosya boş olamaz.';
  }
  if (file.size > SITE_APPLICATION_MAX_FILE_BYTES) {
    return `Dosya boyutu en fazla ${formatFileSize(SITE_APPLICATION_MAX_FILE_BYTES)} olabilir.`;
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return 'Bu dosya türüne izin verilmiyor.';
  }
  return null;
}

export function buildAttachmentStoragePath(
  formSlug: string,
  applicationId: string,
  fileName: string
): { bucket: string; objectPath: string; storageRef: string } {
  const safeName = sanitizeFileName(fileName);
  const safeSlug = formSlug.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'form';
  const objectPath = `${SITE_APPLICATION_STORAGE_FOLDER}/${safeSlug}/${applicationId}/${Date.now()}_${safeName}`;
  return {
    bucket: SITE_APPLICATION_STORAGE_BUCKET,
    objectPath,
    storageRef: `${SITE_APPLICATION_STORAGE_BUCKET}::${objectPath}`,
  };
}

export function computeAttachmentExpiresAt(from = new Date()): string {
  const expires = new Date(from);
  expires.setDate(expires.getDate() + SITE_APPLICATION_FILE_RETENTION_DAYS);
  return expires.toISOString();
}

export function parseAttachmentStorageRef(storageRef: string): {
  bucket: string;
  path: string;
} {
  const trimmed = storageRef.trim();
  if (trimmed.includes('::')) {
    const [bucket, ...rest] = trimmed.split('::');
    return { bucket: bucket || SITE_APPLICATION_STORAGE_BUCKET, path: rest.join('::') };
  }
  return { bucket: SITE_APPLICATION_STORAGE_BUCKET, path: trimmed.replace(/^\/+/, '') };
}
