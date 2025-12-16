// hooks/useUserModules.ts
import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

interface Module {
  key: string;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  icon: string;
  is_active: boolean;
}

interface UseUserModulesReturn {
  modules: Module[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUserModules(): UseUserModulesReturn {
  const { user, isLoaded } = useUser();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    if (!user || !isLoaded) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching modules for user:', user.id);
      
      const response = await fetch('/api/auth/user-modules', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      
      // Debug bilgileri (sadece development'ta)
      if (process.env.NODE_ENV === 'development' && data.debug) {
        console.log('🐛 Debug Info:', data.debug);
      }
      
      setModules(data.modules || []);
      
    } catch (err: unknown) {
      console.error('💥 useUserModules error:', err);
      setError((err as Error).message || 'Modüller yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [user, isLoaded]);

  const refetch = () => {
    fetchModules();
  };

  useEffect(() => {
    if (isLoaded) {
      fetchModules();
    }
  }, [user, isLoaded, fetchModules]);

  return {
    modules,
    loading,
    error,
    refetch
  };
}