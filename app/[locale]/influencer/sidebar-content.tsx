import {
  DollarSign,
  BarChart3,
  Star,
  Home,
  Link2,
  Shield,
  Tag,
} from 'lucide-react';

export const influencerSidebarContent = {
  tr: {
    title: 'Influencer Panel',
    items: [
      { name: 'Ana Sayfa', href: '/', icon: Home, capability: 'home' },
      { name: 'Kodlarım', href: '/codes', icon: Tag, capability: 'codes' },
      { name: 'Satışlarım', href: '/sales', icon: DollarSign, capability: 'sales' },
      { name: 'Performans', href: '/analytics', icon: BarChart3, capability: 'analytics' },
      { name: 'Kampanyalarım', href: '/campaigns', icon: Star, capability: 'campaigns' },
      { name: 'Dokümanlarım', href: '/docs', icon: Link2, capability: 'docs' },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Influencer Panel',
    items: [
      { name: 'Home', href: '/', icon: Home, capability: 'home' },
      { name: 'My Codes', href: '/codes', icon: Tag, capability: 'codes' },
      { name: 'My Sales', href: '/sales', icon: DollarSign, capability: 'sales' },
      { name: 'Performance', href: '/analytics', icon: BarChart3, capability: 'analytics' },
      { name: 'My Campaigns', href: '/campaigns', icon: Star, capability: 'campaigns' },
      { name: 'Docs', href: '/docs', icon: Link2, capability: 'docs' },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
