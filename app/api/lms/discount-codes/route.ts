import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import {
  applyHighValueFixedDefaults,
  DISCOUNT_ADMIN_SELECT,
  resolveBalanceFields,
  type DiscountCodeAdminPayload,
} from '@/app/lib/lms/discountCodesAdmin';

/**
 * GET – List non-referral discount codes (LMS admin).
 */
export async function GET(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const isCampaign = searchParams.get('is_campaign');
    const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500);

    let query = authResult.supabase
      .from('discount_codes')
      .select(DISCOUNT_ADMIN_SELECT)
      .eq('is_referral', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (isCampaign === 'true') query = query.eq('is_campaign', true);

    const { data, error } = await query;
    if (error) {
      console.error('LMS discount-codes list error:', error);
      return NextResponse.json({ error: error.message || 'Liste alınamadı' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (e) {
    console.error('LMS discount-codes GET error:', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * POST – Create a discount code (LMS admin).
 */
export async function POST(request: NextRequest) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = (await request.json()) as DiscountCodeAdminPayload;
    const code = (body.code ?? '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: 'Kod alanı zorunludur' }, { status: 400 });
    }
    const validUntil = body.valid_until ?? '';
    if (!validUntil) {
      return NextResponse.json({ error: 'Geçerlilik tarihi zorunludur' }, { status: 400 });
    }

    const discountAmount = Number(body.discount_amount);
    if (Number.isNaN(discountAmount) || discountAmount < 0) {
      return NextResponse.json({ error: 'Geçerli bir indirim miktarı girin' }, { status: 400 });
    }

    const discountType = body.discount_type === 'fixed' ? 'fixed' : 'percentage';
    const balance = resolveBalanceFields(body);

    const row = applyHighValueFixedDefaults({
      code,
      discount_amount: discountAmount,
      discount_type: discountType,
      valid_until: validUntil,
      applicable_courses: Array.isArray(body.applicable_courses) ? body.applicable_courses : [],
      is_referral: false,
      max_usage: Math.max(1, Math.min(999999, Number(body.max_usage) || 1)),
      usage_count: 0,
      is_used: false,
      is_campaign: Boolean(body.is_campaign),
      campaign_name: body.campaign_name ?? null,
      campaign_description: body.campaign_description ?? null,
      has_balance_limit: balance.has_balance_limit,
      remaining_balance: balance.remaining_balance,
      minimum_order_amount:
        body.minimum_order_amount != null
          ? Math.max(0, Number(body.minimum_order_amount) || 0) || null
          : null,
      maximum_order_amount:
        body.maximum_order_amount != null
          ? Math.max(0, Number(body.maximum_order_amount) || 0) || null
          : null,
      full_course_only: Boolean(body.full_course_only),
    });

    const { data, error } = await authResult.supabase
      .from('discount_codes')
      .insert(row)
      .select(DISCOUNT_ADMIN_SELECT)
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Bu kod zaten kayıtlı.' }, { status: 409 });
      }
      console.error('LMS discount-codes create error:', error);
      return NextResponse.json({ error: error.message || 'Kod eklenemedi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('LMS discount-codes POST error:', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
