'use client';

import React, { useState, useEffect, useMemo } from 'react';
import GlobalDashboardSidebar from '../../components/GlobalDashboardSidebar';
import { useUserModules } from '../../hooks/useUserModules';
import { hasSiteApplicationsAccess } from '@/app/lib/siteApplications/permissions';

interface SiteApplicationsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

interface SidebarToggleEvent extends CustomEvent {
  detail: { isMinimized: boolean };
}

declare global {
  interface WindowEventMap {
    sidebarToggle: SidebarToggleEvent;
  }
}

export default function SiteApplicationsLayout({
  children,
  params,
}: SiteApplicationsLayoutProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [locale, setLocale] = useState('');
  const [mounted, setMounted] = useState(false);

  const { modules, loading, error, isSuperAdmin } = useUserModules();
  const isInitialModuleLoad = loading && modules.length === 0;

  const hasAccess = useMemo(() => {
    if (isInitialModuleLoad) return null;
    if (error) return false;
    return hasSiteApplicationsAccess(
      modules.map((m) => m.key),
      isSuperAdmin
    );
  }, [isInitialModuleLoad, error, isSuperAdmin, modules]);

  useEffect(() => {
    params.then((p) => {
      setLocale(p.locale);
      setMounted(true);
    });
  }, [params]);

  useEffect(() => {
    const handleSidebarToggle = (event: SidebarToggleEvent) => {
      setIsMinimized(event.detail.isMinimized);
    };

    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebar-collapsed') === 'true';
      setIsMinimized(savedState);
    }

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
  }, []);

  if (!mounted || isInitialModuleLoad || hasAccess === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#990000] mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            {locale === 'tr' ? 'Yetkilendirme kontrol ediliyor...' : 'Checking authorization...'}
          </p>
        </div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center py-12">
        <div className="max-w-md mx-auto text-center px-6">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {locale === 'tr' ? 'Erişim Engellendi' : 'Access Denied'}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {locale === 'tr'
              ? 'Site başvuruları modülüne erişim yetkiniz bulunmamaktadır.'
              : 'You do not have access to the Site Applications module.'}
          </p>
          <button
            onClick={() => { window.location.href = `/${locale}`; }}
            className="px-6 py-3 bg-[#990000] text-white font-medium rounded-lg hover:bg-[#800000]"
          >
            {locale === 'tr' ? 'Ana Panele Dön' : 'Back to Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  const modulesWithCategory = modules.map((module) => ({
    ...module,
    category: 'dashboard',
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex">
      <GlobalDashboardSidebar locale={locale} modules={modulesWithCategory} />
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ${
          isMinimized ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        <main className="min-h-screen w-full min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
