// hooks/useUserModules.ts
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import type { AccessLevel } from '@/app/lib/moduleAccess/rbac';

interface Module {
  key: string;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  icon: string;
  is_active: boolean;
  is_super_admin?: boolean;
}

export type ModuleMembership = {
  id?: string;
  moduleKey?: string;
  panelOrganizationId: string | null;
  accessLevel: AccessLevel | null;
  capabilities: string[] | null;
  isSuperAdmin: boolean;
};

interface UseUserModulesReturn {
  modules: Module[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  /** Kullanıcı süper admin ise true - tüm modüllere erişim */
  isSuperAdmin: boolean;
  memberships: ModuleMembership[];
}

type ModulesCache = {
  userId: string;
  modules: Module[];
  isSuperAdmin: boolean;
  memberships: ModuleMembership[];
  fetchedAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let modulesCache: ModulesCache | null = null;

export function clearModulesCache() {
  modulesCache = null;
}

function getCachedModules(userId: string): ModulesCache | null {
  if (!modulesCache || modulesCache.userId !== userId) return null;
  if (Date.now() - modulesCache.fetchedAt > CACHE_TTL_MS) return null;
  return modulesCache;
}

export function useUserModules(): UseUserModulesReturn {
  const { user, isLoaded } = useUser();
  const cached = user?.id ? getCachedModules(user.id) : null;

  const [modules, setModules] = useState<Module[]>(cached?.modules ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(cached?.isSuperAdmin ?? false);
  const [memberships, setMemberships] = useState<ModuleMembership[]>(
    cached?.memberships ?? []
  );

  const fetchModules = useCallback(async (options?: { silent?: boolean }) => {
    if (!user || !isLoaded) {
      setLoading(false);
      return;
    }

    const hasCache = !!getCachedModules(user.id);

    try {
      if (!options?.silent && !hasCache) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch('/api/auth/user-modules', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const nextModules = data.modules || [];
      const nextIsSuperAdmin =
        data.isSuperAdmin ??
        nextModules.some((m: Module) => m.is_super_admin === true);
      const nextMemberships: ModuleMembership[] = data.memberships || [];

      modulesCache = {
        userId: user.id,
        modules: nextModules,
        isSuperAdmin: nextIsSuperAdmin,
        memberships: nextMemberships,
        fetchedAt: Date.now(),
      };

      setModules(nextModules);
      setIsSuperAdmin(nextIsSuperAdmin);
      setMemberships(nextMemberships);
    } catch (err: unknown) {
      console.error('useUserModules error:', err);
      if (!hasCache) {
        setError((err as Error).message || 'Modüller yüklenirken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, [user, isLoaded]);

  const refetch = () => {
    fetchModules();
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      modulesCache = null;
      setModules([]);
      setIsSuperAdmin(false);
      setMemberships([]);
      setLoading(false);
      return;
    }

    const hasCache = !!getCachedModules(user.id);
    fetchModules({ silent: hasCache });
  }, [user, isLoaded, fetchModules]);

  return {
    modules,
    loading,
    error,
    refetch,
    isSuperAdmin,
    memberships,
  };
}
