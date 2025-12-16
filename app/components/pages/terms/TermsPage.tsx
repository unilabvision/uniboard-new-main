'use client';

import React from 'react';
import { Shield, User, Scale, FileText, AlertTriangle, Gavel, Clock, Phone, Mail, Globe, Users, Lock, CreditCard, BookOpen } from 'lucide-react';

interface TermsConditionsProps {
  locale?: string;
}

const termsData = {
  tr: {
    footerTitle: "Önemli Hatırlatma",
    footerContent: "Bu şartlar ve koşullar, MyUNI eğitim platformunu kullanarak kabul etmiş olduğunuz yasal yükümlülükleri içermektedir. Platformumuzu kullanmaya devam ederek, bu şart ve koşullara uyacağınızı taahhüt etmiş sayılırsınız. Herhangi bir sorunuz veya belirsizlik durumunda, lütfen bizimle iletişime geçmekten çekinmeyin.",
    sections: [
      {
        id: "introduction",
        title: "Giriş ve Kabullenme",
        icon: "shield",
        content: [
          "MyUNI yapay zeka destekli eğitim platformuna hoş geldiniz. Bu şartlar ve koşullar, platformumuzun kullanımına ilişkin kuralları, hakları ve yükümlülükleri belirler.",
          "Platformu kullanarak, bu şartları okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz. Şartları kabul etmiyorsanız, lütfen platformu kullanmayınız.",
          "Bu şartlar, Türkiye Cumhuriyeti yasalarına tabidir ve İstanbul mahkemeleri yetkilidir."
        ]
      },
      {
        id: "platform-usage",
        title: "Platform Kullanımı",
        icon: "user",
        content: [
          "MyUNI, yapay zeka destekli kişiselleştirilmiş eğitim deneyimleri sunmak için tasarlanmış bir eğitim platformudur.",
          "Platformu yalnızca yasal amaçlar için kullanabilirsiniz. Aşağıdaki faaliyetler kesinlikle yasaktır:",
          "• Başkalarının haklarını ihlal edici içerikler paylaşmak",
          "• Sahte bilgiler veya belgeler ile kayıt yapmak",
          "• Spam veya zararlı içerik göndermek",
          "• Fikri mülkiyet haklarını ihlal edici eylemler",
          "• Platform güvenliğini tehdit edici davranışlar",
          "• Eğitim içeriklerinin izinsiz paylaşımı veya kopyalanması"
        ]
      },
      {
        id: "education-enrollment",
        title: "Eğitim Kayıtları ve Katılım",
        icon: "bookopen",
        content: [
          "Platform üzerinden eğitim programlarına kayıt olabilir ve kurslara katılabilirsiniz.",
          "Kayıt formlarında verdiğiniz bilgilerin doğru ve güncel olmasından sorumlusunuz.",
          "Yanlış veya eksik bilgi vermek eğitim kayıtlarınızın iptal edilmesine neden olabilir.",
          "Eğitim programlarına katılım için belirtilen ön koşulları karşılamanız gerekmektedir.",
          "Eğitim programları planlandığı şekilde sürdürülür ve değişiklikler önceden duyurulur.",
          "Başarıyla tamamlanan eğitimler için sertifika verilir."
        ]
      },
      {
        id: "payment-refund",
        title: "Ödeme ve İade Politikası",
        icon: "creditcard",
        content: [
          "Ücretli eğitim programları için ödeme, kayıt sırasında tamamlanmalıdır.",
          "Kabul edilen ödeme yöntemleri: Kredi kartı ve banka kartı ",
          "Ödeme işlemi tamamlandıktan sonra eğitim programına erişim hakkınız başlar.",
          "ÖNEMLİ: Ödeme yapılan eğitim programları için herhangi bir iade yapılmaz.",
          "Teknik sorunlar nedeniyle eğitime erişememe durumunda destek ekibiyle iletişime geçiniz.",
          "Ödeme sırasında yaşanan sorunlar için 24 saat içinde destek ekibini bilgilendiriniz."
        ]
      },
      {
        id: "content-ip",
        title: "İçerik ve Fikri Mülkiyet",
        icon: "filetext",
        content: [
          "Platform üzerindeki tüm eğitim içeriği, yapay zeka algoritmaları, tasarım ve materyaller MyUNI'nin fikri mülkiyetidir.",
          "Eğitim içeriklerini izinsiz olarak kopyalayamaz, dağıtamaz veya ticari amaçla kullanamazsınız.",
          "Platform kullanıcıları tarafından üretilen içerikler için kullanıcılar sorumludur.",
          "Üçüncü taraf içeriklerinin kullanımında ilgili telif hakkı sahiplerinin izni alınmıştır.",
          "Yapay zeka tarafından üretilen kişiselleştirilmiş içerikler yalnızca kişisel kullanım içindir.",
          "Eğitim materyallerinin akademik amaçlı alıntıları kaynak gösterilerek yapılabilir."
        ]
      },
      {
        id: "ai-services",
        title: "Yapay Zeka Hizmetleri",
        icon: "users",
        content: [
          "MyUNI platformu, yapay zeka algoritmaları kullanarak kişiselleştirilmiş öğrenme deneyimi sunar.",
          "AI algoritmaları öğrenme verilerinize dayalı olarak eğitim içeriklerini optimize eder.",
          "Yapay zeka önerileri rehber niteliğindedir ve nihai kararlar size aittir.",
          "AI algoritmaları sürekli geliştirilir ve güncellenir.",
          "Yapay zeka hizmetlerinde %100 doğruluk garantisi verilmez.",
          "AI performansı, sağladığınız veri kalitesi ile doğrudan ilişkilidir."
        ]
      },
      {
        id: "services-availability",
        title: "Hizmet Kullanılabilirliği",
        icon: "clock",
        content: [
          "Platform hizmetlerini 7/24 kesintisiz sunmaya çalışsak da, %100 kesintisiz hizmet garantisi veremeyiz.",
          "Teknik bakım, güncelleme veya beklenmeyen teknik sorunlar nedeniyle hizmet kesintileri yaşanabilir.",
          "Hizmet kesintileri öncesinde mümkün olduğunca kullanıcılar e-posta ile bilgilendirilir.",
          "Planlanmış bakım çalışmaları için en az 24 saat önceden duyuru yapılır.",
          "Acil durum güncellemeleri ve güvenlik yamalarında anında müdahale edilir.",
          "Hizmet kesintileri sebebiyle eğitim süreleriniz otomatik olarak uzatılır."
        ]
      },
      {
        id: "liability-disclaimer",
        title: "Sorumluluk Reddi",
        icon: "alerttriangle",
        content: [
          "MyUNI, platform kullanımından doğabilecek dolaylı zararlardan sorumlu tutulamaz.",
          "Platform üzerindeki eğitim içeriklerinin doğruluğu için azami özen gösterilir ancak garanti verilmez.",
          "Kullanıcıların eğitim başarısı kişisel çaba ve katılımla doğrudan ilişkilidir.",
          "Üçüncü taraf bağlantıları ve dış kaynaklardan MyUNI sorumlu değildir.",
          "Kullanıcıların platformu kendi risk ve sorumluluklarında kullandıkları kabul edilir.",
          "Veri kaybı, sistem arızaları veya güvenlik ihlalleri nedeniyle oluşabilecek eğitim kesintileri için tam sorumluluk kabul edilmez.",
          "Yapay zeka önerilerinden kaynaklanan sonuçlar için MyUNI sorumlu tutulamaz."
        ]
      },
      {
        id: "user-conduct",
        title: "Kullanıcı Davranış Kuralları",
        icon: "scale",
        content: [
          "Eğitim programlarına düzenli ve aktif katılım gösterilmesi beklenir.",
          "Diğer öğrencilere ve eğitmenlere saygılı davranılması zorunludur.",
          "Forum ve tartışma alanlarında yapıcı ve saygılı iletişim kurulmalıdır.",
          "Akademik dürüstlük ilkelerine uygun davranılması gerekmektedir.",
          "Platform üzerinde spam, reklam veya uygunsuz içerik paylaşılmamalıdır."
        ]
      },
      {
        id: "privacy-data",
        title: "Gizlilik ve Veri Koruma",
        icon: "lock",
        content: [
          "Kişisel verilerinizin korunması konusunda KVKK'ya tam uyum sağlarız.",
          "Detaylı bilgi için Gizlilik Politikamızı incelemenizi rica ederiz.",
          "Öğrenme verileriniz yalnızca eğitim deneyiminizi iyileştirmek için kullanılır.",
          "Yapay zeka algoritmaları için kullanılan veriler anonimleştirilerek işlenir.",
          "Veri güvenliği için çok katmanlı güvenlik önlemleri ve şifreleme kullanılır.",
          "Veri sahibi haklarınızı istediğiniz zaman kullanabilirsiniz.",
          "Üçüncü taraflarla veri paylaşımı yalnızca yasal zorunluluklar çerçevesinde yapılır."
        ]
      },
      {
        id: "account-termination",
        title: "Hesap İptali ve Yasaklama",
        icon: "gavel",
        content: [
          "Hesabınızı istediğiniz zaman iptal edebilirsiniz.",
          "MyUNI, şartları ihlal eden kullanıcıları platform kullanımından men edebilir.",
          "Hesap iptali durumunda, ödeme yapılan aktif eğitimler için iade yapılmaz.",
          "Hesap kapatma talebi için destek ekibiyle iletişime geçiniz.",
          "Yasaklama durumunda, platform kullanım hakları ve eğitim erişimi derhal sona erer.",
          "Sahte hesap açma veya kimlik bilgilerini yanlış verme yasaklama sebebidir."
        ]
      },
      {
        id: "changes-updates",
        title: "Değişiklikler ve Güncellemeler",
        icon: "globe",
        content: [
          "Bu şartlar ve koşullar, yasal gereklilikler veya hizmet güncellemeleri doğrultusunda değiştirilebilir.",
          "Önemli değişiklikler kullanıcılara e-posta ve platform bildirimleri ile duyurulur.",
          "Güncellemeler yayınlandığı tarihten itibaren geçerli olur.",
          "Değişiklikleri kabul etmiyorsanız, hesabınızı kapatabilirsiniz.",
          "Platform kullanımına devam etmek, güncellenmiş şartları kabul ettiğiniz anlamına gelir.",
          "Yapay zeka algoritmaları sürekli güncellenir ve geliştirilir."
        ]
      },
      {
        id: "contact-support",
        title: "İletişim ve Destek",
        icon: "mail",
        content: [
          "Şartlar ve koşullar hakkında sorularınız için bizimle iletişime geçebilirsiniz:",
          "• E-posta: info@myunilab.net",
          "• Telefon: +90 541 944 46 34",
          "• Teknik Destek: 7/24 canlı destek hizmeti",
        ]
      }
    ]
  },
  en: {
    footerTitle: "Important Notice",
    footerContent: "These terms and conditions contain the legal obligations you have agreed to by using the MyUNI educational platform. By continuing to use our platform, you are deemed to have committed to comply with these terms and conditions. If you have any questions or uncertainties, please do not hesitate to contact us.",
    sections: [
      {
        id: "introduction",
        title: "Introduction and Acceptance",
        icon: "shield",
        content: [
          "Welcome to MyUNI AI-powered educational platform. These terms and conditions set out the rules, rights and obligations regarding the use of our platform.",
          "By using the platform, you declare that you have read, understood and accepted these terms. If you do not accept the terms, please do not use the platform.",
          "These terms are subject to the laws of the Republic of Turkey and Istanbul courts have jurisdiction."
        ]
      },
      {
        id: "platform-usage",
        title: "Platform Usage",
        icon: "user",
        content: [
          "MyUNI is an educational platform designed to provide AI-powered personalized learning experiences.",
          "You may only use the platform for legal purposes. The following activities are strictly prohibited:",
          "• Sharing content that violates the rights of others",
          "• Registering with false information or documents",
          "• Sending spam or harmful content",
          "• Actions that violate intellectual property rights",
          "• Behaviors that threaten platform security",
          "• Unauthorized sharing or copying of educational content"
        ]
      },
      {
        id: "education-enrollment",
        title: "Educational Enrollment and Participation",
        icon: "bookopen",
        content: [
          "You can enroll in educational programs and participate in courses through the platform.",
          "You are responsible for ensuring that the information you provide in enrollment forms is accurate and up to date.",
          "Providing incorrect or incomplete information may result in cancellation of your educational enrollment.",
          "You must meet the specified prerequisites for participation in educational programs.",
          "Educational programs are conducted as planned and changes are announced in advance.",
          "Certificates are awarded for successfully completed courses."
        ]
      },
      {
        id: "payment-refund",
        title: "Payment and Refund Policy",
        icon: "creditcard",
        content: [
          "Payment for paid educational programs must be completed during enrollment.",
          "Accepted payment methods: Credit card and debit card",
          "Your access to the educational program begins after payment is completed.",
          "IMPORTANT: No refunds are provided for paid educational programs.",
          "Contact support team if you cannot access education due to technical issues.",
          "Please inform the support team within 24 hours for payment-related issues."
        ]
      },
      {
        id: "content-ip",
        title: "Content and Intellectual Property",
        icon: "filetext",
        content: [
          "All educational content, AI algorithms, designs and materials on the platform are the intellectual property of MyUNI.",
          "You cannot copy, distribute or use educational content for commercial purposes without permission.",
          "Users are responsible for content created by platform users.",
          "Permission from relevant copyright holders has been obtained for the use of third-party content.",
          "Personalized content generated by AI is for personal use only.",
          "Academic citations of educational materials can be made with proper attribution."
        ]
      },
      {
        id: "ai-services",
        title: "Artificial Intelligence Services",
        icon: "users",
        content: [
          "MyUNI platform provides personalized learning experience using artificial intelligence algorithms.",
          "AI algorithms optimize educational content based on your learning data.",
          "AI recommendations are for guidance purposes and final decisions are yours.",
          "AI algorithms are continuously developed and updated.",
          "100% accuracy is not guaranteed in artificial intelligence services.",
          "AI performance is directly related to the quality of data you provide."
        ]
      },
      {
        id: "services-availability",
        title: "Service Availability",
        icon: "clock",
        content: [
          "Although we strive to provide platform services 24/7 uninterrupted, we cannot guarantee 100% uninterrupted service.",
          "Service interruptions may occur due to technical maintenance, updates or unexpected technical problems.",
          "Users are informed via email as much as possible before service interruptions.",
          "At least 24 hours advance notice is given for planned maintenance work.",
          "Immediate intervention is made for emergency updates and security patches.",
          "Your course durations are automatically extended due to service interruptions."
        ]
      },
      {
        id: "liability-disclaimer",
        title: "Liability Disclaimer",
        icon: "alerttriangle",
        content: [
          "MyUNI cannot be held responsible for indirect damages that may arise from platform use.",
          "Maximum care is taken for the accuracy of educational content on the platform, but no guarantee is given.",
          "User educational success is directly related to personal effort and participation.",
          "MyUNI is not responsible for third party links and external resources.",
          "It is accepted that users use the platform at their own risk and responsibility.",
          "Full responsibility is not accepted for educational interruptions that may occur due to data loss, system failures or security breaches.",
          "MyUNI cannot be held responsible for results arising from AI recommendations."
        ]
      },
      {
        id: "user-conduct",
        title: "User Conduct Rules",
        icon: "scale",
        content: [
          "Regular and active participation in educational programs is expected.",
          "Respectful behavior towards other students and instructors is mandatory.",
          "Constructive and respectful communication must be established in forums and discussion areas.",
          "Assignments and projects must be original, plagiarism is not allowed.",
          "Spam, advertising or inappropriate content should not be shared on the platform."
        ]
      },
      {
        id: "privacy-data",
        title: "Privacy and Data Protection",
        icon: "lock",
        content: [
          "We fully comply with KVKK regarding the protection of your personal data.",
          "Please review our Privacy Policy for detailed information.",
          "Your learning data is used only to improve your educational experience.",
          "Data used for AI algorithms is processed anonymously.",
          "Multi-layered security measures and encryption are used for data security.",
          "You can exercise your data subject rights at any time.",
          "Data sharing with third parties is done only within the framework of legal obligations."
        ]
      },
      {
        id: "account-termination",
        title: "Account Cancellation and Banning",
        icon: "gavel",
        content: [
          "You can cancel your account at any time.",
          "MyUNI may ban users who violate the terms from using the platform.",
          "In case of account cancellation, no refund is made for paid active courses.",
          "Please contact the support team for account closure requests.",
          "In case of banning, platform usage rights and course access end immediately.",
          "Opening fake accounts or providing false identity information is grounds for banning."
        ]
      },
      {
        id: "changes-updates",
        title: "Changes and Updates",
        icon: "globe",
        content: [
          "These terms and conditions may be changed in line with legal requirements or service updates.",
          "Important changes are announced to users via email and platform notifications.",
          "Updates are valid from the date they are published.",
          "If you do not accept the changes, you can close your account.",
          "Continuing to use the platform means that you accept the updated terms.",
          "AI algorithms are continuously updated and improved."
        ]
      },
      {
        id: "contact-support",
        title: "Contact and Support",
        icon: "mail",
        content: [
          "You can contact us for questions about terms and conditions:",
          "• Email: info@myunilab.net",
          "• Phone: +90 541 944 46 34",
          "• Technical Support: 24/7 live support service",
        ]
      }
    ]
  }
};

