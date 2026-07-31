import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { secondsToMinutes } from './durationFormat';

/**
 * Vimeo, yükleme biter bitmez `duration: 0` döndürür; gerçek süre transcode
 * tamamlandıktan sonra oluşur. Bu yüzden süreler hem kayıt anında hem de
 * sonradan tekrar çekilebilecek şekilde senkronize edilir.
 */

const VIMEO_ACCESS_TOKEN = process.env.VIMEO_ACCESS_TOKEN;
const VIMEO_API_VERSION = process.env.NEXT_PUBLIC_VIMEO_API_VERSION || '3.4';
const VIMEO_CONCURRENCY = 4;
const VIMEO_MAX_RETRIES = 3;

export type DurationScope = 'course' | 'event';

interface ScopeTables {
  videos: string;
  lessons: string;
  sections: string;
  sectionParentColumn: string;
}

const SCOPE_TABLES: Record<DurationScope, ScopeTables> = {
  course: {
    videos: 'myuni_videos',
    lessons: 'myuni_course_lessons',
    sections: 'myuni_course_sections',
    sectionParentColumn: 'course_id',
  },
  event: {
    videos: 'myuni_event_videos',
    lessons: 'myuni_event_lessons',
    sections: 'myuni_event_sections',
    sectionParentColumn: 'event_id',
  },
};

interface VideoDurationRow {
  id: string;
  lesson_id: string | null;
  title: string | null;
  vimeo_id: string | null;
  vimeo_hash: string | null;
  vimeo_embed_url: string | null;
  duration_seconds: number | null;
}

export interface SyncedLessonDuration {
  id: string;
  duration_minutes: number;
}

export interface DurationSyncResult {
  videosChecked: number;
  videosUpdated: number;
  lessonsUpdated: number;
  lessons: SyncedLessonDuration[];
  failures: Array<{ title: string; reason: string }>;
}

const VIDEO_SELECT =
  'id, lesson_id, title, vimeo_id, vimeo_hash, vimeo_embed_url, duration_seconds';

function createServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY2;

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase yapılandırması eksik: NEXT_PUBLIC_SUPABASE_URL2 ve SUPABASE_SERVICE_ROLE_KEY2 gerekli'
    );
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * Unlisted (gizli) videolarda Vimeo API kimliği "<id>:<hash>" biçiminde olmalı.
 * Eski kayıtlarda hash alanına video id yazılmış olabiliyor, bu durumda sade id kullanılır.
 */
export function resolveVimeoIdentifier(video: {
  vimeo_id?: string | null;
  vimeo_hash?: string | null;
  vimeo_embed_url?: string | null;
}): string | null {
  const id = String(video.vimeo_id || '').trim();
  if (!id) return null;

  let hash = String(video.vimeo_hash || '').trim();
  if (video.vimeo_embed_url) {
    try {
      hash = new URL(video.vimeo_embed_url).searchParams.get('h') || hash;
    } catch {
      // Geçersiz embed url, kayıtlı hash ile devam
    }
  }

  if (!hash || hash === id || /^\d+$/.test(hash)) return id;
  return `${id}:${hash}`;
}

