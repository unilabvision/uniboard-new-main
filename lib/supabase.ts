// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Ana veritabanı admin client (user_module_access tablosu burada)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_LEARNING_URL!, // Ana database URL
  process.env.SUPABASE_LEARNING_SECRET_KEY!, // Ana database service key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// İkinci veritabanı admin client (profil bilgileri için)
export const supabaseInfluencerAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_IDENTITY_URL!, // İkinci database URL
  process.env.SUPABASE_IDENTITY_SECRET_KEY!, // İkinci database service key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Debug için environment variables'ları kontrol et
console.log('🔧 lib/supabase.ts loaded:');
console.log('📍 Main DB URL:', process.env.NEXT_PUBLIC_SUPABASE_LEARNING_URL ? '✅ SET' : '❌ NOT SET');
console.log('📍 Main DB Secret Key:', process.env.SUPABASE_LEARNING_SECRET_KEY ? '✅ SET' : '❌ NOT SET');
console.log('📍 Second DB URL:', process.env.NEXT_PUBLIC_SUPABASE_IDENTITY_URL ? '✅ SET' : '❌ NOT SET');
console.log('📍 Second DB Secret Key:', process.env.SUPABASE_IDENTITY_SECRET_KEY ? '✅ SET' : '❌ NOT SET');

// Varsayılan export
export default supabaseAdmin;
