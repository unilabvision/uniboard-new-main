'use client';

import React from 'react';
import { Shield, Eye, Lock, Database, Mail, Calendar, Globe, Users, FileText, AlertCircle, Brain, Settings } from 'lucide-react';

interface PrivacyPolicyProps {
  locale?: string;
}

const privacyData = {
  tr: {
    footerTitle: "Önemli Hatırlatma",
    footerContent: "Bu gizlilik politikası, MyUNI eğitim platformunu kullanarak kabul etmiş olduğunuz şartları içermektedir. Platformumuzu kullanmaya devam ederek, kişisel verilerinizin bu politika kapsamında işlenmesini kabul etmiş sayılırsınız. Herhangi bir sorunuz veya endişeniz varsa, lütfen bizimle iletişime geçmekten çekinmeyin.",
    sections: [
      {
        id: "introduction",
        title: "Giriş",
        icon: "shield",
        content: [
          "MyUNI olarak, kişisel verilerinizin gizliliği ve güvenliği konusunda en yüksek standartları benimseriz. Bu gizlilik politikası, yapay zeka destekli eğitim platformumuzda toplanan, işlenen ve korunan kişisel verilerin nasıl yönetildiğini açıklar.",
          "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve ilgili mevzuat hükümlerine tam uyum sağlayarak, veri sahiplerinin haklarını koruma konusunda azami özen gösteririz.",
          "Yapay zeka teknolojileri kullanımında da en yüksek gizlilik ve güvenlik standartlarını uygularız."
        ]
      },
      {
        id: "data-collection",
        title: "Toplanan Veriler",
        icon: "database",
        content: [
          "Eğitim platformumuz aracılığıyla toplanan kişisel veriler şunları içerebilir:",
          "• Ad, soyad ve iletişim bilgileri (e-posta adresi, telefon numarası)",
          "• Demografik bilgiler (yaş, cinsiyet, eğitim durumu)",
          "• Profesyonel bilgiler (çalışma alanı, deneyim, ilgi alanları)",
          "• Eğitim tercihleri ve öğrenme hedefleri",
          "• Kurs katılım bilgileri ve ilerleme verileri",
          "• Öğrenme performansı ve tamamlama oranları",
          "• Platform kullanım verileri ve etkileşim geçmişi",
          "• Yapay zeka kişiselleştirmesi için öğrenme verileri",
          "• IP adresi, tarayıcı bilgileri ve teknik veriler"
        ]
      },
      {
        id: "data-usage",
        title: "Verilerin Kullanım Amaçları",
        icon: "eye",
        content: [
          "Toplanan kişisel veriler aşağıdaki amaçlarla işlenir:",
          "• Eğitim platformu hizmetlerinin sunulması ve geliştirilmesi",
          "• Yapay zeka destekli kişiselleştirilmiş öğrenme deneyiminin sağlanması",
          "• Öğrenme içeriklerinin ve müfredatın optimize edilmesi",
          "• Öğrenci performansının analizi ve iyileştirme önerilerinin sunulması",
          "• Eğitim başarısının takibi ve sertifika süreçlerinin yönetimi",
          "• Öğrenme analitiği ve eğitsel araştırma faaliyetleri",
          "• Müşteri desteği ve teknik yardım hizmetlerinin verilmesi",
          "• Yasal yükümlülüklerin yerine getirilmesi",
          "• Platform güvenliği ve dolandırıcılık önleme"
        ]
      },
      {
        id: "ai-data-processing",
        title: "Yapay Zeka Veri İşleme",
        icon: "brain",
        content: [
          "MyUNI platformunda yapay zeka teknolojileri için veri işleme süreçleri:",
          "• Öğrenme verileriniz kişiselleştirilmiş eğitim içeriği oluşturmak için kullanılır",
          "• AI algoritmaları öğrenme tarzınızı analiz ederek en uygun içerikleri önerir",
          "• Performans verileri adaptif öğrenme sistemini besler",
          "• Veriler anonim hale getirilerek genel model geliştirmede kullanılabilir",
          "• AI önerileri tamamen otomatik sistemler tarafından oluşturulur",
          "• Yapay zeka kararları şeffaf ve açıklanabilir şekilde sunulur",
          "• AI işleme süreçlerinde veri minimizasyonu ilkesi uygulanır"
        ]
      },
      {
        id: "data-sharing",
        title: "Veri Paylaşımı",
        icon: "users",
        content: [
          "Kişisel verileriniz, aşağıdaki durumlarda ve sınırlı şartlar altında üçüncü taraflarla paylaşılabilir:",
          "• Yasal zorunluluklar ve mahkeme kararları",
          "• Eğitim ortakları ve akredite edici kuruluşlar (sadece gerekli bilgiler)",
          "• Teknik hizmet sağlayıcıları (veri işleme sözleşmesi kapsamında)",
          "• Yapay zeka altyapı sağlayıcıları (anonim veriler)",
          "• Akademik araştırma işbirlikleri (anonim ve toplu veriler)",
          "• Sertifika doğrulama hizmetleri (sadece sertifika bilgileri)"
        ]
      },
      {
        id: "data-security",
        title: "Veri Güvenliği",
        icon: "lock",
        content: [
          "Kişisel verilerinizin güvenliği için çok katmanlı güvenlik önlemleri alınmıştır:",
          "• SSL/TLS şifreleme teknolojisi ile veri iletimi",
          "• Güvenli bulut altyapısı ve düzenli güvenlik güncellemeleri",
          "• Çok faktörlü kimlik doğrulama sistemleri",
          "• Erişim kontrolü ve rol tabanlı yetkilendirme",
          "• Düzenli güvenlik denetimleri ve penetrasyon testleri",
          "• Yapay zeka modellerinde veri sızıntısı önleme teknikleri",
          "• Personel eğitimleri ve gizlilik taahhütleri",
          "• Otomatik yedekleme ve felaket kurtarma planları",
          "• Veri şifreleme (hem aktarım hem de depolama)"
        ]
      },
      {
        id: "user-rights",
        title: "Veri Sahibi Hakları",
        icon: "filetext",
        content: [
          "KVKK kapsamında sahip olduğunuz haklar:",
          "• Kişisel verilerinizin işlenip işlenmediğini öğrenme",
          "• İşlenen verileriniz hakkında detaylı bilgi talep etme",
          "• İşleme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme",
          "• Yurt içinde veya yurt dışında verilerin aktarıldığı üçüncü kişileri bilme",
          "• Verilerin eksik veya yanlış işlenmiş olması halinde düzeltilmesini isteme",
          "• Kanunda öngörülen şartlar çerçevesinde verilerin silinmesini isteme",
          "• Yapay zeka kararlarına itiraz etme ve manuel inceleme talep etme",
          "• Veri taşınabilirliği hakkınızı kullanma (eğitim kayıtları)",
          "• Otomatik karar verme süreçleri hakkında bilgi alma"
        ]
      },
      {
        id: "data-retention",
        title: "Veri Saklama Süreleri",
        icon: "calendar",
        content: [
          "MyUNI platformu, sürekli gelişen yapay zeka destekli eğitim hizmetlerinin optimizasyonu ve kullanıcı deneyiminin iyileştirilmesi amacıyla veri saklama stratejisini şu şekilde belirlemiştir:",
          "• Hesap ve profil bilgileri: Platform hizmetlerinin sürekliliği ve kullanıcı deneyimi optimizasyonu için süresiz saklama",
          "• Eğitim kayıtları ve akademik veriler: Eğitim süreçlerinin izlenebilirliği, sertifika doğrulama ve akademik geçerlilik için süresiz saklama",
          "• Öğrenme analitik verileri: Yapay zeka algoritmalarının sürekli öğrenmesi ve kişiselleştirme hizmetlerinin geliştirilmesi için süresiz saklama",
          "• Platform etkileşim verileri: Kullanıcı deneyimi araştırmaları, sistem optimizasyonu ve güvenlik analizleri için süresiz saklama",
          "• Yapay zeka model eğitim verileri: AI algoritmaların sürekli gelişimi, model iyileştirme ve yenilikçi eğitim çözümlerinin geliştirilmesi için süresiz saklama",
          "Bu veri saklama yaklaşımı, platform kullanıcılarına en yüksek kalitede, kişiselleştirilmiş ve sürekli gelişen eğitim deneyimi sunabilmek için gerekli olan sürekli öğrenen sistemlerin temel gereksinimini karşılamaktadır.",
          "Veri sahipleri, KVKK kapsamındaki haklarını kullanarak verilerinin işlenmesine ilişkin taleplerde bulunabilirler."
        ]
      },
      {
        id: "cookies",
        title: "Çerez Politikası",
        icon: "globe",
        content: [
          "Eğitim platformumuzda kullanıcı deneyimini geliştirmek için çerezler kullanılmaktadır:",
          "• Zorunlu çerezler: Platform işlevselliği ve güvenlik için gerekli",
          "• Performans çerezleri: Öğrenme süreçlerini analiz etmek için",
          "• İşlevsellik çerezleri: Kişiselleştirilmiş öğrenme deneyimi sunmak için",
          "• Analitik çerezler: Eğitim içerik optimizasyonu için",
          "• AI çerezleri: Yapay zeka önerilerini geliştirmek için",
          "Çerez tercihlerinizi tarayıcı ayarlarınızdan veya platform ayarları menüsünden yönetebilirsiniz."
        ]
      },
      {
        id: "international-transfers",
        title: "Uluslararası Veri Aktarımı",
        icon: "globe",
        content: [
          "Eğitim hizmetlerimizi sunabilmek için verileriniz aşağıdaki durumlarda yurt dışına aktarılabilir:",
          "• Bulut hizmet sağlayıcıları (AWS, Google Cloud, Microsoft Azure)",
          "• Yapay zeka ve makine öğrenmesi servisleri",
          "• Uluslararası sertifika doğrulama sistemleri",
          "• Tüm aktarımlar KVKK ve GDPR uyumlu koruma seviyesinde yapılır",
          "• Yeterli koruma seviyesi olmayan ülkelere aktarımda ek güvenceler alınır"
        ]
      },
      {
        id: "contact",
        title: "İletişim",
        icon: "mail",
        content: [
          "Gizlilik politikamız hakkında sorularınız veya veri sahibi haklarınızı kullanmak istiyorsanız bizimle iletişime geçebilirsiniz:",
          "• E-posta: info@myunilab.net",
          "• Telefon: +90 541 944 46 34",
          "Başvurularınız en geç 30 gün içerisinde yanıtlanır."
        ]
      },
      {
        id: "changes",
        title: "Politika Güncellemeleri",
        icon: "settings",
        content: [
          "Bu gizlilik politikası, yasal değişiklikler, teknolojik gelişmeler veya platform güncellemeleri doğrultusunda güncellenebilir.",
          "Önemli değişiklikler öncesinde kullanıcılarımız e-posta, platform bildirimleri ve ana sayfa duyuruları yoluyla bilgilendirilir.",
          "Güncel politika her zaman web sitemizde yayınlanır ve son güncelleme tarihi belirtilir.",
          "Yapay zeka teknolojilerindeki gelişmeler doğrultusunda ilgili bölümler güncellenir."
        ]
      }
    ]
  },
  en: {
    footerTitle: "Important Notice",
    footerContent: "This privacy policy contains the terms you have agreed to by using the MyUNI educational platform. By continuing to use our platform, you are deemed to have accepted the processing of your personal data within the scope of this policy. If you have any questions or concerns, please do not hesitate to contact us.",
    sections: [
      {
        id: "introduction",
        title: "Introduction",
        icon: "shield",
        content: [
          "As MyUNI, we adopt the highest standards regarding the privacy and security of your personal data. This privacy policy explains how personal data collected, processed and protected on our AI-powered educational platform is managed.",
          "We take utmost care to protect the rights of data subjects by fully complying with the Personal Data Protection Law No. 6698 (KVKK) and related legislation provisions.",
          "We also apply the highest privacy and security standards in the use of artificial intelligence technologies."
        ]
      },
      {
        id: "data-collection",
        title: "Data Collected",
        icon: "database",
        content: [
          "Personal data collected through our educational platform may include:",
          "• Name, surname and contact information (email address, phone number)",
          "• Demographic information (age, gender, education status)",
          "• Professional information (field of work, experience, interests)",
          "• Educational preferences and learning goals",
          "• Course participation information and progress data",
          "• Learning performance and completion rates",
          "• Platform usage data and interaction history",
          "• Learning data for AI personalization",
          "• IP address, browser information and technical data"
        ]
      },
      {
        id: "data-usage",
        title: "Data Usage Purposes",
        icon: "eye",
        content: [
          "Collected personal data is processed for the following purposes:",
          "• Providing and improving educational platform services",
          "• Providing AI-powered personalized learning experience",
          "• Optimizing learning content and curriculum",
          "• Analyzing student performance and providing improvement suggestions",
          "• Tracking educational success and managing certification processes",
          "• Learning analytics and educational research activities",
          "• Providing customer support and technical assistance services",
          "• Fulfilling legal obligations",
          "• Platform security and fraud prevention"
        ]
      },
      {
        id: "ai-data-processing",
        title: "AI Data Processing",
        icon: "brain",
        content: [
          "Data processing processes for artificial intelligence technologies on MyUNI platform:",
          "• Your learning data is used to create personalized educational content",
          "• AI algorithms analyze your learning style and recommend the most suitable content",
          "• Performance data feeds the adaptive learning system",
          "• Data can be anonymized and used in general model development",
          "• AI recommendations are generated entirely by automated systems",
          "• AI decisions are presented in a transparent and explainable manner",
          "• Data minimization principle is applied in AI processing"
        ]
      },
      {
        id: "data-sharing",
        title: "Data Sharing",
        icon: "users",
        content: [
          "Your personal data may be shared with third parties in the following cases and under limited conditions:",
          "• Legal obligations and court decisions",
          "• Educational partners and accrediting organizations (only necessary information)",
          "• Technical service providers (under data processing agreement)",
          "• AI infrastructure providers (anonymous data)",
          "• Academic research collaborations (anonymous and aggregate data)",
          "• Certificate verification services (certificate information only)"
        ]
      },
      {
        id: "data-security",
        title: "Data Security",
        icon: "lock",
        content: [
          "Multi-layered security measures have been taken for the security of your personal data:",
          "• Data transmission with SSL/TLS encryption technology",
          "• Secure cloud infrastructure and regular security updates",
          "• Multi-factor authentication systems",
          "• Access control and role-based authorization",
          "• Regular security audits and penetration testing",
          "• Data leakage prevention techniques in AI models",
          "• Staff training and confidentiality commitments",
          "• Automatic backup and disaster recovery plans",
          "• Data encryption (both transmission and storage)"
        ]
      },
      {
        id: "user-rights",
        title: "Data Subject Rights",
        icon: "filetext",
        content: [
          "Your rights under KVKK:",
          "• Learning whether your personal data is processed",
          "• Requesting detailed information about your processed data",
          "• Learning the purpose of processing and whether they are used in accordance with their purpose",
          "• Knowing the third parties to whom data is transferred domestically or abroad",
          "• Requesting correction if data is processed incompletely or incorrectly",
          "• Requesting deletion of data within the framework of conditions stipulated in the law",
          "• Objecting to AI decisions and requesting manual review",
          "• Using your data portability right (educational records)",
          "• Getting information about automated decision-making processes"
        ]
      },
      {
        id: "data-retention",
        title: "Data Retention Periods",
        icon: "calendar",
        content: [
          "Your personal data is retained for the following periods:",
          "• Account information: As long as account is active + 3 years",
          "• Educational records and certificates: 10 years (academic requirements)",
          "• Learning analytics data: 2 years (anonymous data unlimited)",
          "• Communication records: 3 years",
          "• Data required by legal obligation: For the period of relevant legislation",
          "• Cookie data: 6 months - 2 years (varies by type)",
          "Data whose retention period has expired is securely destroyed."
        ]
      },
      {
        id: "cookies",
        title: "Cookie Policy",
        icon: "globe",
        content: [
          "Cookies are used on our educational platform to improve user experience:",
          "• Essential cookies: Required for platform functionality and security",
          "• Performance cookies: To analyze learning processes",
          "• Functionality cookies: To provide personalized learning experience",
          "• Analytics cookies: For educational content optimization",
          "• AI cookies: To improve artificial intelligence recommendations",
          "You can manage your cookie preferences from your browser settings or platform settings menu."
        ]
      },
      {
        id: "international-transfers",
        title: "International Data Transfer",
        icon: "globe",
        content: [
          "Your data may be transferred abroad in the following cases to provide our educational services:",
          "• Cloud service providers (AWS, Google Cloud, Microsoft Azure)",
          "• Artificial intelligence and machine learning services",
          "• International certificate verification systems",
          "• All transfers are made at KVKK and GDPR compliant protection level",
          "• Additional safeguards are taken for transfers to countries without adequate protection level"
        ]
      },
      {
        id: "contact",
        title: "Contact",
        icon: "mail",
        content: [
          "If you have questions about our privacy policy or want to exercise your data subject rights, you can contact us:",
          "• Email: info@myunilab.net",
          "• Data Protection Officer: info@myunilab.net",
          "• Phone: +90 542 123 45 67",
          "• Application form: 'Data Subject Rights' section on the platform",
          "Your applications will be answered within 30 days at the latest."
        ]
      },
      {
        id: "changes",
        title: "Policy Updates",
        icon: "settings",
        content: [
          "This privacy policy may be updated in line with legal changes, technological developments or platform updates.",
          "Users are informed via email, platform notifications and homepage announcements before important changes.",
          "The current policy is always published on our website and the last update date is specified.",
          "Relevant sections are updated in line with developments in artificial intelligence technologies."
        ]
      }
    ]
  }
};

// Icon mapping
const iconMap: { [key: string]: React.ReactNode } = {
  shield: <Shield className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  database: <Database className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  eye: <Eye className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  brain: <Brain className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  users: <Users className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  lock: <Lock className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  filetext: <FileText className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  calendar: <Calendar className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  globe: <Globe className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  settings: <Settings className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  mail: <Mail className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />
};

export default function PrivacyPolicy({ locale = 'tr' }: PrivacyPolicyProps) {
  const content = privacyData[locale as keyof typeof privacyData] || privacyData.tr;

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
                <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
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