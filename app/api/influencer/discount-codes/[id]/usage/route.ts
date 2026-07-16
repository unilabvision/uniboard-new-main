import { NextRequest, NextResponse } from 'next/server';
import { requireInfluencerUser } from '@/app/lib/influencer/access';
import { calculateCommissionAmount } from '@/app/lib/influencer/codes';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const access = await requireInfluencerUser();
    if (access.error || !access.supabase || !access.userId) {
      return NextResponse.json(
        { error: access.error || 'Unauthorized' },
        { status: access.status }
      );
    }

    if (!id?.trim()) {
      return NextResponse.json({ error: 'Code id required' }, { status: 400 });
    }

    const { data: code, error: codeError } = await access.supabase
      .from('discount_codes')
      .select(
        'id, code, discount_amount, discount_type, valid_until, is_one_time, is_used, used_by, used_at, influencer_id, commission, created_at'
      )
      .eq('id', id)
      .eq('influencer_id', access.userId)
      .maybeSingle();

    if (codeError) {
      return NextResponse.json({ error: codeError.message }, { status: 500 });
    }

    if (!code) {
      return NextResponse.json({ error: 'Kod bulunamadı' }, { status: 404 });
    }

    const { data: orders, error: ordersError } = await access.supabase
      .from('orders')
      .select(
        'orderid, useremail, coursename, amount, discountamount, discountcode, created_at, enrolled, status'
      )
      .ilike('discountcode', code.code)
      .eq('enrolled', true)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Code usage orders error:', ordersError);
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    const usages = (orders || []).map((order) => {
      const amount = Number(order.amount) || 0;
      const discountAmount = Number(order.discountamount) || 0;
      const commissionRate = Number(code.commission) || 15;
      return {
        orderid: order.orderid,
        useremail: order.useremail || '',
        coursename: order.coursename || null,
        amount,
        discountamount: discountAmount,
        discountcode: order.discountcode || code.code,
        created_at: order.created_at,
        enrolled: Boolean(order.enrolled),
        commission_amount: calculateCommissionAmount(
          amount,
          discountAmount,
          commissionRate
        ),
        commission_rate: commissionRate,
      };
    });

    const emailSet = new Set(
      usages.map((u) => u.useremail.trim().toLowerCase()).filter(Boolean)
    );

    return NextResponse.json({
      code,
      usages,
      summary: {
        totalUses: usages.length,
        uniqueEmails: emailSet.size,
        totalAmount: usages.reduce((sum, u) => sum + u.amount, 0),
        totalCommission: usages.reduce((sum, u) => sum + u.commission_amount, 0),
      },
    });
  } catch (err) {
    console.error('Code usage GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
