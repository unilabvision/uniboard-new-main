import { BarChart3, TrendingUp, Users, ShoppingCart, Shield, Wallet } from 'lucide-react';

export const analyticsSidebarContent = {
  tr: {
    title: 'Analitik Raporları',
    items: [
      { name: 'Genel Bakış', href: '/', icon: BarChart3, capability: 'overview' },
      { name: 'Sipariş Defteri', href: '/#ledger', icon: Wallet, capability: 'ledger' },
      { name: 'Satış Özeti', href: '/#sales', icon: ShoppingCart, capability: 'sales' },
      { name: 'Eğitim Katılımı', href: '/#enrollments', icon: Users, capability: 'enrollments' },
      { name: 'Trendler', href: '/#trends', icon: TrendingUp, capability: 'trends' },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Analytics Reports',
    items: [
      { name: 'Overview', href: '/', icon: BarChart3, capability: 'overview' },
      { name: 'Order Ledger', href: '/#ledger', icon: Wallet, capability: 'ledger' },
      { name: 'Sales Summary', href: '/#sales', icon: ShoppingCart, capability: 'sales' },
      { name: 'Training Participation', href: '/#enrollments', icon: Users, capability: 'enrollments' },
      { name: 'Trends', href: '/#trends', icon: TrendingUp, capability: 'trends' },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
