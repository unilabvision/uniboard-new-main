import {
  Home,
  Settings,
  PlusCircle,
  Shield,
  Users,
  Tag,
  ClipboardList,
} from 'lucide-react';

export const lmsSidebarContent = {
  tr: {
    title: 'Eğitim Yönetim Sistemi',
    items: [
      { name: 'Kurs Yönetimi', href: '/', icon: Home, capability: 'courses' },
      { name: 'Kurs Oluştur', href: '/create', icon: PlusCircle, capability: 'create' },
      { name: 'İndirim Kodları', href: '/discount-codes', icon: Tag, capability: 'courses' },
      {
        name: 'Öğrenci Yönetimi',
        href: '/students',
        icon: Users,
        crossModule: true,
      },
      { name: 'Başvurular', href: '/applications', icon: ClipboardList, capability: 'courses' },
      { name: 'Ayarlar', href: '/settings', icon: Settings, capability: 'settings' },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Learning Management System',
    items: [
      { name: 'Course Management', href: '/', icon: Home, capability: 'courses' },
      { name: 'Create Course', href: '/create', icon: PlusCircle, capability: 'create' },
      { name: 'Discount Codes', href: '/discount-codes', icon: Tag, capability: 'courses' },
      {
        name: 'Student Management',
        href: '/students',
        icon: Users,
        crossModule: true,
      },
      { name: 'Applications', href: '/applications', icon: ClipboardList, capability: 'courses' },
      { name: 'Settings', href: '/settings', icon: Settings, capability: 'settings' },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
