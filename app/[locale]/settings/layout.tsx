"use client";

import React, { useState, useEffect } from 'react';
import GlobalDashboardSidebar from '../../components/GlobalDashboardSidebar';
import { useUserModules } from '../../hooks/useUserModules';

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default function SettingsLayout({ children, params }: DashboardLayoutProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [locale, setLocale] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [hasSettingsAccess, setHasSettingsAccess] = useState<boolean | null>(null);
  
  const { modules, loading, error } = useUserModules();

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setLocale(resolvedParams.locale);
      setMounted(true);
    };
    resolveParams();
  }, [params]);

  // Check settings access - Veri tabanından gelen yetkiye göre kontrol et
  useEffect(() => {
    const checkSettingsAccess = () => {
      if (loading) return;
      
      if (error) {
        setHasSettingsAccess(false);
        return;
      }
      
      // Settings modülüne erişim yetkisi olup olmadığını kontrol et
      const hasSettings = modules.some(module => 
        module.key === 'settings' || 
        module.key === 'admin'
      );
      
      // Alternatif: Herhangi bir modülü olan kullanıcılar ayarlara erişebilir
      // const hasSettings = modules.length > 0;
      
      setHasSettingsAccess(hasSettings);
      
      console.log('🔍 Settings access check:', {
        modulesCount: modules.length,
        modules: modules.map(m => m.key),
        hasSettings
      });
    };
    
    checkSettingsAccess();
  }, [modules, loading, error]);

  // Listen for sidebar minimize state changes
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent) => {
      setIsMinimized(event.detail.isMinimized);
    };

    // Load sidebar state from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem("sidebar-collapsed") === "true";
      setIsMinimized(savedState);
    }

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);

  // Loading state
  if (!mounted || loading || hasSettingsAccess === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#990000] mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">
            {locale === 'tr' ? 'Ayarlar yükleniyor...' : 'Loading settings...'}
          </p>
        </div>
      </div>
    );
  }

  // Access denied state (genellikle ayarlar için gerekli olmaz ama güvenlik için bırakıldı)
  if (hasSettingsAccess === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center py-12">
        <div className="max-w-md mx-auto text-center px-6">
          {/* İkon */}
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Başlık */}
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {locale === 'tr' ? 'Erişim Engellendi' : 'Access Denied'}
          </h1>

          {/* Açıklama */}
          <p className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
            {locale === 'tr' 
              ? 'Ayarlar sayfasına erişim yetkiniz bulunmamaktadır. Erişim için lütfen yöneticinizle iletişime geçin.'
              : 'You do not have access to the Settings page. Please contact your administrator for access.'
            }
          </p>

          {/* Modül Bilgisi */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-yellow-800 dark:text-yellow-200">
                {locale === 'tr' ? 'İstenen Sayfa' : 'Requested Page'}
              </span>
            </div>
            <div className="text-yellow-700 dark:text-yellow-300 font-medium">
              {locale === 'tr' ? 'Ayarlar Paneli' : 'Settings Panel'}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              {locale === 'tr' 
                ? 'Sistem ayarları ve kullanıcı tercihleri'
                : 'System settings and user preferences'
              }
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
              <div className="text-sm text-red-700 dark:text-red-300">
                {locale === 'tr' ? 'Teknik Hata: ' : 'Technical Error: '}{error}
              </div>
            </div>
          )}

          {/* Eylem Butonları */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = `/${locale}/destek`}
              className="w-full px-6 py-3 bg-[#990000] text-white font-medium rounded-lg hover:bg-[#800000] transition-colors"
            >
              {locale === 'tr' ? 'Destek ile İletişime Geç' : 'Contact Support'}
            </button>
            
            <button
              onClick={() => window.location.href = `/${locale}`}
              className="w-full px-6 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
            >
              {locale === 'tr' ? 'Ana Sayfaya Dön' : 'Return to Home'}
            </button>
          </div>

          {/* Debug bilgisi - sadece development'ta */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 p-3 rounded">
              <div>Debug Info:</div>
              <div>Available modules: {modules.map(m => m.key).join(', ') || 'None'}</div>
              <div>Has settings access: {hasSettingsAccess?.toString()}</div>
              <div>Loading: {loading.toString()}</div>
              <div>Error: {error || 'None'}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modülleri GlobalDashboardSidebar'ın beklediği formata dönüştür
  const modulesWithCategory = modules.map(module => ({
    key: module.key,
    name_tr: module.name_tr,
    name_en: module.name_en,
    description_tr: module.description_tr,
    description_en: module.description_en,
    icon: module.icon,
    category: 'dashboard' // Varsayılan category ekle
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex">
      {/* Global Sidebar */}
      <GlobalDashboardSidebar locale={locale} modules={modulesWithCategory} />
      
      {/* Main Content with proper margin to account for fixed sidebar */}
      <div className={`flex-1 transition-all duration-300 ${
        isMinimized ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}