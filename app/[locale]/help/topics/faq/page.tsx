"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import PageLayout from '@/app/components/layout/PageLayout';

// FAQ translations
const content = {
  tr: {
    title: "Sık Sorulan Sorular",
    description: "MyUNI Dashboard hakkında en sık sorulan sorular ve cevapları. Bu panel UNIBOARD altyapısında çalışan MyUNI Dashboard için geliştirilmiştir ve içerikleri, satışları ve diğer eğitim kaynaklarını yönetmenize olanak sağlar.",
    sections: [
      {
        title: "Genel Sorular",
        faqs: [
          {
            question: "MyUNI Dashboard nedir?",
            answer: "MyUNI Dashboard, UNIBOARD altyapısında çalışan ve içerikleri, satışları ve diğer eğitim kaynaklarını yönetmenize olanak sağlayan kapsamlı bir yönetim panelidir."
          },
          {
            question: "MyUNI Dashboard'ı kimler kullanabilir?",
            answer: "MyUNI Dashboard, eğitim içeriklerini ve satışlarını yönetmek isteyen eğitmenler, kurumlar ve içerik üreticileri için tasarlanmıştır."
          },
          {
            question: "MyUNI Dashboard ücretli mi?",
            answer: "MyUNI Dashboard'ın fiyatlandırması kullanım ihtiyaçlarınıza göre değişiklik gösterir. Fiyatlandırma hakkında daha fazla bilgi için bizimle iletişime geçebilirsiniz."
          }
        ]
      },
      {
        title: "Hesap ve Giriş",
        faqs: [
          {
            question: "Şifremi unuttum, ne yapmalıyım?",
            answer: "Giriş sayfasındaki 'Şifremi Unuttum' bağlantısına tıklayabilirsiniz. Size şifre sıfırlama talimatlarını içeren bir e-posta göndereceğiz."
          },
          {
            question: "E-posta adresimi nasıl değiştirebilirim?",
            answer: "Hesap ayarlarınıza giderek e-posta adresinizi güncelleyebilirsiniz. Güvenlik nedeniyle, değişikliği onaylamanız için hem eski hem de yeni e-posta adresinize doğrulama bağlantıları gönderilecektir."
          },
          {
            question: "Hesabımı nasıl silebilirim?",
            answer: "Hesabınızı silmek için, Hesap Ayarları sayfasındaki 'Hesabı Sil' seçeneğini kullanabilirsiniz. Hesabınızı silmeden önce tüm verilerinizi yedeklemenizi öneririz, çünkü bu işlem geri alınamaz."
          }
        ]
      },
      {
        title: "Özellikler ve Kullanım",
        faqs: [
          {
            question: "Notlarımı diğer öğrencilerle paylaşabilir miyim?",
            answer: "Evet, notlarınızı diğer öğrencilerle paylaşabilirsiniz. Not detay sayfasındaki 'Paylaş' düğmesini kullanarak notlarınızı belirli kullanıcılarla veya gruplarla paylaşabilirsiniz."
          },
          {
            question: "MyUNI Dashboard'da nasıl içerik ekleyebilirim?",
            answer: "Dashboard'da 'Yeni İçerik' düğmesine tıklayarak yeni bir içerik oluşturabilirsiniz. Zengin metin düzenleyicimiz, içeriklerinizi biçimlendirmenize ve görsel eklemenize olanak tanır."
          },
          {
            question: "Satışlarımı nasıl takip edebilirim?",
            answer: "MyUNI Dashboard'da 'Satış Raporları' bölümünden tüm satışlarınızı, gelirlerinizi ve müşteri verilerinizi detaylı olarak takip edebilirsiniz."
          }
        ]
      },
      {
        title: "Teknik Sorunlar",
        faqs: [
          {
            question: "MyUNI Dashboard'a erişim sağlayamıyorum, ne yapmalıyım?",
            answer: "Öncelikle internet bağlantınızı kontrol edin. Sorun devam ederse, tarayıcınızın çerezlerini temizlemeyi veya farklı bir tarayıcı kullanmayı deneyin. Hala erişim sağlayamıyorsanız, info@myunilab.net adresinden destek ekibimizle iletişime geçin."
          },
          {
            question: "Verilerim kaydedilmiyor, neden?",
            answer: "Bu genellikle internet bağlantısı sorunlarından veya tarayıcı önbelleği sorunlarından kaynaklanır. İnternet bağlantınızın kararlı olduğundan emin olun ve tarayıcınızı yenileyin. Sorununuz devam ederse, lütfen info@myunilab.net adresinden destek ekibimizle iletişime geçin."
          },
          {
            question: "MyUNI Dashboard mobil uyumlu mu?",
            answer: "Evet, MyUNI Dashboard tüm cihazlarda (masaüstü, tablet ve mobil) sorunsuz çalışacak şekilde tasarlanmıştır."
          }
        ]
      }
    ]
  },
  en: {
    title: "Frequently Asked Questions",
    description: "Most frequently asked questions about MyUNI Dashboard and their answers. This panel is developed for MyUNI Dashboard running on UNIBOARD infrastructure and allows you to manage content, sales, and other educational resources.",
    sections: [
      {
        title: "General Questions",
        faqs: [
          {
            question: "What is MyUNI Dashboard?",
            answer: "MyUNI Dashboard is a comprehensive management panel that runs on UNIBOARD infrastructure, allowing you to manage content, sales, and other educational resources."
          },
          {
            question: "Who can use MyUNI Dashboard?",
            answer: "MyUNI Dashboard is designed for educators, institutions, and content creators who want to manage their educational content and sales."
          },
          {
            question: "Is MyUNI Dashboard free?",
            answer: "MyUNI Dashboard pricing varies depending on your usage needs. Please contact us for more information about pricing."
          }
        ]
      },
      {
        title: "Account and Login",
        faqs: [
          {
            question: "I forgot my password, what should I do?",
            answer: "You can click on the 'Forgot Password' link on the login page. We will send you an email with password reset instructions."
          },
          {
            question: "How can I change my email address?",
            answer: "You can update your email address by going to your account settings. For security reasons, verification links will be sent to both your old and new email addresses to confirm the change."
          },
          {
            question: "How can I delete my account?",
            answer: "To delete your account, you can use the 'Delete Account' option in the Account Settings page. We recommend backing up all your data before deleting your account, as this action is irreversible."
          }
        ]
      },
      {
        title: "Features and Usage",
        faqs: [
          {
            question: "Can I share my notes with other students?",
            answer: "Yes, you can share your notes with other students. You can use the 'Share' button on the note detail page to share your notes with specific users or groups."
          },
          {
            question: "How can I add content on MyUNI Dashboard?",
            answer: "You can create new content by clicking the 'New Content' button in the Dashboard. Our rich text editor allows you to format your content and add visuals."
          },
          {
            question: "How can I track my sales?",
            answer: "In MyUNI Dashboard, you can track all your sales, revenue, and customer data in detail from the 'Sales Reports' section."
          }
        ]
      },
      {
        title: "Technical Issues",
        faqs: [
          {
            question: "I can't access MyUNI Dashboard, what should I do?",
            answer: "First, check your internet connection. If the problem persists, try clearing your browser's cookies or using a different browser. If you still can't access, contact our support team at info@myunilab.net."
          },
          {
            question: "My data isn't saving, why?",
            answer: "This is usually due to internet connection issues or browser cache problems. Make sure your internet connection is stable and refresh your browser. If your issue continues, please contact our support team at info@myunilab.net."
          },
          {
            question: "Is MyUNI Dashboard mobile-friendly?",
            answer: "Yes, MyUNI Dashboard is designed to work seamlessly on all devices (desktop, tablet, and mobile)."
          }
        ]
      }
    ]
  }
};

export default function FAQPage() {
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
      href: `/${currentLocale}/help/topics/faq`
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
              <h2 className="text-2xl font-semibold mb-6">{section.title}</h2>
              
              <div className="space-y-6">
                {section.faqs && section.faqs.map((faq, i) => (
                  <div key={i} className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
                    <h3 className="text-lg font-medium mb-3">{faq.question}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
