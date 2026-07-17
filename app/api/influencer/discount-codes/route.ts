import { NextRequest, NextResponse } from 'next/server';
import { requireInfluencerUser } from '@/app/lib/influencer/access';
import {
  DISCOUNT_CODE_SELECT,
  mapDiscountCodeRow,
  normalizeDiscountCode,
} from '@/app/lib/influencer/codes';

const DEFAULT_COMMISSION = 15;

export async function GET() {
  try {
    const access = await requireInfluencerUser();
    if (access.error || !access.supabase || !access.userId) {
      return NextResponse.json(
        { error: access.error || 'Unauthorized' },
        { status: access.status }
      );
    }

    const { data, error } = await access.supabase
      .from('discount_codes')
      .select(DISCOUNT_CODE_SELECT)
      .eq('influencer_id', access.userId)
      .eq('is_referral', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Influencer codes list error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const codes = (data || []).map((row) =>
      mapDiscountCodeRow(row as Record<string, unknown>)
    );
    const codeStrings = codes.map((c) => c.code).filter(Boolean);
    const codeLookup = new Map(
      codeStrings.map((c) => [c.toLowerCase(), c] as const)
    );

    const usageByCode: Record<
      string,
      { uses: number; emails: number; totalAmount: number }
    > = {};

    if (codeStrings.length > 0) {
      const orFilter = codeStrings
        .slice(0, 80)
        .map((c) => `discountcode.ilike.${c.replace(/[,.()]/g, '')}`)
        .join(',');

      const { data: orders, error: ordersError } = await access.supabase
        .from('orders')
        .select('discountcode, useremail, amount')
        .or(orFilter)
        .eq('enrolled', true);

      if (ordersError) {
        console.warn('Influencer codes usage aggregate skipped:', ordersError.message);
      } else {
        const emailSets: Record<string, Set<string>> = {};
        for (const order of orders || []) {
          const raw = String(order.discountcode || '').trim();
          if (!raw) continue;
          const canonical = codeLookup.get(raw.toLowerCase());
          if (!canonical) continue;
          if (!usageByCode[canonical]) {
            usageByCode[canonical] = { uses: 0, emails: 0, totalAmount: 0 };
            emailSets[canonical] = new Set();
          }
          usageByCode[canonical].uses += 1;
          usageByCode[canonical].totalAmount += Number(order.amount) || 0;
          const email = String(order.useremail || '')
            .trim()
            .toLowerCase();
          if (email) emailSets[canonical].add(email);
        }
        for (const key of Object.keys(usageByCode)) {
          usageByCode[key].emails = emailSets[key]?.size || 0;
        }
      }
    }

    const codesWithUsage = codes.map((code) => ({
      ...code,
      usage: usageByCode[code.code] || { uses: 0, emails: 0, totalAmount: 0 },
    }));

    return NextResponse.json({ codes: codesWithUsage });
  } catch (err) {
    console.error('Influencer codes GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireInfluencerUser();
    if (access.error || !access.supabase || !access.userId) {
      return NextResponse.json(
        { error: access.error || 'Unauthorized' },
        { status: access.status }
      );
    }

    const body = await request.json();
    const code = normalizeDiscountCode(String(body.code || ''));
    const discountType =
      body.discount_type === 'fixed' ? 'fixed' : 'percentage';
    const discountAmount = Number(body.discount_amount);
    const validUntil = String(body.valid_until || '').trim();
    const isOneTime = Boolean(body.is_one_time);
    const commissionRaw = body.commission != null ? Number(body.commission) : DEFAULT_COMMISSION;
    const campaignId =
      typeof body.campaign_id === 'string' && body.campaign_id.trim()
        ? body.campaign_id.trim()
        : null;

    let applicableCourses: string[] | null = null;
    if (Array.isArray(body.applicable_courses)) {
      const courses = body.applicable_courses
        .map((c: unknown) => String(c).trim())
        .filter(Boolean);
      applicableCourses = courses.length > 0 ? courses : null;
    } else if (typeof body.applicable_courses === 'string' && body.applicable_courses.trim()) {
      const courses = body.applicable_courses
        .split(',')
        .map((c: string) => c.trim())
        .filter(Boolean);
      applicableCourses = courses.length > 0 ? courses : null;
    }

    if (!code || code.length < 3) {
      return NextResponse.json(
        { error: 'Kod en az 3 karakter olmalı' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
      return NextResponse.json(
        { error: 'Geçerli bir indirim miktarı girin' },
        { status: 400 }
      );
    }

    if (discountType === 'percentage' && discountAmount > 100) {
      return NextResponse.json(
        { error: 'Yüzde indirim 100’ü geçemez' },
        { status: 400 }
      );
    }

    if (!validUntil || Number.isNaN(new Date(validUntil).getTime())) {
      return NextResponse.json(
        { error: 'Geçerlilik tarihi gerekli' },
        { status: 400 }
      );
    }

    const commission = Number.isFinite(commissionRaw)
      ? Math.min(100, Math.max(0, commissionRaw))
      : DEFAULT_COMMISSION;

    const { data: existing } = await access.supabase
      .from('discount_codes')
      .select('id')
      .ilike('code', code)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Bu kod zaten kullanılıyor' },
        { status: 409 }
      );
    }

    if (campaignId) {
      const { data: campaign } = await access.supabase
        .from('campaigns')
        .select('id, influencer_id')
        .eq('id', campaignId)
        .maybeSingle();

      if (!campaign || campaign.influencer_id !== access.userId) {
        return NextResponse.json(
          { error: 'Kampanya bulunamadı veya size ait değil' },
          { status: 400 }
        );
      }
    }

    // Checkout (myuni) valid_until'ı YYYY-MM-DD olarak karşılaştırır
    const dateMatch = validUntil.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const validUntilDate = dateMatch
      ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
      : null;

    if (!validUntilDate) {
      return NextResponse.json(
        { error: 'Geçerlilik tarihi gerekli' },
        { status: 400 }
      );
    }

    // Gerçek şema: is_one_time yok → max_usage ile temsil edilir
    const insertPayload = {
      code,
      discount_amount: discountAmount,
      discount_type: discountType,
      valid_until: validUntilDate,
      applicable_courses: applicableCourses,
      is_used: false,
      influencer_id: access.userId,
      campaign_id: campaignId,
      commission,
      is_referral: false,
      is_campaign: false,
      has_balance_limit: false,
      usage_count: 0,
      max_usage: isOneTime ? 1 : 99999,
    };

    const { data, error } = await access.supabase
      .from('discount_codes')
      .insert(insertPayload)
      .select(DISCOUNT_CODE_SELECT)
      .single();

    if (error) {
      console.error('Influencer code create error:', error);
      return NextResponse.json(
        { error: error.message || 'Kod oluşturulamadı' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { code: mapDiscountCodeRow(data as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (err) {
    console.error('Influencer codes POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
