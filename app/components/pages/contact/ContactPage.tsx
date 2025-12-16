// app/components/pages/contact/ContactPage.tsx
import React from 'react';
import { Phone, Mail, Users, Share2} from 'lucide-react';
import ContactForm from './ContactForm';
import content from './content';

interface ContactPageProps {
  locale: string;
}

export default function ContactPage({ locale }: ContactPageProps) {
  // Get appropriate content for the current locale
  const t = locale in content ? content[locale as keyof typeof content] : content.tr;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 mt-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column - Contact Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main Contact Info */}
          <div className="dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg border border-red-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-gray-600 transition-all duration-300 p-6 shadow-sm hover:shadow-md">
            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-5">
              {t.contactInfoTitle}
            </h2>
            
            <div className="space-y-5">
              
              {/* Phone */}
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center mr-3">
                    <Phone className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </div>
                  {t.phoneTitle}
                </h3>
                <a 
                  href={`tel:${t.phoneNumber.replace(/[^0-9+]/g, '')}`}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors pl-9 block"
                >
                  {t.phoneNumber}
                </a>
              </div>
              
              {/* Email */}
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center mr-3">
                    <Mail className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </div>
                  {t.emailTitle}
                </h3>
                <a 
                  href={`mailto:${t.emailAddress}`}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors pl-9 block"
                >
                  {t.emailAddress}
                </a>
              </div>
            </div>
          </div>

          {/* Community Section */}
          <div className="dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700  rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center mr-3">
                <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              {t.communityTitle}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {t.communityText}
            </p>
          </div>

          {/* Social Media Section */}
          <div className="dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg border border-red-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center mr-3">
                <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              {t.socialMediaTitle}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">
              {t.followUs}
            </p>
            <div className="flex space-x-3">
              {/* X (Twitter) */}
              <a 
                href={t.socialLinks.twitter}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              
              {/* Instagram */}
              <a 
                href={t.socialLinks.instagram}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              
              {/* LinkedIn */}
              <a 
                href={t.socialLinks.linkedin}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        {/* Right Column - Contact Form */}
        <div className="lg:col-span-2">
          <ContactForm locale={locale} />
        </div>
      </div>
    </div>
  );
}