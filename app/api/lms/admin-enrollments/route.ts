import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { sendCourseEnrollmentEmail } from '@/app/_services/courseEnrollmentEmail';
import { createCourseEnrollmentToken } from '@/app/lib/lms/courseEnrollmentInvite';
import {
  findClerkUserByEmail,
  getAppBaseUrl,
} from '@/app/lib/moduleAccess/helpers';
import { loadUserAccessRows } from '@/app/lib/moduleAccess/rbac';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function publicCourseUrl(locale: string, slug: string) {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://myunilab.net'
  ).replace(/\/$/, '');
  return `${base}/${locale}/lms/courses/${encodeURIComponent(slug)}`;
}

function clerkDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
}) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.emailAddresses[0]?.emailAddress || '';
}

async function requireLmsOrStudentsAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { error: 'Unauthorized' as const, status: 401 as const, supabase: null };
  }

  const supabase = getServiceSupabase();
  let rows: Awaited<ReturnType<typeof loadUserAccessRows>>;
  try {
    rows = await loadUserAccessRows(supabase, userId);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Error',
      status: 500 as const,
      supabase: null,
    };
  }

  const isSuperAdmin = rows.some((r) => r.is_super_admin === true);
  const allowed = isSuperAdmin ||
    rows.some((r) =>
      ['students', 'student', 'lms', 'courses'].includes(r.module_key)
    );

  if (!allowed) {
    return { error: 'Forbidden' as const, status: 403 as const, supabase: null };
  }

  return { error: null, status: 200 as const, supabase };
}

/**
 * Admin enrollment read (bypasses anon RLS).
 * POST { courseIds?: string[], courseId?: string }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireLmsOrStudentsAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const body = await request.json().catch(() => ({}));
  const courseId =
    typeof body.courseId === 'string' ? body.courseId.trim() : '';
  const courseIds = Array.isArray(body.courseIds)
    ? body.courseIds.map(String).filter(Boolean)
    : [];

  let query = authResult.supabase
    .from('myuni_enrollments')
    .select(
      'id, course_id, user_id, enrolled_at, progress_percentage, is_active, tier_id'
    );

  if (courseId) {
    query = query.eq('course_id', courseId);
  } else if (courseIds.length > 0) {
    query = query.in('course_id', courseIds);
  } else {
    return NextResponse.json(
      { error: 'courseId or courseIds required' },
      { status: 400 }
    );
  }

  // Include active + null (legacy rows)
  query = query.or('is_active.eq.true,is_active.is.null');

  const { data, error } = await query.limit(10000);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enrollments = (data || []).filter(
    (row) => row.is_active !== false
  );

  return NextResponse.json({
    enrollments,
    count: enrollments.length,
  });
}

/**
 * Admin manual enroll by email.
 * PUT { courseId, email, locale? }
 */
