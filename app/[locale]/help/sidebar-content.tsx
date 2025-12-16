import { 
  HelpCircle, 
  Book, 
  Users, 
  MessageSquare,
  AlertCircle,
  FileQuestion
} from 'lucide-react';

export const helpSidebarContent = {
  tr: {
    title: "Yardım Merkezi",
    items: [
      {
        name: "Yardım Merkezi",
        href: "",
        icon: HelpCircle
      },
      {
        name: "Başlarken",
        href: "/topics/getting-started",
        icon: Book
      },
      {
        name: "Hesap Yönetimi",
        href: "/topics/account-management",
        icon: Users
      },
      {
        name: "Sık Sorulan Sorular",
        href: "/topics/faq",
        icon: FileQuestion
      },
      {
        name: "İletişim",
        href: "/topics/contact",
        icon: MessageSquare
      },
      {
        name: "Sorun Bildirme",
        href: "/topics/report-issue",
        icon: AlertCircle
      }
    ]
  },
  en: {
    title: "Help Center",
    items: [
      {
        name: "Help Center",
        href: "",
        icon: HelpCircle
      },
      {
        name: "Getting Started",
        href: "/topics/getting-started",
        icon: Book
      },
      {
        name: "Account Management",
        href: "/topics/account-management",
        icon: Users
      },
      {
        name: "Frequently Asked Questions",
        href: "/topics/faq",
        icon: FileQuestion
      },
      {
        name: "Contact Us",
        href: "/topics/contact",
        icon: MessageSquare
      },
      {
        name: "Report an Issue",
        href: "/topics/report-issue",
        icon: AlertCircle
      }
    ]
  }
};
