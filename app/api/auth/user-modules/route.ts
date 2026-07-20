// app/api/auth/user-modules/route.ts
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { claimPendingModuleFromClerkMetadata } from '@/app/lib/moduleAccess/grantToken';

const DUPLICATE_EVENT_MODULE_KEYS = new Set([
  'etkinlik',
  'etkinlikler',
  'etkinlik-yonetimi',
  'event-management',
  'event_management',
]);

function dedupeDashboardModules<
  T extends { key: string; name_tr: string; name_en: string },
>(modules: T[]): T[] {
  const hasCanonicalEvents = modules.some((m) => m.key === 'events');
  if (!hasCanonicalEvents) return modules;

  return modules.filter((m) => {
    if (DUPLICATE_EVENT_MODULE_KEYS.has(m.key)) return false;
    if (
      (m.name_tr === 'Etkinlik Yönetimi' || m.name_en === 'Event Management') &&
      m.key !== 'events'
    ) {
      return false;
    }
    return true;
  });
}

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
    
    const { data: userModulesRaw, error: userModulesError } = await supabase
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
      .eq('clerk_user_id', userId)
      .eq('is_enabled', true);
    
    if (userModulesError) {
      console.error('❌ User modules query error:', userModulesError);
      return NextResponse.json({ 
        error: 'Database query error',
        details: userModulesError.message
      }, { status: 500 });
    }

    let userModules = userModulesRaw;

    // Yeni davet: Clerk publicMetadata.pendingModule → access satırı
    try {
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(userId);
      const claimed = await claimPendingModuleFromClerkMetadata(
        supabase,
        userId,
        clerkUser.publicMetadata as Record<string, unknown>
      );
      if (claimed) {
        const { data: refreshed } = await supabase
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
          .eq('clerk_user_id', userId)
          .eq('is_enabled', true);
        userModules = refreshed ?? userModules;
      }
    } catch (claimErr) {
      console.warn('pendingModule claim skipped:', claimErr);
    }

    // Super admin kontrolü: user_module_access.is_super_admin = true olan kayıt var mı?
    const isSuperAdmin = (userModules ?? []).some(
      (uma: { is_super_admin?: boolean }) => uma.is_super_admin === true
    );

    let modules: Array<{
      key: string;
      name_tr: string;
      name_en: string;
      description_tr: string;
      description_en: string;
      icon: string;
      is_active: boolean;
      is_super_admin?: boolean;
    }>;

    if (isSuperAdmin) {
      // Süper admin: Tüm aktif modülleri getir
      const { data: allModules, error: allModulesError } = await supabase
        .from('modules')
        .select('key, name_tr, name_en, description_tr, description_en, icon, is_active')
        .eq('is_active', true);

      if (allModulesError) {
        console.error('❌ Super admin modules query error:', allModulesError);
        modules = [];
      } else {
        modules = (allModules ?? []).map((m) => ({ ...m, is_super_admin: true }));
      }
    } else {
      // Normal kullanıcı: Sadece kendi erişimli modülleri
      // modules join boşsa bile module_key ile erişimi düşürme
      modules = (userModules ?? [])
        .map((item: {
          module_key?: string;
          modules?: {
            key: string;
            name_tr: string;
            name_en: string;
            description_tr: string;
            description_en: string;
            icon: string;
            is_active: boolean;
          } | null;
        }) => {
          if (item.modules?.is_active) {
            return { ...item.modules };
          }
          if (item.module_key) {
            return {
              key: item.module_key,
              name_tr: item.module_key,
              name_en: item.module_key,
              description_tr: '',
              description_en: '',
              icon: 'shield',
              is_active: true,
            };
          }
          return null;
        })
        .filter(Boolean) as Array<{
          key: string;
          name_tr: string;
          name_en: string;
          description_tr: string;
          description_en: string;
          icon: string;
          is_active: boolean;
          is_super_admin?: boolean;
        }>;
    }

    modules = dedupeDashboardModules(modules);

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

    if (isDev) {
      console.log('✅ Processed modules:', modules.length);
      console.log('isSuperAdmin:', isSuperAdmin);
      console.log('Module details:', modules.map((m: { key: string }) => ({ key: m.key })));
    }

    // 6. Response hazırla
    const response = {
      success: true,
      userId,
      modules,
      isSuperAdmin,
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