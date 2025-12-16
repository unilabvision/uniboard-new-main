"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import PageLayout from '@/app/components/layout/PageLayout';

// Report Issue translations
const content = {
  tr: {
    title: "Sorun Bildirme",
    description: "MyUNI Dashboard kullanırken karşılaştığınız sorunları bize bildirin. Ekibimiz en kısa sürede size yardımcı olacaktır. Bu dashboard UNIBOARD altyapısında çalışan ve içerikleri, satışları ve diğer eğitim kaynaklarını yönetmenize olanak sağlayan bir platformdur.",
    formTitle: "Sorun Bildir",
    sections: [
      {
        title: "Sorun Bildirme Hakkında",
        content: "MyUNI Dashboard'ı kullanırken herhangi bir hata veya sorunla karşılaşırsanız, bize bildirmeniz sistemimizi iyileştirmemize yardımcı olur. Her bildirim bizim için değerlidir ve gelecekteki güncellemelerimizde dikkate alınır."
      }
    ],
    form: {
      nameLabel: "Adınız",
      namePlaceholder: "Adınızı girin",
      emailLabel: "E-posta Adresiniz",
      emailPlaceholder: "E-posta adresinizi girin",
      categoryLabel: "Sorun Kategorisi",
      categories: [
        { value: "bug", label: "Hata/Bug" },
        { value: "functionality", label: "İşlevsellik Sorunu" },
        { value: "performance", label: "Performans Sorunu" },
        { value: "ui", label: "Kullanıcı Arayüzü Sorunu" },
        { value: "other", label: "Diğer" }
      ],
      categoryPlaceholder: "Bir kategori seçin",
      priorityLabel: "Öncelik",
      priorities: [
        { value: "low", label: "Düşük" },
        { value: "medium", label: "Orta" },
        { value: "high", label: "Yüksek" },
        { value: "critical", label: "Kritik" }
      ],
      priorityPlaceholder: "Bir öncelik seçin",
      urlLabel: "Sorunun Oluştuğu URL (İsteğe Bağlı)",
      urlPlaceholder: "Sorunun meydana geldiği URL'yi girin",
      descriptionLabel: "Sorun Açıklaması",
      descriptionPlaceholder: "Lütfen sorunu detaylı bir şekilde açıklayın...",
      stepsLabel: "Yeniden Oluşturma Adımları",
      stepsPlaceholder: "Sorunu yeniden oluşturmak için gereken adımları açıklayın...",
      deviceInfoLabel: "Cihaz ve Tarayıcı Bilgileri",
      deviceInfoPlaceholder: "İşletim sistemi, tarayıcı ve cihaz bilgilerinizi girin",
      screenshotLabel: "Ekran Görüntüsü Ekle (İsteğe Bağlı)",
      attachButtonLabel: "Dosya Ekle",
      submitButton: "Sorun Bildir",
      successMessage: "Sorun bildirimi başarıyla gönderildi. Teşekkür ederiz! Sorun takip numaranız: #",
      errorMessage: "Bildiriminiz gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin."
    },
    tips: {
      title: "Etkili Bir Sorun Bildirimi Nasıl Oluşturulur?",
      items: [
        "Sorunu olabildiğince açık ve net bir şekilde tanımlayın.",
        "Sorunu yeniden oluşturmanın kesin adımlarını belirtin.",
        "Sorunla karşılaştığınız sayfanın URL'sini dahil edin.",
        "Mümkünse ekran görüntüleri veya videolar ekleyin.",
        "Kullandığınız tarayıcı ve işletim sistemi hakkında bilgi verin.",
        "Karşılaştığınız hata mesajlarını (varsa) tam olarak yazın."
      ]
    },
    faq: {
      title: "Sık Sorulan Sorular",
      questions: [
        {
          question: "Sorun bildirimim ne kadar sürede değerlendirilecek?",
          answer: "Sorun bildirimlerini genellikle 24-48 saat içinde değerlendiriyoruz. Kritik sorunlar daha öncelikli olarak ele alınır."
        },
        {
          question: "Bildirdiğim sorunun çözüm sürecini nasıl takip edebilirim?",
          answer: "Sorun bildiriminiz gönderildikten sonra size bir takip numarası verilecektir. Bu numarayı kullanarak 'Sorun Takibi' sayfasından bildirimin durumunu kontrol edebilirsiniz."
        },
        {
          question: "Eğer bir özelliğin eksik olduğunu düşünüyorsam, bu formu kullanabilir miyim?",
          answer: "Bu form öncelikle hataları bildirmek için tasarlanmıştır. Özellik istekleri için lütfen 'Geri Bildirim' formunu kullanın veya info@myunilab.net adresine e-posta gönderin."
        }
      ]
    }
  },
  en: {
    title: "Report an Issue",
    description: "Report issues you encounter while using MyUNI Dashboard. Our team will assist you as soon as possible. This dashboard runs on UNIBOARD infrastructure and allows you to manage content, sales, and other educational resources.",
    formTitle: "Report Issue",
    sections: [
      {
        title: "About Issue Reporting",
        content: "If you encounter any errors or issues while using MyUNI Dashboard, reporting them to us helps improve our system. Every report is valuable to us and will be considered in our future updates."
      }
    ],
    form: {
      nameLabel: "Your Name",
      namePlaceholder: "Enter your name",
      emailLabel: "Your Email Address",
      emailPlaceholder: "Enter your email address",
      categoryLabel: "Issue Category",
      categories: [
        { value: "bug", label: "Bug/Error" },
        { value: "functionality", label: "Functionality Issue" },
        { value: "performance", label: "Performance Issue" },
        { value: "ui", label: "User Interface Issue" },
        { value: "other", label: "Other" }
      ],
      categoryPlaceholder: "Select a category",
      priorityLabel: "Priority",
      priorities: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "critical", label: "Critical" }
      ],
      priorityPlaceholder: "Select a priority",
      urlLabel: "URL Where Issue Occurred (Optional)",
      urlPlaceholder: "Enter the URL where the issue occurred",
      descriptionLabel: "Issue Description",
      descriptionPlaceholder: "Please describe the issue in detail...",
      stepsLabel: "Steps to Reproduce",
      stepsPlaceholder: "Explain the steps to reproduce the issue...",
      deviceInfoLabel: "Device and Browser Information",
      deviceInfoPlaceholder: "Enter your operating system, browser, and device information",
      screenshotLabel: "Attach Screenshot (Optional)",
      attachButtonLabel: "Attach File",
      submitButton: "Submit Report",
      successMessage: "Issue report successfully submitted. Thank you! Your issue tracking number is: #",
      errorMessage: "An error occurred while submitting your report. Please try again later."
    },
    tips: {
      title: "How to Create an Effective Issue Report?",
      items: [
        "Define the issue as clearly and precisely as possible.",
        "Specify exact steps to reproduce the issue.",
        "Include the URL of the page where you encountered the issue.",
        "Add screenshots or videos if possible.",
        "Provide information about your browser and operating system.",
        "Write down error messages (if any) exactly as they appear."
      ]
    },
    faq: {
      title: "Frequently Asked Questions",
      questions: [
        {
          question: "How long will it take to evaluate my issue report?",
          answer: "We typically evaluate issue reports within 24-48 hours. Critical issues are addressed with higher priority."
        },
        {
          question: "How can I track the resolution process of my reported issue?",
          answer: "After your issue report is submitted, you will be given a tracking number. You can use this number to check the status of your report on the 'Issue Tracking' page."
        },
        {
          question: "If I think a feature is missing, can I use this form?",
          answer: "This form is primarily designed for reporting bugs. For feature requests, please use the 'Feedback' form or send an email to info@myunilab.net."
        }
      ]
    }
  }
};

