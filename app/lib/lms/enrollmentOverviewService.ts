import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg',
});

/**
 * Source of truth for package entitlements:
 * - Clerk user id = myuni_enrollments.user_id (identity only; do NOT store packages in Clerk)
 * - Purchase rows = myuni_enrollments.tier_id → myuni_course_tiers
 * - Public site (Iyzico) writes enrollments; this dashboard only reads them
 */

export interface PurchasedPackage {
  tier_id: string | null;
  title: string;
  slug: string | null;
  is_full_course: boolean;
  session_labels: string[];
  enrolled_at: string | null;
}

export interface EnrollmentPaymentInfo {
  order_id: string;
  amount: number;
  discount_code: string | null;
  discount_amount: number;
  tier_id: string | null;
  course_name: string | null;
  paid_at: string | null;
  payment_method: string | null;
  buyer_email: string | null;
}

export interface ModuleProgressItem {
  lesson_id: string;
  lesson_title: string;
  section_title: string;
  lesson_type: string | null;
  order_index: number;
  section_order: number;
  is_completed: boolean;
  watch_time_seconds: number;
  quiz_score: number | null;
  last_activity: string | null;
  /** Which purchased package(s) unlock this module */
  entitled_by?: string[];
}

export interface CourseEnrollmentDetail {
  course_id: string;
  course_title: string;
  course_slug: string;
  enrolled_at: string | null;
  progress_percentage: number;
  completed_modules: number;
  total_modules: number;
  modules: ModuleProgressItem[];
  /** Packages bought via myuni_enrollments.tier_id */
  purchased_packages: PurchasedPackage[];
  has_full_access: boolean;
  access_source: 'full_course' | 'packages' | 'legacy_enrollment';
  /** Matched rows from orders table */
  payments: EnrollmentPaymentInfo[];
  total_paid: number;
  discount_codes: string[];
  total_discount: number;
}

export interface PersonEnrollmentOverview {
  user_id: string;
  user_name: string;
  user_email: string;
  user_image: string | null;
  courses: CourseEnrollmentDetail[];
}

type EnrollmentRow = {
  course_id: string;
  user_id: string;
  enrolled_at: string | null;
  progress_percentage: number | null;
  is_active: boolean;
  tier_id: string | null;
};

type CourseTierRow = {
  id: string;
  course_id: string;
  title: string;
  slug: string | null;
  is_full_course: boolean | null;
  session_labels: string[] | null;
  is_active: boolean | null;
};

type LessonRow = {
  id: string;
  title: string;
  lesson_type: string | null;
  order_index: number;
  myuni_course_sections:
    | {
        id: string;
        title: string;
        order_index: number;
        course_id: string;
      }
    | Array<{
        id: string;
        title: string;
        order_index: number;
        course_id: string;
      }>
    | null;
};

type TierSessionRow = {
  tier_id: string;
  order_index: number;
  myuni_live_sessions:
    | { id: string; title?: string | null; session_number?: number | null }
    | Array<{ id: string; title?: string | null; session_number?: number | null }>
    | null;
};

type OrderRow = {
  orderid: string;
  courseid: string | null;
  coursename: string | null;
  amount: number | null;
  discountcode: string | null;
  discountamount: number | null;
  useremail: string | null;
  enrolled: boolean | null;
  status: string | null;
  paymentmethod: string | null;
  created_at: string | null;
  custom_data: {
    userId?: string;
    clerkUserId?: string;
    tierId?: string | null;
    cartMode?: boolean;
    cartItems?: Array<{ courseId?: string; tierId?: string; price?: number; title?: string }>;
    discountCodes?: string;
    totalDiscount?: number;
  } | null;
};

function parseDiscountCodes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((code) => code.trim())
    .filter(Boolean);
}

function orderBelongsToUser(
  order: OrderRow,
  userId: string,
  userEmail: string | null | undefined
) {
  const customUserId = order.custom_data?.userId || order.custom_data?.clerkUserId;
  if (customUserId && customUserId === userId) return true;
  if (userEmail && order.useremail && order.useremail.toLowerCase() === userEmail.toLowerCase()) {
    return true;
  }
  return false;
}

