/** Süre biçimlendirme yardımcıları — hem sunucu hem istemci tarafında kullanılır. */

/** "1 sa 12 dk" / "12 dk" biçiminde okunabilir süre üretir. */
export function formatDurationMinutes(minutes: number | null | undefined): string {
  const total = Math.round(Number(minutes));
  if (!Number.isFinite(total) || total <= 0) return '';
  if (total < 60) return `${total} dk`;

  const hours = Math.floor(total / 60);
  const remaining = total % 60;
  return remaining === 0 ? `${hours} sa` : `${hours} sa ${remaining} dk`;
}

/** Saniye toplamını dakikaya çevirir; 0'dan büyük her süre en az 1 dk sayılır. */
export function secondsToMinutes(seconds: number | null | undefined): number {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.max(1, Math.round(total / 60));
}

/**
 * Dersin görüntülenecek süresini belirler: kayıtlı `duration_minutes` yoksa
 * bağlı videoların toplam süresinden hesaplar.
 */
export function resolveLessonDurationMinutes(lesson: {
  duration_minutes?: number | null;
  videos?: Array<{ duration_seconds?: number | null }> | null;
}): number {
  const stored = Number(lesson.duration_minutes);
  if (Number.isFinite(stored) && stored > 0) return Math.round(stored);

  const videoSeconds = (lesson.videos || []).reduce(
    (total, video) => total + (Number(video?.duration_seconds) || 0),
    0
  );
  return secondsToMinutes(videoSeconds);
}
