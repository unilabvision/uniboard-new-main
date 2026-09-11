import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import {
  siteApplicationsDb,
  applyTeamApplicationsFilter,
  applyEventApplicationsFilter,
} from '@/app/lib/siteApplications/config';
import {
  requireSiteApplicationsOrEventsUser,
  resolveSiteApplicationsTenantScope,
  applySiteApplicationsTenantScope,
} from '@/app/api/site-applications/access/_helpers';
import {
  APPLICATION_EXPORT_COLUMNS,
  applyApplicationListFilters,
  parseApplicationListFilters,
} from '@/app/lib/siteApplications/listQuery';

/** Lower than previous 5000 to bound peak RAM for XLSX workbook + buffer. */
const MAX_EXPORT_ROWS = 2500;

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

function cellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(cellValue).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.file_name === 'string') return obj.file_name;
    if (typeof obj.url === 'string') return obj.url;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
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
  const filters = parseApplicationListFilters(searchParams);
  const labelLocale = searchParams.get('locale') || 'tr';

  if (tenantScope.mode === 'none') {
    return NextResponseEmptyList();
  }

  let query = supabase
    .from(siteApplicationsDb.applications)
    .select(APPLICATION_EXPORT_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(MAX_EXPORT_ROWS);

  if (filters.category === 'event') {
    query = applyEventApplicationsFilter(query);
  } else if (filters.category === 'team') {
    query = applyTeamApplicationsFilter(query);
  }

  query = applySiteApplicationsTenantScope(query, tenantScope);
  query = applyApplicationListFilters(query, filters);

  const { data: rows, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  type ExportRow = {
    form_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    status?: string | null;
    created_at?: string | null;
    organization?: string | null;
    event_name?: string | null;
    source?: string | null;
    locale?: string | null;
    submission_data?: Record<string, unknown> | null;
  };

  const applications = (rows ?? []) as ExportRow[];
  if (applications.length === 0) {
    return NextResponseEmptyList();
  }

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
      const label = labelLocale === 'en' ? f.label_en : f.label_tr;
      if (!fieldLabelMap.has(f.field_key)) {
        fieldLabelMap.set(f.field_key, label || f.field_key);
      }
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

  const staticHeaders = [
    labelLocale === 'tr' ? 'Ad' : 'First Name',
    labelLocale === 'tr' ? 'Soyad' : 'Last Name',
    'Email',
    labelLocale === 'tr' ? 'Telefon' : 'Phone',
    labelLocale === 'tr' ? 'Durum' : 'Status',
    labelLocale === 'tr' ? 'Başvuru Tarihi' : 'Date',
    labelLocale === 'tr' ? 'Kurum' : 'Organization',
    labelLocale === 'tr' ? 'Etkinlik' : 'Event',
    labelLocale === 'tr' ? 'Kaynak' : 'Source',
    labelLocale === 'tr' ? 'Dil' : 'Locale',
  ];

  const dynamicHeaders = dynamicKeys.map(
    (key) => fieldLabelMap.get(key) || key.replace(/_/g, ' ')
  );

  const headers = [...staticHeaders, ...dynamicHeaders];
  const worksheetData: unknown[][] = [headers];

  for (const app of applications) {
    const sub = (app.submission_data as Record<string, unknown>) || {};
    const staticRow = [
      cellValue(app.first_name),
      cellValue(app.last_name),
      cellValue(app.email),
      cellValue(app.phone),
      cellValue(app.status),
      app.created_at
        ? new Date(app.created_at).toISOString().slice(0, 16).replace('T', ' ')
        : '',
      cellValue(app.organization),
      cellValue(app.event_name),
      cellValue(app.source),
      cellValue(app.locale),
    ];
    const dynamicRow = dynamicKeys.map((key) => cellValue(sub[key]));
    worksheetData.push([...staticRow, ...dynamicRow]);
  }

  // Drop source rows before encoding workbook to free references sooner.
  applications.length = 0;

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const colWidths = headers.map((_, colIndex) => {
    let max = 10;
    for (let rowIndex = 0; rowIndex < worksheetData.length; rowIndex++) {
      const val = worksheetData[rowIndex][colIndex];
      const len = val ? String(val).length : 0;
      if (len > max) max = len > 50 ? 50 : len;
    }
    return { wch: max + 2 };
  });
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    labelLocale === 'tr' ? 'Basvurular' : 'Applications'
  );

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const filename = labelLocale === 'tr' ? 'basvurular.xlsx' : 'applications.xlsx';

  return new Response(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Export-Row-Limit': String(MAX_EXPORT_ROWS),
    },
  });
}

function NextResponseEmptyList() {
  return new Response('', {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
}
