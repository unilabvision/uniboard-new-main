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
    title: "Influencer Panel",
    items: [
      {
        name: "Ana Sayfa",
        href: "/",
        icon: Home
      },
      {
        name: "Kodlarım",
        href: "/codes",
        icon: Tag
      },
      {
        name: "Satışlarım",
        href: "/sales",
        icon: DollarSign
      },
      {
        name: "Performans",
        href: "/analytics",
        icon: BarChart3
      },
      {
        name: "Kampanyalarım",
        href: "/campaigns",
        icon: Star
      },
      {
        name: "Dokümanlarım",
        href: "/docs",
        icon: Link2
      },
      {
        name: "Yetkilendirme",
        href: "/access",
        icon: Shield
      },
    ]
  },
  en: {
    title: "Influencer Panel",
    items: [
       {
        name: "Home",
        href: "/",
        icon: Home
      },
      {
        name: "My Codes",
        href: "/codes",
        icon: Tag
      },
      {
        name: "My Sales",
        href: "/sales",
        icon: DollarSign
      },
      {
        name: "Performance",
        href: "/analytics",
        icon: BarChart3
      },
      {
        name: "My Campaigns", 
        href: "/campaigns",
        icon: Star
      },
      {
        name: "Docs",
        href: "/docs",
        icon: Link2
      },
      {
        name: "Access Control",
        href: "/access",
        icon: Shield
      },
    ]
  }
};