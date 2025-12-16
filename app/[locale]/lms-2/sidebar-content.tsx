import { 
  Home,
  Settings,
  BarChart3,
  Award,
  PlusCircle,
  Library
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
        name: "Ayarlar",
        href: "/settings",
        icon: Settings
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
      }
    ]
  }
};
