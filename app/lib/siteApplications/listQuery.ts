/**
 * Shared list/export query helpers for site applications.
 * Keeps filters and column projections consistent without loading full row blobs.
 */

export const MAX_SEARCH_LEN = 100;
export const MAX_ORGANIZATION_LEN = 120;
export const MAX_SOURCE_LEN = 64;

export const ALLOWED_STATUSES = [
  'pending',
  'under_review',
  'accepted',
  'rejected',
] as const;

export const ALLOWED_SOURCES = ['website', 'event_website'] as const;

/** Keys kept on list responses to avoid shipping full form answers. */
export const LIST_SUBMISSION_KEYS = [
  'registration_tier',
  'payment_status',
  'package_title',
  'package_price',
  'package_currency',
] as const;

export const APPLICATION_LIST_COLUMNS = [
  'id',
  'form_id',
  'event_id',
  'course_id',
  'application_type',
  'first_name',
  'last_name',
  'email',
  'phone',
  'event_name',
  'organization',
  'status',
  'source',
  'locale',
  // Project only package/payment keys from JSONB (avoids shipping full form answers)
  'registration_tier:submission_data->registration_tier',
  'payment_status:submission_data->payment_status',
  'package_title:submission_data->package_title',
  'package_price:submission_data->package_price',
  'package_currency:submission_data->package_currency',
  'attachment_file_name',
  'attachment_storage_path',
  'created_at',
  'updated_at',
].join(', ');

export const APPLICATION_EXPORT_COLUMNS = [
  'id',
  'form_id',
  'application_type',
  'first_name',
  'last_name',
  'email',
  'phone',
  'event_name',
  'organization',
  'status',
  'source',
  'locale',
  'submission_data',
  'attachment_storage_path',
  'created_at',
].join(', ');

export type ApplicationListFilters = {
  search?: string;
  form?: string;
  status?: string;
  category?: string;
  eventId?: string;
  eventName?: string;
  registrationTier?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  organization?: string;
  hasAttachment?: 'yes' | 'no' | '';
  localeFilter?: string;
  source?: string;
};

/** Trim + length-cap free-text filter input. */
export function sanitizeFilterText(raw: string, maxLen: number): string {
  return raw.replace(/[\u0000-\u001f]/g, '').trim().slice(0, maxLen);
}

/**
 * Quote a PostgREST filter value so commas / parentheses cannot break `.or()` chains.
 * @see https://postgrest.org/en/stable/references/api/tables_views.html#horizontal-filtering
 */
export function quotePostgrestValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/**
 * Build a safe `col.ilike."%term%",...` clause for `.or()`.
 * Returns null when the search term is empty after sanitization.
 */
export function buildIlikeOrFilter(
  columns: string[],
  rawSearch: string
): string | null {
  const cleaned = sanitizeFilterText(rawSearch, MAX_SEARCH_LEN);
  if (!cleaned || columns.length === 0) return null;
  const pattern = quotePostgrestValue(`%${cleaned}%`);
  return columns.map((col) => `${col}.ilike.${pattern}`).join(',');
}

/** Fallback when a full submission_data object is present. */
export function slimSubmissionDataForList(raw: unknown): Record<string, unknown> {
  const src =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const key of LIST_SUBMISSION_KEYS) {
    if (src[key] !== undefined) out[key] = src[key];
  }
  return out;
}

/** Rebuild slim submission_data from projected list-select columns. */
export function submissionFromProjectedListRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  if (row.submission_data && typeof row.submission_data === 'object') {
    return slimSubmissionDataForList(row.submission_data);
  }
  const out: Record<string, unknown> = {};
  for (const key of LIST_SUBMISSION_KEYS) {
    if (row[key] !== undefined && row[key] !== null) out[key] = row[key];
  }
  return out;
}

