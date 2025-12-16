// app/components/pages/contact/content.ts

export interface ContactContent {
  title: string;
  description: string;
  contactInfoTitle: string;
  phoneTitle: string;
  phoneNumber: string;
  emailTitle: string;
  emailAddress: string;
  formTitle: string;
  nameLabel: string;
  namePlaceholder: string;
  surnameLabel: string;
  surnamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  submitButton: string;
  successMessage: string;
  errorMessage: string;
  requiredFieldError: string;
  invalidEmailError: string;
  invalidPhoneError: string;
  spamProtectionText: string;
  communityTitle: string;
  communityText: string;
  socialMediaTitle: string;
  followUs: string;
  socialLinks: {
    twitter: string;
    instagram: string;
    linkedin: string;
  };
}

const content = {
tr: {
  title: "İletişim",
  description: "MyUNI eğitim platformu, kurslarımız ve yapay zeka destekli öğrenme çözümlerimiz hakkında bilgi almak için bizimle iletişime geçebilirsiniz.",
  contactInfoTitle: "İletişim Bilgileri",
  phoneTitle: "Telefon",
  phoneNumber: "+90 (541) 944 46 34",
  emailTitle: "E-posta",
  emailAddress: "info@myunilab.net",
  formTitle: "İletişim Formu",
  nameLabel: "Adınız",
  namePlaceholder: "Adınızı giriniz",
  surnameLabel: "Soyadınız",
  surnamePlaceholder: "Soyadınızı giriniz",
  emailLabel: "E-posta Adresiniz",
  emailPlaceholder: "E-posta adresinizi giriniz",
  phoneLabel: "Telefon Numaranız",
  phonePlaceholder: "Telefon numaranızı giriniz",
  messageLabel: "Mesajınız",
  messagePlaceholder: "Kurslarımız, eğitim programlarımız, kurumsal çözümlerimiz veya platform hakkında merak ettiklerinizi buraya yazabilirsiniz...",
  submitButton: "Gönder",
  successMessage: "Mesajınız başarıyla gönderildi. MyUNI ekibimiz en kısa sürede sizinle iletişime geçecektir.",
  errorMessage: "Mesajınız gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.",
  requiredFieldError: "Bu alan zorunludur",
  invalidEmailError: "Geçerli bir e-posta adresi giriniz",
  invalidPhoneError: "Geçerli bir telefon numarası giriniz",
  spamProtectionText: "Bu formda spam koruması bulunmaktadır. Lütfen gerçek bilgilerinizi giriniz.",
  communityTitle: "MyUNI Hakkında",
  communityText: "MyUNI, yapay zeka destekli, yenilikçi bir eğitim platformudur. Bireylere ve kurumlara yönelik dönüştürücü öğrenme deneyimleri sunar. Disiplinler arası yaklaşımı, en son teknolojileri ve yapay zeka destekli altyapısı sayesinde hem bireysel gelişim hem de kurumsal eğitim alanında yüksek etkili çözümler sunuyoruz.",
  socialMediaTitle: "Sosyal Medya",
  followUs: "Eğitim dünyasındaki gelişmelerimizi takip edin",
  socialLinks: {
    twitter: "https://twitter.com/myuniturkiye",
    instagram: "https://instagram.com/myuniturkiye",
    linkedin: "https://linkedin.com/company/myuniturkiye"
  }
},
en: {
  title: "Contact",
  description: "Get in touch with us to learn about MyUNI educational platform, our courses, and AI-powered learning solutions.",
  contactInfoTitle: "Contact Information",
  phoneTitle: "Phone",
  phoneNumber: "+90 (541) 944 46 34",
  emailTitle: "Email",
  emailAddress: "info@myunilab.net",
  formTitle: "Contact Form",
  nameLabel: "First Name",
  namePlaceholder: "Enter your first name",
  surnameLabel: "Last Name",
  surnamePlaceholder: "Enter your last name",
  emailLabel: "Email Address",
  emailPlaceholder: "Enter your email address",
  phoneLabel: "Phone Number",
  phonePlaceholder: "Enter your phone number",
  messageLabel: "Message",
  messagePlaceholder: "Share your questions about our courses, educational programs, corporate solutions, or the platform here...",
  submitButton: "Submit",
  successMessage: "Your message has been sent successfully. Our MyUNI team will contact you as soon as possible.",
  errorMessage: "An error occurred while sending your message. Please try again later.",
  requiredFieldError: "This field is required",
  invalidEmailError: "Please enter a valid email address",
  invalidPhoneError: "Please enter a valid phone number",
  spamProtectionText: "This form has spam protection. Please enter your real information.",
  communityTitle: "About MyUNI",
  communityText: "MyUNI is an innovative, AI-powered educational platform that provides transformative learning experiences for individuals and institutions. Through our interdisciplinary approach, cutting-edge technologies, and AI-powered infrastructure, we offer highly effective solutions for both personal development and corporate education.",
  socialMediaTitle: "Social Media",
  followUs: "Follow our developments in education",
  socialLinks: {
    twitter: "https://twitter.com/myuniturkiye",
    instagram: "https://instagram.com/myuniturkiye",
    linkedin: "https://linkedin.com/company/myuniturkiye"
  }
}
};

export default content;