import type { Metadata } from "next";
import { Arimo, Syne } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import ConditionalLayout from "../components/ConditionalLayout";
import "../globals.css";
import Script from "next/script";

// Font definitions
const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

// Helper function to get page type from URL
function getPageTypeFromUrl(url: string, locale: string): {
  pageType: string;
  title: string;
  description: string;
  canonical: string;
} {
  const baseUrl = 'https://myunilab.net';
  
  // Remove locale from URL to get clean path
  const cleanPath = url.replace(`/${locale}`, '') || '/';
  const fullCanonical = `${baseUrl}/${locale}${cleanPath === '/' ? '' : cleanPath}`;
  
  // Page type detection
  if (cleanPath === '/') {
    return {
      pageType: 'homepage',
      title: locale === 'tr'
        ? "MyUNI | Yapay Zeka Destekli Eğitim Platformu - Kariyerine Yön Ver"
        : "MyUNI | AI-Powered Learning Platform - Shape Your Career",
      description: locale === 'tr'
        ? "MyUNI ile kariyerinize yön verin ve gerçek potansiyelinizi keşfedin! Yapay zeka desteği ile kişiselleştirilmiş öğrenme deneyimi. Esnek eğitim seçenekleri ve uzman eğitmenlerle becerilerinizi geliştirin."
        : "Shape your career and discover your true potential with MyUNI! AI-powered personalized learning experience. Develop your skills with flexible education options and expert instructors.",
      canonical: fullCanonical
    };
  }
  
  if (cleanPath.startsWith('/kurs') || cleanPath.startsWith('/course')) {
    // Course pages
    if (cleanPath === '/kurs' || cleanPath === '/course') {
      // Course listing page
      return {
        pageType: 'course-listing',
        title: locale === 'tr'
          ? "Kurslar | MyUNI - Yapay Zeka Destekli Eğitim Platformu"
          : "Courses | MyUNI - AI-Powered Learning Platform",
        description: locale === 'tr'
          ? "MyUNI'de uzman eğitmenler tarafından hazırlanmış kursları keşfedin. Online, canlı ve hibrit eğitim seçenekleri ile kariyerinizi ilerletin."
          : "Discover courses prepared by expert instructors at MyUNI. Advance your career with online, live and hybrid education options.",
        canonical: fullCanonical
      };
    } else {
      // Individual course page
      const courseSlug = cleanPath.split('/').pop() || '';
      return {
        pageType: 'course-detail',
        title: locale === 'tr'
          ? `${courseSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Kursu | MyUNI`
          : `${courseSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Course | MyUNI`,
        description: locale === 'tr'
          ? `${courseSlug.replace(/-/g, ' ')} kursu ile becerilerinizi geliştirin. MyUNI'de uzman eğitmenlerle interaktif öğrenme deneyimi yaşayın.`
          : `Develop your skills with ${courseSlug.replace(/-/g, ' ')} course. Experience interactive learning with expert instructors at MyUNI.`,
        canonical: fullCanonical
      };
    }
  }
  
  if (cleanPath.startsWith('/blog')) {
    if (cleanPath === '/blog') {
      return {
        pageType: 'blog-listing',
        title: locale === 'tr'
          ? "Blog | MyUNI - Eğitim ve Teknoloji Haberleri"
          : "Blog | MyUNI - Education and Technology News",
        description: locale === 'tr'
          ? "MyUNI blog'da eğitim teknolojileri, kariyer ipuçları ve sektör trendleri hakkında güncel içerikleri okuyun."
          : "Read current content about educational technologies, career tips and industry trends on the MyUNI blog.",
        canonical: fullCanonical
      };
    } else {
      const blogSlug = cleanPath.split('/').pop() || '';
      return {
        pageType: 'blog-detail',
        title: locale === 'tr'
          ? `${blogSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} | MyUNI Blog`
          : `${blogSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} | MyUNI Blog`,
        description: locale === 'tr'
          ? `${blogSlug.replace(/-/g, ' ')} hakkında detaylı bilgi için MyUNI blog'u okuyun.`
          : `Read MyUNI blog for detailed information about ${blogSlug.replace(/-/g, ' ')}.`,
        canonical: fullCanonical
      };
    }
  }
  
  if (cleanPath.startsWith('/hakkimizda') || cleanPath.startsWith('/about')) {
    return {
      pageType: 'about',
      title: locale === 'tr'
        ? "Hakkımızda | MyUNI - Yapay Zeka Destekli Eğitim Platformu"
        : "About Us | MyUNI - AI-Powered Learning Platform",
      description: locale === 'tr'
        ? "MyUNI'nin hikayesini, misyonunu ve vizyonunu öğrenin. Yapay zeka destekli eğitim platformumuzla tanışın."
        : "Learn about MyUNI's story, mission and vision. Get to know our AI-powered education platform.",
      canonical: fullCanonical
    };
  }
  
  if (cleanPath.startsWith('/iletisim') || cleanPath.startsWith('/contact')) {
    return {
      pageType: 'contact',
      title: locale === 'tr'
        ? "İletişim | MyUNI - Yapay Zeka Destekli Eğitim Platformu"
        : "Contact | MyUNI - AI-Powered Learning Platform",
      description: locale === 'tr'
        ? "MyUNI ile iletişime geçin. Sorularınız için bizimle temasa geçin ve destek alın."
        : "Contact MyUNI. Get in touch with us for your questions and get support.",
      canonical: fullCanonical
    };
  }
  
  // Default case for other pages
  return {
    pageType: 'general',
    title: locale === 'tr'
      ? "MyUNI | Yapay Zeka Destekli Eğitim Platformu"
      : "MyUNI | AI-Powered Learning Platform",
    description: locale === 'tr'
      ? "MyUNI ile kariyerinize yön verin ve gerçek potansiyelinizi keşfedin!"
      : "Shape your career and discover your true potential with MyUNI!",
    canonical: fullCanonical
  };
}

