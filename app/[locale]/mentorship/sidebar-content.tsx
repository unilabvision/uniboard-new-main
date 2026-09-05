import {
  Home,
  PlusCircle,
  Users,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { getPublicMentorshipListUrl } from '@/app/lib/mentorship/config';

export const mentorshipSidebarContent = {
  tr: {
    title: 'Mentörlük Paneli',
    items: [
      { name: 'Duyurular', href: '/', icon: Home },
      { name: 'Yeni Duyuru', href: '/new', icon: PlusCircle, capability: 'edit' },
      { name: 'Başvurular', href: '/applications', icon: Users, capability: 'applications' },
      {
        name: 'Site (mentorluk listesi)',
        href: getPublicMentorshipListUrl('tr'),
        icon: ExternalLink,
      },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Mentorship Panel',
    items: [
      { name: 'Announcements', href: '/', icon: Home },
      { name: 'New Announcement', href: '/new', icon: PlusCircle, capability: 'edit' },
      { name: 'Applications', href: '/applications', icon: Users, capability: 'applications' },
      {
        name: 'Site (mentorship list)',
        href: getPublicMentorshipListUrl('en'),
        icon: ExternalLink,
      },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
