import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { CLERK_JWT_TEMPLATE } from '@/app/lib/supabase/clerkLmsClient';

/**
 * Dev helper: verifies Clerk JWT template claims for Supabase.
 * GET /api/auth/clerk-jwt-status
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let token: string | null = null;
  let tokenError: string | null = null;
  try {
    token = await session.getToken({ template: CLERK_JWT_TEMPLATE });
  } catch (e) {
    tokenError = e instanceof Error ? e.message : 'getToken failed';
  }

  let claims: Record<string, unknown> | null = null;
  if (token) {
    try {
      const payload = token.split('.')[1];
      const json = Buffer.from(payload, 'base64url').toString('utf8');
      claims = JSON.parse(json) as Record<string, unknown>;
    } catch {
      claims = null;
    }
  }

  const liveKey = Boolean(
    process.env.CLERK_SECRET_KEY_LIVE || process.env.CLERK_LOOKUP_SECRET_KEY
  );

  return NextResponse.json({
    template: CLERK_JWT_TEMPLATE,
    hasToken: Boolean(token),
    tokenError,
    claims: claims
      ? {
          aud: claims.aud,
          role: claims.role,
          email: claims.email,
          sub: claims.sub,
          iss: claims.iss,
        }
      : null,
    hasLiveClerkKey: liveKey,
    jwksHint: 'https://clerk.myunilab.net/.well-known/jwks.json',
  });
}
