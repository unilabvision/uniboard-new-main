import { BadgeCheck, ExternalLink, Layers3, Shield } from 'lucide-react';

export const membershipsSidebarContent = {
  tr: {
    title: 'Üyelik Paketleri',
    items: [
      { name: 'Paketler ve fiyatlar', href: '/', icon: Layers3, capability: 'view' },
      {
        name: 'MyUNI yayın görünümü',
        href: 'https://myunilab.net/tr/uyelik',
        icon: ExternalLink,
        capability: 'view',
      },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Membership Plans',
    items: [
      { name: 'Plans and prices', href: '/', icon: BadgeCheck, capability: 'view' },
      {
        name: 'MyUNI published view',
        href: 'https://myunilab.net/en/membership',
        icon: ExternalLink,
        capability: 'view',
      },
      { name: 'Access control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
