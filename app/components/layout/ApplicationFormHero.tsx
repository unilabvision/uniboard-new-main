'use client';

import React from 'react';
import { Home, ChevronRight, Sparkles, Zap, Shield, Smile } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface ApplicationFormHeroProps {
  title: string;
  description?: string;
  locale: string;
  breadcrumbs?: BreadcrumbItem[];
}

export default function ApplicationFormHero({
  title,
  description,
  locale,
  breadcrumbs,
}: ApplicationFormHeroProps) {
  const homeText = locale === 'tr' ? 'Ana Sayfa' : 'Home';
  const isTr = locale === 'tr';

  const perks = [
    { icon: Zap, label: isTr ? 'Hızlı' : 'Quick' },
    { icon: Shield, label: isTr ? 'Güvenli' : 'Secure' },
    { icon: Smile, label: isTr ? 'Kolay' : 'Easy' },
  ];

  return (
    <section className="relative overflow-hidden bg-[#990000]">
      {/* Dekoratif katmanlar */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden
        className="absolute -top-24 right-[10%] h-80 w-80 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-[5%] h-64 w-64 rounded-full bg-rose-300/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute top-1/2 right-0 h-48 w-48 -translate-y-1/2 translate-x-1/3 rounded-full border border-white/10"
      />
      <div
        aria-hidden
        className="absolute top-8 left-[15%] h-3 w-3 rounded-full bg-white/40 animate-pulse"
      />
      <div
        aria-hidden
        className="absolute top-20 right-[25%] h-2 w-2 rounded-full bg-rose-200/60 animate-pulse"
        style={{ animationDelay: '0.5s' }}
      />
      <div
        aria-hidden
        className="absolute bottom-24 right-[40%] h-2.5 w-2.5 rounded-full bg-white/30 animate-pulse"
        style={{ animationDelay: '1s' }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 md:pt-10 md:pb-24">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-6">
            <div className="flex flex-wrap items-center text-sm text-white/75 gap-1">
              <a
                href={`/${locale}`}
                className="inline-flex items-center hover:text-white transition-colors"
              >
                <Home className="w-4 h-4 mr-1" />
                {homeText}
              </a>
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <span key={item.href} className="inline-flex items-center">
                    <ChevronRight className="w-4 h-4 mx-0.5 opacity-60" />
                    {isLast ? (
                      <span className="text-white font-medium">{item.name}</span>
                    ) : (
                      <a href={item.href} className="hover:text-white transition-colors">
                        {item.name}
                      </a>
                    )}
                  </span>
                );
              })}
            </div>
          </nav>
        )}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              {isTr ? 'MyUNI Başvuru' : 'MyUNI Application'}
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight">
              {title}
            </h1>

            {description && (
              <p className="mt-4 text-base sm:text-lg text-white/85 leading-relaxed max-w-xl">
                {description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 lg:pb-1">
            {perks.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-black/5"
              >
                <Icon className="w-4 h-4 text-rose-100" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dalga geçişi */}
      <div className="absolute bottom-0 left-0 right-0 text-white dark:text-neutral-900 pointer-events-none">
        <svg
          viewBox="0 0 1440 80"
          fill="currentColor"
          className="w-full h-10 md:h-14"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0,40 C360,90 720,0 1080,50 C1260,70 1380,60 1440,45 L1440,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  );
}