// Generate metadata function
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; [key: string]: string | string[] }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'tr';
  
  // Construct current URL from params
  const pathSegments = Object.entries(resolvedParams)
    .filter(([key]) => key !== 'locale')
    .map(([, value]) => Array.isArray(value) ? value.join('/') : value)
    .filter(Boolean);
  
  const currentPath = pathSegments.length > 0 ? `/${pathSegments.join('/')}` : '/';
  
  const pageInfo = getPageTypeFromUrl(currentPath, locale);
  const trPath = `https://myunilab.net/tr${currentPath === '/' ? '' : currentPath.replace(/\/(course|kurs)/, locale === 'tr' ? '/kurs' : '/course')}`;
  const enPath = `https://myunilab.net/en${currentPath === '/' ? '' : currentPath.replace(/\/(course|kurs)/, locale === 'tr' ? '/kurs' : '/course')}`;

  return {
    title: pageInfo.title,
    description: pageInfo.description,
    keywords: locale === 'tr'
      ? [
          "MyUNI",
          "yapay zeka eğitim",
          "online eğitim platformu",
          "kariyer geliştirme",
          "kişiselleştirilmiş öğrenme",
          "esnek eğitim",
          "beceri geliştirme",
          "uzaktan eğitim",
          ...(pageInfo.pageType === 'course-listing' || pageInfo.pageType === 'course-detail' 
            ? ["kurslar", "eğitim", "sertifika", "online kurs"] 
            : []),
          ...(pageInfo.pageType === 'blog-listing' || pageInfo.pageType === 'blog-detail' 
            ? ["blog", "eğitim haberleri", "teknoloji", "kariyer ipuçları"] 
            : [])
        ]
      : [
          "MyUNI",
          "AI education",
          "online learning platform",
          "career development",
          "personalized learning",
          "flexible education",
          "skill development",
          "remote learning",
          ...(pageInfo.pageType === 'course-listing' || pageInfo.pageType === 'course-detail' 
            ? ["courses", "education", "certificate", "online course"] 
            : []),
          ...(pageInfo.pageType === 'blog-listing' || pageInfo.pageType === 'blog-detail' 
            ? ["blog", "education news", "technology", "career tips"] 
            : [])
        ],
    authors: [{ name: "MyUNI Eğitim Platformu" }],
    robots: "index, follow",
    alternates: {
      canonical: pageInfo.canonical,
      languages: {
        'tr': trPath,
        'en': enPath,
      },
    },
    openGraph: {
      title: pageInfo.title,
      description: pageInfo.description,
      url: pageInfo.canonical,
      siteName: "MyUNI Eğitim Platformu",
      images: [
        {
          url: "https://myunilab.net/og-image.jpg",
          width: 1200,
          height: 630,
          alt: locale === 'tr' ? "MyUNI Eğitim Platformu Görseli" : "MyUNI Learning Platform Image",
        },
      ],
      locale: locale === 'tr' ? "tr_TR" : "en_US",
      type: pageInfo.pageType === 'blog-detail' ? "article" : "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageInfo.title,
      description: pageInfo.description,
      images: ["https://myunilab.net/twitter-image.jpg"],
    },
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": pageInfo.pageType === 'course-listing' || pageInfo.pageType === 'course-detail' 
          ? "Course" 
          : pageInfo.pageType === 'blog-detail' 
            ? "Article" 
            : "EducationalOrganization",
        name: pageInfo.pageType === 'course-detail' 
          ? pageInfo.title.split(' | ')[0] 
          : "MyUNI Eğitim Platformu",
        alternateName: "MyUNI",
        url: pageInfo.canonical,
        logo: "https://myunilab.net/logo.png",
        description: pageInfo.description,
        ...(pageInfo.pageType === 'course-listing' || pageInfo.pageType === 'course-detail' ? {
          provider: {
            "@type": "EducationalOrganization",
            name: "MyUNI",
            url: "https://myunilab.net"
          },
          educationalLevel: "all-levels",
          teaches: locale === 'tr' ? "Teknoloji ve İş Becerileri" : "Technology and Business Skills"
        } : {
          sameAs: [
            "https://x.com/myuniturkiye",
            "https://linkedin.com/company/myuniturkiye",
            "https://instagram.com/myuniturkiye",
            "https://youtube.com/@myuniturkiye"
          ],
          educationalCredentialAwarded: locale === 'tr' ? "Sertifika" : "Certificate",
          hasCredential: {
            "@type": "EducationalOccupationalCredential",
            name: locale === 'tr' ? "MyUNI Tamamlama Sertifikası" : "MyUNI Completion Certificate"
          }
        }),
        ...(pageInfo.pageType === 'blog-detail' ? {
          author: {
            "@type": "Organization",
            name: "MyUNI"
          },
          publisher: {
            "@type": "Organization",
            name: "MyUNI",
            logo: {
              "@type": "ImageObject",
              url: "https://myunilab.net/logo.png"
            }
          },
          datePublished: new Date().toISOString(),
          dateModified: new Date().toISOString()
        } : {})
      }),
    },
  };
}

