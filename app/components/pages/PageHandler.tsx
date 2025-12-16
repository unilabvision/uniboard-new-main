// app/components/pages/PageHandler.tsx
import { pageRoutes } from '@/app/lib/routes';
import PageLayout from '@/app/components/layout/PageLayout';
import NotFound from '@/app/components/pages/errors/NotFound';

// İçerik sayfaları
import TermsPage from './terms/TermsPage';
import PrivacyPage from './privacy/PrivacyPage';
import ContactPage from './contact/ContactPage';

// İçerik türleri
import { ContactContent } from './contact/content';
import { default as contactContentModule } from './contact/content';

// Desteklenen diller ve sayfalar için tip tanımları
type SupportedLocale = 'tr' | 'en';
type PageType = 'about' | 'projects' | 'blog' | 'services' | 'careers' | 'contact' | 'terms' | 'privacy' | 'newsletter' | 'egitmen' | 'not-found';

// Generic content interface to avoid using `any`
interface PageContent {
  title: string;
  description: string;
}

// Sayfa içerik API'si - jenerik tip kullanarak her sayfa için doğru içerik tipini döndür
async function getPageContent<T extends PageContent>(locale: string, page: PageType): Promise<T | null> {
  try {
    if (locale !== 'tr' && locale !== 'en') {
      return null;
    }
    
    const localeKey = locale as SupportedLocale;
    
    switch(page) {
      case 'contact':
        return contactContentModule[localeKey] as unknown as T;
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error loading content for page "${page}" in "${locale}" locale:`, error);
    return null;
  }
}

interface PageHandlerProps {
  pageType: string;
  locale: string;
}

export default async function PageHandler({ pageType, locale }: PageHandlerProps) {
  // Geçerli bir sayfa türü olup olmadığını kontrol et - egitmen eklendi
  const validPageType = ['about', 'projects', 'blog', 'services', 'careers', 'contact', 'terms', 'privacy', 'newsletter', 'egitmen'].includes(pageType) 
    ? pageType as PageType 
    : 'not-found';
  
  // Her sayfa için kendi içerik tipini kullanarak verileri al
  let content: PageContent | null = null;
  let pageContent: React.ReactNode = null;
  
   if (validPageType === 'terms') {
    // Terms page doesn't need content loading
    pageContent = <TermsPage locale={locale} />;
    // Terms için varsayılan content oluştur
    content = {
      title: locale === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service',
      description: locale === 'tr' 
        ? 'MyUNI hizmetlerinin kullanım koşulları ve şartları.'
        : 'Terms and conditions for using MyUNI services.'
    };
  } else if (validPageType === 'privacy') {
    // Privacy page doesn't need content loading
    pageContent = <PrivacyPage locale={locale} />;
    // Privacy için varsayılan content oluştur
    content = {
      title: locale === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy',
      description: locale === 'tr' 
        ? 'Kişisel verilerinizin korunması ve gizlilik politikamız.'
        : 'Our privacy policy and protection of your personal data.'
    };
  } else if (validPageType === 'contact') {
    const contactContent = await getPageContent<ContactContent>(locale, validPageType);
    if (contactContent) {
      content = contactContent;
    }
    // ContactPage sadece locale prop'unu alır
    pageContent = <ContactPage locale={locale} />;
    
    // Eğer content yüklenemezse varsayılan content oluştur
    if (!content) {
      content = {
        title: locale === 'tr' ? 'İletişim' : 'Contact',
        description: locale === 'tr' 
          ? 'Bizimle iletişime geçin.'
          : 'Get in touch with us.'
      };
    }
  }
  
  // İçerik bulunamazsa veya sayfa içeriği tanımlı değilse, NotFound bileşenini göster
  if (!pageContent) {
    return <NotFound locale={locale} />;
  }
  
  // Breadcrumbs için sayfa adını al
  let pageName = pageType;
  if (validPageType !== 'not-found' && locale in pageRoutes[validPageType as keyof typeof pageRoutes]) {
    pageName = pageRoutes[validPageType as keyof typeof pageRoutes][locale as 'tr' | 'en'];
  }
  
  // Content yoksa varsayılan içerik
  const defaultContent: PageContent = content || {
    title: locale === 'tr' ? 'Sayfa Bulunamadı' : 'Page Not Found',
    description: locale === 'tr' ? 'Aradığınız sayfa bulunamadı.' : 'The page you are looking for could not be found.',
  };
  
  const breadcrumbs = [
    {
      name: defaultContent.title,
      href: `/${locale}/${pageName}`
    }
  ];

  return (
    <PageLayout 
      title={defaultContent.title} 
      description={defaultContent.description} 
      locale={locale}
      breadcrumbs={breadcrumbs}
    >
      {/* Sayfa içeriğini göster */}
      {pageContent}
      
      {/* Henüz bileşeni eklenmemiş sayfalar için geçici içerik */}
      {!pageContent && validPageType !== 'not-found' && (
        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-2xl font-medium mb-6">{defaultContent.title}</h2>
          <p className="mb-8">{defaultContent.description}</p>
          <p className="text-neutral-500">Bu sayfa yapım aşamasındadır - {pageType} / {locale}</p>
        </div>
      )}
    </PageLayout>
  );
}