import {
  Home,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Shield,
  FormInput,
  CalendarDays,
} from 'lucide-react';

export const siteApplicationsSidebarContent = {
  tr: {
    title: 'Site Başvuruları',
    items: [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Etkinlik Özeti', href: '/events', icon: CalendarDays },
      { name: 'Başvurular', href: '/applications', icon: Users },
      { name: 'Formlar', href: '/forms', icon: FormInput },
      { name: 'Bekleyenler', href: '/applications?status=pending', icon: Clock },
      { name: 'İncelemede', href: '/applications?status=under_review', icon: FileText },
      { name: 'Kabul Edilenler', href: '/applications?status=accepted', icon: CheckCircle },
      { name: 'Reddedilenler', href: '/applications?status=rejected', icon: XCircle },
      { name: 'Yetkilendirme', href: '/access', icon: Shield },
    ],
  },
  en: {
    title: 'Site Applications',
    items: [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Events Overview', href: '/events', icon: CalendarDays },
      { name: 'Applications', href: '/applications', icon: Users },
      { name: 'Forms', href: '/forms', icon: FormInput },
      { name: 'Pending', href: '/applications?status=pending', icon: Clock },
      { name: 'Under Review', href: '/applications?status=under_review', icon: FileText },
      { name: 'Accepted', href: '/applications?status=accepted', icon: CheckCircle },
      { name: 'Rejected', href: '/applications?status=rejected', icon: XCircle },
      { name: 'Access Control', href: '/access', icon: Shield },
    ],
  },
};
