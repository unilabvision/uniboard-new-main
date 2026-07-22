"use client";

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  TrendingUp, 
  Settings, 
  HelpCircle, 
  LogOut,
  Menu,
  X,
  User,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  GraduationCap,
  Award
} from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';
import { getModuleHref } from '@/utils/moduleRoutes';

interface ModuleContent {
  title: string;
  items: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

interface SidebarProps {
  locale: string;
  modules: Array<{
    key: string;
    name_tr: string;
    name_en: string;
    description_tr: string;
    description_en: string;
    icon: string;
    category: string;
  }>;
}

// Global dil metinleri - ortak öğeler için
const sidebarTexts = {
  tr: {
    menu: "Menü",
    dashboard: "Ana Panel",
    common: {
      calendar: "Takvim",
      reports: "Raporlar",
      profile: "Profil",
      settings: "Ayarlar",
      help: "Yardım",
      logout: "Çıkış Yap"
    }
  },
  en: {
    menu: "Menu",
    dashboard: "Dashboard",
    common: {
      calendar: "Calendar",
      reports: "Reports",
      profile: "Profile",
      settings: "Settings",
      help: "Help",
      logout: "Logout"
    }
  }
};

function GlobalDashboardSidebarInner({ locale, modules }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [moduleContent, setModuleContent] = useState<Record<string, ModuleContent> | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const t = sidebarTexts[locale as keyof typeof sidebarTexts] || sidebarTexts.tr;
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Aktif modülü tespit et - DÜZELTİLDİ
  const pathSegments = pathname.split('/').filter(Boolean); // Boş segmentleri kaldır
  // Path yapıları:
  // 1. /tr/dashboard/influencer → ['tr', 'dashboard', 'influencer']
  // 2. /tr/influencer → ['tr', 'influencer']
  // 3. /tr/dashboard/settings → ['tr', 'dashboard', 'settings']
  // 4. /tr/settings → ['tr', 'settings']
  let currentModule: string | undefined;
  let basePath: string = '';
  
  if (pathSegments[1] === 'dashboard' && pathSegments[2]) {
    // Dashboard altındaki modül: /tr/dashboard/influencer, /tr/dashboard/settings
    currentModule = pathSegments[2];
    basePath = `/${pathSegments[0]}/${currentModule}`;
  } else if (pathSegments[1] && pathSegments[1] !== 'dashboard') {
    // Doğrudan modül: /tr/influencer, /tr/settings
    currentModule = pathSegments[1];
    basePath = `/${pathSegments[0]}/${currentModule}`;
  }
  
  
  const isInModule =
    !!currentModule &&
    (modules.some((m) => m.key === currentModule) ||
      (currentModule === 'analytics' && modules.some((m) => m.key === 'reports')) ||
      (currentModule === 'reports' && modules.some((m) => m.key === 'analytics')) ||
      (currentModule === 'internship' &&
        modules.some((m) =>
          ['internship', 'staj', 'career', 'kariyer', 'careers'].includes(m.key)
        )) ||
      (currentModule === 'site-applications' &&
        modules.some((m) =>
          ['site-applications', 'site_basvurular', 'site-basvurular', 'basvurular'].includes(m.key)
        )) ||
      (['staj', 'career', 'kariyer', 'careers'].includes(currentModule) &&
        modules.some((m) =>
          ['internship', 'staj', 'career', 'kariyer', 'careers'].includes(m.key)
        )) ||
      (['events', 'etkinlik', 'etkinlikler'].includes(currentModule) &&
        modules.some((m) =>
          ['events', 'etkinlik', 'etkinlikler'].includes(m.key)
        )) ||
      currentModule === 'settings');

  // Modül değiştiğinde sidebar content'ini yükle
  useEffect(() => {
    if (isInModule && currentModule) {
      const loadSidebarContent = async () => {
        try {
          let content = null;
          
          
          // Her modül için ayrı content dosyasını yükle
          switch (currentModule) {
            case 'influencer':
              // Import path'i düzelt - influencer modülü hem dashboard altında hem de doğrudan olabilir
              try {
                // Önce dashboard altındaki dosyayı dene
                const { influencerSidebarContent } = await import('../../app/[locale]/influencer/sidebar-content');
                content = influencerSidebarContent;
              } catch (e1) {
                try {
                  // Sonra doğrudan influencer klasöründeki dosyayı dene
                  const { influencerSidebarContent } = await import('../../app/[locale]/influencer/sidebar-content');
                  content = influencerSidebarContent;
                } catch (e2) {
                  console.error('Could not load influencer sidebar content from either location', e1, e2);
                  content = null;
                }
              }
              break;
              
            case 'settings':
              // Settings modülü için content yükle
              try {
                const { settingsSidebarContent } = await import('../../app/[locale]/settings/sidebar-content');
                content = settingsSidebarContent;
              } catch (error) {
                console.error('Could not load settings sidebar content', error);
                content = null;
              }
              break;
              
            case 'help':
              // Help modülü için content yükle
              try {
                const { helpSidebarContent } = await import('../../app/[locale]/help/sidebar-content');
                content = helpSidebarContent;
              } catch (error) {
                console.error('Could not load help sidebar content', error);
                content = null;
              }
              break;
              
            case 'certificates':
              // Certificates modülü için content yükle
              try {
                const { certificatesSidebarContent } = await import('../../app/[locale]/certificates/sidebar-content');
                content = certificatesSidebarContent;
              } catch (error) {
                console.error('Could not load certificates sidebar content', error);
                content = null;
              }
              break;
              
            case 'lms':
              // LMS modülü için content yükle
              try {
                const { lmsSidebarContent } = await import('../../app/[locale]/lms/sidebar-content');
                content = lmsSidebarContent;
              } catch (error) {
                console.error('Could not load lms sidebar content', error);
                content = null;
              }
              break;
              
            case 'lms-2':
              // LMS modülü için content yükle
              try {
                const { lmsSidebarContent } = await import('../../app/[locale]/lms-2/sidebar-content');
                content = lmsSidebarContent;
              } catch (error) {
                console.error('Could not load lms-2 sidebar content', error);
                content = null;
              }
              break;

            case 'analytics':
            case 'reports':
              try {
                const { analyticsSidebarContent } = await import('../../app/[locale]/analytics/sidebar-content');
                content = analyticsSidebarContent;
              } catch (error) {
                console.error('Could not load analytics sidebar content', error);
                content = null;
              }
              break;

            case 'internship':
            case 'staj':
            case 'career':
            case 'kariyer':
            case 'careers':
              try {
                const { internshipSidebarContent } = await import('../../app/[locale]/internship/sidebar-content');
                content = internshipSidebarContent;
              } catch (error) {
                console.error('Could not load internship sidebar content', error);
                content = null;
              }
              break;

            case 'site-applications':
            case 'site_basvurular':
            case 'site-basvurular':
            case 'basvurular':
              try {
                const { siteApplicationsSidebarContent } = await import('../../app/[locale]/site-applications/sidebar-content');
                content = siteApplicationsSidebarContent;
              } catch (error) {
                console.error('Could not load site applications sidebar content', error);
                content = null;
              }
              break;

            case 'events':
            case 'etkinlik':
            case 'etkinlikler':
              try {
                const { eventsSidebarContent } = await import('../../app/[locale]/events/sidebar-content');
                content = eventsSidebarContent;
              } catch (error) {
                console.error('Could not load events sidebar content', error);
                content = null;
              }
              break;
            // case 'sales':
            //   const { salesSidebarContent } = await import('@/app/[locale]/dashboard/sales/sidebar-content');
            //   content = salesSidebarContent;
            //   break;
            default:
              
              content = null;
          }
          
          setModuleContent(content);
        } catch {
          // Error loading module content
          
          setModuleContent(null);
        }
      };
      
      loadSidebarContent();
    } else {
      console.log('Not in module or no current module, clearing content');
      setModuleContent(null);
    }
  }, [currentModule, isInModule]);

  // Theme toggle function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
    } else {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
    }
  };

  // Load sidebar state and theme from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("sidebar-collapsed") === "true";
      setIsCollapsed(savedState);
      
      // Load theme
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));
    
    // Dispatch custom event to notify layout
    window.dispatchEvent(new CustomEvent('sidebarToggle', {
      detail: { isMinimized: newState }
    }));
  };

  const handleLogout = () => {
    signOut();
  };

  // Modüle özel navigation items'ları al - DÜZELTİLDİ
  const getModuleNavigationItems = () => {
    if (!isInModule || !moduleContent) {
      console.log('No module content available');
      return [];
    }
    
    const content = moduleContent[locale as keyof typeof moduleContent] || moduleContent.tr;
    
    
    return [
      // Ana Panel butonu - her zaman dashboard ana sayfasına git
      {
        name: t.dashboard,
        href: `/${locale}/`,
        icon: TrendingUp,
        active: pathname === `/${locale}/`
      },
      // Modül özel navigation items
      ...(content as ModuleContent).items.map((item) => {
        const fullHref = item.href.startsWith('http')
          ? item.href
          : `${basePath}${item.href === '/' ? '' : item.href}`;
        const [itemPath, itemQuery = ''] = fullHref.split('?');
        const normalizedPath = pathname.replace(/\/$/, '') || pathname;
        const normalizedItem = itemPath.replace(/\/$/, '') || itemPath;
        const isModuleHome =
          normalizedItem === basePath ||
          normalizedItem === `${basePath}` ||
          item.href === '/';
        const isActive = itemQuery
          ? normalizedPath === normalizedItem && currentQuery === itemQuery
          : isModuleHome
            ? normalizedPath === basePath
            : normalizedPath === normalizedItem ||
              normalizedPath.startsWith(`${normalizedItem}/`);

        return {
          name: item.name,
          href: fullHref,
          icon: item.icon,
          active: isActive,
        };
      })
    ];
  };

  const navigationItems = getModuleNavigationItems();

  return (
    <>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
      
      {/* Desktop spacer — keeps page content beside the fixed sidebar */}
      <div
        className={`hidden lg:block flex-shrink-0 transition-[width] duration-300 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
        aria-hidden
      />

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-md hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-dvh w-64 flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Header */}
        <div
          className={`h-14 flex items-center border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0 ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
          }`}
        >
          {!isCollapsed && (
            <Link
              href={`/${locale}/`}
              className="flex items-center min-w-0 hover:opacity-90 transition-opacity"
              onClick={() => setIsOpen(false)}
            >
              <Image
                src="/myuni-logo.png"
                alt="MyUNI"
                width={110}
                height={28}
                className="block dark:hidden h-7 w-auto"
              />
              <Image
                src="/myuni-logo-dark.png"
                alt="MyUNI"
                width={110}
                height={28}
                className="hidden dark:block h-7 w-auto"
              />
            </Link>
          )}

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden lg:flex p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Main Navigation */}
          <nav className="px-2.5 py-3 space-y-0.5 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Eğer bir modül içindeysek, o modülün navigation'ını göster */}
            {isInModule && moduleContent ? (
              <>
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={`${item.name}-${item.href}`}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`group relative flex items-center rounded-lg text-sm font-medium transition-colors ${
                        isCollapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2'
                      } ${
                        item.active
                          ? 'bg-[#990000] text-white shadow-sm'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 hover:text-neutral-900 dark:hover:text-neutral-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="ml-3 truncate">{item.name}</span>
                      )}
                      
                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </>
            ) : (
              <>
                {/* Dashboard Ana Sayfa - Sadece ana dashboard'dayken göster */}
                <Link
                  href={`/${locale}/dashboard`}
                  onClick={() => setIsOpen(false)}
                  className={`group relative flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === `/${locale}/dashboard`
                      ? 'bg-[#990000] text-white'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  <TrendingUp className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="ml-3 truncate">{t.dashboard}</span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {t.dashboard}
                    </div>
                  )}
                </Link>

                {/* Divider */}
                <div className="py-2">
                  <div className="border-t border-neutral-200 dark:border-neutral-800"></div>
                </div>

                {/* Modül Listesi - Sadece ana dashboard'dayken göster */}
                {modules.map((module) => (
                  <Link
                    key={module.key}
                    href={getModuleHref(locale, module.key)}
                    onClick={() => setIsOpen(false)}
                    className="group relative flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                  >
                    {module.key === 'certificates' ? (
                      <Award className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <GraduationCap className="w-5 h-5 flex-shrink-0" />
                    )}
                    {!isCollapsed && (
                      <span className="ml-3 truncate">
                        {locale === 'tr' ? module.name_tr : module.name_en}
                      </span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {locale === 'tr' ? module.name_tr : module.name_en}
                      </div>
                    )}
                  </Link>
                ))}
              </>
            )}

            {/* Divider */}
            <div className="py-2">
              <div className="border-t border-neutral-200 dark:border-neutral-800"></div>
            </div>

            {/* Settings Link - Sadece settings modülünde değilken göster */}
            {currentModule !== 'settings' && (
              <Link
                href={`/${locale}/settings`}
                onClick={() => setIsOpen(false)}
                className={`group relative flex items-center rounded-lg text-sm font-medium transition-colors ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2'
                } ${
                  pathname.includes('/settings')
                    ? 'bg-[#990000] text-white'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="ml-3 truncate">{t.common.settings}</span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {t.common.settings}
                  </div>
                )}
              </Link>
            )}

            <Link
              href={`/${locale}/help`}
              onClick={() => setIsOpen(false)}
              className={`group relative flex items-center rounded-lg text-sm font-medium transition-colors ${
                isCollapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2'
              } ${
                pathname.includes('/help')
                  ? 'bg-[#990000] text-white'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="ml-3 truncate">{t.common.help}</span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {t.common.help}
                </div>
              )}
            </Link>

            <div
              onClick={toggleTheme}
              className={`group relative flex items-center rounded-lg text-sm font-medium transition-colors text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer ${
                isCollapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2'
              }`}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Moon className="w-5 h-5 flex-shrink-0" />
              )}
              {!isCollapsed && (
                <span className="ml-3 truncate">
                  {locale === 'tr' ? 'Tema' : 'Theme'}
                </span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {locale === 'tr' ? 'Tema' : 'Theme'}
                </div>
              )}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="px-2.5 pt-2 pb-3 space-y-1 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex-shrink-0">
            {/* User Profile Info - only when not collapsed */}
            {user && !isCollapsed && (
              <div className="flex items-center px-2.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                  {user.imageUrl ? (
                    <Image 
                      src={user.imageUrl} 
                      alt={user.fullName || 'User'} 
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  )}
                </div>
                <div className="ml-2.5 flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {user.fullName || user.firstName || 'User'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {isInModule && moduleContent
                      ? (moduleContent[locale as keyof typeof moduleContent] || moduleContent.tr)?.title || 'Dashboard'
                      : 'Dashboard'
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Profile Link */}
            <Link
              href={`/${locale}/settings/profile`}
              onClick={() => setIsOpen(false)}
              className={`group relative flex items-center rounded-lg text-sm font-medium transition-colors ${
                isCollapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2'
              } ${
                pathname.includes('/profile')
                  ? 'bg-[#990000] text-white'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <User className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="ml-3 truncate">{t.common.profile}</span>
              )}
              
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {t.common.profile}
                </div>
              )}
            </Link>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className={`group relative w-full flex items-center rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
                isCollapsed ? 'justify-center px-2 py-2.5' : 'px-2.5 py-2'
              }`}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="ml-3">{t.common.logout}</span>
              )}
              
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {t.common.logout}
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function GlobalDashboardSidebarFallback() {
  return (
    <>
      <div className="hidden lg:block flex-shrink-0 w-64" aria-hidden />
      <div
        className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800"
        aria-hidden
      />
    </>
  );
}

export default function GlobalDashboardSidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<GlobalDashboardSidebarFallback />}>
      <GlobalDashboardSidebarInner {...props} />
    </Suspense>
  );
}