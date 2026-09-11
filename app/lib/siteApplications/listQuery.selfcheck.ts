/**
 * Self-check / unit tests for listQuery pure helpers.
 * Run: npx ts-node --transpile-only app/lib/siteApplications/listQuery.selfcheck.ts
 */
import assert from 'node:assert/strict';
import {
  buildIlikeOrFilter,
  dateFromBoundUtc,
  dateToBoundUtc,
  isIsoDateOnly,
  parseApplicationListFilters,
  quotePostgrestValue,
  sanitizeFilterText,
  slimSubmissionDataForList,
  submissionFromProjectedListRow,
  MAX_SEARCH_LEN,
} from './listQuery';

assert.equal(sanitizeFilterText('  hello  ', 10), 'hello');
assert.equal(sanitizeFilterText('x'.repeat(200), MAX_SEARCH_LEN).length, MAX_SEARCH_LEN);
assert.equal(sanitizeFilterText('a\nb\tc', 20), 'abc');

assert.equal(quotePostgrestValue('plain'), '"plain"');
assert.equal(quotePostgrestValue('a"b'), '"a\\"b"');
assert.equal(quotePostgrestValue('a\\b'), '"a\\\\b"');

const orClause = buildIlikeOrFilter(
  ['first_name', 'last_name', 'email', 'phone'],
  'foo,bar)'
);
assert.ok(orClause);
assert.match(orClause!, /first_name\.ilike\."%foo,bar\)%"/);
assert.ok(!orClause!.includes('foo,bar).ilike')); // value must stay quoted
assert.equal(buildIlikeOrFilter(['email'], '   '), null);

assert.equal(isIsoDateOnly('2024-01-15'), true);
assert.equal(isIsoDateOnly('2024-1-15'), false);
assert.equal(isIsoDateOnly('not-a-date'), false);

// Istanbul UTC+3: 2024-06-01 00:00+03 → 2024-05-31T21:00:00.000Z
assert.equal(dateFromBoundUtc('2024-06-01'), '2024-05-31T21:00:00.000Z');
assert.equal(dateToBoundUtc('2024-06-01'), '2024-06-01T20:59:59.999Z');

const params = new URLSearchParams({
  search: '  ali  ',
  status: 'hacked',
  paymentStatus: 'paid',
  localeFilter: 'tr',
  hasAttachment: 'yes',
  source: 'event_website',
  organization: '  Uni Lab  ',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
});
const filters = parseApplicationListFilters(params);
assert.equal(filters.search, 'ali');
assert.equal(filters.status, ''); // not in allowlist
assert.equal(filters.paymentStatus, 'paid');
assert.equal(filters.localeFilter, 'tr');
assert.equal(filters.hasAttachment, 'yes');
assert.equal(filters.source, 'event_website');
assert.equal(filters.organization, 'Uni Lab');

const paramsOkStatus = new URLSearchParams({ status: 'rejected' });
assert.equal(parseApplicationListFilters(paramsOkStatus).status, 'rejected');

const slim = slimSubmissionDataForList({
  registration_tier: 'certificate',
  payment_status: 'pending',
  motivation: 'long essay should be dropped',
  package_price: 100,
});
assert.deepEqual(slim, {
  registration_tier: 'certificate',
  payment_status: 'pending',
  package_price: 100,
});
assert.equal('motivation' in slim, false);

const projected = submissionFromProjectedListRow({
  registration_tier: 'free',
  payment_status: 'none',
  package_currency: 'TRY',
  first_name: 'A',
});
assert.deepEqual(projected, {
  registration_tier: 'free',
  payment_status: 'none',
  package_currency: 'TRY',
});

console.log('listQuery.selfcheck: all assertions passed');
