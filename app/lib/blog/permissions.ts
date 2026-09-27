import { BLOG_MODULE_KEY } from '@/app/lib/blog/config';

export const BLOG_CAPABILITIES = ['edit', 'delete', 'access'] as const;
export type BlogCapability = (typeof BLOG_CAPABILITIES)[number];

export const BLOG_CAPABILITY_LABELS: Record<
  BlogCapability,
  { tr: string; en: string }
> = {
  edit: {
    tr: 'Blog yazıları (oluştur / düzenle)',
    en: 'Blog posts (create / edit)',
  },
  delete: {
    tr: 'Blog yazısı silme',
    en: 'Delete blog posts',
  },
  access: {
    tr: 'Yetkilendirme yönetimi',
    en: 'Access management',
  },
};

export function hasBlogAccess(moduleKeys: string[], isSuperAdmin: boolean): boolean {
  return isSuperAdmin || moduleKeys.includes(BLOG_MODULE_KEY);
}

export function isBlogCapability(value: unknown): value is BlogCapability {
  return typeof value === 'string' &&
    (BLOG_CAPABILITIES as readonly string[]).includes(value);
}

