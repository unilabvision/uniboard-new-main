"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getAlternateLanguagePath } from "@/app/lib/routes";
import { useEffect, useState } from "react";

interface LanguageSwitcherProps {
  mobile?: boolean;
  // Blog post sayfaları için özel props
  blogPostAlternateSlug?: string | null;
  // Course sayfaları için özel props
  courseAlternateSlug?: string | null;
}

// Kurs slug'ları database'den courseAlternateSlug prop'u ile gelir

export default function LanguageSwitcher({ 
  mobile = false, 
  blogPostAlternateSlug,
  courseAlternateSlug
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [targetPath, setTargetPath] = useState('');
  
  // Yolu parçalara ayır
  const segments = pathname.split('/');
  
  // İlk segment dil kodu (tr veya en)
  const currentLocale = segments.length > 1 ? segments[1] : 'tr';
  
  // Hedef dili belirle
  const targetLocale = currentLocale === 'tr' ? 'en' : 'tr';

  useEffect(() => {
    // Blog post sayfası kontrolü
    const isBlogPost = segments.length >= 4 && segments[2] === 'blog' && segments[3];
    
    // Course sayfası kontrolü (TR: kurs, EN: course)
    const isCourseList = (segments.length === 3 && 
      ((currentLocale === 'tr' && segments[2] === 'kurs') || 
       (currentLocale === 'en' && segments[2] === 'course')));
       
    const isCourseDetail = (segments.length >= 4 && 
      ((currentLocale === 'tr' && segments[2] === 'kurs') || 
       (currentLocale === 'en' && segments[2] === 'course')) && segments[3]);

    // Watch sayfası kontrolü (/tr/watch/courseSlug veya /en/watch/courseSlug)
    const isWatchPage = segments.length >= 4 && segments[2] === 'watch' && segments[3];
    
    let calculatedTargetPath = '';
    
    if (isBlogPost && blogPostAlternateSlug) {
      // Blog post sayfası için alternate slug kullan
      calculatedTargetPath = `/${targetLocale}/blog/${blogPostAlternateSlug}`;
    } else if (isBlogPost && !blogPostAlternateSlug) {
      // Alternate slug yoksa blog ana sayfasına yönlendir
      calculatedTargetPath = `/${targetLocale}/blog`;
    } else if (isCourseList) {
      // Kurs listesi sayfası için
      const courseListPath = targetLocale === 'tr' ? 'kurs' : 'course';
      calculatedTargetPath = `/${targetLocale}/${courseListPath}`;
    } else if (isCourseDetail) {
      // Kurs detay sayfası için
      if (courseAlternateSlug) {
        const courseBasePath = targetLocale === 'tr' ? 'kurs' : 'course';
        calculatedTargetPath = `/${targetLocale}/${courseBasePath}/${courseAlternateSlug}`;
      } else {
        // Alternate slug yoksa aynı slug'ı kullan
        const currentSlug = segments[3];
        const courseBasePath = targetLocale === 'tr' ? 'kurs' : 'course';
        calculatedTargetPath = `/${targetLocale}/${courseBasePath}/${currentSlug}`;
      }
    } else if (isWatchPage) {
      // Watch sayfası için
      if (courseAlternateSlug) {
        calculatedTargetPath = `/${targetLocale}/watch/${courseAlternateSlug}`;
      } else {
        // Alternate slug yoksa aynı slug'ı kullan
        const currentSlug = segments[3];
        calculatedTargetPath = `/${targetLocale}/watch/${currentSlug}`;
      }
    } else {
      // Diğer sayfalar için mevcut yöntemi kullan
      calculatedTargetPath = getAlternateLanguagePath(pathname, currentLocale, targetLocale);
    }
    
    setTargetPath(calculatedTargetPath);
  }, [pathname, currentLocale, targetLocale, blogPostAlternateSlug, courseAlternateSlug, segments]);

  // Sayfa yüklendiğinde scroll pozisyonunu kontrol et
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('scrollPosition');
    if (savedScrollPosition) {
      const scrollY = parseInt(savedScrollPosition);
      // Sayfanın tamamen yüklenmesini bekle
      setTimeout(() => {
        window.scrollTo(0, scrollY);
        sessionStorage.removeItem('scrollPosition');
      }, 100);
    }
  }, []);

  const handleLanguageSwitch = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Mevcut scroll pozisyonunu kaydet
    sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    
    // Yeni sayfaya yönlendir
    router.push(targetPath);
  };

  if (!targetPath) {
    // Target path henüz hazır değilse loading göster
    return (
      <span className={`
        text-sm font-medium
        text-neutral-400 dark:text-neutral-500
        ${mobile ? 'py-2' : 'mx-1'}
      `}>
        {currentLocale === 'tr' ? 'EN' : 'TR'}
      </span>
    );
  }

  return (
    <Link
      href={targetPath}
      onClick={handleLanguageSwitch}
      className={`
        text-sm font-medium
        text-neutral-500 dark:text-neutral-400
        hover:text-neutral-900 dark:hover:text-neutral-50
        transition-all duration-300 ease-in-out
        border-b border-transparent hover:border-current
        ${mobile ? 'py-2' : 'mx-1'}
      `}
      aria-label={currentLocale === 'tr' ? "Switch to English" : "Türkçe'ye geç"}
    >
      {currentLocale === 'tr' ? 'EN' : 'TR'}
    </Link>
  );
}