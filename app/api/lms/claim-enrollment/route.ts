import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { findSiteClerkUserByEmail } from '@/app/lib/moduleAccess/helpers';
import { verifyCourseEnrollmentToken } from '@/app/lib/lms/courseEnrollmentInvite';
import { resolveEnrollmentTierId } from '@/app/lib/lms/enrollmentTiers';
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function htmlResponse(
  message: string,
  status: number,
  action?: { href: string; label: string }
) {
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.href)}" style="background:#990000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block">${escapeHtml(action.label)}</a></p>`
    : '';
  return new NextResponse(
    `<!doctype html><html lang="tr"><meta charset="utf-8"><title>MyUNI</title><body style="font-family:Arial,sans-serif;max-width:640px;margin:64px auto;padding:24px"><h1>MyUNI</h1><p>${message}</p>${button}</body></html>`,
    {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  );
}

function errorResponse(message: string, status: number) {
  return htmlResponse(message, status);
}

function isUniqueConflict(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
      (error.code === '23505' ||
        (error.message || '').includes('unique_user_course_enrollment') ||
        (error.message || '').includes('duplicate key'))
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

  // Absolute claim URL so signup can send the user back here after account creation.
  const claimUrl = new URL(request.nextUrl.href);

  const user = await findSiteClerkUserByEmail(parsed.email);

  if (!user) {
    const signupUrl = new URL(`/${locale}/sign-up`, getMyuniPublicOrigin());
    signupUrl.searchParams.set('email', parsed.email);
    // Clerk / site auth flows commonly honor these redirect params.
    signupUrl.searchParams.set('redirect_url', claimUrl.toString());
    signupUrl.searchParams.set('after_sign_up_url', claimUrl.toString());
    signupUrl.searchParams.set('redirect_url_complete', claimUrl.toString());

    return htmlResponse(
      locale === 'en'
        ? `No MyUNI account exists for ${escapeHtml(parsed.email)} yet. Create your account with this email, then you will be returned here to activate the course. Keep this invitation email until the course appears.`
        : `${escapeHtml(parsed.email)} için henüz bir MyUNI hesabı yok. Bu e-posta ile hesabınızı oluşturun; ardından kursu aktifleştirmek için buraya yönlendirileceksiniz. Kurs görünene kadar bu davet e-postasını saklayın.`,
      200,
      {
        href: signupUrl.toString(),
        label: locale === 'en' ? 'Create account' : 'Hesap oluştur',
      }
    );
  }

  const userId = user.id;

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

  const tierResult = await resolveEnrollmentTierId(
    supabase,
    parsed.courseId,
    parsed.tierId
  );
  const tierId = tierResult.error ? null : tierResult.tierId;

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
  const activeRow = courseRows.find((row) => row.is_active !== false);
  const inactiveRow = courseRows.find((row) => row.is_active === false);
  const hadActiveCourseAccess = courseRows.some((row) => row.is_active !== false);

  let newlyActivated = false;

  if (activeRow) {
    // Already enrolled — still sync package from the invitation when needed.
    if ((activeRow.tier_id ?? null) !== tierId) {
      const { error } = await supabase
        .from('myuni_enrollments')
        .update({ tier_id: tierId })
        .eq('id', activeRow.id);
      if (error && !isUniqueConflict(error)) {
        return errorResponse(error.message, 500);
      }
    }
  } else if (inactiveRow) {
    const { error } = await supabase
      .from('myuni_enrollments')
      .update({
        is_active: true,
        tier_id: tierId,
        enrolled_at: new Date().toISOString(),
        progress_percentage: inactiveRow.progress_percentage ?? 0,
      })
      .eq('id', inactiveRow.id);
    if (error && !isUniqueConflict(error)) {
      return errorResponse(error.message, 500);
    }
    newlyActivated = !error;
  } else {
    const { error } = await supabase.from('myuni_enrollments').insert({
      course_id: parsed.courseId,
      user_id: userId,
      enrolled_at: new Date().toISOString(),
      progress_percentage: 0,
      is_active: true,
      tier_id: tierId,
    });
    if (error && !isUniqueConflict(error)) {
      return errorResponse(error.message, 500);
    }
    newlyActivated = !error;
  }

  // Idempotency: only bump participant count when access becomes active
  // for the first time (no previously-active row for this user+course).
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
