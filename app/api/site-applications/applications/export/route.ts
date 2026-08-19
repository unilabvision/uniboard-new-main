import { NextRequest } from 'next/server';
import {
  siteApplicationsDb,
  applyTeamApplicationsFilter,
  applyEventApplicationsFilter,
} from '@/app/lib/siteApplications/config';
import {
  requireSiteApplicationsOrEventsUser,
  resolveSiteApplicationsTenantScope,
} from '@/app/api/site-applications/access/_helpers';

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

export async function GET(request: NextRequest) {
  const authResult = await requireSiteApplicationsOrEventsUser('registrations');
  if (authResult.error || !authResult.supabase) {
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: authResult.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = authResult.supabase;
  const tenantScope = await resolveSiteApplicationsTenantScope(
    supabase,
    authResult.userId || ''
  );

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search')?.trim() || '';
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';
  const eventId = searchParams.get('eventId')?.trim() || '';
  const eventName = searchParams.get('eventName')?.trim() || '';
  const locale = searchParams.get('locale') || 'tr';

  let query = supabase
    .from(siteApplicationsDb.applications)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MAX_EXPORT_ROWS);

  if (category === 'event') {
    query = applyEventApplicationsFilter(query);
  } else if (category === 'team') {
    query = applyTeamApplicationsFilter(query);
  }

  if (tenantScope.mode === 'none') {
    return new Response('', { status: 204 });
  } else if (tenantScope.mode === 'scoped') {
    query = query.in('organization', tenantScope.allowedValues);
  }

  if (eventId) query = query.eq('event_id', eventId);
  else if (eventName) query = query.ilike('event_name', eventName);
  if (status) query = query.eq('status', status);
  if (search) {
    const q = `%${search}%`;
    query = query.or(`first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`);
  }

  const { data: rows, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const applications = rows ?? [];
  if (applications.length === 0) {
    return new Response('', { status: 204 });
  }

  // Collect all form_ids to fetch field definitions for labels
  const formIds = [
    ...new Set(
      applications
        .map((a) => a.form_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    ),
  ];

  const fieldLabelMap = new Map<string, string>();
  if (formIds.length > 0) {
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
  }

  // Determine dynamic submission_data columns
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

  const staticHeaders = [
    locale === 'tr' ? 'Ad' : 'First Name',
    locale === 'tr' ? 'Soyad' : 'Last Name',
    'Email',
    locale === 'tr' ? 'Telefon' : 'Phone',
    locale === 'tr' ? 'Durum' : 'Status',
    locale === 'tr' ? 'Başvuru Tarihi' : 'Date',
    locale === 'tr' ? 'Kurum' : 'Organization',
    locale === 'tr' ? 'Etkinlik' : 'Event',
  ];

  const dynamicHeaders = dynamicKeys.map(
    (key) => fieldLabelMap.get(key) || key.replace(/_/g, ' ')
  );

  const headers = [...staticHeaders, ...dynamicHeaders];

  const csvRows: string[] = [headers.map(escapeCsvCell).join(',')];

  for (const app of applications) {
    const sub = (app.submission_data as Record<string, unknown>) || {};
    const staticRow = [
      app.first_name,
      app.last_name,
      app.email,
      app.phone,
      app.status,
      app.created_at ? new Date(app.created_at).toISOString().slice(0, 16).replace('T', ' ') : '',
      app.organization,
      app.event_name,
    ];
    const dynamicRow = dynamicKeys.map((key) => sub[key] ?? '');
    csvRows.push([...staticRow, ...dynamicRow].map(escapeCsvCell).join(','));
  }

  const BOM = '\uFEFF';
  const csv = BOM + csvRows.join('\r\n');

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="basvurular.csv"',
    },
  });
}
