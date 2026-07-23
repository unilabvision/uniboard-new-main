import { Home, PlusCircle, Calendar, Shield, CalendarDays, Users, FormInput } from 'lucide-react';

export const eventsSidebarContent = {
  tr: {
    title: 'Etkinlik Yönetimi',
    items: [
      { name: 'Tüm Etkinlikler', href: '/', icon: Home },
      { name: 'Yeni Etkinlik', href: '/new', icon: PlusCircle, capability: 'edit' },
      { name: 'Etkinlik Özeti', href: '/overview', icon: CalendarDays, capability: 'registrations' },
      { name: 'Kayıtlar', href: '/registrations', icon: Users, capability: 'registrations' },
      { name: 'Formlar', href: '/forms', icon: FormInput, capability: 'forms' },
      { name: 'Site Önizleme', href: 'https://myunilab.net/tr/etkinlik', icon: Calendar },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Event Management',
    items: [
      { name: 'All Events', href: '/', icon: Home },
      { name: 'New Event', href: '/new', icon: PlusCircle, capability: 'edit' },
      { name: 'Events Overview', href: '/overview', icon: CalendarDays, capability: 'registrations' },
      { name: 'Registrations', href: '/registrations', icon: Users, capability: 'registrations' },
      { name: 'Forms', href: '/forms', icon: FormInput, capability: 'forms' },
      { name: 'Site Preview', href: 'https://myunilab.net/en/event', icon: Calendar },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
