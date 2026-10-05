const MEBIBYTE = 1024 * 1024;

export const LMS_NOTE_STORAGE_BUCKET = process.env.LMS_NOTE_STORAGE_BUCKET || 'lms-notes';
export const MAX_NOTE_FILE_BYTES = 15 * MEBIBYTE;

const NOTE_EXTENSIONS = new Set(['md', 'markdown', 'html', 'txt', 'json']);

export function validateNoteFile(file: {
  name: string;
  size: number;
}): string | null {
  if (!file.size || file.size <= 0) return 'Dosya boş olamaz.';
  if (file.size > MAX_NOTE_FILE_BYTES) return 'Dosya boyutu en fazla 15 MB olabilir.';

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!NOTE_EXTENSIONS.has(extension)) {
    return 'TXT, MD, MARKDOWN, HTML veya JSON dosyası yükleyin.';
  }

  return null;
}

function sanitizeFileName(fileName: string): string {
  const cleaned = fileName
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 120);
  return cleaned || 'note.md';
}

export function buildNoteStoragePath(lessonId: string, fileName: string): string {
  const safeLessonId = lessonId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `notes/${safeLessonId}/${stamp}_${sanitizeFileName(fileName)}`;
}

export function createNoteStorageRef(objectPath: string): string {
  return `${LMS_NOTE_STORAGE_BUCKET}::${objectPath}`;
}

export function parseNoteStorageRef(storageRef: string): {
  bucket: string;
  objectPath: string;
} | null {
  const [bucket, ...pathParts] = storageRef.split('::');
  const objectPath = pathParts.join('::');
  if (bucket !== LMS_NOTE_STORAGE_BUCKET || !objectPath.startsWith('notes/')) return null;
  return { bucket, objectPath };
}

export function isNoteStorageRef(value?: string | null): boolean {
  return Boolean(value && parseNoteStorageRef(value));
}
