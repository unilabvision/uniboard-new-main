import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Paid courses gate access by package (tier); enrollment rows without a tier are
 * invisible on the public site, so admin/invite enrollments must carry one when
 * the course sells packages.
 *
 * `unique_user_course_enrollment` allows a single active row per user and course,
 * so a participant holds exactly one package at a time.
 */
export async function resolveEnrollmentTierId(
  supabase: SupabaseClient,
  courseId: string,
  requestedTierId: string | null
): Promise<{ tierId: string | null; error?: string }> {
  const { data: tiers, error } = await supabase
    .from('myuni_course_tiers')
    .select('id, is_full_course, order_index')
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) return { tierId: null, error: error.message };
  if (!tiers?.length) return { tierId: null };

  if (requestedTierId) {
    const match = tiers.find((tier) => String(tier.id) === requestedTierId);
    if (!match) return { tierId: null, error: 'Paket bu kursa ait değil' };
    return { tierId: String(match.id) };
  }

  const fullCourse = tiers.find((tier) => tier.is_full_course === true);
  return { tierId: String((fullCourse || tiers[0]).id) };
}
