import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { isCourseApplicationForm } from '@/app/lib/siteApplications/formTypes';

/**
 * GET – Course application submissions for LMS inbox.
 * Query: ?courseId= optional filter
 */
export async function GET(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const courseId = request.nextUrl.searchParams.get('courseId')?.trim() || null;
  const status = request.nextUrl.searchParams.get('status')?.trim() || null;

  // Load course forms
  const { data: forms, error: formsError } = await authResult.supabase
    .from(siteApplicationsDb.forms)
    .select('id, title_tr, title_en, slug_tr, slug_en, form_type, course_id, event_id, is_active')
    .order('updated_at', { ascending: false });

  if (formsError) {
    return NextResponse.json({ error: formsError.message }, { status: 500 });
  }

  const courseForms = (forms || []).filter((f) => isCourseApplicationForm(f));
  const formIds = courseForms
    .filter((f) => !courseId || String(f.course_id || '') === courseId)
    .map((f) => String(f.id));

  if (formIds.length === 0) {
    return NextResponse.json({ success: true, applications: [], forms: courseForms });
  }

  let query = authResult.supabase
    .from(siteApplicationsDb.applications)
    .select(
      'id, form_id, course_id, first_name, last_name, email, phone, status, locale, created_at, submission_data, source'
    )
    .in('form_id', formIds)
    .order('created_at', { ascending: false })
    .limit(500);

  if (courseId) {
    query = query.or(`course_id.eq.${courseId},submission_data->>course_id.eq.${courseId}`);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    // Fallback without course_id filter expression
    const fallback = await authResult.supabase
      .from(siteApplicationsDb.applications)
      .select(
        'id, form_id, first_name, last_name, email, phone, status, locale, created_at, submission_data, source'
      )
      .in('form_id', formIds)
      .order('created_at', { ascending: false })
      .limit(500);
    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      applications: fallback.data || [],
      forms: courseForms,
    });
  }

  return NextResponse.json({
    success: true,
    applications: data || [],
    forms: courseForms,
  });
}
