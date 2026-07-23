import { User, Shield } from 'lucide-react';

export const settingsSidebarContent = {
  tr: {
    title: 'Ayarlar Paneli',
    items: [
      { name: 'Profil Ayarları', href: '/profile', icon: User, capability: 'profile' },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Settings Panel',
    items: [
      { name: 'Profile Settings', href: '/profile', icon: User, capability: 'profile' },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
