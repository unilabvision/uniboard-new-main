"use client";

import React, { useEffect, useState } from 'react';
import GlobalDashboardSidebar from '@/app/components/GlobalDashboardSidebar';
import { useParams } from 'next/navigation';

interface Module {
  key: string;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  icon: string;
  category: string;
}


export default function HelpLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useParams();
  const [userModules, setUserModules] = useState<Module[]>([]);
  
  // Mock modules for help section
  useEffect(() => {
    const mockModules = [{
      key: 'help',
      name_tr: 'Yardım',
      name_en: 'Help',
      description_tr: 'Yardım merkezi',
      description_en: 'Help center',
      icon: 'HelpCircle',
      category: 'support'
    }];
    
    setUserModules(mockModules);
  }, []);
  
  
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex">
      <GlobalDashboardSidebar locale={locale as string} modules={userModules} />
      <main className="flex-1 min-w-0 min-h-screen overflow-x-hidden pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
