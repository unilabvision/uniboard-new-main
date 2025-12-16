// app/lib/routes.ts

// Her sayfa için çeviriler
// app/lib/routes.ts - Kontrol edilmesi gereken dosya
export const pageRoutes = {
  about: {
    tr: 'hakkimizda',
    en: 'about'
  },
  kurs: {
    tr: 'kurs',
    en: 'course'
  },
  projects: {
    tr: 'projelerimiz', 
    en: 'projects'
  },
  courses: {
    tr: 'kurs',
    en: 'course'
  },
  blog: {
    tr: 'blog',
    en: 'blog'
  },
  careers: {
    tr: 'kariyer',
    en: 'career'
  },
  contact: {
    tr: 'iletisim',
    en: 'contact'
  },
  terms: {
    tr: 'sartlar-ve-kosullar',
    en: 'terms'
  },
  privacy: {
    tr: 'gizlilik',
    en: 'privacy'
  },
  newsletter: {
    tr: 'bultenimiz',
    en: 'newsletter'
  },
  egitmen: {
    tr: 'egitmen-ol',
    en: 'egitmen-ol'
  }
};


// URL'den sayfa adını almak için (örn: /tr/hakkimizda -> about)
export function getPageFromSlug(locale: string, slug: string): string | null {
  for (const [page, translations] of Object.entries(pageRoutes)) {
    if (translations[locale as keyof typeof translations] === slug) {
      return page;
    }
  }
  return null;
}

// Alternatif dil URL'si oluşturmak için (örn: /tr/hakkimizda -> /en/about)
export function getAlternateLanguagePath(currentPath: string, currentLocale: string, targetLocale: string): string {
  // Yolu parçalara ayırıyoruz (örn: /tr/hakkimizda -> ['', 'tr', 'hakkimizda'])
  const pathParts = currentPath.split('/');
  
  // Eğer path geçerli bir format değilse ana sayfaya yönlendir
  if (pathParts.length < 3) {
    return `/${targetLocale}`;
  }
  
  const currentSlug = pathParts[2];
  
  
  // Geçerli slug'dan sayfa adını bul
  const pageName = getPageFromSlug(currentLocale, currentSlug);
  
  // Sayfa adı bulunamadıysa, orijinal slug'ı kullan
  if (!pageName) {
    return `/${targetLocale}/${currentSlug}`;
  }
  
  // Hedef dilde karşılık gelen slug'ı bul
  const targetSlug = pageRoutes[pageName as keyof typeof pageRoutes]?.[targetLocale as 'tr' | 'en'] || currentSlug;
  
  // Alt sayfaları da dahil ederek yeni URL oluştur
  const restOfPath = pathParts.slice(3).join('/');
  return `/${targetLocale}/${targetSlug}${restOfPath ? `/${restOfPath}` : ''}`;
}