function orderTouchesCourse(order: OrderRow, courseId: string) {
  if (order.courseid === courseId) return true;
  if (order.custom_data?.cartMode && Array.isArray(order.custom_data.cartItems)) {
    return order.custom_data.cartItems.some((item) => item.courseId === courseId);
  }
  return false;
}

function extractPaymentsForUserCourse(
  orders: OrderRow[],
  userId: string,
  userEmail: string | null | undefined,
  courseId: string
): EnrollmentPaymentInfo[] {
  const payments: EnrollmentPaymentInfo[] = [];

  orders.forEach((order) => {
    if (!orderBelongsToUser(order, userId, userEmail)) return;
    if (!orderTouchesCourse(order, courseId)) return;

    const status = (order.status || '').toLowerCase();
    const looksPaid =
      order.enrolled === true ||
      status === 'success' ||
      status === 'completed' ||
      status === 'paid';
    if (!looksPaid && status === 'pending') return;
    if (status === 'failed' || status === 'cancelled') return;

    // Cart orders may include multiple courses — allocate this course's share when possible
    if (order.custom_data?.cartMode && Array.isArray(order.custom_data.cartItems)) {
      const courseItems = order.custom_data.cartItems.filter((item) => item.courseId === courseId);
      if (courseItems.length === 0) return;

      const cartTotal = order.custom_data.cartItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0),
        0
      );
      const courseShare = courseItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
      const orderAmount = Number(order.amount) || 0;
      const orderDiscount = Number(order.discountamount) || Number(order.custom_data.totalDiscount) || 0;
      const ratio = cartTotal > 0 ? courseShare / cartTotal : 1 / Math.max(order.custom_data.cartItems.length, 1);
      const allocatedAmount = Math.round(orderAmount * ratio * 100) / 100;
      const allocatedDiscount = Math.round(orderDiscount * ratio * 100) / 100;
      const codes = parseDiscountCodes(order.discountcode || order.custom_data.discountCodes);

      courseItems.forEach((item) => {
        payments.push({
          order_id: order.orderid,
          amount: courseItems.length === 1 ? allocatedAmount : Number(item.price) || allocatedAmount,
          discount_code: codes.join(', ') || null,
          discount_amount: allocatedDiscount,
          tier_id: item.tierId || null,
          course_name: item.title || order.coursename,
          paid_at: order.created_at,
          payment_method: order.paymentmethod,
          buyer_email: order.useremail || null,
        });
      });
      return;
    }

    const codes = parseDiscountCodes(
      order.discountcode || order.custom_data?.discountCodes || null
    );

    payments.push({
      order_id: order.orderid,
      amount: Number(order.amount) || 0,
      discount_code: codes.join(', ') || null,
      discount_amount: Number(order.discountamount) || Number(order.custom_data?.totalDiscount) || 0,
      tier_id: order.custom_data?.tierId || null,
      course_name: order.coursename,
      paid_at: order.created_at,
      payment_method: order.paymentmethod,
      buyer_email: order.useremail || null,
    });
  });

  // Deduplicate by order_id + tier_id
  const unique = [...payments.reduce((map, payment) => {
    const key = `${payment.order_id}:${payment.tier_id || 'course'}`;
    if (!map.has(key)) map.set(key, payment);
    return map;
  }, new Map<string, EnrollmentPaymentInfo>()).values()];

  return unique.sort((a, b) => {
    const aTime = a.paid_at ? new Date(a.paid_at).getTime() : 0;
    const bTime = b.paid_at ? new Date(b.paid_at).getTime() : 0;
    return bTime - aTime;
  });
}

