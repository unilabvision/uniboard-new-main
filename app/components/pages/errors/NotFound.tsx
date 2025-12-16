// app/components/pages/errors/NotFound.tsx
import React from 'react';
import Link from 'next/link';

interface NotFoundProps {
  locale: string;
}

const NotFound: React.FC<NotFoundProps> = ({ locale }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-neutral-800 dark:text-neutral-200">404</h1>
        <h2 className="mt-4 text-3xl font-medium text-neutral-700 dark:text-neutral-300">
          {locale === 'tr' ? 'Sayfa Bulunamadı' : 'Page Not Found'}
        </h2>
        <p className="mt-6 text-neutral-600 dark:text-neutral-400">
          {locale === 'tr' 
            ? 'Aradığınız sayfa mevcut değil veya kaldırılmış olabilir.' 
            : 'The page you are looking for might have been removed or is temporarily unavailable.'}
        </p>
        <div className="mt-10">
          <Link 
            href={`/${locale}`} 
            className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white py-3 px-8 rounded-sm text-md font-medium inline-block"
          >
            {locale === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;