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

// Custom event interface for sidebar toggle
interface SidebarToggleEvent extends CustomEvent {
  detail: {
    isMinimized: boolean;
  };
}

// Extend the global Window interface to include our custom event
declare global {
  interface WindowEventMap {
    sidebarToggle: SidebarToggleEvent;
  }
}

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useParams();
  const [userModules, setUserModules] = useState<Module[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  
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
  
  // Listen for sidebar minimize state changes
  useEffect(() => {
    const handleSidebarToggle = (event: SidebarToggleEvent) => {
      setIsMinimized(event.detail.isMinimized);
    };

    // Load sidebar state from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem("sidebar-collapsed") === "true";
      setIsMinimized(savedState);
    }

    window.addEventListener('sidebarToggle', handleSidebarToggle);
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 flex">
      {/* Sidebar */}
      <GlobalDashboardSidebar locale={locale as string} modules={userModules} />
      
      {/* Main content with responsive margin based on sidebar state */}
      <div className={`flex-1 transition-all duration-300 ${
        isMinimized ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