// Icon mapping
const iconMap: { [key: string]: React.ReactNode } = {
  shield: <Shield className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  user: <User className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  users: <Users className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  bookopen: <BookOpen className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  creditcard: <CreditCard className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  filetext: <FileText className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  clock: <Clock className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  alerttriangle: <AlertTriangle className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  scale: <Scale className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  lock: <Lock className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  gavel: <Gavel className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  globe: <Globe className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  mail: <Mail className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  phone: <Phone className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />
};

export default function TermsConditions({ locale = 'tr' }: TermsConditionsProps) {
  const content = termsData[locale as keyof typeof termsData] || termsData.tr;

  return (
    <div className="bg-white dark:bg-neutral-900 min-h-screen">
      {/* Content Sections */}
      <section className="py-12 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="space-y-12">
            {content.sections.map((section, index) => (
              <div key={section.id} className="text-left">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#990000]/5 dark:bg-[#990000]/10">
                    {iconMap[section.icon]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-light text-neutral-900 dark:text-neutral-100">
                      {section.title}
                    </h2>
                    <div className="w-12 h-px bg-[#990000] mt-2"></div>
                  </div>
                </div>

                <div className="space-y-4">
                  {section.content.map((paragraph, pIndex) => (
                    <p 
                      key={pIndex} 
                      className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-left"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {index < content.sections.length - 1 && (
                  <div className="mt-12 w-full h-px bg-neutral-200 dark:bg-neutral-700"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Notice */}
      <section className="py-12 bg-neutral-50 dark:bg-neutral-800/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-8 border border-neutral-200 dark:border-neutral-700 text-left">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                  {content.footerTitle}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {content.footerContent}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}