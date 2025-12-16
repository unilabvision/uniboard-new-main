"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import PageLayout from '@/app/components/layout/PageLayout';

// Getting Started translations
const content = {
  tr: {
    title: "Başlarken",
    description: "MyUNI Dashboard'a hoş geldiniz! İşte başlamanıza yardımcı olacak temel bilgiler. Bu panel UNIBOARD altyapısında çalışan MyUNI Dashboard için geliştirilmiştir ve içerikleri, satışları ve diğer eğitim kaynaklarını yönetmenize olanak sağlar.",
    sections: [
      {
        title: "Hesap Oluşturma",
        content: "MyUNI Dashboard'ı kullanmaya başlamak için önce bir hesap oluşturmanız gerekiyor.",
        steps: [
          "Ana sayfada 'Kayıt Ol' butonuna tıklayın.",
          "E-posta adresinizi, adınızı ve şifrenizi girin.",
          "Hesabınızı doğrulamak için e-postanıza gelen bağlantıya tıklayın.",
          "Profilinizi tamamlayın ve tercihlerinizi ayarlayın."
        ]
      },
      {
        title: "Paneli Keşfetme",
        content: "MyUNI Dashboard paneli, tüm özelliklerimize kolay erişim sağlar.",
        features: [
          {
            name: "Dashboard",
            description: "Genel bakış ve hızlı erişim için ana sayfa."
          },
          {
            name: "Modüller",
            description: "Farklı araçlar ve özelliklere erişin."
          },
          {
            name: "Profil",
            description: "Kişisel bilgilerinizi güncelleyin."
          },
          {
            name: "Ayarlar",
            description: "Hesap ayarlarınızı özelleştirin."
          }
        ]
      }
    ]
  },
  en: {
    title: "Getting Started",
    description: "Welcome to MyUNI Dashboard! Here's the essential information to help you get started. This panel is developed for MyUNI Dashboard running on UNIBOARD infrastructure and allows you to manage content, sales, and other educational resources.",
    sections: [
      {
        title: "Creating an Account",
        content: "To start using MyUNI Dashboard, you first need to create an account.",
        steps: [
          "Click the 'Sign Up' button on the home page.",
          "Enter your email address, name, and password.",
          "Click on the verification link sent to your email to confirm your account.",
          "Complete your profile and set your preferences."
        ]
      },
      {
        title: "Exploring the Dashboard",
        content: "The MyUNI Dashboard provides easy access to all our features.",
        features: [
          {
            name: "Dashboard",
            description: "Home page for overview and quick access."
          },
          {
            name: "Modules",
            description: "Access different tools and features."
          },
          {
            name: "Profile",
            description: "Update your personal information."
          },
          {
            name: "Settings",
            description: "Customize your account settings."
          }
        ]
      }
    ]
  }
};

export default function GettingStartedPage() {
  const { locale } = useParams();
  const currentLocale = locale as string || 'en';
  const helpContent = content[currentLocale as keyof typeof content] || content.en;

  // Construct breadcrumbs
  const breadcrumbs = [
    {
      name: currentLocale === 'tr' ? 'Yardım' : 'Help',
      href: `/${currentLocale}/help`
    },
    {
      name: helpContent.title,
      href: `/${currentLocale}/help/topics/getting-started`
    }
  ];

  return (
    <PageLayout 
      title={helpContent.title}
      description={helpContent.description}
      locale={currentLocale}
      breadcrumbs={breadcrumbs}
    >
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          {helpContent.sections.map((section, index) => (
            <div key={index} className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
              <p className="mb-6 text-gray-700 dark:text-gray-300">{section.content}</p>

              {section.steps && (
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 mb-6">
                  <h3 className="text-lg font-medium mb-4">{currentLocale === 'tr' ? 'Adımlar:' : 'Steps:'}</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    {section.steps.map((step, i) => (
                      <li key={i} className="pl-2">{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {section.features && (
                <div className="grid md:grid-cols-2 gap-6">
                  {section.features.map((feature, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-medium mb-2">{feature.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
