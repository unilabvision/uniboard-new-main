import { NextRequest } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';
import { isCourseApplicationForm } from '@/app/lib/siteApplications/formTypes';

const MAX_EXPORT_ROWS = 5000;

const INTERNAL_SUBMISSION_KEYS = new Set([
  'registration_tier',
  'package_title',
  'package_price',
  'package_currency',
  'payment_status',
  'payment_method',
  'order_id',
  'paid_at',
  'course_id',
  'course_slug',
  'course_title',
  'checkout_type',
  'tier_id',
  'event_slug',
  'event_title',
]);

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/\r?\n/g, ' ');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * GET – Excel/CSV export of course application submissions.
 * Query: courseId?, status?, locale?
 */
export async function GET(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = authResult.supabase;
  const { searchParams } = request.nextUrl;
  const courseId = searchParams.get('courseId')?.trim() || '';
  const status = searchParams.get('status')?.trim() || '';
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'tr';

  const { data: forms, error: formsError } = await supabase
    .from(siteApplicationsDb.forms)
    .select('id, title_tr, title_en, slug_tr, slug_en, form_type, course_id, event_id')
    .order('updated_at', { ascending: false });

  if (formsError) {
    return new Response(JSON.stringify({ error: formsError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const courseForms = (forms || []).filter((f) => isCourseApplicationForm(f));
  const formById = new Map(courseForms.map((f) => [String(f.id), f]));
  const formIds = courseForms
    .filter((f) => !courseId || String(f.course_id || '') === courseId)
    .map((f) => String(f.id));

  if (formIds.length === 0) {
    return new Response('', { status: 204 });
  }

  let query = supabase
    .from(siteApplicationsDb.applications)
    .select('*')
    .in('form_id', formIds)
    .order('created_at', { ascending: false })
    .limit(MAX_EXPORT_ROWS);

  if (status) query = query.eq('status', status);

  const { data: rows, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let applications = rows ?? [];
  if (courseId) {
    applications = applications.filter((a) => {
      const fromCol = a.course_id != null && String(a.course_id) === courseId;
      const sub = a.submission_data as Record<string, unknown> | null;
      const fromSub = sub && String(sub.course_id || '') === courseId;
      const form = formById.get(String(a.form_id));
      const fromForm = form && String(form.course_id || '') === courseId;
      return fromCol || fromSub || fromForm;
    });
  }

  if (applications.length === 0) {
    return new Response('', { status: 204 });
  }

  const courseIds = [
    ...new Set(
      applications
        .map((a) => {
          const form = formById.get(String(a.form_id));
          return (
            (a.course_id && String(a.course_id)) ||
            (typeof (a.submission_data as Record<string, unknown> | null)?.course_id === 'string'
              ? String((a.submission_data as Record<string, unknown>).course_id)
              : null) ||
            (form?.course_id ? String(form.course_id) : null)
          );
        })
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const courseTitleById = new Map<string, string>();
  if (courseIds.length > 0) {
    const { data: courses } = await supabase
      .from('myuni_courses')
      .select('id, title')
      .in('id', courseIds);
    for (const c of courses ?? []) {
      courseTitleById.set(String(c.id), String(c.title || ''));
    }
  }

  const fieldLabelMap = new Map<string, string>();
  const { data: fields } = await supabase
    .from(siteApplicationsDb.formFields)
    .select('field_key, label_tr, label_en, form_id')
    .in('form_id', formIds);
  for (const f of fields ?? []) {
    const label = locale === 'en' ? f.label_en : f.label_tr;
    if (!fieldLabelMap.has(f.field_key)) {
      fieldLabelMap.set(f.field_key, label || f.field_key);
    }
  }

  const dynamicKeys: string[] = [];
  const seenKeys = new Set<string>();
  for (const app of applications) {
    if (app.submission_data && typeof app.submission_data === 'object') {
      for (const key of Object.keys(app.submission_data)) {
        if (!seenKeys.has(key) && !INTERNAL_SUBMISSION_KEYS.has(key)) {
          seenKeys.add(key);
          dynamicKeys.push(key);
        }
      }
    }
  }

  const staticHeaders =
    locale === 'tr'
      ? ['Ad', 'Soyad', 'Email', 'Telefon', 'Kurs', 'Form', 'Durum', 'Başvuru Tarihi']
      : ['First Name', 'Last Name', 'Email', 'Phone', 'Course', 'Form', 'Status', 'Date'];

  const dynamicHeaders = dynamicKeys.map(
    (key) => fieldLabelMap.get(key) || key.replace(/_/g, ' ')
  );
  const headers = [...staticHeaders, ...dynamicHeaders];
  const csvRows: string[] = [headers.map(escapeCsvCell).join(',')];

  for (const app of applications) {
    const form = formById.get(String(app.form_id));
    const resolvedCourseId =
      (app.course_id && String(app.course_id)) ||
      (typeof (app.submission_data as Record<string, unknown> | null)?.course_id === 'string'
        ? String((app.submission_data as Record<string, unknown>).course_id)
        : null) ||
      (form?.course_id ? String(form.course_id) : null);
    const courseTitle =
      (resolvedCourseId && courseTitleById.get(resolvedCourseId)) ||
      (typeof (app.submission_data as Record<string, unknown> | null)?.course_title === 'string'
        ? String((app.submission_data as Record<string, unknown>).course_title)
        : '') ||
      '';
    const formTitle =
      locale === 'en'
        ? form?.title_en || form?.title_tr || ''
        : form?.title_tr || form?.title_en || '';
    const sub = (app.submission_data as Record<string, unknown>) || {};

    const staticRow = [
      app.first_name,
      app.last_name,
      app.email,
      app.phone,
      courseTitle,
      formTitle,
      app.status,
      app.created_at
        ? new Date(app.created_at).toISOString().slice(0, 16).replace('T', ' ')
        : '',
    ];
    const dynamicRow = dynamicKeys.map((key) => sub[key] ?? '');
    csvRows.push([...staticRow, ...dynamicRow].map(escapeCsvCell).join(','));
  }

  const BOM = '\uFEFF';
  const csv = BOM + csvRows.join('\r\n');
  const filename =
    locale === 'tr' ? 'kurs-basvurulari.csv' : 'course-applications.csv';

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
