import {
  Home,
  Settings,
  BarChart3,
  Award,
  PlusCircle,
  Library,
  Shield,
} from 'lucide-react';

export const lmsSidebarContent = {
  tr: {
    title: 'Eğitim Yönetim Sistemi',
    items: [
      { name: 'Ana Sayfa', href: '/', icon: Home, capability: 'home' },
      { name: 'İlerleme Takibi', href: '/progress', icon: BarChart3, capability: 'progress' },
      { name: 'Ayarlar', href: '/settings', icon: Settings, capability: 'settings' },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Learning Management System',
    items: [
      { name: 'Home', href: '/', icon: Home, capability: 'home' },
      { name: 'Progress Tracking', href: '/progress', icon: BarChart3, capability: 'progress' },
      { name: 'My Certificates', href: '/certificates', icon: Award, capability: 'certificates' },
      { name: 'Course Templates', href: '/templates', icon: Library, capability: 'templates' },
      { name: 'Create Course', href: '/create', icon: PlusCircle, capability: 'create' },
      { name: 'Settings', href: '/settings', icon: Settings, capability: 'settings' },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