/** Parse common list/export filters from URLSearchParams. */
export function parseApplicationListFilters(
  searchParams: URLSearchParams
): ApplicationListFilters {
  const hasAttachmentRaw = searchParams.get('hasAttachment')?.trim() || '';
  const hasAttachment =
    hasAttachmentRaw === 'yes' || hasAttachmentRaw === 'no' ? hasAttachmentRaw : '';

  const localeFilterRaw = searchParams.get('localeFilter')?.trim() || '';
  const localeFilter =
    localeFilterRaw === 'tr' || localeFilterRaw === 'en' ? localeFilterRaw : '';

  const statusRaw = searchParams.get('status')?.trim() || '';
  const status = (ALLOWED_STATUSES as readonly string[]).includes(statusRaw)
    ? statusRaw
    : '';

  const sourceRaw = sanitizeFilterText(
    searchParams.get('source') || '',
    MAX_SOURCE_LEN
  );
  const source = sourceRaw
    ? (ALLOWED_SOURCES as readonly string[]).includes(sourceRaw)
      ? sourceRaw
      : // allow unknown sources only if they look like safe identifiers
        /^[a-z0-9_]{1,64}$/i.test(sourceRaw)
        ? sourceRaw
        : ''
    : '';

  return {
    search: sanitizeFilterText(searchParams.get('search') || '', MAX_SEARCH_LEN),
    form: sanitizeFilterText(searchParams.get('form') || '', 120),
    status,
    category: searchParams.get('category')?.trim() || '',
    eventId: sanitizeFilterText(searchParams.get('eventId') || '', 80),
    eventName: sanitizeFilterText(searchParams.get('eventName') || '', 200),
    registrationTier: searchParams.get('registrationTier')?.trim() || '',
    paymentStatus: searchParams.get('paymentStatus')?.trim() || '',
    dateFrom: searchParams.get('dateFrom')?.trim() || '',
    dateTo: searchParams.get('dateTo')?.trim() || '',
    organization: sanitizeFilterText(
      searchParams.get('organization') || '',
      MAX_ORGANIZATION_LEN
    ),
    hasAttachment,
    localeFilter,
    source,
  };
}

export function isIsoDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Turkey observes permanent UTC+3 (no DST). Interpret YYYY-MM-DD as an Istanbul calendar day.
 */
export const LIST_FILTER_TIMEZONE_OFFSET = '+03:00';

export function dateFromBoundUtc(dateOnly: string): string {
  return new Date(`${dateOnly}T00:00:00.000${LIST_FILTER_TIMEZONE_OFFSET}`).toISOString();
}

export function dateToBoundUtc(dateOnly: string): string {
  return new Date(`${dateOnly}T23:59:59.999${LIST_FILTER_TIMEZONE_OFFSET}`).toISOString();
}

/** Minimal chainable surface used by applyApplicationListFilters (avoids `any`). */
export type ApplicationFilterQuery = {
  eq: (column: string, value: unknown) => ApplicationFilterQuery;
  ilike: (column: string, pattern: string) => ApplicationFilterQuery;
  or: (filters: string) => ApplicationFilterQuery;
  gte: (column: string, value: string) => ApplicationFilterQuery;
  lte: (column: string, value: string) => ApplicationFilterQuery;
  not: (column: string, operator: string, value: unknown) => ApplicationFilterQuery;
  is: (column: string, value: null) => ApplicationFilterQuery;
};

/**
 * Apply list filters to a Supabase query builder.
 * Category/team/event/tenant scope must be applied by the caller separately.
 */
export function applyApplicationListFilters<T extends ApplicationFilterQuery>(
  query: T,
  filters: ApplicationListFilters
): T {
  let q: ApplicationFilterQuery = query;

  if (filters.eventId) {
    q = q.eq('event_id', filters.eventId);
  } else if (filters.eventName) {
    q = q.ilike('event_name', `%${filters.eventName}%`);
  }

  if (filters.form && filters.form !== 'all') {
    q = q.eq('application_type', filters.form);
  }

  if (filters.status) {
    q = q.eq('status', filters.status);
  }

  const searchOr = filters.search
    ? buildIlikeOrFilter(
        ['first_name', 'last_name', 'email', 'phone'],
        filters.search
      )
    : null;
  if (searchOr) {
    q = q.or(searchOr);
  }

  if (filters.registrationTier === 'free' || filters.registrationTier === 'certificate') {
    q = q.eq('submission_data->>registration_tier', filters.registrationTier);
  }

  if (
    filters.paymentStatus === 'paid' ||
    filters.paymentStatus === 'pending' ||
    filters.paymentStatus === 'failed' ||
    filters.paymentStatus === 'none' ||
    filters.paymentStatus === 'superseded'
  ) {
    q = q.eq('submission_data->>payment_status', filters.paymentStatus);
  }

  if (filters.dateFrom && isIsoDateOnly(filters.dateFrom)) {
    q = q.gte('created_at', dateFromBoundUtc(filters.dateFrom));
  }

  if (filters.dateTo && isIsoDateOnly(filters.dateTo)) {
    q = q.lte('created_at', dateToBoundUtc(filters.dateTo));
  }

  if (filters.organization) {
    // Client .ilike encodes safely — do not use raw .or() here.
    q = q.ilike('organization', `%${filters.organization}%`);
  }

  if (filters.hasAttachment === 'yes') {
    q = q.not('attachment_storage_path', 'is', null);
  } else if (filters.hasAttachment === 'no') {
    q = q.is('attachment_storage_path', null);
  }

  if (filters.localeFilter === 'tr' || filters.localeFilter === 'en') {
    q = q.eq('locale', filters.localeFilter);
  }

  if (filters.source) {
    q = q.eq('source', filters.source);
  }

  return q as T;
}
