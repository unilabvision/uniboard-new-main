import { createHmac, timingSafeEqual } from 'crypto';

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

function inviteSecret() {
  return (
    process.env.MODULE_GRANT_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    process.env.EMAIL_PASSWORD ||
    'uniboard-course-enrollment-dev'
  );
}

function encode(value: string) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding =
    normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64').toString('utf8');
}

export function createCourseEnrollmentToken(
  email: string,
  courseId: string,
  tierId: string | null = null
) {
  const expiresAt = Date.now() + INVITE_TTL_MS;
  const payload = `${email.trim().toLowerCase()}|${courseId}|${tierId || ''}|${expiresAt}`;
  const signature = createHmac('sha256', inviteSecret())
    .update(payload)
    .digest('hex');
  return encode(`${payload}|${signature}`);
}

export function verifyCourseEnrollmentToken(token: string): {
  email: string;
  courseId: string;
  tierId: string | null;
} | null {
  try {
    const parts = decode(token.trim()).split('|');
    // Legacy invites were signed without a tier segment.
    if (parts.length !== 4 && parts.length !== 5) return null;

    const email = parts[0];
    const courseId = parts[1];
    const tierSegment = parts.length === 5 ? parts[2] : '';
    const expiresAtRaw = parts[parts.length - 2];
    const signature = parts[parts.length - 1];
    if (!email || !courseId || !signature) return null;

    const payload = parts.slice(0, -1).join('|');
    const expected = createHmac('sha256', inviteSecret())
      .update(payload)
      .digest('hex');
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

    return {
      email: email.toLowerCase(),
      courseId,
      tierId: tierSegment || null,
    };
  } catch {
    return null;
  }
}
