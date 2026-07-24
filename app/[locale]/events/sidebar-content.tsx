import { Home, PlusCircle, Calendar, Shield, Users, FormInput, LayoutDashboard } from 'lucide-react';

export const eventsSidebarContent = {
  tr: {
    title: 'Etkinlik Yönetimi',
    items: [
      { name: 'Dashboard', href: '/overview', icon: LayoutDashboard, capability: 'registrations' },
      { name: 'Tüm Etkinlikler', href: '/', icon: Home },
      { name: 'Yeni Etkinlik', href: '/new', icon: PlusCircle, capability: 'edit' },
      { name: 'Kayıtlar', href: '/registrations', icon: Users, capability: 'registrations' },
      { name: 'Formlar', href: '/forms', icon: FormInput, capability: 'forms' },
      { name: 'Site (etkinlik listesi)', href: 'https://myunilab.net/tr/etkinlik', icon: Calendar },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Event Management',
    items: [
      { name: 'Dashboard', href: '/overview', icon: LayoutDashboard, capability: 'registrations' },
      { name: 'All Events', href: '/', icon: Home },
      { name: 'New Event', href: '/new', icon: PlusCircle, capability: 'edit' },
      { name: 'Registrations', href: '/registrations', icon: Users, capability: 'registrations' },
      { name: 'Forms', href: '/forms', icon: FormInput, capability: 'forms' },
      { name: 'Site (event list)', href: 'https://myunilab.net/en/event', icon: Calendar },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
