"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import PageLayout from '@/app/components/layout/PageLayout';

// Contact Page translations
const content = {
  tr: {
    title: "İletişim",
    description: "Bizimle iletişime geçin. Sorularınız, önerileriniz veya geri bildirimleriniz için buradayız. Bu panel UNIBOARD altyapısında çalışan MyUNI Dashboard için geliştirilmiştir ve içerikleri, satışları ve diğer eğitim kaynaklarını yönetmenize olanak sağlar.",
    formTitle: "İletişim Formu",
    contactInfo: {
      title: "İletişim Bilgileri",
      email: "info@myunilab.net",
      phone: "+90 212 123 4567",
      address: "Maslak Mahallesi, Büyükdere Caddesi, No: 123, 34485 Sarıyer/İstanbul, Türkiye",
      workingHours: "Çalışma Saatleri: Pazartesi - Cuma, 09:00 - 18:00"
    },
    form: {
      nameLabel: "Adınız",
      namePlaceholder: "Adınızı girin",
      emailLabel: "E-posta Adresiniz",
      emailPlaceholder: "E-posta adresinizi girin",
      subjectLabel: "Konu",
      subjectPlaceholder: "Mesajınızın konusunu girin",
      messageLabel: "Mesajınız",
      messagePlaceholder: "Mesajınızı buraya yazın...",
      submitButton: "Gönder",
      successMessage: "Mesajınız başarıyla gönderildi. En kısa sürede size geri dönüş yapacağız.",
      errorMessage: "Mesajınız gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin."
    },
    faqs: {
      title: "Sık Sorulan Sorular",
      questions: [
        {
          question: "Ne kadar sürede yanıt alacağım?",
          answer: "Genellikle 24 saat içinde yanıt vermeye çalışıyoruz. Yoğun dönemlerde bu süre 48 saate kadar uzayabilir."
        },
        {
          question: "Teknik destek için nasıl iletişime geçebilirim?",
          answer: "Teknik destek için iletişim formunu kullanabilir veya doğrudan info@myunilab.net adresine e-posta gönderebilirsiniz."
        },
        {
          question: "İş birliği teklifleri için kiminle görüşmeliyim?",
          answer: "İş birliği teklifleri için info@myunilab.net adresine e-posta gönderebilirsiniz."
        }
      ]
    }
  },
  en: {
    title: "Contact Us",
    description: "Get in touch with us. We're here for your questions, suggestions, or feedback. This panel is developed for MyUNI Dashboard running on UNIBOARD infrastructure and allows you to manage content, sales, and other educational resources.",
    formTitle: "Contact Form",
    contactInfo: {
      title: "Contact Information",
      email: "info@myunilab.net",
      phone: "+90 212 123 4567",
      address: "Maslak District, Büyükdere Avenue, No: 123, 34485 Sarıyer/Istanbul, Turkey",
      workingHours: "Working Hours: Monday - Friday, 09:00 AM - 06:00 PM"
    },
    form: {
      nameLabel: "Your Name",
      namePlaceholder: "Enter your name",
      emailLabel: "Your Email Address",
      emailPlaceholder: "Enter your email address",
      subjectLabel: "Subject",
      subjectPlaceholder: "Enter the subject of your message",
      messageLabel: "Your Message",
      messagePlaceholder: "Write your message here...",
      submitButton: "Submit",
      successMessage: "Your message has been sent successfully. We'll get back to you as soon as possible.",
      errorMessage: "An error occurred while sending your message. Please try again later."
    },
    faqs: {
      title: "Frequently Asked Questions",
      questions: [
        {
          question: "How long will it take to get a response?",
          answer: "We typically try to respond within 24 hours. During busy periods, this may extend to 48 hours."
        },
        {
          question: "How can I contact technical support?",
          answer: "For technical support, you can use the contact form or send an email directly to info@myunilab.net."
        },
        {
          question: "Who should I contact for partnership inquiries?",
          answer: "For partnership inquiries, you can send an email to info@myunilab.net."
        }
      ]
    }
  }
};

export default function ContactPage() {
  const { locale } = useParams();
  const currentLocale = locale as string || 'en';
  const contactContent = content[currentLocale as keyof typeof content] || content.en;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState<null | 'success' | 'error'>(null);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    // For now, let's just simulate a successful submission
    setSubmitStatus('success');
    // Reset form after successful submission
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  // Construct breadcrumbs
  const breadcrumbs = [
    {
      name: currentLocale === 'tr' ? 'Yardım' : 'Help',
      href: `/${currentLocale}/help`
    },
    {
      name: contactContent.title,
      href: `/${currentLocale}/help/topics/contact`
    }
  ];

  return (
    <PageLayout 
      title={contactContent.title}
      description={contactContent.description}
      locale={currentLocale}
      breadcrumbs={breadcrumbs}
    >
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {/* Contact Info */}
            <div className="bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
              <h2 className="text-2xl font-semibold mb-6">{contactContent.contactInfo.title}</h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="min-w-[24px] mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600 dark:text-red-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">{currentLocale === 'tr' ? 'E-posta' : 'Email'}</p>
                    <a href={`mailto:${contactContent.contactInfo.email}`} className="text-red-600 dark:text-red-400 hover:underline">
                      {contactContent.contactInfo.email}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="min-w-[24px] mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600 dark:text-red-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">{currentLocale === 'tr' ? 'Telefon' : 'Phone'}</p>
                    <a href={`tel:${contactContent.contactInfo.phone}`} className="text-red-600 dark:text-red-400 hover:underline">
                      {contactContent.contactInfo.phone}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="min-w-[24px] mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600 dark:text-red-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">{currentLocale === 'tr' ? 'Adres' : 'Address'}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {contactContent.contactInfo.address}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="min-w-[24px] mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600 dark:text-red-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">{currentLocale === 'tr' ? 'Çalışma Saatleri' : 'Working Hours'}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {contactContent.contactInfo.workingHours}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
              <h2 className="text-2xl font-semibold mb-6">{contactContent.formTitle}</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md">
                  {contactContent.form.successMessage}
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
                  {contactContent.form.errorMessage}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {contactContent.form.nameLabel}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    placeholder={contactContent.form.namePlaceholder}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {contactContent.form.emailLabel}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    placeholder={contactContent.form.emailPlaceholder}
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {contactContent.form.subjectLabel}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    placeholder={contactContent.form.subjectPlaceholder}
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {contactContent.form.messageLabel}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    placeholder={contactContent.form.messagePlaceholder}
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {contactContent.form.submitButton}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* FAQs */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold mb-6">{contactContent.faqs.title}</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {contactContent.faqs.questions.map((faq, index) => (
                <div key={index} className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
                  <h3 className="text-lg font-medium mb-3">{faq.question}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </PageLayout>
  );
}
