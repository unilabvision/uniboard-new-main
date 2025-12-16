import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Instagram, Mail } from 'lucide-react';
import { usePathname } from 'next/navigation';
import XIcon from './XIcon'; // Import the new XIcon component

interface FooterProps {
  locale: string;
}

const Footer = ({ locale }: FooterProps) => {
  const pathname = usePathname();
  
  // Determine if the current path is under /tr/watch/ or /en/watch/
  const isWatchPage = pathname.startsWith(`/${locale}/watch/`);

  // Language-based content
  const content = {
    tr: {
      description: "MyUNI, yapay zeka destekli, yenilikçi bir eğitim platformudur. Bireylere ve kurumlara yönelik dönüştürücü öğrenme deneyimleri sunar. Disiplinler arası yaklaşımı, en son teknolojileri ve yapay zeka destekli altyapısı sayesinde hem bireysel gelişim hem de kurumsal eğitim alanında yüksek etkili çözümler sunuyoruz.",
      copyright: `© ${new Date().getFullYear()} MyUNI. Tüm hakları saklıdır.`,
      privacyPolicy: "Gizlilik Politikası",
      termsOfService: "Kullanım Koşulları",
      mainLinks: [
        {
          title: 'MyUNI',
          items: [
            { label: 'Ana Sayfa', href: `/${locale}` },
            { label: 'Hakkımızda', href: `/${locale}/hakkimizda` },
            { label: 'İletişim', href: `/${locale}/iletisim` },
          ],
        },
        {
          title: 'Eğitim',
          items: [
            { label: 'Kurslar', href: `/${locale}/kurslar` },
            { label: 'Canlı Dersler', href: `/${locale}/canli-dersler` },
            { label: 'Sertifikalar', href: `/${locale}/sertifikalar` },
          ],
        },
        {
          title: 'Platformlarımız',
          items: [
            { label: 'MyUNI Notes', href: `/${locale}/notes` },
            { label: 'Dark Science Dergisi', href: `/${locale}/dark-science` },
            { label: 'Etkinlikler', href: `/${locale}/etkinlikler` },
         
          ],
        },
        {
          title: 'Destek',
          items: [
            { label: 'Yardım Merkezi', href: `/${locale}/yardim` },
            { label: 'SSS', href: `/${locale}/sss` },
            { label: 'Topluluk', href: `/${locale}/topluluk` },
            { label: 'Blog', href: `/${locale}/blog` },
          ],
        },
      ],
    },
    en: {
      description: "MyUNI is an AI-powered, innovative educational platform. It offers transformative learning experiences for individuals and institutions. Through our interdisciplinary approach, latest technologies, and AI-driven infrastructure, we provide highly effective solutions for both personal development and corporate education.",
      copyright: `© ${new Date().getFullYear()} MyUNI. All rights reserved.`,
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      mainLinks: [
        {
          title: 'MyUNI',
          items: [
            { label: 'Home', href: `/${locale}` },
            { label: 'About Us', href: `/${locale}/about` },
            { label: 'Contact', href: `/${locale}/contact` },
          ],
        },
        {
          title: 'Education',
          items: [
            { label: 'Courses', href: `/${locale}/courses` },
            { label: 'Live Classes', href: `/${locale}/live-classes` },
            { label: 'Certificates', href: `/${locale}/certificates` },
          ],
        },
        {
          title: 'Our Platforms',
          items: [
            { label: 'MyUNI Notes', href: `/${locale}/notes` },
            { label: 'Dark Science Journal', href: `/${locale}/dark-science` },
            { label: 'Events', href: `/${locale}/events` },
            { label: 'Research', href: `/${locale}/research` },
          ],
        },
        {
          title: 'Support',
          items: [
            { label: 'Help Center', href: `/${locale}/help` },
            { label: 'FAQ', href: `/${locale}/faq` },
            { label: 'Community', href: `/${locale}/community` },
            { label: 'Blog', href: `/${locale}/blog` },
          ],
        },
      ],
    },
  };

  // Safely retrieve content (fall back to Turkish if locale is unsupported)
  const t = locale in content ? content[locale as keyof typeof content] : content.tr;

  // Social media links with locale-based handles
  const socialLinks = [
    { icon: Mail, href: 'mailto:info@myunilab.net', label: 'Email' },
    {
      icon: Instagram,
      href: locale === 'tr' ? 'https://instagram.com/myuniturkiye' : 'https://instagram.com/myuniturkiye',
      label: 'Instagram',
    },
    {
      icon: Linkedin,
      href: locale === 'tr' ? 'https://linkedin.com/company/myuniturkiye' : 'https://linkedin.com/company/myuniturkiye',
      label: 'LinkedIn',
    },
    {
      icon: XIcon,
      href: locale === 'tr' ? 'https://x.com/myuniturkiye' : 'https://x.com/myuniturkiye',
      label: 'X',
    },
  ];

  return (
    <footer className="bg-neutral-900 dark:bg-neutral-950 text-neutral-300 py-16 px-6">
      <div className={`container mx-auto 
        ${isWatchPage ? 'max-w-none' : 'max-w-7xl px-0 sm:px-0 md:px-6 lg:px-6 xl:px-6 2xl:px-6'}`}> {/* Conditionally apply wider max-width */}
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <Link href={`/${locale}`} className="block mb-4">
              <Image
                src="/myuni-logo-dark.png"
                alt="MyUNI"
                width={180}
                height={60}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-4 text-md leading-relaxed text-neutral-400">
              {t.description}
            </p>
            <div className="mt-6 flex space-x-5">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-500 hover:text-[#a90013] dark:hover:text-[#ffdee2] transition-colors duration-300"
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          {t.mainLinks.map((section, index) => (
            <div key={index}>
              <h3 className="text-md font-medium text-neutral-100 mb-5">{section.title}</h3>
              <ul className="space-y-3">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Link
                      href={item.href}
                      className="text-sm text-neutral-400 hover:text-[#a90013] dark:hover:text-[#ffdee2] transition-colors duration-200"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-6 border-t border-neutral-800">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
              <p className="text-neutral-500 text-sm text-center md:text-left">
                {t.copyright}
              </p>
            </div>
            <div className="flex space-x-6 mt-4 lg:mt-0">
              <Link 
                href={locale === 'tr' ? '/tr/gizlilik' : '/en/privacy'} 
                className="text-neutral-500 hover:text-[#a90013] dark:hover:text-[#ffdee2] transition-colors duration-200 text-sm"
              >
                {t.privacyPolicy}
              </Link>
              <Link 
                href={locale === 'tr' ? '/tr/sartlar-ve-kosullar' : '/en/terms'} 
                className="text-neutral-500 hover:text-[#a90013] dark:hover:text-[#ffdee2] transition-colors duration-200 text-sm"
              >
                {t.termsOfService}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;