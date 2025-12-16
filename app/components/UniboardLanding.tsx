'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Users, BarChart3, Settings, Database, Zap } from 'lucide-react';
import Button from '../components/ui/Button';

interface UniboardLandingProps {
  locale: string;
}

// Content function for UNIBOARD landing
function getUniboardContent(locale: string) {
  return {

    headlines: locale === 'tr' 
      ? [
          "Güçlü ve Esnek Yönetim Paneli",
          "Modüler CMS ve İçerik Yönetimi",
          "Modern Admin Dashboard Çözümü"
        ]
      : [
          "Powerful and Flexible Admin Panel",
          "Modular CMS and Content Management",
          "Modern Admin Dashboard Solution"
        ],
    description: locale === 'tr'
      ? "UNIBOARD ile web uygulamalarınızı kolayca yönetin. Modüler yapısı sayesinde ihtiyacınıza göre özelleştirilebilir, modern tasarımı ile kullanıcı dostu deneyim sunar. Blog editörü, kullanıcı yönetimi ve analitik araçlarıyla tüm ihtiyaçlarınızı karşılar."
      : "Easily manage your web applications with UNIBOARD. Customizable according to your needs with its modular structure, it offers a user-friendly experience with modern design. Meets all your needs with blog editor, user management and analytics tools.",
    cta: locale === 'tr' ? "CMS'i Keşfet" : "Discover CMS",
    ctaLink: locale === 'tr' ? '/tr/cms' : '/en/cms',
    secondaryCta: locale === 'tr' ? 'Dokümantasyon' : 'Documentation',
    secondaryLink: locale === 'tr' ? '/tr/docs' : '/en/docs',
    hoverText: locale === 'tr' 
      ? 'Modern Teknolojilerle Güçlendirilmiş Yönetim'
      : 'Management Powered by Modern Technologies',
    stats: locale === 'tr' 
      ? [
          { value: "5+", label: "Modül" },
          { value: "100%", label: "Özelleştirilebilir" },
          { value: "24/7", label: "Erişim" }
        ]
      : [
          { value: "5+", label: "Modules" },
          { value: "100%", label: "Customizable" },
          { value: "24/7", label: "Access" }
        ],
    features: locale === 'tr' 
      ? [
          {
            icon: Shield,
            title: "Güvenli Erişim",
            description: "Rol tabanlı yetkilendirme ve güvenli kimlik doğrulama sistemi"
          },
          {
            icon: Users,
            title: "Kullanıcı Yönetimi",
            description: "Kullanıcıları kolayca yönetin, roller atayın ve izinleri kontrol edin"
          },
          {
            icon: BarChart3,
            title: "Analitik Dashboard",
            description: "Gerçek zamanlı veriler ve detaylı raporlarla performansı izleyin"
          },
          {
            icon: Settings,
            title: "Sistem Ayarları",
            description: "Tüm sistem konfigürasyonlarını tek yerden yönetin"
          },
          {
            icon: Database,
            title: "İçerik Yönetimi",
            description: "Blog yazıları, sayfalar ve medya dosyalarını organize edin"
          },
          {
            icon: Zap,
            title: "Hızlı Performans",
            description: "Modern teknolojiler ile optimize edilmiş hızlı yükleme"
          }
        ]
      : [
          {
            icon: Shield,
            title: "Secure Access",
            description: "Role-based authorization and secure authentication system"
          },
          {
            icon: Users,
            title: "User Management",
            description: "Easily manage users, assign roles and control permissions"
          },
          {
            icon: BarChart3,
            title: "Analytics Dashboard",
            description: "Monitor performance with real-time data and detailed reports"
          },
          {
            icon: Settings,
            title: "System Settings",
            description: "Manage all system configurations from one place"
          },
          {
            icon: Database,
            title: "Content Management",
            description: "Organize blog posts, pages and media files"
          },
          {
            icon: Zap,
            title: "Fast Performance",
            description: "Fast loading optimized with modern technologies"
          }
        ],
    imageOverlays: locale === 'tr' 
      ? ["Modern Admin Interface", "Modüler Yapı ve Esneklik"]
      : ["Modern Admin Interface", "Modular Structure and Flexibility"]
  };
}

