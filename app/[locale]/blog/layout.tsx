'use client';

import React, { useEffect, useMemo, useState } from 'react';
import GlobalDashboardSidebar from '@/app/components/GlobalDashboardSidebar';
import { useUserModules } from '@/app/hooks/useUserModules';
import { hasBlogAccess } from '@/app/lib/blog/permissions';

export default function BlogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [mounted, setMounted] = useState(false);
  const { modules, loading, error, isSuperAdmin, memberships } = useUserModules();
  const isInitialLoad = loading && modules.length === 0;
  const hasAccess = useMemo(() => {
    if (isInitialLoad) return null;
    if (error) return false;
    return hasBlogAccess(modules.map((module) => module.key), isSuperAdmin);
  }, [error, isInitialLoad, isSuperAdmin, modules]);

  useEffect(() => {
    params.then((value) => {
      setLocale(value.locale);
      setMounted(true);
    });
  }, [params]);

  if (!mounted || hasAccess === null) {
    return <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#990000]" /></div>;
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-xl font-semibold">{locale === 'tr' ? 'Erişim Engellendi' : 'Access denied'}</h1>
          <p className="text-neutral-600 dark:text-neutral-400">{locale === 'tr' ? 'Blog yönetimi modülüne erişiminiz yok.' : 'You do not have access to the blog management module.'}</p>
        </div>
      </div>
    );
  }

  const dashboardModules = modules.map((module) => ({ ...module, category: 'dashboard' }));
  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <GlobalDashboardSidebar locale={locale} modules={dashboardModules} memberships={memberships} isSuperAdmin={isSuperAdmin} />
      <main className="min-h-screen min-w-0 flex-1 overflow-x-hidden pt-14 lg:pt-0">{children}</main>
    </div>
  );
}