export async function fetchVimeoDurationSeconds(
  identifier: string,
  attempt = 1
): Promise<number> {
  if (!VIMEO_ACCESS_TOKEN) {
    throw new Error('VIMEO_ACCESS_TOKEN tanımlı değil');
  }

  const response = await fetch(
    `https://api.vimeo.com/videos/${identifier}?fields=duration`,
    {
      headers: {
        Authorization: `bearer ${VIMEO_ACCESS_TOKEN}`,
        Accept: `application/vnd.vimeo.*+json;version=${VIMEO_API_VERSION}`,
      },
      cache: 'no-store',
    }
  );

  if (response.status === 429 && attempt <= VIMEO_MAX_RETRIES) {
    const waitMs = Number(response.headers.get('retry-after') || 5) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return fetchVimeoDurationSeconds(identifier, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`Vimeo ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as { duration?: number };
  return Number(json.duration) || 0;
}

async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        await worker(items[index]);
      }
    })
  );
}

/**
 * Ders süresini, o derse bağlı videoların toplam süresinden yeniden hesaplar.
 * Öğrenci paneli yalnızca `duration_minutes` alanını okuduğu için bu adım şart.
 */
export async function syncLessonDurations(
  lessonIds: string[],
  scope: DurationScope = 'course',
  client?: SupabaseClient
): Promise<SyncedLessonDuration[]> {
  const uniqueLessonIds = [...new Set(lessonIds.filter(Boolean))];
  if (uniqueLessonIds.length === 0) return [];

  const supabase = client ?? createServiceClient();
  const tables = SCOPE_TABLES[scope];

  const { data: videos, error } = await supabase
    .from(tables.videos)
    .select('lesson_id, duration_seconds')
    .in('lesson_id', uniqueLessonIds);

  if (error) {
    throw new Error(`${tables.videos} süreleri okunamadı: ${error.message}`);
  }

  const secondsByLesson = new Map<string, number>();
  for (const lessonId of uniqueLessonIds) {
    secondsByLesson.set(lessonId, 0);
  }
  for (const video of (videos || []) as Array<{
    lesson_id: string | null;
    duration_seconds: number | null;
  }>) {
    if (!video.lesson_id) continue;
    secondsByLesson.set(
      video.lesson_id,
      (secondsByLesson.get(video.lesson_id) || 0) + (video.duration_seconds || 0)
    );
  }

  const updated: SyncedLessonDuration[] = [];
  await Promise.all(
    [...secondsByLesson].map(async ([lessonId, seconds]) => {
      // Süre henüz Vimeo'dan gelmediyse mevcut değeri (ör. quiz süresi) ezmeyelim.
      if (seconds <= 0) return;

      const minutes = secondsToMinutes(seconds);
      const { error: updateError } = await supabase
        .from(tables.lessons)
        .update({ duration_minutes: minutes })
        .eq('id', lessonId);

      if (updateError) {
        console.error(
          `[videoDurations] ${lessonId} dersi güncellenemedi: ${updateError.message}`
        );
        return;
      }
      updated.push({ id: lessonId, duration_minutes: minutes });
    })
  );

  return updated;
}

/**
 * Süresi eksik (0/null) videoları Vimeo'dan tekrar sorgular, `duration_seconds`
 * alanını tazeler ve ardından bağlı derslerin `duration_minutes` değerini günceller.
 */
async function refreshDurations(
  videos: VideoDurationRow[],
  scope: DurationScope,
  supabase: SupabaseClient,
  force: boolean
): Promise<DurationSyncResult> {
  const failures: Array<{ title: string; reason: string }> = [];
  const tables = SCOPE_TABLES[scope];
  const pending = force
    ? videos
    : videos.filter((video) => !video.duration_seconds);

  let videosUpdated = 0;

  await mapWithConcurrency(pending, VIMEO_CONCURRENCY, async (video) => {
    const identifier = resolveVimeoIdentifier(video);
    if (!identifier) {
      failures.push({ title: video.title || video.id, reason: 'vimeo_id yok' });
      return;
    }

    try {
      const seconds = await fetchVimeoDurationSeconds(identifier);
      if (!seconds) {
        failures.push({
          title: video.title || video.id,
          reason: 'Vimeo süresi henüz hazır değil',
        });
        return;
      }
      if (seconds === video.duration_seconds) return;

      const { error } = await supabase
        .from(tables.videos)
        .update({ duration_seconds: seconds })
        .eq('id', video.id);

      if (error) throw new Error(error.message);
      videosUpdated += 1;
    } catch (error) {
      failures.push({
        title: video.title || video.id,
        reason: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });
    }
  });

  const lessonIds = videos
    .map((video) => video.lesson_id)
    .filter((id): id is string => Boolean(id));

  const lessons = await syncLessonDurations(lessonIds, scope, supabase);

  return {
    videosChecked: pending.length,
    videosUpdated,
    lessonsUpdated: lessons.length,
    lessons,
    failures,
  };
}

/**
 * Tek bir dersin videolarını tazeler. Video kaydedildikten hemen sonra çağrılır.
 */
export async function syncLessonVideoDurations(
  lessonId: string,
  options: { scope?: DurationScope; force?: boolean; client?: SupabaseClient } = {}
): Promise<DurationSyncResult> {
  const { scope = 'course', force = false, client } = options;
  const supabase = client ?? createServiceClient();
  const tables = SCOPE_TABLES[scope];

  const { data, error } = await supabase
    .from(tables.videos)
    .select(VIDEO_SELECT)
    .eq('lesson_id', lessonId);

  if (error) {
    throw new Error(`${tables.videos} okunamadı: ${error.message}`);
  }

  return refreshDurations(
    (data || []) as VideoDurationRow[],
    scope,
    supabase,
    force
  );
}

/**
 * Bir kursun/etkinliğin tüm bölüm → ders → video zincirindeki süreleri senkronize eder.
 */
export async function syncContentDurations(
  parentId: string,
  options: { scope?: DurationScope; force?: boolean; client?: SupabaseClient } = {}
): Promise<DurationSyncResult> {
  const { scope = 'course', force = false, client } = options;
  const supabase = client ?? createServiceClient();
  const tables = SCOPE_TABLES[scope];

  const { data: sections, error: sectionsError } = await supabase
    .from(tables.sections)
    .select('id')
    .eq(tables.sectionParentColumn, parentId);

  if (sectionsError) {
    throw new Error(`${tables.sections} okunamadı: ${sectionsError.message}`);
  }

  const sectionIds = (sections || []).map((section: { id: string }) => section.id);
  if (sectionIds.length === 0) {
    return { videosChecked: 0, videosUpdated: 0, lessonsUpdated: 0, lessons: [], failures: [] };
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from(tables.lessons)
    .select('id')
    .in('section_id', sectionIds);

  if (lessonsError) {
    throw new Error(`${tables.lessons} okunamadı: ${lessonsError.message}`);
  }

  const lessonIds = (lessons || []).map((lesson: { id: string }) => lesson.id);
  if (lessonIds.length === 0) {
    return { videosChecked: 0, videosUpdated: 0, lessonsUpdated: 0, lessons: [], failures: [] };
  }

  const { data: videos, error: videosError } = await supabase
    .from(tables.videos)
    .select(VIDEO_SELECT)
    .in('lesson_id', lessonIds);

  if (videosError) {
    throw new Error(`${tables.videos} okunamadı: ${videosError.message}`);
  }

  return refreshDurations(
    (videos || []) as VideoDurationRow[],
    scope,
    supabase,
    force
  );
}

export {
  formatDurationMinutes,
  secondsToMinutes,
  resolveLessonDurationMinutes,
} from './durationFormat';
