import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Paid courses gate access by package (tier); enrollment rows without a tier are
 * invisible on the public site, so admin/invite enrollments must carry one when
 * the course sells packages.
 */
export async function resolveEnrollmentTierIds(
  supabase: SupabaseClient,
  courseId: string,
  requestedTierIds: string[]
): Promise<{ tierIds: Array<string | null>; error?: string }> {
  const { data: tiers, error } = await supabase
    .from('myuni_course_tiers')
    .select('id, is_full_course, order_index')
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) return { tierIds: [], error: error.message };

  // Courses without packages grant access through a single tier-less row.
  if (!tiers?.length) return { tierIds: [null] };

  const requested = [...new Set(requestedTierIds.filter(Boolean))];
  if (requested.length > 0) {
    const known = new Set(tiers.map((tier) => String(tier.id)));
    const unknown = requested.find((id) => !known.has(id));
    if (unknown) return { tierIds: [], error: 'Paket bu kursa ait değil' };
    return { tierIds: requested };
  }

  const fullCourse = tiers.find((tier) => tier.is_full_course === true);
  return { tierIds: [String((fullCourse || tiers[0]).id)] };
}