export default function UniboardLanding({ locale }: UniboardLandingProps) {
  const [content] = useState(() => getUniboardContent(locale));
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const FadeInSlideText = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      if (!isLoaded) return;

      const headlinesLength = content.headlines.length;
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % headlinesLength);
      }, 3500);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="h-24 lg:h-32 relative overflow-hidden">
        {content.headlines.map((headline, index) => (
          <h1
            key={index}
            className={`absolute top-0 left-0 text-3xl lg:text-4xl xl:text-4xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight transition-all duration-700 ease-in-out ${
              currentIndex === index
                ? 'opacity-100 transform translate-y-0'
                : index === (currentIndex - 1 + content.headlines.length) % content.headlines.length
                ? 'opacity-0 transform -translate-y-8'
                : 'opacity-0 transform translate-y-8'
            }`}
          >
            {headline}
          </h1>
        ))}
      </div>
    );
  };

  const AdminDashboardPreview = () => {
  const [currentView, setCurrentView] = useState(1);

  useEffect(() => {
    if (!isLoaded) return;

    const viewInterval = setInterval(() => {
      setCurrentView((prevView) => (prevView >= 3 ? 1 : prevView + 1));
    }, 5000);

    return () => clearInterval(viewInterval);
  }, []);

  return (
    <div className="relative h-[280px] sm:h-[320px] md:h-[380px] lg:h-[500px] w-full">
      {/* Main Container */}
      <div className="relative h-full bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-xl border border-neutral-200/50 dark:border-neutral-800/50">
        
        {/* Dashboard Views */}
        {[1, 2, 3].map((viewNum) => (
          <div
            key={viewNum}
            className={`transition-all duration-1000 ease-in-out absolute inset-0 ${
              currentView === viewNum ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            <div className="w-full h-full">
              
              {/* Modern Header */}
              <div className="h-14 bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border-b border-neutral-200 dark:border-neutral-700 flex items-center px-6">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-[#990000] to-[#770000] rounded-lg"></div>
                  <div className="w-20 h-2 bg-neutral-300 dark:bg-neutral-600 rounded-full"></div>
                </div>
                <div className="ml-auto flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="w-8 h-8 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-600 dark:to-neutral-700 rounded-full"></div>
                </div>
              </div>
              
              {/* Content Area */}
              <div className="p-6 bg-neutral-50/30 dark:bg-neutral-900/30 h-full">
                
                {/* Dashboard Analytics View */}
                {viewNum === 1 && (
                  <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { color: "from-blue-500 to-blue-600", height: "h-1" },
                        { color: "from-emerald-500 to-emerald-600", height: "h-1" },
                        { color: "from-amber-500 to-amber-600", height: "h-1" },
                        { color: "from-purple-500 to-purple-600", height: "h-1" }
                      ].map((item, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-700/50">
                          <div className={`w-full ${item.height} bg-gradient-to-r ${item.color} rounded-full mb-3`}></div>
                          <div className="w-12 h-3 bg-neutral-200 dark:bg-neutral-600 rounded-full mb-1"></div>
                          <div className="w-8 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full"></div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Modern Chart */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200/50 dark:border-neutral-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-16 h-3 bg-neutral-200 dark:bg-neutral-600 rounded-full"></div>
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-[#990000] rounded-full"></div>
                          <div className="w-2 h-2 bg-neutral-400 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-end justify-between h-24 space-x-1">
                        {[65, 85, 45, 75, 90, 55, 80, 70, 95, 60, 85, 75].map((height, i) => (
                          <div 
                            key={i} 
                            className="bg-gradient-to-t from-[#990000]/15 to-[#990000]/50 rounded-t-sm flex-1 transition-all duration-300"
                            style={{height: `${height}%`}}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Content Management View */}
                {viewNum === 2 && (
                  <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-700/50 flex items-center space-x-3">
                      <div className="w-4 h-4 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
                      <div className="w-32 h-2 bg-neutral-200 dark:bg-neutral-600 rounded-full"></div>
                    </div>
                    
                    {/* Content List */}
                    {[1,2,3,4].map(i => (
                      <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-700/50">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-600 dark:to-neutral-700 rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="w-3/4 h-3 bg-neutral-200 dark:bg-neutral-600 rounded-full"></div>
                            <div className="w-1/2 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full"></div>
                          </div>
                          <div className="w-6 h-6 bg-[#990000]/10 dark:bg-[#990000]/20 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-[#990000] rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* User Management View */}
                {viewNum === 3 && (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="w-24 h-3 bg-neutral-300 dark:bg-neutral-600 rounded-full"></div>
                      <div className="w-16 h-8 bg-[#990000] rounded-lg"></div>
                    </div>
                    
                    {/* User Cards */}
                    {[1,2,3,4].map(i => (
                      <div key={i} className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200/50 dark:border-neutral-700/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-600 dark:to-neutral-700 rounded-full border-2 border-[#990000]/20"></div>
                            <div className="space-y-1">
                              <div className="w-20 h-3 bg-neutral-200 dark:bg-neutral-600 rounded-full"></div>
                              <div className="w-16 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full"></div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-[#990000] rounded-full"></div>
                            <div className="w-12 h-6 bg-[#990000]/10 dark:bg-[#990000]/20 rounded-full flex items-center justify-center">
                              <div className="w-6 h-2 bg-[#990000] rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Subtle Floating Labels */}
        <div className="absolute top-6 right-6 hidden sm:block">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm text-neutral-600 dark:text-neutral-400 px-3 py-2 rounded-lg text-xs font-medium border border-neutral-200/50 dark:border-neutral-700/50">
            {content.imageOverlays[0]}
          </div>
        </div>

        <div className="absolute bottom-6 left-6 hidden sm:block">
          <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm text-neutral-600 dark:text-neutral-400 px-3 py-2 rounded-lg text-xs font-medium border border-neutral-200/50 dark:border-neutral-700/50">
            {content.imageOverlays[1]}
          </div>
        </div>

        {/* View Indicators */}
        <div className="absolute bottom-4 right-4 flex space-x-2">
          {[1, 2, 3].map((view) => (
            <div
              key={view}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentView === view 
                  ? 'bg-blue-500 w-6' 
                  : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

  if (!isLoaded) {
    return (
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left order-2 lg:order-1">
              <div className="animate-pulse">
                <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-6"></div>
                <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-6"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="h-[280px] sm:h-[320px] md:h-[380px] lg:h-[500px] bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-8 lg:py-18 overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left side - Content */}
            <div className="text-left order-2 lg:order-1">


              {/* Fade In Slide Animation instead of Typewriter */}
              <FadeInSlideText />

              <div className="w-16 h-px bg-[#990000] dark:bg-[#990000] mb-6"></div>

              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 max-w-2xl">
                {content.description}
              </p>

              {/* Statistics */}
              <div className="flex space-x-8 mb-8 text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
                {content.stats.map((stat, index) => (
                  <div key={index} className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                    <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">{stat.value}</span>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons - Now with Square/Rectangular Shape */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={content.ctaLink}>
                  <Button
                    variant="primary"
                    className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white border-0 rounded-none py-3 px-8 text-md font-medium flex items-center justify-center w-full sm:w-auto"
                  >
                    {content.cta}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>

                <Link href={content.secondaryLink}>
                  <Button
                    variant="secondary"
                    className="bg-transparent border border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 text-neutral-800 dark:text-neutral-300 rounded-none py-3 px-8 text-md font-medium w-full"
                  >
                    {content.secondaryCta}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right side - Admin Dashboard Preview */}
            <div className="order-1 lg:order-2">
              <AdminDashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 ">
        <div className="container mx-auto">
          <div className="text-left mb-16">
            <h2 className="text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {locale === 'tr' ? 'Güçlü Özellikler' : 'Powerful Features'}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
              {locale === 'tr' 
                ? 'UNIBOARD ile web uygulamalarınızı yönetmek hiç bu kadar kolay olmamıştı'
                : 'Managing your web applications with UNIBOARD has never been this easy'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-red-200/40 dark:border-red-800/30">
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}