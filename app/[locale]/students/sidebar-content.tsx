import {
  Users,
  BarChart3,
  Shield,
  BookOpen,
} from 'lucide-react';

export const studentsSidebarContent = {
  tr: {
    title: 'Öğrenci Yönetimi',
    items: [
      { name: 'İlerleme Takibi', href: '/', icon: BarChart3, capability: 'progress' },
      { name: 'Kayıtlar', href: '/enrollments', icon: Users, capability: 'enrollments' },
      { name: 'Kurslarım (öğrenci görünümü)', href: '/my-courses', icon: BookOpen, capability: 'my-courses' },
      { name: 'Yetkilendirme', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
  en: {
    title: 'Student Management',
    items: [
      { name: 'Progress Tracking', href: '/', icon: BarChart3, capability: 'progress' },
      { name: 'Enrollments', href: '/enrollments', icon: Users, capability: 'enrollments' },
      { name: 'My Courses (learner view)', href: '/my-courses', icon: BookOpen, capability: 'my-courses' },
      { name: 'Access Control', href: '/access', icon: Shield, capability: 'access' },
    ],
  },
};
