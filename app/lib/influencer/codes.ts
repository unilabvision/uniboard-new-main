export type DiscountType = 'fixed' | 'percentage';

export type InfluencerDiscountCode = {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: DiscountType;
  valid_until: string;
  applicable_courses: string[] | null;
  is_one_time: boolean;
  is_used: boolean;
  used_by?: string | null;
  used_at?: string | null;
  influencer_id: string;
  campaign_id?: string | null;
  commission: number;
  created_at: string;
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

export function getCodeStatus(code: {
  is_used: boolean;
  valid_until: string;
}): CodeStatus {
  if (code.is_used) return 'used';
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
