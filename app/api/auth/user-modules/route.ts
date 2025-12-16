// app/api/auth/user-modules/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🚀 User modules API starting...');
    
    // 1. Auth kontrolü
    const { userId } = await auth();
    console.log('👤 User ID:', userId);
    
    if (!userId) {
      console.log('❌ No user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Environment variables kontrolü
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      console.log('🌐 Environment check:');
      console.log('NEXT_PUBLIC_SUPABASE_URL2:', process.env.NEXT_PUBLIC_SUPABASE_URL2);
      console.log('SUPABASE_SERVICE_ROLE_KEY2 exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY2);
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL2 || !process.env.SUPABASE_SERVICE_ROLE_KEY2) {
      console.log('❌ Missing environment variables');
      return NextResponse.json({ 
        error: 'Configuration error',
        details: 'Database configuration missing'
      }, { status: 500 });
    }

    // 3. Supabase client'ı oluştur
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL2,
      process.env.SUPABASE_SERVICE_ROLE_KEY2,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    if (isDev) {
      console.log('✅ Supabase client created');
    }

    // 4. Kullanıcının modül erişimlerini çek - DÜZELTME: clerk_user_id kullan
    console.log('🔍 Fetching user modules for clerk_user_id:', userId);
    
    const { data: userModules, error: userModulesError } = await supabase
      .from('user_module_access')
      .select(`
        *,
        modules (
          key,
          name_tr,
          name_en,
          description_tr,
          description_en,
          icon,
          is_active
        )
      `)
      .eq('clerk_user_id', userId)  // DÜZELTME: user_id yerine clerk_user_id
      .eq('is_enabled', true);      // DÜZELTME: is_active yerine is_enabled
    
    if (userModulesError) {
      console.error('❌ User modules query error:', userModulesError);
      return NextResponse.json({ 
        error: 'Database query error',
        details: userModulesError.message
      }, { status: 500 });
    }

    // 5. Debug bilgileri (sadece development'ta)
    if (isDev) {
      console.log('📊 Debug Information:');
      console.log('Raw user modules data:', JSON.stringify(userModules, null, 2));
      console.log('User modules count:', userModules?.length || 0);
      
      // Tüm kullanıcıları listele (debug için)
      const { data: allUsers, error: allUsersError } = await supabase
        .from('user_module_access')
        .select('clerk_user_id, granted_at')  // DÜZELTME: user_id yerine clerk_user_id, created_at yerine granted_at
        .limit(10);
        
      if (!allUsersError) {
        console.log('📋 Sample users in database:', allUsers?.map(u => ({
          clerk_user_id: u.clerk_user_id,
          granted_at: u.granted_at
        })));
      }
      
      // Aktif modülleri listele
      const { data: allModules, error: modulesError } = await supabase
        .from('modules')
        .select('key, name_tr, name_en, is_active')
        .eq('is_active', true);
        
      if (!modulesError) {
        console.log('📋 Active modules in database:', allModules);
      }
    }

    // 6. Modül verilerini işle
    const modules = userModules
      ?.filter(item => item.modules && item.modules.is_active)
      ?.map(item => item.modules) || [];

    if (isDev) {
      console.log('✅ Processed modules:', modules.length);
      console.log('Module details:', modules.map(m => ({ key: m.key, name_tr: m.name_tr, name_en: m.name_en })));
    }

    // 7. Response hazırla
    const response = {
      success: true,
      userId,
      modules,
      totalCount: modules.length,
      ...(isDev && {
        debug: {
          rawDataCount: userModules?.length || 0,
          filteredCount: modules.length,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }
      })
    };

    console.log(`✅ API completed. Returning ${modules.length} modules for user ${userId}`);
    
    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('💥 API Error:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: (error as Error).message,
      ...(process.env.NODE_ENV === 'development' && { stack: (error as Error).stack })
    }, { status: 500 });
  }
}