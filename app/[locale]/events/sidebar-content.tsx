import { Home, PlusCircle, Calendar, Shield } from 'lucide-react';

export const eventsSidebarContent = {
  tr: {
    title: 'Etkinlik Yönetimi',
    items: [
      { name: 'Tüm Etkinlikler', href: '/', icon: Home },
      { name: 'Yeni Etkinlik', href: '/new', icon: PlusCircle },
      { name: 'Site Önizleme', href: 'https://myunilab.net/tr/etkinlik', icon: Calendar },
      { name: 'Yetkilendirme', href: '/access', icon: Shield },
    ],
  },
  en: {
    title: 'Event Management',
    items: [
      { name: 'All Events', href: '/', icon: Home },
      { name: 'New Event', href: '/new', icon: PlusCircle },
      { name: 'Site Preview', href: 'https://myunilab.net/en/event', icon: Calendar },
      { name: 'Access Control', href: '/access', icon: Shield },
    ],
  },
};