async function fetchClerkUserDetails(userIds: string[]) {
  const userDetailsMap = new Map<string, { fullName: string; email: string; imageUrl: string | null }>();

  if (userIds.length === 0) return userDetailsMap;

  try {
    const response = await fetch('/api/auth/user-details-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    });

    if (response.ok) {
      const data = await response.json();
      Object.entries(data.users || {}).forEach(([userId, userData]) => {
        const user = userData as {
          firstName?: string;
          lastName?: string;
          username?: string;
          emailAddresses?: Array<{ emailAddress?: string }>;
          imageUrl?: string;
        };
        userDetailsMap.set(userId, {
          fullName:
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName || user.lastName || user.username || `Kullanıcı ${userId.substring(0, 8)}`,
          email: user.emailAddresses?.[0]?.emailAddress || '',
          imageUrl: user.imageUrl || null,
        });
      });
    }
  } catch (error) {
    console.error('Error fetching user details batch:', error);
  }

  userIds.forEach((userId) => {
    if (!userDetailsMap.has(userId)) {
      userDetailsMap.set(userId, {
        fullName: `Kullanıcı ${userId.substring(0, 8)}`,
        email: '',
        imageUrl: null,
      });
    }
  });

  return userDetailsMap;
}

function unwrapSection(lesson: LessonRow) {
  if (!lesson.myuni_course_sections) return null;
  return Array.isArray(lesson.myuni_course_sections)
    ? lesson.myuni_course_sections[0]
    : lesson.myuni_course_sections;
}

function unwrapLiveSession(row: TierSessionRow) {
  if (!row.myuni_live_sessions) return null;
  return Array.isArray(row.myuni_live_sessions)
    ? row.myuni_live_sessions[0]
    : row.myuni_live_sessions;
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isFullCourseTier(tier: Pick<CourseTierRow, 'is_full_course' | 'slug'>) {
  return tier.is_full_course === true || tier.slug === 'tam-egitim';
}

function labelsMatchContent(labels: string[], lessonTitle: string, sectionTitle: string) {
  if (labels.length === 0) return false;
  const lessonNorm = normalizeText(lessonTitle);
  const sectionNorm = normalizeText(sectionTitle);

  return labels.some((label) => {
    const labelNorm = normalizeText(label);
    if (!labelNorm) return false;
    return (
      lessonNorm.includes(labelNorm) ||
      labelNorm.includes(lessonNorm) ||
      sectionNorm.includes(labelNorm) ||
      labelNorm.includes(sectionNorm)
    );
  });
}

function collectEntitlementLabels(
  packages: PurchasedPackage[],
  tierSessionLabels: Map<string, string[]>
) {
  const labels = new Set<string>();
  packages.forEach((pkg) => {
    pkg.session_labels.forEach((label) => labels.add(label));
    if (pkg.tier_id) {
      (tierSessionLabels.get(pkg.tier_id) || []).forEach((label) => labels.add(label));
    }
  });
  return [...labels];
}

/**
 * Loads people → courses → purchased packages → entitled modules.
 * Clerk is only used for display names/emails; entitlements come from Supabase.
 */
export async function getEnrollmentOverview(options?: {
  courseId?: string;
}): Promise<PersonEnrollmentOverview[]> {
  let enrollmentsQuery = supabase
    .from('myuni_enrollments')
    .select('course_id, user_id, enrolled_at, progress_percentage, is_active, tier_id')
    .eq('is_active', true);

  if (options?.courseId) {
    enrollmentsQuery = enrollmentsQuery.eq('course_id', options.courseId);
  }

  const { data: enrollmentsData, error: enrollmentsError } = await enrollmentsQuery;
  if (enrollmentsError) throw enrollmentsError;

  const enrollments = (enrollmentsData || []) as EnrollmentRow[];
  if (enrollments.length === 0) return [];

  const courseIds = [...new Set(enrollments.map((e) => e.course_id))];
  const userIds = [...new Set(enrollments.map((e) => e.user_id))];

  const [
    { data: courses, error: coursesError },
    { data: lessons, error: lessonsError },
    { data: tiers, error: tiersError },
  ] = await Promise.all([
    supabase.from('myuni_courses').select('id, title, slug').in('id', courseIds),
    supabase
      .from('myuni_course_lessons')
      .select(`
        id,
        title,
        lesson_type,
        order_index,
        myuni_course_sections!inner (
          id,
          title,
          order_index,
          course_id
        )
      `)
      .in('myuni_course_sections.course_id', courseIds),
    supabase
      .from('myuni_course_tiers')
      .select('id, course_id, title, slug, is_full_course, session_labels, is_active')
      .in('course_id', courseIds),
  ]);

  if (coursesError) throw coursesError;
  if (lessonsError) throw lessonsError;
  // tiers table may be empty for non-packaged courses; treat query errors as empty
  if (tiersError) {
    console.warn('Course tiers fetch skipped:', tiersError.message);
  }

  const tierRows = ((tiers || []) as CourseTierRow[]).filter((t) => t.is_active !== false);
  const tierMap = new Map(tierRows.map((t) => [t.id, t]));
  const courseHasTiers = new Set(tierRows.map((t) => t.course_id));

  const tierIds = tierRows.map((t) => t.id);
  const tierSessionLabels = new Map<string, string[]>();

  if (tierIds.length > 0) {
    const { data: tierSessions, error: tierSessionsError } = await supabase
      .from('myuni_tier_sessions')
      .select(`
        tier_id,
        order_index,
        myuni_live_sessions (
          id,
          title,
          session_number
        )
      `)
      .in('tier_id', tierIds);

    if (tierSessionsError) {
      console.warn('Tier sessions fetch skipped:', tierSessionsError.message);
    } else {
      ((tierSessions || []) as TierSessionRow[]).forEach((row) => {
        const session = unwrapLiveSession(row);
        const title =
          session?.title ||
          (session?.session_number != null ? `Oturum ${session.session_number}` : null);
        if (!title) return;
        const list = tierSessionLabels.get(row.tier_id) || [];
        list.push(title);
        tierSessionLabels.set(row.tier_id, list);
      });
    }
  }

  const courseMap = new Map((courses || []).map((c) => [c.id, c]));
  const lessonsByCourse = new Map<string, ModuleProgressItem[]>();

  ((lessons || []) as LessonRow[]).forEach((lesson) => {
    const section = unwrapSection(lesson);
    if (!section?.course_id) return;

    const item: ModuleProgressItem = {
      lesson_id: lesson.id,
      lesson_title: lesson.title,
      section_title: section.title,
      lesson_type: lesson.lesson_type,
      order_index: lesson.order_index ?? 0,
      section_order: section.order_index ?? 0,
      is_completed: false,
      watch_time_seconds: 0,
      quiz_score: null,
      last_activity: null,
    };

    const list = lessonsByCourse.get(section.course_id) || [];
    list.push(item);
    lessonsByCourse.set(section.course_id, list);
  });

  lessonsByCourse.forEach((list, courseId) => {
    lessonsByCourse.set(
      courseId,
      [...list].sort((a, b) => a.section_order - b.section_order || a.order_index - b.order_index)
    );
  });

  const allLessonIds = [...new Set(((lessons || []) as LessonRow[]).map((l) => l.id))];
  let progressRows: Array<{
    user_id: string;
    lesson_id: string;
    is_completed: boolean | null;
    watch_time_seconds: number | null;
    quiz_score: number | null;
    updated_at: string | null;
  }> = [];

  if (allLessonIds.length > 0 && userIds.length > 0) {
    const { data: progressData, error: progressError } = await supabase
      .from('myuni_user_progress')
      .select('user_id, lesson_id, is_completed, watch_time_seconds, quiz_score, updated_at')
      .in('lesson_id', allLessonIds)
      .in('user_id', userIds);

    if (progressError) throw progressError;
    progressRows = progressData || [];
  }

  const progressKey = (userId: string, lessonId: string) => `${userId}:${lessonId}`;
  const progressMap = new Map(progressRows.map((p) => [progressKey(p.user_id, p.lesson_id), p]));
  const userDetails = await fetchClerkUserDetails(userIds);

  // Payment / discount data from orders (same DB as LMS)
  let orderRows: OrderRow[] = [];
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select(
      'orderid, courseid, coursename, amount, discountcode, discountamount, useremail, enrolled, status, paymentmethod, created_at, custom_data'
    )
    .in('courseid', [...courseIds, 'CART']);

  if (ordersError) {
    console.warn('Orders fetch skipped:', ordersError.message);
  } else {
    orderRows = (ordersData || []) as OrderRow[];
  }

  // Group enrollments by user + course (a user may buy multiple packages)
  const grouped = new Map<string, EnrollmentRow[]>();
  enrollments.forEach((enrollment) => {
    const key = `${enrollment.user_id}::${enrollment.course_id}`;
    const list = grouped.get(key) || [];
    list.push(enrollment);
    grouped.set(key, list);
  });

  const byUser = new Map<string, PersonEnrollmentOverview>();

  grouped.forEach((rows) => {
    const first = rows[0];
    const course = courseMap.get(first.course_id);
    if (!course) return;
    const details = userDetails.get(first.user_id);

    const purchasedPackages: PurchasedPackage[] = [];
    let hasNullTierEnrollment = false;
    let earliestEnrolledAt: string | null = null;
    let enrollmentProgressFallback = 0;

    rows.forEach((row) => {
      if (!earliestEnrolledAt || (row.enrolled_at && row.enrolled_at < earliestEnrolledAt)) {
        earliestEnrolledAt = row.enrolled_at;
      }
      enrollmentProgressFallback = Math.max(
        enrollmentProgressFallback,
        row.progress_percentage || 0
      );

      if (!row.tier_id) {
        hasNullTierEnrollment = true;
        purchasedPackages.push({
          tier_id: null,
          title: 'Tam Eğitim',
          slug: 'tam-egitim',
          is_full_course: true,
          session_labels: [],
          enrolled_at: row.enrolled_at,
        });
        return;
      }

      const tier = tierMap.get(row.tier_id);
      purchasedPackages.push({
        tier_id: row.tier_id,
        title: tier?.title || `Paket ${row.tier_id.substring(0, 8)}`,
        slug: tier?.slug || null,
        is_full_course: tier ? isFullCourseTier(tier) : false,
        session_labels: tier?.session_labels || [],
        enrolled_at: row.enrolled_at,
      });
    });

    // Deduplicate packages by tier_id/title
    const uniquePackages = [...purchasedPackages.reduce((map, pkg) => {
      const key = pkg.tier_id || `full:${pkg.title}`;
      if (!map.has(key)) map.set(key, pkg);
      return map;
    }, new Map<string, PurchasedPackage>()).values()];

    const hasFullAccess =
      hasNullTierEnrollment ||
      uniquePackages.some((pkg) => pkg.is_full_course) ||
      !courseHasTiers.has(course.id);

    const accessSource: CourseEnrollmentDetail['access_source'] = !courseHasTiers.has(course.id)
      ? 'legacy_enrollment'
      : hasFullAccess
        ? 'full_course'
        : 'packages';

    const baseModules = lessonsByCourse.get(course.id) || [];
    const entitlementLabels = collectEntitlementLabels(uniquePackages, tierSessionLabels);

    const entitledModules = baseModules
      .map((module) => {
        const progress = progressMap.get(progressKey(first.user_id, module.lesson_id));
        const entitledBy = uniquePackages
          .filter((pkg) => {
            if (hasFullAccess || pkg.is_full_course) return true;
            const labels = [
              ...pkg.session_labels,
              ...(pkg.tier_id ? tierSessionLabels.get(pkg.tier_id) || [] : []),
            ];
            return labelsMatchContent(labels, module.lesson_title, module.section_title);
          })
          .map((pkg) => pkg.title);

        return {
          ...module,
          is_completed: Boolean(progress?.is_completed),
          watch_time_seconds: progress?.watch_time_seconds || 0,
          quiz_score: progress?.quiz_score ?? null,
          last_activity: progress?.updated_at || null,
          entitled_by: entitledBy,
        };
      })
      .filter((module) => {
        if (hasFullAccess) return true;
        // If we have entitlement labels, only keep matched lessons
        if (entitlementLabels.length > 0) {
          return (module.entitled_by || []).length > 0;
        }
        // No label mapping available: keep lessons that have any progress under purchased packages
        // so partial buyers still see activity; otherwise hide curriculum
        return (
          module.is_completed ||
          module.watch_time_seconds > 0 ||
          module.quiz_score !== null
        );
      });

    // If package labels don't map to lessons, surface package session labels as pseudo-modules
    // so admins still see what was purchased.
    const modules =
      !hasFullAccess && entitledModules.length === 0 && entitlementLabels.length > 0
        ? entitlementLabels.map((label, index) => ({
            lesson_id: `label:${course.id}:${normalizeText(label)}`,
            lesson_title: label,
            section_title: uniquePackages.map((p) => p.title).join(', '),
            lesson_type: 'package_item',
            order_index: index,
            section_order: 0,
            is_completed: false,
            watch_time_seconds: 0,
            quiz_score: null,
            last_activity: null,
            entitled_by: uniquePackages.map((p) => p.title),
          }))
        : entitledModules;

    const completed = modules.filter((m) => m.is_completed).length;
    const total = modules.length;
    const computedProgress =
      total > 0 ? Math.round((completed / total) * 100) : enrollmentProgressFallback;

    const payments = extractPaymentsForUserCourse(
      orderRows,
      first.user_id,
      details?.email,
      course.id
    );
    const discountCodes = [
      ...new Set(
        payments
          .flatMap((payment) => parseDiscountCodes(payment.discount_code))
          .filter(Boolean)
      ),
    ];
    const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalDiscount = payments.reduce(
      (sum, payment) => sum + (payment.discount_amount || 0),
      0
    );

    const courseDetail: CourseEnrollmentDetail = {
      course_id: course.id,
      course_title: course.title,
      course_slug: course.slug,
      enrolled_at: earliestEnrolledAt,
      progress_percentage: computedProgress,
      completed_modules: completed,
      total_modules: total,
      modules,
      purchased_packages: uniquePackages,
      has_full_access: hasFullAccess,
      access_source: accessSource,
      payments,
      total_paid: totalPaid,
      discount_codes: discountCodes,
      total_discount: totalDiscount,
    };

    const existing = byUser.get(first.user_id);
    const orderEmail =
      payments.map((p) => p.buyer_email).find((email) => Boolean(email)) || '';
    const resolvedEmail = details?.email || orderEmail || '';

    if (existing) {
      if (!existing.user_email && resolvedEmail) {
        existing.user_email = resolvedEmail;
      }
      existing.courses.push(courseDetail);
      return;
    }

    byUser.set(first.user_id, {
      user_id: first.user_id,
      user_name: details?.fullName || `Kullanıcı ${first.user_id.substring(0, 8)}`,
      user_email: resolvedEmail,
      user_image: details?.imageUrl || null,
      courses: [courseDetail],
    });
  });

  return [...byUser.values()]
    .map((person) => ({
      ...person,
      courses: [...person.courses].sort((a, b) => a.course_title.localeCompare(b.course_title, 'tr')),
    }))
    .sort((a, b) => a.user_name.localeCompare(b.user_name, 'tr'));
}

export async function updateCoursePrices(
  courseId: string,
  price: number | null,
  originalPrice: number | null
) {
  const { error } = await supabase
    .from('myuni_courses')
    .update({
      price,
      original_price: originalPrice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', courseId);

  if (error) throw error;
}

export type CoursePackagePrice = {
  id: string;
  course_id: string;
  title: string;
  slug: string | null;
  price: number;
  original_price: number | null;
  is_full_course: boolean;
  order_index: number;
  is_active: boolean;
};

/** Aktif satış paketlerini (tier) fiyat alanlarıyla getirir */
export async function getCoursePackagePrices(
  courseId: string
): Promise<CoursePackagePrice[]> {
  const { data, error } = await supabase
    .from('myuni_course_tiers')
    .select(
      'id, course_id, title, slug, price, original_price, is_full_course, order_index, is_active'
    )
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) throw error;

  return ((data || []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    course_id: String(row.course_id),
    title: String(row.title || 'Paket'),
    slug: row.slug != null ? String(row.slug) : null,
    price: Number(row.price) || 0,
    original_price:
      row.original_price != null && row.original_price !== ''
        ? Number(row.original_price)
        : null,
    is_full_course: row.is_full_course === true,
    order_index: Number(row.order_index) || 0,
    is_active: row.is_active !== false,
  }));
}

export async function updateCourseTierPrices(
  tierId: string,
  price: number | null,
  originalPrice: number | null
) {
  const { error } = await supabase
    .from('myuni_course_tiers')
    .update({
      price,
      original_price: originalPrice,
    })
    .eq('id', tierId);

  if (error) throw error;
}
