import React, { useState, useRef, useEffect, useMemo } from "react";
// import Link from "next/link"; // Removed due to build error
// import { useUser } from "@clerk/nextjs"; // Removed due to build error
import { ChevronDown } from "lucide-react";

interface DesktopNavProps {
  locale: string;
}

interface MenuItem {
  href: string;
  label: string;
  children?: MenuItem[];
}

export default function DesktopNav({ locale }: DesktopNavProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const menuItems: Record<string, MenuItem[]> = {
      tr: [
        { href: `/${locale}/`, label: "Ana Sayfa" },
        { href: `/${locale}/kurs`, label: "Kurslar" },
        { 
          href: `/${locale}/hakkimizda`, 
          label: "Hakkımızda",
          children: [
            { href: `/${locale}/hakkimizda/`, label: "Biz Kimiz" },
            { href: `/${locale}/egitmen-ol`, label: "Eğitmen Ol!" },
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
    
    const currentItems = menuItems[locale as keyof typeof menuItems] || menuItems.tr;

   
    return currentItems;
  }, [locale]); // Removed 'isSignedIn' from dependency array

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const handleMouseEnter = (label: string, hasChildren: boolean) => {
    if (hasChildren) {
      setOpenDropdown(label);
    }
  };

  const handleMouseLeave = () => {
    // Small delay to allow moving to dropdown
    setTimeout(() => {
      if (!dropdownRef.current?.matches(':hover')) {
        setOpenDropdown(null);
      }
    }, 100);
  };

  return (
    <div ref={dropdownRef}>
      <nav className="hidden lg:flex items-center space-x-10">
        {items.map((item, index) => (
          <div
            key={index}
            className="relative group"
            onMouseEnter={() => handleMouseEnter(item.label, !!item.children)}
            onMouseLeave={handleMouseLeave}
          >
            {item.children ? (
              <div>
                <button
                  onClick={() => handleDropdownToggle(item.label)}
                  className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors duration-200"
                >
                  {item.label}
                  <ChevronDown 
                    className={`ml-1 h-4 w-4 transition-transform duration-200 ${
                      openDropdown === item.label ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                
                {/* Dropdown Menu */}
                {openDropdown === item.label && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50">
                    {item.children.map((child, childIndex) => (
                      <a
                        key={childIndex}
                        href={child.href}
                        className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <a
                href={item.href}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors duration-200"
              >
                {item.label}
              </a>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}