/**
 * In-memory rate limit + audit helpers for applicant-facing emails.
 * Process-local (resets on deploy); enough to blunt accidental/abusive bursts.
 */

const WINDOW_MS = 60_000;
const MAX_PER_APP = 5;
const MAX_PER_USER = 20;

type Bucket = number[];

const byApp = new Map<string, Bucket>();
const byUser = new Map<string, Bucket>();

function prune(bucket: Bucket, now: number): Bucket {
  return bucket.filter((ts) => now - ts < WINDOW_MS);
}

function take(map: Map<string, Bucket>, key: string, limit: number, now: number): boolean {
  const next = prune(map.get(key) || [], now);
  if (next.length >= limit) {
    map.set(key, next);
    return false;
  }
  next.push(now);
  map.set(key, next);
  return true;
}

export type EmailSendGuardResult =
  | { ok: true }
  | { ok: false; status: 429; error: string };

export function assertEmailSendAllowed(params: {
  userId: string;
  applicationId: string;
}): EmailSendGuardResult {
  const now = Date.now();
  const appKey = params.applicationId;
  const userKey = params.userId;

  if (!take(byApp, appKey, MAX_PER_APP, now)) {
    return {
      ok: false,
      status: 429,
      error: 'Too many emails for this application. Try again in a minute.',
    };
  }
  if (!take(byUser, userKey, MAX_PER_USER, now)) {
    return {
      ok: false,
      status: 429,
      error: 'Email rate limit exceeded. Try again in a minute.',
    };
  }
  return { ok: true };
}

export function auditApplicantEmail(params: {
  userId: string;
  applicationId: string;
  to: string;
  subject: string;
  kind?: string;
  success: boolean;
  error?: string;
}) {
  console.info('[site-applications-email-audit]', {
    at: new Date().toISOString(),
    kind: params.kind || 'send-email',
    userId: params.userId,
    applicationId: params.applicationId,
    to: params.to,
    subjectLen: params.subject.length,
    success: params.success,
    error: params.error || null,
  });
}

/** Test helper */
export function _resetEmailSendGuardForTests() {
  byApp.clear();
  byUser.clear();
}
