import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCourseEnrollmentToken } from '@/app/lib/lms/courseEnrollmentInvite';
import { resolveEnrollmentTierIds } from '@/app/lib/lms/enrollmentTiers';
import { getMyuniPublicOrigin } from '@/app/lib/siteApplications/publicUrls';

function serviceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function publicCourseUrl(locale: string, slug: string) {
  const path = locale === 'en' ? 'course' : 'kurs';
  return `${getMyuniPublicOrigin()}/${locale}/${path}/${encodeURIComponent(slug)}`;
}

function errorResponse(message: string, status: number) {
  return new NextResponse(
    `<!doctype html><html lang="tr"><meta charset="utf-8"><title>MyUNI</title><body style="font-family:Arial,sans-serif;max-width:640px;margin:64px auto;padding:24px"><h1>MyUNI</h1><p>${message}</p></body></html>`,
    {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
  const parsed = verifyCourseEnrollmentToken(token);
  if (!parsed) {
    return errorResponse(
      locale === 'en'
        ? 'This enrollment invitation is invalid or has expired.'
        : 'Bu kurs daveti geçersiz veya süresi dolmuş.',
      400
    );
  }

  const { userId } = await auth();
  if (!userId) {
    const claimPath = `/api/lms/claim-enrollment?token=${encodeURIComponent(
      token
    )}&locale=${locale}`;
    const loginUrl = new URL(`/${locale}/login`, request.nextUrl.origin);
    loginUrl.searchParams.set('tab', 'signup');
    loginUrl.searchParams.set('email', parsed.email);
    loginUrl.searchParams.set('redirect', claimPath);
    return NextResponse.redirect(loginUrl);
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const ownsEmail = user.emailAddresses.some(
    (item) => item.emailAddress.trim().toLowerCase() === parsed.email
  );
  if (!ownsEmail) {
    return errorResponse(
      locale === 'en'
        ? 'This invitation belongs to another email address.'
        : 'Bu davet başka bir e-posta adresine ait.',
      403
    );
  }

  const supabase = serviceSupabase();
  const { data: course, error: courseError } = await supabase
    .from('myuni_courses')
    .select('id, slug, current_participants')
    .eq('id', parsed.courseId)
    .maybeSingle();
  if (courseError || !course) {
    return errorResponse(
      locale === 'en' ? 'Course not found.' : 'Kurs bulunamadı.',
      404
    );
  }

  const tierResult = await resolveEnrollmentTierIds(
    supabase,
    parsed.courseId,
    parsed.tierIds
  );
  const tierIds = tierResult.error ? [null] : tierResult.tierIds;

  const { data: allRows, error: existingError } = await supabase
    .from('myuni_enrollments')
    .select('id, is_active, progress_percentage, tier_id')
    .eq('course_id', parsed.courseId)
    .eq('user_id', userId)
    .limit(50);
  if (existingError) {
    return errorResponse(existingError.message, 500);
  }

  const courseRows = allRows || [];
  const hadActiveCourseAccess = courseRows.some((row) => row.is_active !== false);

  let newlyActivated = false;
  for (const tierId of tierIds) {
    const tierRows = courseRows.filter((row) => (row.tier_id ?? null) === tierId);
    if (tierRows.some((row) => row.is_active !== false)) continue;

    const inactive = tierRows.find((row) => row.is_active === false);
    if (inactive) {
      const { error } = await supabase
        .from('myuni_enrollments')
        .update({
          is_active: true,
          enrolled_at: new Date().toISOString(),
          progress_percentage: inactive.progress_percentage ?? 0,
        })
        .eq('id', inactive.id);
      if (error) return errorResponse(error.message, 500);
      newlyActivated = true;
    } else {
      const { error } = await supabase.from('myuni_enrollments').insert({
        course_id: parsed.courseId,
        user_id: userId,
        enrolled_at: new Date().toISOString(),
        progress_percentage: 0,
        is_active: true,
        tier_id: tierId,
      });
      if (error && error.code !== '23505') {
        return errorResponse(error.message, 500);
      }
      newlyActivated = newlyActivated || !error;
    }
  }

  if (newlyActivated && !hadActiveCourseAccess) {
    await supabase
      .from('myuni_courses')
      .update({
        current_participants: (course.current_participants || 0) + 1,
      })
      .eq('id', parsed.courseId);
  }

  return NextResponse.redirect(
    publicCourseUrl(locale, course.slug || course.id)
  );
}
