'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';
import LanguageSwitcher from '../LanguageSwitcher';

interface HeaderProps {
  primary?: string;
  locale: string;
}

export default function Header({ primary = '#a90013', locale }: HeaderProps) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoSrc, setLogoSrc] = useState('/myuni-logo.png'); // Default logo for SSR

  // Determine if the current path is under /tr/watch/ or /en/watch/
  const isWatchPage = pathname.startsWith(`/${locale}/watch/`);

  // Handle theme detection and logo update
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const isDark =
        savedTheme === 'dark' ||
        (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
      setLogoSrc(isDark ? '/myuni-logo-dark.png' : '/myuni-logo.png');
    }
  }, []);

  // Handle scroll effect with debounce
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsScrolled(window.scrollY > 20), 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  // Check if current page is a blog post and get alternate slug
  

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  // Helper function to update theme and logo
  const updateTheme = (isDark: boolean) => {
    setLogoSrc(isDark ? '/myuni-logo-dark.png' : '/myuni-logo.png');
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 backdrop-blur-md z-50 transition-all duration-300
        ${isScrolled ? 'bg-[#fff] dark:bg-neutral-900/95 shadow-sm py-3' : 'bg-[#fff] dark:bg-neutral-900/80 py-5'} 
        border-b border-neutral-200 dark:border-neutral-800`}
      style={{ '--primary': primary } as React.CSSProperties}
    >
      <div
        className={`mx-auto px-6 sm:px-6 md:px-6 lg:px-6 flex justify-between items-center
          ${isWatchPage ? 'max-w-8xl' : 'max-w-8xl'}`} // Conditionally apply wider max-width
      >
        {/* Logo */}
        <Link href={`/${locale}`} prefetch className="transition-all duration-300 flex items-center">
          <Image
            src={logoSrc}
            alt="UNILAB Vision"
            width={150}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation and Actions */}
        <div className="flex items-center space-x-5">
          <DesktopNav locale={locale} />
          <div className="hidden lg:flex items-center space-x-5">
            <SearchBar locale={locale} />
            <LanguageSwitcher blogPostAlternateSlug={null} />
            <ThemeToggle
              isDarkMode={logoSrc === '/myuni-logo-dark.png'}
              setIsDarkMode={updateTheme}
            />
            
            {/* Auth Section */}
            {isLoaded ? (
              <>
                {isSignedIn ? (
                  <div className="flex items-center justify-center space-x-3">
                    <Link
                      href={`/${locale}/dashboard`}
                      className="bg-[#990000] hover:bg-[#770000] text-white px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md flex items-center"
                    >
                      {locale === 'tr' ? 'Kurslarım' : 'My Courses'}
                    </Link>
                    <div className="flex items-center justify-center">
                      <UserButton
                        appearance={{
                          elements: {
                            avatarBox: "w-8 h-8 flex items-center justify-center",
                            userButtonPopoverCard: "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700",
                            userButtonPopoverActionButton: "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          }
                        }}
                        userProfileProps={{
                          appearance: {
                            elements: {
                              rootBox: "bg-white dark:bg-neutral-900",
                              card: "bg-white dark:bg-neutral-900"
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <Link
                    href={locale === 'tr' ? '/tr/login' : '/en/login'}
                    className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-gray-800 dark:hover:bg-gray-200 border-0 rounded-md flex items-center justify-center"
                  >
                    {locale === 'tr' ? 'Giriş Yap' : 'Sign In'}
                  </Link>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          {/* Mobile Menu */}
          <div className="lg:hidden flex items-center space-x-4">
            <LanguageSwitcher mobile blogPostAlternateSlug={null} />
            <ThemeToggle
              isDarkMode={logoSrc === '/myuni-logo-dark.png'}
              setIsDarkMode={updateTheme}
            />
            
            {/* Mobile Auth */}
            {isLoaded ? (
              isSignedIn && (
                <div className="flex items-center justify-center">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-7 h-7 flex items-center justify-center",
                        userButtonPopoverCard: "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                      }
                    }}
                  />
                </div>
              )
            ) : (
              <div className="flex items-center justify-center">
                <div className="w-7 h-7 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
              </div>
            )}
            
            <button
              className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors duration-200 flex items-center justify-center"
              onClick={toggleMobileMenu}
              aria-label={locale === 'tr' ? 'Menüyü aç/kapat' : 'Toggle menu'}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <MobileNav 
          toggleMobileMenu={toggleMobileMenu} 
          locale={locale} 
        />
      )}
    </header>
  );
}