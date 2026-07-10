import { 
  Home,
  Settings,
  BarChart3,
  PlusCircle,
  Shield,
  Video,
} from 'lucide-react';

export const lmsSidebarContent = {
  tr: {
    title: "Eğitim Yönetim Sistemi",
    items: [
      {
        name: "Kurs Yönetimi",
        href: "/",
        icon: Home
      },
      {
        name: "Kurs Oluştur",
        href: "/create",
        icon: PlusCircle
      },
      {
        name: "İlerleme Takibi",
        href: "/progress",
        icon: BarChart3
      },
      {
        name: "Öğrenci Paneli",
        href: "/my-courses",
        icon: Video
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
        name: "Course Management",
        href: "/",
        icon: Home
      },
      {
        name: "Create Course",
        href: "/create",
        icon: PlusCircle
      },
      {
        name: "Progress Tracking",
        href: "/progress",
        icon: BarChart3
      },
      {
        name: "Student Panel",
        href: "/my-courses",
        icon: Video
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
