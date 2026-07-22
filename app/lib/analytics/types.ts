export type PeriodKey =
  | 'last7Days'
  | 'last30Days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'all';

export type TrendMetric = 'revenue' | 'orders' | 'enrollments' | 'students';

export interface StudentPurchaseItem {
  title: string;
  type: string;
  list_price: number;
  catalog_list_price: number | null;
  paid_price: number;
  order_id: string;
  created_at: string | null;
  is_cart: boolean;
}

export interface StudentParticipation {
  user_id: string;
  email: string;
  name: string | null;
  modules: string[];
  progress: number;
  paid_amount: number;
  list_amount: number;
  /** Siparişteki ham liste (katalog ile farklıysa) */
  order_list_amount: number;
  discount_amount: number;
  discount_codes: string[];
  enrolled_at: string | null;
  order_refs: string[];
  order_count: number;
  purchase_items: StudentPurchaseItem[];
}

export interface CourseParticipation {
  course_id: string;
  course_name: string;
  is_certificate?: boolean;
  enrollments: number;
  unique_students: number;
  revenue: number;
  list_revenue: number;
  orders: number;
  discount_amount: number;
  discounted_orders: number;
  avg_progress: number;
  completed: number;
  module_breakdown: Array<{ title: string; count: number }>;
  students: StudentParticipation[];
}

export interface DiscountUsageDetail {
  order_ref: string;
  buyer_email: string;
  buyer_name: string | null;
  course_name: string;
  module_title: string | null;
  list_amount: number;
  paid_amount: number;
  discount_amount: number;
  created_at: string | null;
}

export interface DiscountCodeDetail {
  code: string;
  usage_count: number;
  unique_buyers: number;
  total_discount: number;
  total_paid: number;
  total_list: number;
  courses: string[];
  influencer_id: string | null;
  influencer_name: string | null;
  influencer_email: string | null;
  discount_type: string | null;
  discount_value: number | null;
  commission: number | null;
  estimated_commission: number;
  db_usage_count: number | null;
  max_usage: number | null;
  valid_until: string | null;
  usages: DiscountUsageDetail[];
}

export interface OrderLedgerItem {
  id: string;
  title: string;
  type: string;
  list_price: number;
  paid_price: number;
  course_id: string | null;
  tier_id: string | null;
}

export interface OrderLedgerEntry {
  order_id: string;
  created_at: string | null;
  buyer_email: string;
  buyer_name: string | null;
  buyer_user_id: string | null;
  status: string;
  payment_method: string;
  is_cart: boolean;
  item_type: string;
  course_label: string;
  list_total: number;
  paid_total: number;
  discount_amount: number;
  discount_codes: string[];
  items: OrderLedgerItem[];
}

export interface CashflowSummary {
  money_in: number;
  discount_given: number;
  list_volume: number;
  order_count: number;
  cart_order_count: number;
  free_order_count: number;
  unique_buyers: number;
}

export interface DiscountCodeRow {
  id: string;
  code: string;
  code_upper?: string;
  code_normalized?: string;
  discount_amount: number | null;
  discount_type: string | null;
  influencer_id: string | null;
  commission: number | null;
  max_usage?: number | null;
  usage_count?: number | null;
  valid_until?: string | null;
}

export interface TierRow {
  id: string;
  course_id: string;
  title: string;
  is_full_course: boolean | null;
  price?: number | null;
  original_price?: number | null;
}

export interface ClerkUserLite {
  fullName: string;
  email: string;
}
