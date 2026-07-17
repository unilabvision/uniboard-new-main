// app/_services/supabaseClients.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Ana uygulama için (discount_codes tablosu)
export const supabaseMain = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2!
});

// Influencer bilgileri için (ikinci database)
export const supabaseInfluencers = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2!
});

// Type definitions
export interface DiscountCode {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: 'fixed' | 'percentage';
  valid_until: string;
  applicable_courses: string[];
  is_used: boolean;
  used_by?: string;
  used_at?: string;
  influencer_id?: string;
  created_at: string;
  max_usage?: number;
  usage_count?: number;
}

export interface Influencer {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  social_links?: Record<string, string>;
  commission_rate: number;
  total_sales: number;
  total_commissions: number;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}