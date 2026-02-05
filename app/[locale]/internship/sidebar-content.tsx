import { 
  Home,
  Users,
  FileText,
  BarChart3,
  Settings,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const internshipSidebarContent = {
  tr: {
    title: "Staj Başvuruları",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: Home
      },
      {
        name: "Tüm Başvurular",
        href: "/applications",
        icon: Users
      },
      {
        name: "Bekleyenler",
        href: "/applications?status=pending",
        icon: Clock
      },
      {
        name: "İncelemede",
        href: "/applications?status=under_review",
        icon: FileText
      },
      {
        name: "Kabul Edilenler",
        href: "/applications?status=accepted",
        icon: CheckCircle
      },
      {
        name: "Reddedilenler",
        href: "/applications?status=rejected",
        icon: XCircle
      },
      {
        name: "Reviewer Yönetimi",
        href: "/reviewers",
        icon: UserCheck
      },
      {
        name: "İstatistikler",
        href: "/stats",
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
    title: "Internship Applications",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: Home
      },
      {
        name: "All Applications",
        href: "/applications",
        icon: Users
      },
      {
        name: "Pending",
        href: "/applications?status=pending",
        icon: Clock
      },
      {
        name: "Under Review",
        href: "/applications?status=under_review",
        icon: FileText
      },
      {
        name: "Accepted",
        href: "/applications?status=accepted",
        icon: CheckCircle
      },
      {
        name: "Rejected",
        href: "/applications?status=rejected",
        icon: XCircle
      },
      {
        name: "Reviewer Management",
        href: "/reviewers",
        icon: UserCheck
      },
      {
        name: "Statistics",
        href: "/stats",
        icon: BarChart3
      },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings
      }
    ]
  }
};
