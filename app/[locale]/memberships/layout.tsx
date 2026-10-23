'use client';

import { useEffect, useMemo, useState } from 'react';
import GlobalDashboardSidebar from '@/app/components/GlobalDashboardSidebar';
import { useUserModules } from '@/app/hooks/useUserModules';
import { hasMembershipsAccess } from '@/app/lib/memberships/permissions';

export default function MembershipsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [mounted, setMounted] = useState(false);
  const { modules, loading, error, isSuperAdmin, memberships } = useUserModules();
  const initialLoading = loading && modules.length === 0;
  const hasAccess = useMemo(() => {
    if (initialLoading) return null;
    if (error) return false;
    return hasMembershipsAccess(
      modules.map((module) => module.key),
      isSuperAdmin
    );
  }, [error, initialLoading, isSuperAdmin, modules]);

  useEffect(() => {
    params.then(({ locale: nextLocale }) => {
      setLocale(nextLocale);
      setMounted(true);
    });
  }, [params]);

  if (!mounted || initialLoading || hasAccess === null) {
    return (
      <div className="min-h-screen grid place-items-center bg-neutral-50 dark:bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-b-[#990000]" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen grid place-items-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">
            {locale === 'tr' ? 'Erişim engellendi' : 'Access denied'}
          </h1>
          <p className="mt-2 text-neutral-600">
            {locale === 'tr'
              ? 'Üyelik paketleri modülüne erişiminiz yok.'
              : 'You do not have access to the membership plans module.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <GlobalDashboardSidebar
        locale={locale}
        modules={modules.map((module) => ({ ...module, category: 'dashboard' }))}
        memberships={memberships}
        isSuperAdmin={isSuperAdmin}
      />
      <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
