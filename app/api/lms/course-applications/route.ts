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

  // Deduplicate form IDs to avoid fetching same form twice
  const uniqueFormIds = [
    ...new Set(
      courseForms
        .filter((f) => !courseId || String(f.course_id || '') === courseId)
        .map((f) => String(f.id))
    ),
  ];

  if (uniqueFormIds.length === 0) {
    return NextResponse.json({ success: true, applications: [], forms: courseForms });
  }

  let query = authResult.supabase
    .from(siteApplicationsDb.applications)
    .select(
      'id, form_id, course_id, first_name, last_name, email, phone, status, locale, created_at, submission_data, source'
    )
    .in('form_id', uniqueFormIds)
    .order('created_at', { ascending: false })
    .limit(500);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate applications by ID (safety net against DB-level duplicates)
  const seen = new Set<string>();
  const idDedupedApplications = (data || []).filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  // Further deduplicate by email + form_id combination:
  // Keep only the latest submission per (email, form_id) pair.
  const emailFormSeen = new Map<string, string>(); // key -> row id of latest
  // First pass: identify latest per key
  for (const row of idDedupedApplications) {
    const key = `${(row.email || '').toLowerCase()}::${row.form_id}`;
    if (!emailFormSeen.has(key)) {
      emailFormSeen.set(key, row.id);
    }
    // idDedupedApplications is already sorted desc by created_at, so first one is the latest
  }
  const dedupedApplications = idDedupedApplications.filter(
    (row) => emailFormSeen.get(`${(row.email || '').toLowerCase()}::${row.form_id}`) === row.id
  );

  return NextResponse.json({
    success: true,
    applications: dedupedApplications,
    forms: courseForms,
  });
}
