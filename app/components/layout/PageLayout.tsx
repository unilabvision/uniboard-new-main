import React, { useMemo } from 'react';
// import Link from 'next/link'; // Removed to fix build error
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  locale: string;
  breadcrumbs?: BreadcrumbItem[];
  variant?: 'default' | 'minimal';
  bgImage?: string; // Added to accept the background image prop
}

export default function PageLayout({
  children,
  title,
  description,
  locale,
  breadcrumbs,
  variant = 'default',
  bgImage
}: PageLayoutProps) {
  
  const homeText = useMemo(() => locale === 'tr' ? 'Ana Sayfa' : 'Home', [locale]);

  // Style for the hero section, applying the background image if it exists
  const heroStyle = bgImage ? {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${bgImage})`,
  } : {};

  // Default gradient if no image is provided
  const headerClasses = bgImage 
    ? "relative bg-cover bg-center bg-no-repeat"
    : "bg-gradient-to-br from-rose-500/5 to-red-500/10 dark:from-rose-900/20 dark:to-red-900/30";


  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Header Section */}
      <div className={`${headerClasses} py-12 lg:py-16`} style={heroStyle}>
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          
          {/* Breadcrumbs */}
          {breadcrumbs && (
            <nav className="mb-6">
              <div className="flex items-center text-sm text-black dark:text-rose-300/80 space-x-1">
                <a href={`/${locale}`} className="hover:text-rose-700 dark:hover:text-rose-200 flex items-center">
                  <Home className="w-4 h-4 mr-1" />
                  {homeText}
                </a>
                {breadcrumbs.map((item, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <div key={index} className="flex items-center">
                      <ChevronRight className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      {isLast ? (
                        <span className="ml-1 text-rose-500 dark:text-rose-100 font-medium">{item.name}</span>
                      ) : (
                        <a href={item.href} className="ml-1 hover:text-white dark:hover:text-rose-200">
                          {item.name}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </nav>
          )}

          {/* Title */}
          <div className="max-w-3xl">
            <h1 className={`text-3xl lg:text-4xl font-medium mb-4 leading-relaxed ${bgImage ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>
              {title}
            </h1>
            
            {description && (
              <p className={`text-lg leading-relaxed font-regular ${bgImage ? 'text-rose-100/90' : 'text-gray-600 dark:text-gray-300'}`}>
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="bg-white dark:bg-neutral-900">
        {children}
      </main>

      {/* Simple Contact Section (conditionally rendered) */}
      {variant === 'default' && (
        <section className="py-12 bg-rose-50/50 dark:bg-gray-800/50 mt-12">
          <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-3">
              {locale === 'tr' ? 'Bizimle İletişime Geçin' : 'Get in Touch'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 font-regular">
              {locale === 'tr' 
                ? 'Sorularınız için bizimle iletişime geçebilirsiniz.'
                : 'Contact us for any questions you may have.'
              }
            </p>
            <a 
              href={`/${locale}/${locale === 'tr' ? 'iletisim' : 'contact'}`}
              className="inline-block px-6 py-2 bg-rose-600 dark:bg-rose-700 text-white rounded-md hover:bg-rose-700 dark:hover:bg-rose-600 transition-colors font-light"
            >
              {locale === 'tr' ? 'İletişim' : 'Contact'}
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
