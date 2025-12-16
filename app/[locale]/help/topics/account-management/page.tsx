"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import PageLayout from '@/app/components/layout/PageLayout';

// Account Management translations
const content = {
  tr: {
    title: "Hesap Yönetimi",
    description: "MyUNI Dashboard hesabınızı nasıl yöneteceğiniz hakkında bilgiler. Bu panel UNIBOARD altyapısında çalışan MyUNI Dashboard için geliştirilmiştir ve içerikleri, satışları ve diğer eğitim kaynaklarını yönetmenize olanak sağlar.",
    sections: [
      {
        title: "Profil Bilgilerini Güncelleme",
        content: "Kişisel bilgilerinizi güncel tutmak için profilinizi düzenleyebilirsiniz.",
        steps: [
          "Sağ üst köşedeki profil simgenize tıklayın.",
          "'Profil' seçeneğini seçin.",
          "Değiştirmek istediğiniz bilgileri güncelleyin.",
          "'Değişiklikleri Kaydet' düğmesine tıklayın."
        ]
      },
      {
        title: "Şifre Değiştirme",
        content: "Güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi öneririz.",
        steps: [
          "Profil sayfanıza gidin.",
          "'Güvenlik' sekmesine tıklayın.",
          "Mevcut şifrenizi ve yeni şifrenizi girin.",
          "'Şifreyi Güncelle' düğmesine tıklayın."
        ]
      },
      {
        title: "Bildirim Ayarları",
        content: "Hangi bildirimler alacağınızı özelleştirebilirsiniz.",
        features: [
          {
            name: "E-posta Bildirimleri",
            description: "Önemli güncellemeler ve etkinlikler hakkında e-posta alın."
          },
          {
            name: "Uygulama İçi Bildirimler",
            description: "Platform içindeki etkinlikler hakkında anlık bildirimler alın."
          },
          {
            name: "SMS Bildirimleri",
            description: "Kritik bildirimler için telefon numaranıza SMS alın."
          }
        ]
      },
      {
        title: "Hesap Silme",
        content: "Hesabınızı kalıcı olarak silmek isterseniz, bu işlemi güvenli bir şekilde gerçekleştirebilirsiniz.",
        steps: [
          "Profil sayfanıza gidin.",
          "'Hesap Ayarları' sekmesine tıklayın.",
          "Sayfanın alt kısmındaki 'Hesabı Sil' seçeneğine tıklayın.",
          "İşlemi onaylamak için şifrenizi girin ve 'Hesabı Kalıcı Olarak Sil' düğmesine tıklayın."
        ]
      }
    ]
  },
  en: {
    title: "Account Management",
    description: "Information about how to manage your MyUNI Dashboard account. This panel is developed for MyUNI Dashboard running on UNIBOARD infrastructure and allows you to manage content, sales, and other educational resources.",
    sections: [
      {
        title: "Updating Profile Information",
        content: "You can edit your profile to keep your personal information up to date.",
        steps: [
          "Click on your profile icon in the upper right corner.",
          "Select the 'Profile' option.",
          "Update the information you want to change.",
          "Click the 'Save Changes' button."
        ]
      },
      {
        title: "Changing Password",
        content: "For your security, we recommend changing your password regularly.",
        steps: [
          "Go to your profile page.",
          "Click on the 'Security' tab.",
          "Enter your current password and your new password.",
          "Click the 'Update Password' button."
        ]
      },
      {
        title: "Notification Settings",
        content: "You can customize what notifications you receive.",
        features: [
          {
            name: "Email Notifications",
            description: "Receive emails about important updates and events."
          },
          {
            name: "In-App Notifications",
            description: "Get instant notifications about activities on the platform."
          },
          {
            name: "SMS Notifications",
            description: "Receive SMS to your phone number for critical notifications."
          }
        ]
      },
      {
        title: "Deleting Account",
        content: "If you want to permanently delete your account, you can do so securely.",
        steps: [
          "Go to your profile page.",
          "Click on the 'Account Settings' tab.",
          "Click on the 'Delete Account' option at the bottom of the page.",
          "Enter your password to confirm and click the 'Permanently Delete Account' button."
        ]
      }
    ]
  }
};

export default function AccountManagementPage() {
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
      href: `/${currentLocale}/help/topics/account-management`
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
