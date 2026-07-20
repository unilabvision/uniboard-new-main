import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import {
  claimPendingModuleFromClerkMetadata,
  upsertModuleAccessByClerkId,
  verifyModuleGrantToken,
} from '@/app/lib/moduleAccess/grantToken';
import { getServiceSupabase } from '@/app/lib/moduleAccess/helpers';
import { normalizeEmail } from '@/app/lib/internship/accessQuery';

/**
 * POST /api/modules/claim-grant
 * Body: { token?: string } — davet mailindeki grant token
 * Ayrıca Clerk publicMetadata.pendingModule varsa onu da claim eder.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let token: string | null = null;
  try {
    const body = await request.json();
    if (typeof body?.token === 'string' && body.token.trim()) {
      token = body.token.trim();
    }
  } catch {
    /* empty ok */
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const emails = user.emailAddresses.map((e) => normalizeEmail(e.emailAddress));
  const supabase = getServiceSupabase();

  const claimed: string[] = [];

  const fromMeta = await claimPendingModuleFromClerkMetadata(
    supabase,
    userId,
    user.publicMetadata as Record<string, unknown>
  );
  if (fromMeta) claimed.push(fromMeta);

  if (token) {
    const parsed = verifyModuleGrantToken(token);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Geçersiz veya süresi dolmuş davet linki.', claimed },
        { status: 400 }
      );
    }
    if (!emails.includes(parsed.email)) {
      return NextResponse.json(
        {
          error:
            'Bu davet başka bir e-posta için. Lütfen davet edilen hesapla giriş yapın.',
          claimed,
        },
        { status: 403 }
      );
    }
    await upsertModuleAccessByClerkId(supabase, userId, parsed.moduleKey);
    claimed.push(parsed.moduleKey);
  }

  if (claimed.length === 0) {
    return NextResponse.json({
      success: true,
      claimed: [],
      message: 'Claim edilecek yetki bulunamadı.',
    });
  }

  return NextResponse.json({
    success: true,
    claimed: [...new Set(claimed)],
  });
}
