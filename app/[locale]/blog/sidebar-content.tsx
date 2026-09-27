import { BookOpen, ExternalLink, FilePlus2, Shield } from 'lucide-react';
import { getPublicBlogUrl } from '@/app/lib/blog/config';

export const blogSidebarContent = {
  tr: {
    title: 'Blog Yönetimi',
    items: [
      { name: 'Tüm Yazılar', href: '/', icon: BookOpen },
      { name: 'Yeni Yazı', href: '/new', icon: FilePlus2, capability: 'edit' },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
      { name: 'myunilab.net Blog', href: getPublicBlogUrl('tr'), icon: ExternalLink },
    ],
  },
  en: {
    title: 'Blog Management',
    items: [
      { name: 'All Posts', href: '/', icon: BookOpen },
      { name: 'New Post', href: '/new', icon: FilePlus2, capability: 'edit' },
      { name: 'myunilab.net Blog', href: getPublicBlogUrl('en'), icon: ExternalLink },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
