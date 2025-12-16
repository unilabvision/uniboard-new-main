"use client";

import React from 'react';

interface CertificatesLayoutProps {
  children: React.ReactNode;
}

export default function CertificatesLayout({ children }: CertificatesLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {children}
      </div>
    </div>
  );
}