export default function ReportIssuePage() {
  const { locale } = useParams();
  const currentLocale = locale as string || 'en';
  const issueContent = content[currentLocale as keyof typeof content] || content.en;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    priority: '',
    url: '',
    description: '',
    steps: '',
    deviceInfo: '',
    screenshot: null as File | null
  });
  const [submitStatus, setSubmitStatus] = useState<null | 'success' | 'error'>(null);
  const [issueId, setIssueId] = useState<string>('');

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // For simplicity, we're not actually storing the file, just acknowledging it was selected
      setFormData(prev => ({ ...prev, screenshot: e.target.files![0] }));
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    // For now, let's just simulate a successful submission
    setSubmitStatus('success');
    setIssueId(Math.floor(100000 + Math.random() * 900000).toString()); // Generate a random 6-digit issue ID
    
    // Reset form after successful submission
    setFormData({
      name: '',
      email: '',
      category: '',
      priority: '',
      url: '',
      description: '',
      steps: '',
      deviceInfo: '',
      screenshot: null
    });
  };

  // Construct breadcrumbs
  const breadcrumbs = [
    {
      name: currentLocale === 'tr' ? 'Yardım' : 'Help',
      href: `/${currentLocale}/help`
    },
    {
      name: issueContent.title,
      href: `/${currentLocale}/help/topics/report-issue`
    }
  ];

  return (
    <PageLayout 
      title={issueContent.title}
      description={issueContent.description}
      locale={currentLocale}
      breadcrumbs={breadcrumbs}
    >
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-full xl:max-w-[1500px] 2xl:max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          
          {/* Introduction */}
          {issueContent.sections.map((section, index) => (
            <div key={index} className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
              <p className="text-gray-700 dark:text-gray-300">{section.content}</p>
            </div>
          ))}
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Issue Form */}
            <div className="md:col-span-2 bg-white dark:bg-neutral-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
              <h2 className="text-2xl font-semibold mb-6">{issueContent.formTitle}</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md">
                  {issueContent.form.successMessage}{issueId}
                </div>
              )}
              
              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
                  {issueContent.form.errorMessage}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {issueContent.form.nameLabel}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                      placeholder={issueContent.form.namePlaceholder}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {issueContent.form.emailLabel}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                      placeholder={issueContent.form.emailPlaceholder}
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {issueContent.form.categoryLabel}
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="" disabled>{issueContent.form.categoryPlaceholder}</option>
                      {issueContent.form.categories.map((category, index) => (
                        <option key={index} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {issueContent.form.priorityLabel}
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="" disabled>{issueContent.form.priorityPlaceholder}</option>
                      {issueContent.form.priorities.map((priority, index) => (
                        <option key={index} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {issueContent.form.urlLabel}
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    placeholder={issueContent.form.urlPlaceholder}
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {issueContent.form.descriptionLabel}
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    placeholder={issueContent.form.descriptionPlaceholder}
                  />
                </div>
                
                <div>
                  <label htmlFor="steps" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {issueContent.form.stepsLabel}
                  </label>
                  <textarea
                    id="steps"
                    name="steps"
                    value={formData.steps}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    placeholder={issueContent.form.stepsPlaceholder}
                  />
                </div>
                
                <div>
                  <label htmlFor="deviceInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {issueContent.form.deviceInfoLabel}
                  </label>
                  <input
                    type="text"
                    id="deviceInfo"
                    name="deviceInfo"
                    value={formData.deviceInfo}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-100"
                    placeholder={issueContent.form.deviceInfoPlaceholder}
                  />
                </div>
                
                <div>
                  <label htmlFor="screenshot" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {issueContent.form.screenshotLabel}
                  </label>
                  <input
                    type="file"
                    id="screenshot"
                    name="screenshot"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100 dark:file:bg-red-900 dark:file:text-red-200 dark:text-gray-400"
                  />
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {issueContent.form.submitButton}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Tips and FAQ */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
                <h3 className="text-xl font-semibold mb-4">{issueContent.tips.title}</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 list-disc list-inside">
                  {issueContent.tips.items.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-white dark:bg-neutral-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
                <h3 className="text-xl font-semibold mb-4">{issueContent.faq.title}</h3>
                <div className="space-y-4">
                  {issueContent.faq.questions.map((faq, index) => (
                    <div key={index}>
                      <h4 className="text-lg font-medium mb-2">{faq.question}</h4>
                      <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </PageLayout>
  );
}
