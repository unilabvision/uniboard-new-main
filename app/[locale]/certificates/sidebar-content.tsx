import {
  FileText,
  PlusCircle,
  Home,
  Settings,
  Shield,
  Send,
} from 'lucide-react';

export const certificatesSidebarContent = {
  tr: {
    title: 'Sertifika Yönetimi',
    items: [
      { name: 'Ana Sayfa', href: '/', icon: Home },
      { name: 'Gönderilecekler', href: '/issuance', icon: Send },
      { name: 'Yeni Sertifika', href: '/create', icon: PlusCircle },
      { name: 'Şablonlar', href: '/templates', icon: FileText },
      { name: 'Organizasyon Ayarları', href: '/settings', icon: Settings },
      { name: 'Yetkilendirme', href: '/access', icon: Shield },
    ],
  },
  en: {
    title: 'Certificate Management',
    items: [
      { name: 'Home', href: '/', icon: Home },
      { name: 'To Issue', href: '/issuance', icon: Send },
      { name: 'New Certificate', href: '/create', icon: PlusCircle },
      { name: 'Templates', href: '/templates', icon: FileText },
      { name: 'Organization Settings', href: '/settings', icon: Settings },
      { name: 'Access Control', href: '/access', icon: Shield },
    ],
  },
};