// Viewport export
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Static parameters
export function generateStaticParams() {
  return [
    { locale: 'tr' },
    { locale: 'en' },
  ];
}

// Layout component
export default async function LocaleLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode; 
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'tr';
  
  return (
    <html lang={locale} dir="ltr" className={`${arimo.variable} ${syne.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://clerk.com" />
        
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-W94586N6');
          `}
        </Script>
        
        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "olp6bbrkve");
          `}
        </Script>

        {/* Additional meta tags for education platform */}
        <meta name="theme-color" content="#1f2937" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Educational platform specific tags */}
        <meta property="educational:type" content="online-learning" />
        <meta property="educational:level" content="all-levels" />
        <meta property="educational:subject" content="technology,business,design,development" />
      </head>
      <body className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-W94586N6"
            height="0" 
            width="0" 
            style={{display: 'none', visibility: 'hidden'}}
          ></iframe>
        </noscript>
        
        <ClerkProvider
          afterSignOutUrl={`/${locale}`}
          appearance={{
            variables: {
              colorPrimary: '#3b82f6', // Educational blue theme
              colorBackground: '#ffffff',
              colorText: '#1f2937',
              colorInputBackground: '#ffffff',
              colorInputText: '#1f2937',
              borderRadius: '0.5rem', // Slightly more rounded for modern feel
            },
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200',
              card: 'shadow-xl border border-neutral-200 backdrop-blur-sm',
              headerTitle: 'text-neutral-900 font-bold text-xl',
              headerSubtitle: 'text-neutral-600',
              socialButtonsBlockButton: 'border border-neutral-300 hover:bg-neutral-50 transition-colors duration-200',
              formFieldInput: 'border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200',
              footerActionLink: 'text-blue-600 hover:text-blue-700 transition-colors duration-200',
              dividerLine: 'bg-neutral-200',
              dividerText: 'text-neutral-500',
            }
          }}
        >
          <ConditionalLayout locale={locale}>
            {children}
          </ConditionalLayout>
        </ClerkProvider>
      </body>
    </html>
  );
}