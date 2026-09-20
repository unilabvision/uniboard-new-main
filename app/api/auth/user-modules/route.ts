// app/api/auth/user-modules/route.ts
import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { claimPendingModuleFromClerkMetadata } from '@/app/lib/moduleAccess/grantToken';

const DUPLICATE_EVENT_MODULE_KEYS = new Set([
  'event',
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL2 || !process.env.SUPABASE_SERVICE_ROLE_KEY2) {
      return NextResponse.json({ 
        error: 'Configuration error',
        details: 'Database configuration missing'
      }, { status: 500 });
    }

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
    const { data: userModulesRaw, error: userModulesError } = await supabase
      .from('user_module_access')
      .select(`
        id,
        module_key,
        panel_organization_id,
        access_level,
        is_super_admin,
        capabilities,
        notes,
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
            id,
            module_key,
            panel_organization_id,
            access_level,
            is_super_admin,
            capabilities,
            notes,
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

    const { decodeCapabilitiesFromRow, isAccessLevel } = await import(
      '@/app/lib/moduleAccess/rbac'
    );

    const memberships = (userModules ?? []).map(
      (row: {
        id?: string;
        module_key?: string;
        panel_organization_id?: string | null;
        access_level?: string | null;
        is_super_admin?: boolean;
        capabilities?: unknown;
        notes?: unknown;
      }) => ({
        id: row.id,
        moduleKey: row.module_key,
        panelOrganizationId: row.panel_organization_id ?? null,
        accessLevel: isAccessLevel(row.access_level) ? row.access_level : null,
        capabilities: decodeCapabilitiesFromRow(row),
        isSuperAdmin: row.is_super_admin === true,
      })
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
          } | Array<{
            key: string;
            name_tr: string;
            name_en: string;
            description_tr: string;
            description_en: string;
            icon: string;
            is_active: boolean;
          }> | null;
        }) => {
          const joinedModule = Array.isArray(item.modules)
            ? item.modules[0]
            : item.modules;
          if (joinedModule?.is_active) {
            return { ...joinedModule };
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

    const { sortDashboardModules } = await import(
      '@/app/lib/moduleAccess/dashboardOrder'
    );
    const { withModuleDashboardCopy } = await import(
      '@/app/lib/moduleAccess/registry'
    );
    modules = sortDashboardModules(modules.map(withModuleDashboardCopy));

    const response = {
      success: true,
      userId,
      modules,
      isSuperAdmin,
      memberships,
      totalCount: modules.length,
    };
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
