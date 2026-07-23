import {
  Home,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Shield,
  FormInput,
} from 'lucide-react';

export const siteApplicationsSidebarContent = {
  tr: {
    title: 'Site Başvuruları',
    items: [
      { name: 'Dashboard', href: '/', icon: Home, capability: 'dashboard' },
      { name: 'Başvurular', href: '/applications', icon: Users, capability: 'applications' },
      { name: 'Formlar', href: '/forms', icon: FormInput, capability: 'forms' },
      { name: 'Bekleyenler', href: '/applications?status=pending', icon: Clock, capability: 'applications' },
      { name: 'İncelemede', href: '/applications?status=under_review', icon: FileText, capability: 'applications' },
      { name: 'Kabul Edilenler', href: '/applications?status=accepted', icon: CheckCircle, capability: 'applications' },
      { name: 'Reddedilenler', href: '/applications?status=rejected', icon: XCircle, capability: 'applications' },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Site Applications',
    items: [
      { name: 'Dashboard', href: '/', icon: Home, capability: 'dashboard' },
      { name: 'Applications', href: '/applications', icon: Users, capability: 'applications' },
      { name: 'Forms', href: '/forms', icon: FormInput, capability: 'forms' },
      { name: 'Pending', href: '/applications?status=pending', icon: Clock, capability: 'applications' },
      { name: 'Under Review', href: '/applications?status=under_review', icon: FileText, capability: 'applications' },
      { name: 'Accepted', href: '/applications?status=accepted', icon: CheckCircle, capability: 'applications' },
      { name: 'Rejected', href: '/applications?status=rejected', icon: XCircle, capability: 'applications' },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
