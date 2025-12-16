//app/components/ConditionalLayout.tsx
'use client';

import { usePathname } from 'next/navigation';
import BackToTop from "./BackToTop";

interface ConditionalLayoutProps {
  children: React.ReactNode;
  locale: string;
}

export default function ConditionalLayout({ children, locale }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  const isAdminPage = 
    pathname?.includes(`/${locale}/dashboard`) ||
    pathname?.includes(`/${locale}/dashboard`) 

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        {children}
      </div>
      {!isAdminPage && <BackToTop />}
    </div>
  );
}