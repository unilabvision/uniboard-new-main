"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useClerk } from '@clerk/nextjs';
import { useUserModules } from '../hooks/useUserModules';
import { getIconComponent } from '@/utils/iconMapper';
import { getModuleHref } from '@/utils/moduleRoutes';
import { GraduationCap, BarChart3, Target, Lock, LogOut, HelpCircle, LucideIcon, Shield } from 'lucide-react';
import ThemeSwitcher from '@/app/components/ThemeSwitcher'; // Theme switcher import

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
}

const texts = {
  tr: {
    // Giriş yapmamış kullanıcılar için
    welcomeTitle: "MyUNI Dashboard'a Hoş Geldiniz",
    welcomeSubtitle: "Yapay zeka destekli eğitim platformu ile kariyerinize yön verin",
    loginButton: "Giriş Yap",
    signupButton: "Üye Ol",
    learnMore: "Daha Fazla Bilgi",
    
    // Giriş yapmış kullanıcılar için
    welcomeBack: "Tekrar Hoş Geldiniz",
    dashboardTitle: "Dashboard",
    subtitle: "Modüllerden birini seçerek devam edin.",
    loading: "Modülleriniz yükleniyor...",
    error: "Modüller yüklenemedi",
    tryAgain: "Tekrar Dene",
    noModules: "Henüz aktif modülünüz yok",
    noModulesDesc: "Dashboard modüllerine erişim için yöneticinizle iletişime geçin.",
    signOut: "Çıkış Yap",
    support: "Destek",
    backToHome: "Ana Sayfaya Dön",
    moduleCount: "aktif modülünüz var. Birini seçerek devam edin.",
    viewOptions: {
      grid: "Izgara Görünümü",
      list: "Liste Görünümü",
      compact: "Kompakt Görünüm"
    },
    themeTooltip: "Tema Değiştir"
  },
  en: {
    // For non-logged-in users
    welcomeTitle: "Welcome to MyUNI",
    welcomeSubtitle: "Shape your career with AI-powered learning platform",
    loginButton: "Sign In",
    signupButton: "Sign Up",
    learnMore: "Learn More",
    
    // For logged-in users
    welcomeBack: "Welcome Back",
    dashboardTitle: "Dashboard",
    subtitle: "Choose a module to continue.",
    loading: "Loading your modules...",
    error: "Failed to load modules",
    tryAgain: "Try Again",
    noModules: "No active modules yet",
    noModulesDesc: "Contact your administrator for dashboard module access.",
    signOut: "Sign Out",
    support: "Support",
    backToHome: "Back to Home",
    moduleCount: "active modules. Choose one to continue.",
    viewOptions: {
      grid: "Grid View",
      list: "List View", 
      compact: "Compact View"
    },
    themeTooltip: "Toggle Theme"
  }
};

const ModuleCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href,
  delay = 0,
  viewMode = 'grid'
}: { 
  title: string; 
  description: string; 
  icon: LucideIcon; 
  href: string;
  delay?: number;
  viewMode?: 'grid' | 'list' | 'compact';
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);  
    }, delay * 100);
    return () => clearTimeout(timer);
  }, [delay]);

  // Grid görünümü (varsayılan)
  if (viewMode === 'grid') {
    return (
      <Link href={href} className="h-full">
        <div 
          className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 hover:border-[#990000] dark:hover:border-[#990000] transition-all duration-200 group cursor-pointer transform h-full flex flex-col ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
          style={{ transition: 'opacity 0.6s ease-out, transform 0.6s ease-out' }}
        >
          <div className="flex items-start space-x-4 flex-1">
            <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center group-hover:bg-[#990000] transition-colors duration-200 flex-shrink-0">
              <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400 group-hover:text-white transition-colors duration-200" />
            </div>
            
            <div className="flex-1 min-w-0 flex flex-col">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                {title}
              </h3>
              
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed flex-1">
                {description}
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Liste görünümü
  if (viewMode === 'list') {
    return (
      <Link href={href}>
        <div 
          className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-[#990000] dark:hover:border-[#990000] transition-all duration-200 group cursor-pointer transform ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
          style={{ transition: 'opacity 0.6s ease-out, transform 0.6s ease-out' }}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center group-hover:bg-[#990000] transition-colors duration-200">
              <Icon className="w-6 h-6 text-neutral-600 dark:text-neutral-400 group-hover:text-white transition-colors duration-200" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                {title}
              </h3>
              
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {description}
              </p>
            </div>
            
            <div className="text-neutral-400 group-hover:text-[#990000] transition-colors duration-200">
              →
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Kompakt görünüm
  return (
    <Link href={href}>
      <div 
        className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-[#990000] dark:hover:border-[#990000] transition-all duration-200 group cursor-pointer transform ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
        style={{ transition: 'opacity 0.6s ease-out, transform 0.6s ease-out' }}
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center group-hover:bg-[#990000] transition-colors duration-200">
            <Icon className="w-6 h-6 text-neutral-600 dark:text-neutral-400 group-hover:text-white transition-colors duration-200" />
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              {title}
            </h3>
            
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Theme Switcher Floating Button Component
const ThemeSwitcherFloat = ({ locale }: { locale: string }) => {
  const t = texts[locale as keyof typeof texts] || texts.tr;
  
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div 
        className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 group cursor-pointer"
        title={t.themeTooltip}
      >
        <ThemeSwitcher />
      </div>
    </div>
  );
};

// Giriş yapmamış kullanıcılar için modül kartları tarzında ana sayfa
const PublicHomePage = ({ locale }: { locale: string }) => {
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Feature cards - modül kartları gibi tasarlanacak
  const features = [
    {
      icon: GraduationCap,
      title: locale === 'tr' ? 'Akıllı Eğitim' : 'Smart Learning',
      description: locale === 'tr' ? 'Yapay zeka destekli kişiselleştirilmiş öğrenme deneyimi' : 'AI-powered personalized learning experience',
      href: `/${locale}/hakkimizda`
    },
    {
      icon: BarChart3,
      title: locale === 'tr' ? 'İlerleme Takibi' : 'Progress Tracking',
      description: locale === 'tr' ? 'Detaylı analitik ve performans raporları' : 'Detailed analytics and performance reports',
      href: `/${locale}/hakkimizda`
    },
    {
      icon: Target,
      title: locale === 'tr' ? 'Hedef Odaklı' : 'Goal Oriented',
      description: locale === 'tr' ? 'Kariyerinize yönelik özel öğrenme yolları' : 'Customized learning paths for your career',
      href: `/${locale}/hakkimizda`
    }
  ];

  return (
    <>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center py-12">
        <div className="max-w-6xl mx-auto px-6 w-full">
          {/* Header - Dashboard tarzında */}
          <div 
            className={`mb-12 transform transition-all duration-300 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Logo */}
            <div className="text-left mb-6 ml-1">
              <Image
                src="/myuni-logo.png"
                alt="MyUNI Logo"
                width={120}
                height={120}
                className="dark:hidden"
              />
              <Image
                src="/myuni-logo-dark.png"
                alt="MyUNI Logo"
                width={120}
                height={120}
                className="hidden dark:block"
              />
              <div className="w-32 h-0.5 bg-neutral-300 dark:bg-neutral-600 mt-4 -ml-1"></div>
            </div>
            
            {/* Title and Subtitle */}
            <div className="text-left mb-8">
              <h1 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {t.welcomeTitle}
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8">
                {t.welcomeSubtitle}
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <Link 
                  href={`/${locale}/login?tab=signin`}
                  className="group relative px-8 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10">{t.loginButton}</span>
                  <div className="absolute inset-0 bg-neutral-900 dark:bg-neutral-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  <span className="absolute inset-0 flex items-center justify-center text-white dark:text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    {t.loginButton}
                  </span>
                </Link>
                <Link 
                  href={`/${locale}/login?tab=signup`}
                  className="group relative px-8 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-400 dark:hover:border-neutral-300 transition-all duration-300"
                >
                  {t.signupButton}
                </Link>
              </div>
            </div>
          </div>

          {/* Feature Cards Grid - Modül kartları gibi */}
          <div 
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr mb-12 transform transition-all duration-1000 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {features.map((feature, index) => (
              <div key={index}>
                <Link href={feature.href} className="h-full">
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 hover:border-[#990000] dark:hover:border-[#990000] transition-all duration-200 group cursor-pointer transform h-full flex flex-col">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center group-hover:bg-[#990000] transition-colors duration-200 flex-shrink-0">
                        <feature.icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400 group-hover:text-white transition-colors duration-200" />
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col">
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                          {feature.title}
                        </h3>
                        
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed flex-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Footer Link */}
          <div 
            className={`text-center transform transition-all duration-1000 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Link 
              href={`/${locale}/hakkimizda`}
              className="text-sm text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-300 tracking-wide"
            >
              {t.learnMore} →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Theme Switcher */}
      <ThemeSwitcherFloat locale={locale} />
    </>
  );
};

// Giriş yapmış kullanıcılar için dashboard
const DashboardContent = ({ locale }: { locale: string }) => {
  const { modules, loading, error, isSuperAdmin } = useUserModules();
  const { signOut } = useClerk(); // signOut fonksiyonunu useClerk'den alıyoruz
  const [headerVisible, setHeaderVisible] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    const timer = setTimeout(() => {
      setHeaderVisible(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // İlk yükleme tamamlandığında initial loading'i kapat
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Çıkış yap fonksiyonu
  const handleSignOut = async () => {
    try {
      await signOut();
      // Çıkış yaptıktan sonra ana sayfaya yönlendir
      window.location.href = `/${locale}`;
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Loading state
  if (initialLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-8 h-8 border-2 border-neutral-200 dark:border-neutral-700 rounded-full animate-spin mx-auto">
              <div className="absolute top-0 left-0 w-8 h-8 border-2 border-transparent border-t-[#990000] rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-4">
            {t.loading}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4 text-4xl">⚠️</div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {t.error}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-sm">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#990000] text-white rounded-md hover:bg-[#800000] transition-colors"
            >
              {t.tryAgain}
            </button>
          </div>
        </div>
        <ThemeSwitcherFloat locale={locale} />
      </>
    );
  }

  // No modules state - kullanıcı giriş yapmış ama modülü yok
  if (modules.length === 0) {
    return (
      <>
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center py-12">
          <div className="max-w-2xl mx-auto px-8 text-center">

            {/* Icon */}
            <div className="w-20 h-20 border-2 border-neutral-200 dark:border-neutral-700 rounded-full flex items-center justify-center mx-auto mb-8">
              <Lock className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
            </div>

            {/* Title and Description */}
            <h1 className="text-2xl md:text-3xl font-light text-neutral-900 dark:text-neutral-100 mb-6 tracking-wide">
              {t.noModules}
            </h1>
            <p className="text-base text-neutral-600 dark:text-neutral-400 mb-12 max-w-md mx-auto leading-relaxed">
              {t.noModulesDesc}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleSignOut}
                className="group relative px-8 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span>{t.signOut}</span>
                </span>
                <div className="absolute inset-0 bg-neutral-900 dark:bg-neutral-100 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                <span className="absolute inset-0 flex items-center justify-center space-x-2 text-white dark:text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <LogOut className="w-4 h-4" />
                  <span>{t.signOut}</span>
                </span>
              </button>
              
              <Link 
                href={`/${locale}/destek`}
                className="group relative px-8 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-400 dark:hover:border-neutral-300 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <HelpCircle className="w-4 h-4" />
                <span>{t.support}</span>
              </Link>
            </div>

          </div>
        </div>
        <ThemeSwitcherFloat locale={locale} />
      </>
    );
  }

  // Dashboard with modules
  return (
    <>
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center py-12">
        <div className="max-w-6xl mx-auto px-6 w-full">
          {/* Header */}
          <div 
            className={`mb-12 transform transition-all duration-600 ease-out ${
              headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
          >
            {/* Logo */}
            <div className="text-left mb-6 ml-1">
              <Image
                src="/myuni-logo.png"
                alt="MyUNI Logo"
                width={120}
                height={120}
                className="dark:hidden"
              />
              <Image
                src="/myuni-logo-dark.png"
                alt="MyUNI Logo"
                width={120}
                height={120}
                className="hidden dark:block"
              />
              <div className="w-32 h-0.5 bg-neutral-300 dark:bg-neutral-600 mt-4 -ml-1"></div>
            </div>
            
            {/* Title and Subtitle */}
            <div className="text-left">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100">
                  {t.welcomeBack}
                </h1>
                {isSuperAdmin && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    <Shield className="w-3.5 h-3.5" />
                    {locale === 'tr' ? 'Süper Admin' : 'Super Admin'}
                  </span>
                )}
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">
                {modules.length} {t.moduleCount}
              </p>
            </div>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {modules.map((module, index) => {
              const IconComponent = getIconComponent(module.icon);
              return (
                <ModuleCard
                  key={module.key}
                  title={locale === 'tr' ? module.name_tr : module.name_en}
                  description={locale === 'tr' ? module.description_tr : module.description_en}
                  icon={IconComponent}
                  href={getModuleHref(locale, module.key)}
                  delay={index}
                />
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Theme Switcher */}
      <ThemeSwitcherFloat locale={locale} />
    </>
  );
};

const HomePageContent = ({ locale }: { locale: string }) => {
  const { user, isLoaded } = useUser();

  // Clerk henüz yüklenmemiş
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-300 border-t-[#990000]"></div>
      </div>
    );
  }

  // Kullanıcı giriş yapmamış - genel ana sayfa göster
  if (!user) {
    return <PublicHomePage locale={locale} />;
  }

  // Kullanıcı giriş yapmış - dashboard göster
  return <DashboardContent locale={locale} />;
};

export default function HomePage({ params }: HomePageProps) {
  const [locale, setLocale] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setLocale(resolvedParams.locale);
      setMounted(true);
    };
    resolveParams();
  }, [params]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-300 border-t-[#990000]"></div>
      </div>
    );
  }

  return <HomePageContent locale={locale} />;
}