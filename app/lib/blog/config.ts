export const BLOG_MODULE_KEY = 'blog';
export const BLOG_SITE = 'myuni_platform';

export const blogDb = {
  posts: 'unilab_vision_blog_posts',
  tags: 'unilab_vision_blog_post_tags',
  categories: 'unilab_vision_blog_categories',
} as const;

export const BLOG_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_BLOG_STORAGE_BUCKET || 'unilab-vision-uploads';
export const BLOG_STORAGE_FOLDER = 'myuni/blog';
export const BLOG_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const BLOG_IMAGE_WIDTH = 1600;
export const BLOG_IMAGE_HEIGHT = 900;
export const BLOG_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export function slugifyBlogTitle(value: string): string {
  const trMap: Record<string, string> = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
  };

  return value
    .trim()
    .split('')
    .map((character) => trMap[character] ?? character)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function getPublicBlogUrl(locale: string, slug?: string): string {
  const path = slug ? `/${locale}/blog/${slug}` : `/${locale}/blog`;
  return `https://myunilab.net${path}`;
}

