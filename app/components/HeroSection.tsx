// components/CTASection.tsx
'use client';

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Clock, Users } from "lucide-react";

interface CTASectionProps {
  locale?: string;
}

const CTASection: React.FC<CTASectionProps> = ({ locale = 'tr' }) => {
  const content = {
    tr: {
      badge: "🚀 Hemen Başla",
      title: "Kariyerinizde yeni bir sayfa açmaya hazır mısınız?",
      description: "MyUNI ile binlerce öğrencinin katıldığı eğitim devrimine siz de katılın. İlk adımı atın, geleceğinizi şekillendirin.",
      stats: [
        { number: "50K+", label: "Aktif Öğrenci", icon: Users },
        { number: "24/7", label: "Destek", icon: Clock },
        { number: "500+", label: "Uzman Eğitmen", icon: Sparkles }
      ],
      cta: {
        primary: "Ücretsiz Denemeye Başla",
        primaryLink: "/tr/ucretsiz-deneme",
        secondary: "Kursları İncele",
        secondaryLink: "/tr/kurslar"
      },
      features: [
        "Kredi kartı bilgisi gerekmez",
        "7 gün ücretsiz erişim",
        "İstediğiniz zaman iptal edebilirsiniz"
      ]
    },
    en: {
      badge: "🚀 Get Started",
      title: "Ready to open a new page in your career?",
      description: "Join the education revolution that thousands of students have joined with MyUNI. Take the first step, shape your future.",
      stats: [
        { number: "50K+", label: "Active Students", icon: Users },
        { number: "24/7", label: "Support", icon: Clock },
        { number: "500+", label: "Expert Instructors", icon: Sparkles }
      ],
      cta: {
        primary: "Start Free Trial",
        primaryLink: "/en/free-trial",
        secondary: "Explore Courses",
        secondaryLink: "/en/courses"
      },
      features: [
        "No credit card required",
        "7 days free access",
        "Cancel anytime"
      ]
    }
  };

  const currentContent = content[locale as keyof typeof content] || content.tr;

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-br from-[#990000] via-[#cc0000] to-[#990000] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border border-white rounded-full" />
        <div className="absolute top-32 right-20 w-16 h-16 border border-white rounded-full" />
        <div className="absolute bottom-20 left-32 w-12 h-12 border border-white rounded-full" />
        <div className="absolute bottom-32 right-10 w-24 h-24 border border-white rounded-full" />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="text-center text-white">
          {/* Badge */}
          <div className="bg-white/20 backdrop-blur-sm text-white text-sm px-4 py-2 mb-8 border border-white/30 rounded-full shadow-sm inline-block">
            {currentContent.badge}
          </div>

          {/* Title */}
          <h2 className="text-3xl lg:text-5xl font-medium leading-tight mb-6 max-w-4xl mx-auto">
            {currentContent.title}
          </h2>

          {/* Description */}
          <p className="text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto mb-12">
            {currentContent.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-2xl mx-auto">
            {currentContent.stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg mb-3">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl lg:text-3xl font-bold text-white mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-white/80">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href={currentContent.cta.primaryLink} className="inline-block">
              <button className="bg-white hover:bg-neutral-50 text-[#990000] px-8 py-4 text-lg font-semibold transition-all duration-300 focus:outline-none rounded-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2 min-w-[200px]">
                {currentContent.cta.primary}
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            
            <Link href={currentContent.cta.secondaryLink} className="inline-block">
              <button className="bg-transparent hover:bg-white/10 text-white border-2 border-white/50 hover:border-white px-8 py-4 text-lg font-semibold transition-all duration-300 focus:outline-none rounded-lg flex items-center justify-center gap-2 min-w-[200px]">
                {currentContent.cta.secondary}
              </button>
            </Link>
          </div>

          {/* Features */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm text-white/80">
            {currentContent.features.map((feature, index) => (
              <div key={index} className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;