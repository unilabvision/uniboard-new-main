import { Metadata } from 'next';
import Link from 'next/link';

interface NotFoundPageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Metadata generator function
export async function generateMetadata({ params }: NotFoundPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: locale === 'tr' ? '404 - Sayfa Bulunamadı' : '404 - Page Not Found',
    description: locale === 'tr' ? 'Aradığınız sayfa bulunamadı.' : 'The page you are looking for could not be found.'
  };
}

// Viewport export remains the same
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default async function NotFound({ params }: NotFoundPageProps) {
  const { locale } = await params;

  const t = {
    title: locale === 'tr' ? 'Sayfa Bulunamadı' : 'Page Not Found',
    description: locale === 'tr' 
      ? 'Aradığınız sayfa mevcut değil veya kaldırılmış olabilir.'
      : 'The page you are looking for might have been removed or is temporarily unavailable.',
    homeButton: locale === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home',
    blogButton: locale === 'tr' ? 'Blog Sayfasına Git' : 'Go to Blog',
    errorCode: '404'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-900">
      <div className="text-center max-w-lg">
        {/* Logo */}
        
        
        {/* 404 Visual Element */}
        <div className="relative w-full h-40 mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-9xl font-bold text-[#a90013] dark:text-[#fff]">{t.errorCode}</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">
          {t.title}
        </h1>
        <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400 mb-8">
          {t.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link 
            href={`/${locale}`}
            className="bg-[#a90013] hover:bg-[#8a0010] dark:bg-[#a90013] dark:hover:bg-[#8a0010] text-white py-3 px-8 rounded-sm text-md font-medium inline-block transition-colors"
          >
            {t.homeButton}
          </Link>
          <Link 
            href={`/${locale}/blog`}
            className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 py-3 px-8 rounded-sm text-md font-medium inline-block transition-colors"
          >
            {t.blogButton}
          </Link>
        </div>
      </div>
    </div>
  );
}