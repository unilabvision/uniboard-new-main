import {
  Home,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Shield,
  FormInput,
  Mail,
  Briefcase,
} from 'lucide-react';

export const siteApplicationsSidebarContent = {
  tr: {
    title: 'Site Başvuruları',
    items: [
      { name: 'Dashboard', href: '/', icon: Home, capability: 'dashboard' },
      { name: 'Başvurular', href: '/applications', icon: Users, capability: 'applications' },
      { name: 'Staj / Fırsat İlanları', href: '/opportunities', icon: Briefcase, capability: 'forms' },
      { name: 'Formlar', href: '/forms', icon: FormInput, capability: 'forms' },
      { name: 'Bekleyenler', href: '/applications?status=pending', icon: Clock, capability: 'applications' },
      { name: 'İncelemede', href: '/applications?status=under_review', icon: FileText, capability: 'applications' },
      { name: 'Kabul Edilenler', href: '/applications?status=accepted', icon: CheckCircle, capability: 'applications' },
      { name: 'Reddedilenler', href: '/applications?status=rejected', icon: XCircle, capability: 'applications' },
      { name: 'E-posta Ayarları', href: '/email-settings', icon: Mail, capability: 'forms' },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Site Applications',
    items: [
      { name: 'Dashboard', href: '/', icon: Home, capability: 'dashboard' },
      { name: 'Applications', href: '/applications', icon: Users, capability: 'applications' },
      { name: 'Opportunities', href: '/opportunities', icon: Briefcase, capability: 'forms' },
      { name: 'Forms', href: '/forms', icon: FormInput, capability: 'forms' },
      { name: 'Pending', href: '/applications?status=pending', icon: Clock, capability: 'applications' },
      { name: 'Under Review', href: '/applications?status=under_review', icon: FileText, capability: 'applications' },
      { name: 'Accepted', href: '/applications?status=accepted', icon: CheckCircle, capability: 'applications' },
      { name: 'Rejected', href: '/applications?status=rejected', icon: XCircle, capability: 'applications' },
      { name: 'Email Settings', href: '/email-settings', icon: Mail, capability: 'forms' },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
