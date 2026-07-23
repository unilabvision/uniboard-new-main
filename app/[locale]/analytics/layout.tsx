"use client";

import React, { useState, useEffect, useMemo } from 'react';
import GlobalDashboardSidebar from '../../components/GlobalDashboardSidebar';
import { useUserModules } from '../../hooks/useUserModules';

interface AnalyticsLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

const ANALYTICS_MODULE_KEYS = ['analytics', 'reports'];

export default function AnalyticsLayout({ children, params }: AnalyticsLayoutProps) {
  const [locale, setLocale] = useState('');
  const [mounted, setMounted] = useState(false);

  const { modules, loading, error, isSuperAdmin, memberships } = useUserModules();
  const isInitialModuleLoad = loading && modules.length === 0;

  const hasAnalyticsAccess = useMemo(() => {
    if (isInitialModuleLoad) return null;
    if (error) return false;
    return (
      isSuperAdmin ||
      modules.some((module) => ANALYTICS_MODULE_KEYS.includes(module.key))
    );
  }, [isInitialModuleLoad, error, isSuperAdmin, modules]);

  useEffect(() => {
    params.then((resolved) => {
      setLocale(resolved.locale);
      setMounted(true);
    });
  }, [params]);

  if (!mounted || isInitialModuleLoad || hasAnalyticsAccess === null) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#990000] mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            {locale === 'tr' ? 'Yetkilendirme kontrol ediliyor...' : 'Checking authorization...'}
          </p>
        </div>
      </div>
    );
  }

  if (!hasAnalyticsAccess) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center py-12">
        <div className="max-w-md mx-auto text-center px-6">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {locale === 'tr' ? 'Erişim Engellendi' : 'Access Denied'}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {locale === 'tr'
              ? 'Analitik raporları modülüne erişim yetkiniz bulunmamaktadır.'
              : 'You do not have access to the Analytics module.'}
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = `/${locale}`;
            }}
            className="w-full px-6 py-3 bg-[#990000] text-white font-medium rounded-lg hover:bg-[#800000] transition-colors"
          >
            {locale === 'tr' ? 'Ana Sayfaya Dön' : 'Return to Home'}
          </button>
        </div>
      </div>
    );
  }

  const modulesWithCategory = modules.map((module) => ({
    key: module.key,
    name_tr: module.name_tr,
    name_en: module.name_en,
    description_tr: module.description_tr,
    description_en: module.description_en,
    icon: module.icon,
    category: 'dashboard',
  }));

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      <GlobalDashboardSidebar locale={locale} modules={modulesWithCategory} memberships={memberships} isSuperAdmin={isSuperAdmin} />
      <main className="flex-1 min-w-0 min-h-screen overflow-x-hidden pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
