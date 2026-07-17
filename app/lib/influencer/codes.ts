export type DiscountType = 'fixed' | 'percentage';

/** Gerçek DB kolonları (discount_codes) */
export type InfluencerDiscountCode = {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: DiscountType;
  valid_until: string;
  applicable_courses: string[] | null;
  is_used: boolean;
  used_by?: string | null;
  used_at?: string | null;
  influencer_id: string;
  campaign_id?: string | null;
  commission: number;
  created_at: string;
  max_usage?: number | null;
  usage_count?: number | null;
  /** UI için türetilir: max_usage === 1 */
  is_one_time?: boolean;
};

export type CodeUsageRow = {
  orderid: string;
  useremail: string;
  coursename: string | null;
  amount: number;
  discountamount: number | null;
  discountcode: string | null;
  created_at: string;
  enrolled: boolean;
};

export type CodeStatus = 'active' | 'used' | 'expired';

export function normalizeDiscountCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9_-]/g, '');
}

/** DB'de is_one_time yok; max_usage=1 tek kullanımlık demektir. */
export function isOneTimeCode(code: {
  max_usage?: number | null;
  is_one_time?: boolean | null;
}): boolean {
  if (typeof code.is_one_time === 'boolean') return code.is_one_time;
  return Number(code.max_usage) === 1;
}

export function mapDiscountCodeRow(
  row: Record<string, unknown>
): InfluencerDiscountCode {
  const maxUsage =
    row.max_usage != null && row.max_usage !== ''
      ? Number(row.max_usage)
      : null;
  const usageCount =
    row.usage_count != null && row.usage_count !== ''
      ? Number(row.usage_count)
      : 0;

  return {
    id: String(row.id),
    code: String(row.code || ''),
    discount_amount: Number(row.discount_amount) || 0,
    discount_type: row.discount_type === 'fixed' ? 'fixed' : 'percentage',
    valid_until: String(row.valid_until || ''),
    applicable_courses: Array.isArray(row.applicable_courses)
      ? (row.applicable_courses as string[])
      : null,
    is_used: row.is_used === true,
    used_by: row.used_by != null ? String(row.used_by) : null,
    used_at: row.used_at != null ? String(row.used_at) : null,
    influencer_id: String(row.influencer_id || ''),
    campaign_id: row.campaign_id != null ? String(row.campaign_id) : null,
    commission: Number(row.commission) || 15,
    created_at: String(row.created_at || ''),
    max_usage: maxUsage,
    usage_count: usageCount,
    is_one_time: maxUsage === 1,
  };
}

export function getCodeStatus(code: {
  is_used?: boolean;
  valid_until: string;
  max_usage?: number | null;
  usage_count?: number | null;
}): CodeStatus {
  const maxUsage = Number(code.max_usage);
  const usageCount = Number(code.usage_count) || 0;
  if (code.is_used) return 'used';
  if (Number.isFinite(maxUsage) && maxUsage > 0 && usageCount >= maxUsage) {
    return 'used';
  }
  if (new Date(code.valid_until) < new Date()) return 'expired';
  return 'active';
}

export function calculateCommissionAmount(
  saleAmount: number,
  discountAmount = 0,
  commissionRate = 15
): number {
  const net = Math.max(0, saleAmount - (discountAmount || 0));
  return Math.round(((net * commissionRate) / 100) * 100) / 100;
}

export function daysLeft(validUntil: string): number {
  const end = new Date(validUntil);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export const DISCOUNT_CODE_SELECT =
  'id, code, discount_amount, discount_type, valid_until, applicable_courses, is_used, used_by, used_at, influencer_id, campaign_id, commission, created_at, max_usage, usage_count';
