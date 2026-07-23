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
      { name: 'Ana Sayfa', href: '/', icon: Home, capability: 'home' },
      { name: 'Gönderilecekler', href: '/issuance', icon: Send, capability: 'issuance' },
      { name: 'Yeni Sertifika', href: '/create', icon: PlusCircle, capability: 'create' },
      { name: 'Şablonlar', href: '/templates', icon: FileText, capability: 'templates' },
      { name: 'Organizasyon Ayarları', href: '/settings', icon: Settings, capability: 'settings' },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Certificate Management',
    items: [
      { name: 'Home', href: '/', icon: Home, capability: 'home' },
      { name: 'To Issue', href: '/issuance', icon: Send, capability: 'issuance' },
      { name: 'New Certificate', href: '/create', icon: PlusCircle, capability: 'create' },
      { name: 'Templates', href: '/templates', icon: FileText, capability: 'templates' },
      { name: 'Organization Settings', href: '/settings', icon: Settings, capability: 'settings' },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
