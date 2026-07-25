import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import {
  applyHighValueFixedDefaults,
  DISCOUNT_ADMIN_SELECT,
  resolveBalanceFields,
  type DiscountCodeAdminPayload,
} from '@/app/lib/lms/discountCodesAdmin';

/**
 * PATCH – Update discount code by id.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });
  }

  try {
    const body = (await request.json()) as Partial<DiscountCodeAdminPayload>;
    const updates: Record<string, unknown> = {};

    if (body.code !== undefined) updates.code = String(body.code).trim().toUpperCase();
    if (body.discount_amount !== undefined) updates.discount_amount = Number(body.discount_amount);
    if (body.discount_type !== undefined) updates.discount_type = body.discount_type;
    if (body.valid_until !== undefined) updates.valid_until = body.valid_until;
    if (body.applicable_courses !== undefined) updates.applicable_courses = body.applicable_courses;
    if (body.max_usage !== undefined) updates.max_usage = Math.max(1, Number(body.max_usage));
    if (body.is_campaign !== undefined) updates.is_campaign = body.is_campaign;
    if (body.campaign_name !== undefined) updates.campaign_name = body.campaign_name;
    if (body.campaign_description !== undefined) {
      updates.campaign_description = body.campaign_description;
    }
    if (body.has_balance_limit !== undefined || body.remaining_balance !== undefined || body.initial_balance !== undefined) {
      const balance = resolveBalanceFields({
        has_balance_limit:
          body.has_balance_limit !== undefined
            ? body.has_balance_limit
            : (updates.has_balance_limit as boolean | undefined),
        remaining_balance:
          body.remaining_balance !== undefined ? body.remaining_balance : undefined,
        initial_balance: body.initial_balance,
      });
      // If only remaining/initial sent without has_balance_limit flag, keep existing unless explicitly set
      if (body.has_balance_limit !== undefined) {
        updates.has_balance_limit = balance.has_balance_limit;
        updates.remaining_balance = balance.remaining_balance;
      } else {
        if (body.remaining_balance !== undefined) {
          updates.remaining_balance = body.remaining_balance;
        } else if (body.initial_balance !== undefined) {
          updates.remaining_balance = Number(body.initial_balance) || 0;
        }
      }
    }
    if (body.minimum_order_amount !== undefined) {
      const n =
        body.minimum_order_amount == null
          ? null
          : Math.max(0, Number(body.minimum_order_amount) || 0);
      updates.minimum_order_amount = n === 0 ? null : n;
    }
    if (body.maximum_order_amount !== undefined) {
      const n =
        body.maximum_order_amount == null
          ? null
          : Math.max(0, Number(body.maximum_order_amount) || 0);
      updates.maximum_order_amount = n === 0 ? null : n;
    }
    if (body.full_course_only !== undefined) {
      updates.full_course_only = Boolean(body.full_course_only);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 });
    }

    const { data: existing } = await authResult.supabase
      .from('discount_codes')
      .select('discount_type, discount_amount, has_balance_limit, minimum_order_amount')
      .eq('id', id)
      .single();

    const merged = applyHighValueFixedDefaults({
      discount_type: (updates.discount_type as string) ?? existing?.discount_type ?? 'percentage',
      discount_amount: Number(updates.discount_amount ?? existing?.discount_amount ?? 0),
      has_balance_limit: Boolean(
        updates.has_balance_limit !== undefined
          ? updates.has_balance_limit
          : existing?.has_balance_limit
      ),
      minimum_order_amount:
        updates.minimum_order_amount !== undefined
          ? (updates.minimum_order_amount as number | null)
          : existing?.minimum_order_amount ?? null,
    });

    if (merged.minimum_order_amount != null) {
      updates.minimum_order_amount = merged.minimum_order_amount;
    }

    const { data, error } = await authResult.supabase
      .from('discount_codes')
      .update(updates)
      .eq('id', id)
      .select(DISCOUNT_ADMIN_SELECT)
      .single();

    if (error) {
      console.error('LMS discount-codes PATCH error:', error);
      return NextResponse.json({ error: error.message || 'Güncellenemedi' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('LMS discount-codes PATCH error:', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * DELETE – Delete discount code by id.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });
  }

  const { error } = await authResult.supabase.from('discount_codes').delete().eq('id', id);
  if (error) {
    console.error('LMS discount-codes DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Silinemedi' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
