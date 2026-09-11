/**
 * Self-check for certificate issue helpers + paid-only eligibility.
 * Run: npm run test:certificate-issue
 */
import assert from 'node:assert/strict';
import { isCertificateEligible } from '../certificates/syncIssuanceQueue';
import {
  buildDryRunIssueResult,
  resolveTemplateForIssue,
  summarizeQueuePreview,
  validateSaveBeforeSend,
} from './certificateIssue';

// --- paid-only eligibility ---
assert.equal(
  isCertificateEligible({
    registration_tier: 'certificate',
    payment_status: 'paid',
  }),
  true
);
assert.equal(
  isCertificateEligible({
    registration_tier: 'certificate',
    payment_status: 'pending',
    package_price: 0,
  }),
  false,
  'pending even with 0₺ must not queue (submit marks free as paid)'
);
assert.equal(
  isCertificateEligible({
    registration_tier: 'free',
    payment_status: 'paid',
  }),
  false
);
assert.equal(
  isCertificateEligible({
    registration_tier: 'certificate',
    payment_status: 'failed',
  }),
  false
);

// --- save before send ---
assert.equal(validateSaveBeforeSend({ templateId: null }).ok, false);
assert.equal(validateSaveBeforeSend({ templateId: 1, dirty: true }).ok, false);
assert.equal(validateSaveBeforeSend({ templateId: 1, dirty: false }).ok, true);

// --- template resolve ---
const missingId = resolveTemplateForIssue(null, null);
assert.equal(missingId.ok, false);
if (!missingId.ok) assert.equal(missingId.code, 'missing_template_id');

const notFound = resolveTemplateForIssue(42, null);
assert.equal(notFound.ok, false);
if (!notFound.ok) assert.equal(notFound.code, 'template_not_found');

const noSlug = resolveTemplateForIssue(7, {
  id: 7,
  name: 'Katılım',
  organization_slug: '  ',
});
assert.equal(noSlug.ok, false);
if (!noSlug.ok) assert.equal(noSlug.code, 'missing_org_slug');

const okTpl = resolveTemplateForIssue(7, {
  id: 7,
  name: 'Katılım Sertifikası',
  organization_slug: 'myuni',
});
assert.equal(okTpl.ok, true);
if (okTpl.ok) {
  assert.equal(okTpl.organizationSlug, 'myuni');
  assert.equal(okTpl.templateId, 7);
}

// --- queue preview ---
const now = Date.parse('2026-09-11T12:00:00.000Z');
const summary = summarizeQueuePreview(
  [
    {
      id: '1',
      status: 'ready',
      eligible_at: '2026-09-11T10:00:00.000Z',
      recipient_email: 'a@x.com',
      recipient_name: 'A',
    },
    {
      id: '2',
      status: 'pending',
      eligible_at: '2026-09-12T10:00:00.000Z',
      recipient_email: 'b@x.com',
      recipient_name: 'B',
    },
    {
      id: '3',
      status: 'failed',
      eligible_at: '2026-09-10T10:00:00.000Z',
      recipient_email: 'c@x.com',
      recipient_name: 'C',
    },
    {
      id: '4',
      status: 'issued',
      eligible_at: '2026-09-01T10:00:00.000Z',
      recipient_email: 'd@x.com',
      recipient_name: 'D',
    },
  ],
  now
);
assert.equal(summary.readyDue, 1);
assert.equal(summary.pendingWait, 1);
assert.equal(summary.failed, 1);
assert.equal(summary.failedDue, 1);
assert.equal(summary.issued, 1);
assert.equal(summary.wouldIssue, 2);
assert.equal(summary.dueRecipients.length, 2);

// --- dry-run ---
const dryBad = buildDryRunIssueResult({
  templateResult: notFound,
  dueRows: [],
});
assert.equal(dryBad.canSend, false);
assert.ok(dryBad.templateError);

const dryOk = buildDryRunIssueResult({
  templateResult: okTpl,
  dueRows: [
    {
      id: '1',
      status: 'ready',
      eligible_at: '2026-09-11T10:00:00.000Z',
      recipient_email: 'A@X.com',
      recipient_name: 'Ali',
    },
  ],
});
assert.equal(dryOk.canSend, true);
assert.equal(dryOk.wouldIssue, 1);
assert.equal(dryOk.recipients[0].email, 'a@x.com');
assert.match(dryOk.message, /Dry-run: 1/);

const dryEmpty = buildDryRunIssueResult({
  templateResult: okTpl,
  dueRows: [],
  nextEligibleAt: '2026-09-12T12:00:00.000Z',
});
assert.equal(dryEmpty.canSend, false);
assert.match(dryEmpty.message, /Bekleme süresi/);

console.log('certificateIssue selfcheck OK');
