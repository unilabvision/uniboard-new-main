import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeDiscountCode } from '@/app/lib/influencer/codes';

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Database configuration missing');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireAnalyticsAccess(userId: string) {
  const supabase = getAdminSupabase();
  const { loadUserAccessRows, resolveMembershipFromRows, hasFeature } =
    await import('@/app/lib/moduleAccess/rbac');
  let rows: Awaited<ReturnType<typeof loadUserAccessRows>>;
  try {
    rows = await loadUserAccessRows(supabase, userId);
  } catch (e) {
    return {
      ok: false as const,
      status: 500,
      error: e instanceof Error ? e.message : 'Error',
      supabase,
    };
  }

  const resolved = resolveMembershipFromRows(rows, 'analytics');
  const hasModule = resolved.isSuperAdmin || Boolean(resolved.membership);

  if (!hasModule) {
    return { ok: false as const, status: 403, error: 'Forbidden', supabase };
  }

  // Overview capability when RBAC is set; legacy full access passes
  if (
    !hasFeature(resolved.membership, 'overview', resolved.isSuperAdmin) &&
    resolved.membership?.accessLevel != null
  ) {
    return { ok: false as const, status: 403, error: 'Forbidden', supabase };
  }

  return { ok: true as const, status: 200, error: null, supabase };
}

/**
 * GET /api/analytics/meta
 * discount_codes + influencer Clerk profiles (service role; bypasses anon RLS)
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await requireAnalyticsAccess(userId);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const { data: codes, error: codesError } = await access.supabase
      .from('discount_codes')
      .select(
        'id, code, discount_amount, discount_type, influencer_id, commission, max_usage, usage_count, is_used, valid_until, applicable_courses, created_at'
      )
      .order('created_at', { ascending: false });

    if (codesError) {
      console.error('analytics/meta discount_codes:', codesError);
      return NextResponse.json({ error: codesError.message }, { status: 500 });
    }

    const rows = codes || [];
    const influencerIds = [
      ...new Set(
        rows
          .map((row) => String(row.influencer_id || '').trim())
          .filter(Boolean)
      ),
    ];

    const influencers: Record<
      string,
      { fullName: string; email: string; imageUrl: string | null }
    > = {};

    if (influencerIds.length > 0) {
      const clerk = await clerkClient();
      for (let i = 0; i < influencerIds.length; i += 100) {
        const chunk = influencerIds.slice(i, i + 100);
        try {
          const { data } = await clerk.users.getUserList({
            userId: chunk,
            limit: 100,
          });
          for (const user of data) {
            const email =
              user.emailAddresses?.[0]?.emailAddress ||
              user.primaryEmailAddress?.emailAddress ||
              '';
            const fullName =
              [user.firstName, user.lastName].filter(Boolean).join(' ') ||
              user.username ||
              email ||
              user.id.slice(0, 10);
            influencers[user.id] = {
              fullName,
              email,
              imageUrl: user.imageUrl || null,
            };
          }
        } catch (err) {
          console.warn('analytics/meta clerk influencers:', err);
        }
      }
    }

    const discountCodes = rows.map((row) => {
      const rawCode = String(row.code || '').trim();
      const upper = rawCode.toLocaleUpperCase('tr-TR');
      const normalized = normalizeDiscountCode(rawCode);
      return {
        id: String(row.id),
        code: rawCode,
        code_upper: upper,
        code_normalized: normalized,
        discount_amount:
          row.discount_amount != null ? Number(row.discount_amount) : null,
        discount_type: row.discount_type ? String(row.discount_type) : null,
        influencer_id: row.influencer_id ? String(row.influencer_id) : null,
        commission: row.commission != null ? Number(row.commission) : null,
        max_usage: row.max_usage != null ? Number(row.max_usage) : null,
        usage_count: row.usage_count != null ? Number(row.usage_count) : null,
        is_used: row.is_used === true,
        valid_until: row.valid_until ? String(row.valid_until) : null,
        applicable_courses: Array.isArray(row.applicable_courses)
          ? row.applicable_courses
          : null,
        created_at: row.created_at ? String(row.created_at) : null,
      };
    });

    return NextResponse.json({
      success: true,
      discountCodes,
      influencers,
    });
  } catch (error) {
    console.error('GET /api/analytics/meta:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
