/** Minimal high-value fixed defaults (mirrors myuni lib/discountRestrictions). */
export const HIGH_VALUE_FIXED_THRESHOLD = 2000;

export function applyHighValueFixedDefaults<T extends Record<string, unknown>>(
  row: T & {
    discount_type?: string;
    discount_amount?: number;
    has_balance_limit?: boolean;
    minimum_order_amount?: number | null;
  }
): T {
  if (row.has_balance_limit) return row;
  const type = String(row.discount_type || '').toLowerCase();
  const amount = Number(row.discount_amount) || 0;
  if (type !== 'fixed' || amount < HIGH_VALUE_FIXED_THRESHOLD) return row;

  const explicitMin = row.minimum_order_amount == null ? 0 : Number(row.minimum_order_amount) || 0;
  return {
    ...row,
    minimum_order_amount: Math.max(explicitMin, amount + 1),
  };
}

export type DiscountCodeAdminPayload = {
  code: string;
  discount_amount: number;
  discount_type: 'percentage' | 'fixed';
  valid_until: string;
  applicable_courses?: string[] | null;
  max_usage?: number;
  is_campaign?: boolean;
  campaign_name?: string | null;
  campaign_description?: string | null;
  has_balance_limit?: boolean;
  remaining_balance?: number | null;
  initial_balance?: number | null;
  minimum_order_amount?: number | null;
  maximum_order_amount?: number | null;
  full_course_only?: boolean;
};

export const DISCOUNT_ADMIN_SELECT =
  'id, code, discount_amount, discount_type, valid_until, applicable_courses, is_used, usage_count, max_usage, is_referral, is_campaign, campaign_name, campaign_description, has_balance_limit, remaining_balance, initial_balance, minimum_order_amount, maximum_order_amount, full_course_only, created_at';
