'use client';

import React, { useEffect, useMemo, useState } from 'react';
import GlobalDashboardSidebar from '../../components/GlobalDashboardSidebar';
import { useUserModules } from '../../hooks/useUserModules';
import { hasEventsAccess } from '@/app/lib/events/permissions';

interface EventsLayoutProps {
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

export default function EventsLayout({ children, params }: EventsLayoutProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [locale, setLocale] = useState('');
  const [mounted, setMounted] = useState(false);
  const { modules, loading, error, isSuperAdmin } = useUserModules();
  const isInitialModuleLoad = loading && modules.length === 0;

  const hasAccess = useMemo(() => {
    if (isInitialModuleLoad) return null;
    if (error) return false;
    return hasEventsAccess(
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
      setIsMinimized(localStorage.getItem('sidebar-collapsed') === 'true');
    }
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => window.removeEventListener('sidebarToggle', handleSidebarToggle);
  }, []);

  if (!mounted || isInitialModuleLoad || hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="animate-spin h-8 w-8 border-b-2 border-[#990000] rounded-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">
            {locale === 'tr' ? 'Erişim Engellendi' : 'Access Denied'}
          </h1>
          <p className="text-neutral-600">
            {locale === 'tr'
              ? 'Etkinlik yönetimi modülüne erişiminiz yok.'
              : 'You do not have access to the events module.'}
          </p>
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
