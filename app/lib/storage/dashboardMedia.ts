import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildCourseImageStoragePath,
  COURSE_BANNER_HEIGHT,
  COURSE_BANNER_WIDTH,
  COURSE_THUMBNAIL_HEIGHT,
  COURSE_THUMBNAIL_WIDTH,
  validateCourseImageFile,
  type CourseImageKind,
} from '@/app/lib/lms/courseMedia';
import {
  MENTORSHIP_BANNER_HEIGHT,
  MENTORSHIP_BANNER_WIDTH,
} from '@/app/lib/mentorship/config';
import {
  buildMentorshipImageStoragePath,
  validateMentorshipImageFile,
  type MentorshipImageKind,
} from '@/app/lib/mentorship/storage';
import { hasValidImageSignature } from './imageValidation';
import { storeLegacyMedia, storeManagedMedia, type StoredMedia } from './managedMedia';

const COURSE_KINDS = new Set<CourseImageKind>(['banner', 'thumbnail']);
const MENTORSHIP_KINDS = new Set<MentorshipImageKind>(['banner', 'thumbnail', 'mentor']);

export class DashboardMediaError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function parentDirectory(path: string): string {
  return path.slice(0, path.lastIndexOf('/'));
}

async function readImage(file: File): Promise<Buffer> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidImageSignature(buffer, file.type)) {
    throw new DashboardMediaError('Dosya içeriği geçerli bir görsel değil', 400);
  }
  return buffer;
}

async function storeImage(
  supabase: SupabaseClient,
  file: File,
  bucket: string,
  legacyPath: string,
  maxWidth: number,
  maxHeight: number
): Promise<StoredMedia> {
  const buffer = await readImage(file);
  if (file.type.toLowerCase() === 'image/gif') {
    return storeLegacyMedia({
      supabase,
      bucket,
      path: legacyPath,
      buffer,
      contentType: file.type,
    });
  }
  return storeManagedMedia({
    supabase,
    bucket,
    folder: parentDirectory(legacyPath),
    buffer,
    maxWidth,
    maxHeight,
  });
}

export async function uploadMentorshipImage(
  supabase: SupabaseClient,
  file: File,
  kind: MentorshipImageKind,
  slug: string | null
): Promise<StoredMedia> {
  if (!MENTORSHIP_KINDS.has(kind)) {
    throw new DashboardMediaError(
      'Geçersiz görsel türü (thumbnail | banner | mentor)',
      400
    );
  }
  const validationError = validateMentorshipImageFile(file);
  if (validationError) throw new DashboardMediaError(validationError, 400);

  const { bucket, objectPath } = buildMentorshipImageStoragePath(kind, file.name, slug);
  const isBanner = kind === 'banner';
  return storeImage(
    supabase,
    file,
    bucket,
    objectPath,
    isBanner ? MENTORSHIP_BANNER_WIDTH : 800,
    isBanner ? MENTORSHIP_BANNER_HEIGHT : 800
  );
}

export async function uploadCourseImage(
  supabase: SupabaseClient,
  file: File,
  kind: CourseImageKind,
  courseId: string,
  persist: boolean
): Promise<StoredMedia & { kind: CourseImageKind; persisted: boolean }> {
  if (!COURSE_KINDS.has(kind)) {
    throw new DashboardMediaError('Geçersiz görsel türü (banner | thumbnail)', 400);
  }
  const validationError = validateCourseImageFile(file);
  if (validationError) throw new DashboardMediaError(validationError, 400);

  const { data: course, error: courseError } = await supabase
    .from('myuni_courses')
    .select('id, slug')
    .eq('id', courseId)
    .maybeSingle();
  if (courseError) throw new DashboardMediaError(courseError.message, 500);
  if (!course) throw new DashboardMediaError('Kurs bulunamadı', 404);

  const { bucket, objectPath } = buildCourseImageStoragePath(kind, file.name, course.slug);
  const isBanner = kind === 'banner';
  const media = await storeImage(
    supabase,
    file,
    bucket,
    objectPath,
    isBanner ? COURSE_BANNER_WIDTH : COURSE_THUMBNAIL_WIDTH,
    isBanner ? COURSE_BANNER_HEIGHT : COURSE_THUMBNAIL_HEIGHT
  );

  if (persist) {
    const column = kind === 'thumbnail' ? 'thumbnail_url' : 'banner_url';
    const { error } = await supabase
      .from('myuni_courses')
      .update({ [column]: media.url, updated_at: new Date().toISOString() })
      .eq('id', courseId);
    if (error) {
      throw new DashboardMediaError(
        error.message || 'Görsel yüklendi fakat kursa kaydedilemedi',
        500
      );
    }
  }

  return { ...media, kind, persisted: persist };
}
