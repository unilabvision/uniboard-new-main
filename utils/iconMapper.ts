// utils/iconMapper.ts
import { 
  BarChart3, BookOpen, Users, TrendingUp, 
  MessageSquare, Calendar, Star, Settings,
  Shield, CreditCard, FileText, Bell, GraduationCap, Award
} from 'lucide-react';

const iconMap = {
  'BarChart3': BarChart3,
  'BookOpen': BookOpen,
  'Users': Users,
  'TrendingUp': TrendingUp,
  'MessageSquare': MessageSquare,
  'Calendar': Calendar,
  'Star': Star,
  'Settings': Settings,
  'Shield': Shield,
  'CreditCard': CreditCard,
  'FileText': FileText,
  'Bell': Bell,
  'GraduationCap': GraduationCap,
  'Award': Award,
};

export const getIconComponent = (iconName: string) => {
  return iconMap[iconName as keyof typeof iconMap] || Settings;
};