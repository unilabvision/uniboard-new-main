'use client';

import Link from "next/link";
import MobileSearchBar from './MobileSearchbar';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface MobileNavProps {
  toggleMobileMenu: () => void;
  locale: string;
}

interface MenuItem {
  href: string;
  label: string;
  children?: MenuItem[];
}

export default function MobileNav({ toggleMobileMenu, locale }: MobileNavProps) {
  const { isSignedIn } = useUser();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const menuItems: Record<string, MenuItem[]> = {
    tr: [
      { href: `/${locale}/#`, label: "Ana Sayfa" },
      { href: `/${locale}/kurs`, label: "Kurslar" },
      { 
        href: `/${locale}/hakkimizda`, 
        label: "Hakkımızda",
        children: [
          { href: `/${locale}/hakkimizda/`, label: "Biz Kimiz" },
          { href: `/${locale}/egitmen-ol`, label: "Eğitmen Ol" },
          { href: `/${locale}/bultenimiz`, label: "Bültenimiz" },
          { href: `/${locale}/sartlar-ve-kosullar`, label: "Şartlar ve Koşullar" },
          { href: `/${locale}/gizlilik`, label: "Gizlilik Politikası" },
        ]
      },
      { href: `/${locale}/blog`, label: "Blog" },
      { href: `/${locale}/iletisim`, label: "İletişim" },
    ],
    en: [
      { href: `/${locale}/`, label: "Home" },
      { href: `/${locale}/course`, label: "Courses" },
      { 
        href: `/${locale}/about`, 
        label: "About Us",
        children: [
          { href: `/${locale}/about`, label: "Who We Are" },
          { href: `/${locale}/careers`, label: "Career" },
          { href: `/${locale}/newsletter`, label: "Newsletter" },
          { href: `/${locale}/terms`, label: "Terms and Conditions" },
          { href: `/${locale}/privacy`, label: "Privacy Policy" },
        ]
      },
      { href: `/${locale}/projects`, label: "Projects" },
      { href: `/${locale}/blog`, label: "Blog" },
      { href: `/${locale}/contact`, label: "Contact" },
    ],
  };

  

  const items = menuItems[locale as keyof typeof menuItems] || menuItems.tr;

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <div className="lg:hidden bg-[#fff] min-h-screen dark:bg-neutral-900 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 absolute top-full left-0 right-0 z-40 animate-slideDown shadow-lg">
      <nav className="max-w-6xl mx-auto px-6 py-6 flex flex-col space-y-5">
        {/* Mobile Search Bar */}
        <div className="mb-4">
          <MobileSearchBar locale={locale} />
        </div>

        {/* Menu Items */}
        {items.map((item, index) => (
          <div key={index} className="relative">
            {item.children ? (
              <div>
                <button
                  onClick={() => handleDropdownToggle(item.label)}
                  className="flex items-center justify-between w-full text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors duration-200"
                >
                  <span>{item.label}</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform duration-200 ${
                      openDropdown === item.label ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                
                {/* Dropdown Menu */}
                {openDropdown === item.label && (
                  <div className="mt-3 ml-4 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
                    {item.children.map((child, childIndex) => (
                      <Link
                        key={childIndex}
                        href={child.href}
                        className="block text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors duration-200"
                        onClick={toggleMobileMenu}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                className="text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors duration-200"
                onClick={toggleMobileMenu}
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}

        {/* Giriş Yap Butonu - Sadece giriş yapmamış kullanıcılar için */}
        {!isSignedIn && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href={locale === 'tr' ? '/tr/login' : '/en/login'}
              className="block w-full bg-black dark:bg-white text-white dark:text-black px-4 py-3 text-center text-base font-medium transition-colors duration-200 hover:bg-gray-800 dark:hover:bg-gray-200 border-0 rounded-md"
              onClick={toggleMobileMenu}
            >
              {locale === 'tr' ? 'Giriş Yap' : 'Sign In'}
            </Link>
          </div>
        )}

        {/* Kurslarım Butonu - Sadece giriş yapmış kullanıcılar için */}
        {isSignedIn && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href={`/${locale}/dashboard`}
              className="block w-full bg-[#990000] hover:bg-[#770000] text-white px-4 py-3 text-center text-base font-medium transition-colors duration-200 border-0 rounded-md"
              onClick={toggleMobileMenu}
            >
              {locale === 'tr' ? 'Kurslarım' : 'My Courses'}
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
}