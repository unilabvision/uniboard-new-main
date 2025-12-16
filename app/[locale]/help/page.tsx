"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import PageLayout from '@/app/components/layout/PageLayout';
import Link from 'next/link';

// Help page translations
const helpContent = {
  tr: {
    title: "Yardım Merkezi",
    description: "MyUNI Dashboard'u kullanmak hakkında yardıma mı ihtiyacınız var? Bu panel UNIBOARD altyapısında çalışmaktadır.",
    helpTopics: [
      {
        title: "Başlarken",
        description: "MyUNI Dashboard'a nasıl başlayacağınızı öğrenin",
        link: "/help/topics/getting-started"
      },
      {
        title: "Hesap Yönetimi",
        description: "Hesabınızı nasıl yöneteceğinizi öğrenin",
        link: "/help/topics/account-management"
      },
      {
        title: "Sık Sorulan Sorular",
        description: "En çok sorulan soruların cevaplarını bulun",
        link: "/help/topics/faq"
      }
    ],
    sections: [
      {
        title: "Sık Sorulan Sorular",
        content: "Burada en çok sorulan soruları ve cevaplarını bulabilirsiniz.",
        items: [
          {
            question: "MyUNI Dashboard nedir?",
            answer: "MyUNI Dashboard, UNIBOARD altyapısında çalışan ve içerikleri, satışları ve diğer eğitim kaynaklarını yönetmenize olanak sağlayan kapsamlı bir yönetim panelidir."
          },
          {
            question: "Hesabımı nasıl güncelleyebilirim?",
            answer: "Profil sayfasına giderek kişisel bilgilerinizi ve ayarlarınızı güncelleyebilirsiniz."
          },
          {
            question: "Şifremi unuttum, ne yapmalıyım?",
            answer: "Giriş sayfasındaki 'Şifremi Unuttum' bağlantısını kullanarak şifrenizi sıfırlayabilirsiniz."
          }
        ]
      },
      {
        title: "İletişim",
        content: "Hala yardıma ihtiyacınız varsa, bizimle iletişime geçin:",
        contact: {
          email: "info@myunilab.net",
          phone: "+90 212 123 45 67",
          hours: "Hafta içi 09:00 - 18:00"
        }
      }
    ]
  },
  en: {
    title: "Help Center",
    description: "Need help using MyUNI Dashboard? This panel runs on UNIBOARD infrastructure.",
    helpTopics: [
      {
        title: "Getting Started",
        description: "Learn how to get started with MyUNI Dashboard",
        link: "/help/topics/getting-started"
      },
      {
        title: "Account Management",
        description: "Learn how to manage your account",
        link: "/help/topics/account-management"
      },
      {
        title: "Frequently Asked Questions",
        description: "Find answers to the most common questions",
        link: "/help/topics/faq"
      }
    ],
    sections: [
      {
        title: "Frequently Asked Questions",
        content: "Here you can find the most commonly asked questions and their answers.",
        items: [
          {
            question: "What is MyUNI Dashboard?",
            answer: "MyUNI Dashboard is a comprehensive management panel that runs on UNIBOARD infrastructure, allowing you to manage content, sales, and other educational resources."
          },
          {
            question: "How can I update my account?",
            answer: "You can update your personal information and settings by going to the Profile page."
          },
          {
            question: "I forgot my password, what should I do?",
            answer: "You can reset your password using the 'Forgot Password' link on the login page."
          }
        ]
      },
      {
        title: "Contact",
        content: "If you still need help, contact us:",
        contact: {
          email: "info@myunilab.net",
          phone: "+90 212 123 45 67",
          hours: "Weekdays 09:00 - 18:00"
        }
      }
    ]
  }
};

export default function HelpPage() {
  const { locale } = useParams();
  const currentLocale = locale as string || 'en';
  const content = helpContent[currentLocale as keyof typeof helpContent] || helpContent.en;

  return (
    <PageLayout 
      title={content.title} 
      description={content.description}
      locale={currentLocale}
    >
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Help Topics */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">{currentLocale === 'tr' ? 'Yardım Konuları' : 'Help Topics'}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {content.helpTopics.map((topic, index) => (
                <Link 
                  key={index} 
                  href={`/${currentLocale}${topic.link}`}
                  className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                >
                  <h3 className="text-lg font-medium mb-2 text-[#990000]">{topic.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{topic.description}</p>
                </Link>
              ))}
            </div>
          </div>

          {content.sections.map((section, index) => (
            <div key={index} className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
              <p className="mb-6 text-gray-700 dark:text-gray-300">{section.content}</p>

              {section.items && (
                <div className="grid md:grid-cols-2 gap-6">
                  {section.items.map((item, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 hover:shadow-md transition-shadow">
                      <h3 className="text-lg font-medium mb-2">{item.question}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{item.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.contact && (
                <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 mt-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">Email:</p>
                      <p><a href={`mailto:${section.contact.email}`} className="text-[#990000] hover:underline">{section.contact.email}</a></p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">Phone:</p>
                      <p className="text-neutral-700 dark:text-neutral-300">{section.contact.phone}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">Hours:</p>
                      <p className="text-neutral-700 dark:text-neutral-300">{section.contact.hours}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Quick Help Section */}
          <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700">
                <h3 className="text-xl font-semibold mb-3">{currentLocale === 'tr' ? 'Video Rehberler' : 'Video Guides'}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  {currentLocale === 'tr' 
                    ? 'MyUNI Dashboard kullanımı hakkında detaylı video rehberleri izleyin' 
                    : 'Watch detailed video guides about using MyUNI Dashboard'}
                </p>
                <Link
                  href={`/${currentLocale}/help/videos`}
                  className="inline-block px-6 py-2 bg-[#990000] text-white rounded-md hover:bg-[#800000] transition-colors"
                >
                  {currentLocale === 'tr' ? 'Videolara Göz At' : 'Browse Videos'}
                </Link>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700">
                <h3 className="text-xl font-semibold mb-3">{currentLocale === 'tr' ? 'Yardım Dökümanları' : 'Help Documentation'}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  {currentLocale === 'tr' 
                    ? 'Detaylı kullanım kılavuzlarını ve dokümanları inceleyin' 
                    : 'Browse detailed user guides and documentation'}
                </p>
                <Link
                  href={`/${currentLocale}/help/documentation`}
                  className="inline-block px-6 py-2 bg-[#990000] text-white rounded-md hover:bg-[#800000] transition-colors"
                >
                  {currentLocale === 'tr' ? 'Dokümanlara Göz At' : 'Browse Docs'}
                </Link>
              </div>
              
              <div className="text-center p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700">
                <h3 className="text-xl font-semibold mb-3">{currentLocale === 'tr' ? 'Destek Al' : 'Get Support'}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  {currentLocale === 'tr' 
                    ? 'Sorunlarınız için destek ekibimizle iletişime geçin' 
                    : 'Contact our support team for your issues'}
                </p>
                <Link
                  href={`/${currentLocale}/help/support`}
                  className="inline-block px-6 py-2 bg-[#990000] text-white rounded-md hover:bg-[#800000] transition-colors"
                >
                  {currentLocale === 'tr' ? 'Destek Al' : 'Get Support'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