export async function PUT(request: NextRequest) {
  const authResult = await requireLmsOrStudentsAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  const body = await request.json().catch(() => ({}));
  const courseId =
    typeof body.courseId === 'string' ? body.courseId.trim() : '';
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const locale =
    typeof body.locale === 'string' && body.locale.trim()
      ? body.locale.trim()
      : 'tr';

  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const { data: course, error: courseError } = await authResult.supabase
    .from('myuni_courses')
    .select('id, title, slug, current_participants')
    .eq('id', courseId)
    .maybeSingle();

  if (courseError) {
    return NextResponse.json({ error: courseError.message }, { status: 500 });
  }
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const clerkUser = await findClerkUserByEmail(email);
  if (!clerkUser) {
    const safeLocale = locale === 'en' ? 'en' : 'tr';
    const token = createCourseEnrollmentToken(email, courseId);
    const claimPath = `/api/lms/claim-enrollment?token=${encodeURIComponent(
      token
    )}&locale=${safeLocale}`;
    const signupUrl = new URL(`/${safeLocale}/login`, getAppBaseUrl());
    signupUrl.searchParams.set('tab', 'signup');
    signupUrl.searchParams.set('email', email);
    signupUrl.searchParams.set('redirect', claimPath);

    try {
      const clerk = await clerkClient();
      await clerk.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: signupUrl.toString(),
        publicMetadata: {
          pendingCourseId: courseId,
          pendingCourseLocale: safeLocale,
        },
        notify: false,
      });
    } catch (inviteError) {
      // The signed claim link remains sufficient if Clerk invitation creation
      // is unavailable or an account was created during this request.
      console.warn('Course Clerk invitation skipped:', inviteError);
    }

    const mail = await sendCourseEnrollmentEmail({
      to: email,
      name: email,
      courseTitle: course.title || 'MyUNI',
      courseUrl: signupUrl.toString(),
      locale: safeLocale,
      invited: true,
    });

    return NextResponse.json({
      success: true,
      invited: true,
      alreadyEnrolled: false,
      emailSent: Boolean(mail.success),
      emailWarning: mail.success ? undefined : mail.error || 'Email send failed',
    });
  }

  const userId = clerkUser.id;
  const userEmail =
    clerkUser.emailAddresses.find(
      (e) => e.emailAddress.toLowerCase() === email
    )?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    email;
  const userName = clerkDisplayName(clerkUser);

  const { data: existingRows, error: existingError } = await authResult.supabase
    .from('myuni_enrollments')
    .select('id, course_id, user_id, enrolled_at, progress_percentage, is_active, tier_id')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .limit(5);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingActive = (existingRows || []).find((row) => row.is_active !== false);
  if (existingActive) {
    return NextResponse.json({
      success: true,
      alreadyEnrolled: true,
      emailSent: false,
      enrollment: existingActive,
      user: { id: userId, email: userEmail, name: userName },
    });
  }

  const existingInactive = (existingRows || []).find((row) => row.is_active === false);
  let enrollment = existingInactive || null;

  if (existingInactive) {
    const { data: reactivated, error: reactivateError } = await authResult.supabase
      .from('myuni_enrollments')
      .update({
        is_active: true,
        enrolled_at: new Date().toISOString(),
        progress_percentage: existingInactive.progress_percentage ?? 0,
      })
      .eq('id', existingInactive.id)
      .select(
        'id, course_id, user_id, enrolled_at, progress_percentage, is_active, tier_id'
      )
      .single();

    if (reactivateError || !reactivated) {
      return NextResponse.json(
        { error: reactivateError?.message || 'Failed to reactivate enrollment' },
        { status: 500 }
      );
    }
    enrollment = reactivated;
  } else {
    const { data: inserted, error: insertError } = await authResult.supabase
      .from('myuni_enrollments')
      .insert([
        {
          course_id: courseId,
          user_id: userId,
          enrolled_at: new Date().toISOString(),
          progress_percentage: 0,
          is_active: true,
        },
      ])
      .select(
        'id, course_id, user_id, enrolled_at, progress_percentage, is_active, tier_id'
      )
      .single();

    if (insertError || !inserted) {
      // Race: another insert won unique constraint — treat as already enrolled
      if (insertError?.code === '23505') {
        const { data: raced } = await authResult.supabase
          .from('myuni_enrollments')
          .select(
            'id, course_id, user_id, enrolled_at, progress_percentage, is_active, tier_id'
          )
          .eq('course_id', courseId)
          .eq('user_id', userId)
          .maybeSingle();

        return NextResponse.json({
          success: true,
          alreadyEnrolled: true,
          emailSent: false,
          enrollment: raced,
          user: { id: userId, email: userEmail, name: userName },
        });
      }

      return NextResponse.json(
        { error: insertError?.message || 'Failed to create enrollment' },
        { status: 500 }
      );
    }
    enrollment = inserted;
  }

  await authResult.supabase
    .from('myuni_courses')
    .update({
      current_participants: (course.current_participants || 0) + 1,
    })
    .eq('id', courseId);

  const courseUrl = publicCourseUrl(locale === 'en' ? 'en' : 'tr', course.slug || course.id);
  const mail = await sendCourseEnrollmentEmail({
    to: userEmail,
    name: userName,
    courseTitle: course.title || 'MyUNI',
    courseUrl,
    locale: locale === 'en' ? 'en' : 'tr',
  });

  return NextResponse.json({
    success: true,
    alreadyEnrolled: false,
    emailSent: Boolean(mail.success),
    emailWarning: mail.success ? undefined : mail.error || 'Email send failed',
    enrollment,
    user: { id: userId, email: userEmail, name: userName },
  });
}
