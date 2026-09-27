export type BlogLocale = 'tr' | 'en';

export interface BlogPost {
  id: string;
  post_id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  date: string;
  featured: boolean;
  locale: BlogLocale;
  alternate_slug: string | null;
  alternate_post_id: string | null;
  site: string;
  created_at?: string;
  updated_at?: string;
  tags: string[];
}

export interface BlogPostInput {
  title: string;
  slug: string;
  category: string;
  excerpt?: string;
  content: string;
  image?: string;
  date: string;
  featured?: boolean;
  locale: BlogLocale;
  tags?: string[];
  alternateId?: string | null;
}

