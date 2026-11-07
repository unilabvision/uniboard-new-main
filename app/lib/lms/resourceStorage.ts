const MEBIBYTE = 1024 * 1024;

export const LMS_RESOURCE_STORAGE_BUCKET =
  process.env.LMS_RESOURCE_STORAGE_BUCKET || 'myunilab';
export const MAX_RESOURCE_PDF_BYTES = 5 * MEBIBYTE;

const RESOURCE_PREFIX = 'lms/resources/';

export function validateResourcePdf(file: {
  name: string;
  size: number;
  type?: string;
}): string | null {
  if (!file.size || file.size <= 0) return 'PDF dosyası boş olamaz.';
  if (file.size > MAX_RESOURCE_PDF_BYTES) return 'PDF dosyası en fazla 5 MB olabilir.';
  if (!file.name.toLowerCase().endsWith('.pdf')) return 'Yalnızca PDF dosyası yükleyin.';
  if (file.type && file.type !== 'application/pdf') return 'Yalnızca PDF dosyası yükleyin.';
  return null;
}

export function hasPdfSignature(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

function sanitizeFileName(fileName: string): string {
  const cleaned = fileName
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
  return cleaned || 'resource.pdf';
}

export function buildResourceStoragePath(lessonId: string, fileName: string): string {
  const safeLessonId = lessonId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${RESOURCE_PREFIX}${safeLessonId}/${stamp}_${sanitizeFileName(fileName)}`;
}

export function createResourceStorageRef(objectPath: string): string {
  return `${LMS_RESOURCE_STORAGE_BUCKET}::${objectPath}`;
}

export function parseResourceStorageRef(storageRef: string): {
  bucket: string;
  objectPath: string;
} | null {
  const [bucket, ...pathParts] = storageRef.split('::');
  const objectPath = pathParts.join('::');
  if (bucket !== LMS_RESOURCE_STORAGE_BUCKET || !objectPath.startsWith(RESOURCE_PREFIX)) {
    return null;
  }
  return { bucket, objectPath };
}

export function parseResourcePublicUrl(value: string): {
  bucket: string;
  objectPath: string;
} | null {
  try {
    const url = new URL(value);
    const marker = `/storage/v1/object/public/${LMS_RESOURCE_STORAGE_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex < 0) return null;

    const encodedPath = url.pathname.slice(markerIndex + marker.length);
    const objectPath = decodeURIComponent(encodedPath);
    if (!objectPath.startsWith(RESOURCE_PREFIX)) return null;
    return { bucket: LMS_RESOURCE_STORAGE_BUCKET, objectPath };
  } catch {
    return null;
  }
}
