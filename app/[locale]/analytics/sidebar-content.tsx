import { BarChart3, TrendingUp, Users, ShoppingCart, Shield } from 'lucide-react';

export const analyticsSidebarContent = {
  tr: {
    title: 'Analitik Raporları',
    items: [
      {
        name: 'Genel Bakış',
        href: '/',
        icon: BarChart3,
      },
      {
        name: 'Satış Özeti',
        href: '/#sales',
        icon: ShoppingCart,
      },
      {
        name: 'Eğitim Katılımı',
        href: '/#enrollments',
        icon: Users,
      },
      {
        name: 'Trendler',
        href: '/#trends',
        icon: TrendingUp,
      },
      {
        name: 'Yetkilendirme',
        href: '/access',
        icon: Shield,
      },
    ],
  },
  en: {
    title: 'Analytics Reports',
    items: [
      {
        name: 'Overview',
        href: '/',
        icon: BarChart3,
      },
      {
        name: 'Sales Summary',
        href: '/#sales',
        icon: ShoppingCart,
      },
      {
        name: 'Training Participation',
        href: '/#enrollments',
        icon: Users,
      },
      {
        name: 'Trends',
        href: '/#trends',
        icon: TrendingUp,
      },
      {
        name: 'Access Control',
        href: '/access',
        icon: Shield,
      },
    ],
  },
};
