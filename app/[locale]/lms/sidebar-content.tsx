import { 
  Home,
  Settings,
  BarChart3,
  Award,
  PlusCircle,
  Library,
  Shield,
} from 'lucide-react';

export const lmsSidebarContent = {
  tr: {
    title: "Eğitim Yönetim Sistemi",
    items: [
      {
        name: "Ana Sayfa",
        href: "/",
        icon: Home
      },
      {
        name: "İlerleme Takibi",
        href: "/progress",
        icon: BarChart3
      },
      {
        name: "Sertifikalarım",
        href: "/certificates",
        icon: Award
      },
      {
        name: "Kurs Şablonları",
        href: "/templates",
        icon: Library
      },
      {
        name: "Kurs Oluştur",
        href: "/create",
        icon: PlusCircle
      },
      {
        name: "Ayarlar",
        href: "/settings",
        icon: Settings
      },
      {
        name: "Yetkilendirme",
        href: "/access",
        icon: Shield
      }
    ]
  },
  en: {
    title: "Learning Management System",
    items: [
      {
        name: "Home",
        href: "/",
        icon: Home
      },
      {
        name: "Progress Tracking",
        href: "/progress",
        icon: BarChart3
      },
      {
        name: "My Certificates",
        href: "/certificates",
        icon: Award
      },
      {
        name: "Course Templates",
        href: "/templates",
        icon: Library
      },
      {
        name: "Create Course",
        href: "/create",
        icon: PlusCircle
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings
      },
      {
        name: "Access Control",
        href: "/access",
        icon: Shield
      }
    ]
  }
};
