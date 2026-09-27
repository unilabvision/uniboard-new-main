import { NextRequest, NextResponse } from 'next/server';
import { sanitizeHtml } from '@/app/lib/lms/htmlContent';
import { blogDb, BLOG_SITE } from '@/app/lib/blog/config';
import {
  buildBlogPayload,
  ensureBlogCategory,
  POST_COLUMNS,
  replaceBlogTags,
  syncAlternateLink,
  validateBlogInput,
} from '@/app/lib/blog/posts';
import type { BlogPostInput } from '@/app/types/blog';
import { requireBlogCapability, requireBlogModuleUser } from './_helpers';

function positiveInt(value: string | null, fallback: number): number {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

export async function GET(request: NextRequest) {
  const access = await requireBlogModuleUser();
  if (access.error || !access.supabase) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const page = positiveInt(request.nextUrl.searchParams.get('page'), 1);
  const perPage = Math.min(100, positiveInt(request.nextUrl.searchParams.get('perPage'), 30));
  const locale = request.nextUrl.searchParams.get('locale');
  const search = (request.nextUrl.searchParams.get('search') || '')
    .trim()
    .replace(/[%_,().]/g, ' ')
    .slice(0, 80);
  const from = (page - 1) * perPage;

  let query = access.supabase
    .from(blogDb.posts)
    .select(POST_COLUMNS, { count: 'exact' })
    .eq('site', BLOG_SITE)
    .order('date', { ascending: false })
    .range(from, from + perPage - 1);
  if (locale === 'tr' || locale === 'en') query = query.eq('locale', locale);
  if (search) query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%,slug.ilike.%${search}%`);

  const { data: posts, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const postIds = (posts ?? []).map((post) => post.post_id);
  const tagsResult = postIds.length
    ? await access.supabase
        .from(blogDb.tags)
        .select('post_id,tag')
        .eq('site', BLOG_SITE)
        .in('post_id', postIds)
    : { data: [], error: null };
  if (tagsResult.error) {
    return NextResponse.json({ error: tagsResult.error.message }, { status: 500 });
  }

  const tagsByPost = new Map<string, string[]>();
  for (const row of tagsResult.data ?? []) {
    tagsByPost.set(row.post_id, [...(tagsByPost.get(row.post_id) ?? []), row.tag]);
  }

  const { data: categoryRows } = await access.supabase
    .from(blogDb.categories)
    .select('name,locale')
    .eq('site', BLOG_SITE)
    .order('name');
  const postCategories = (posts ?? []).map((post) => ({ name: post.category, locale: post.locale }));
  const categories = [...(categoryRows ?? []), ...postCategories].filter(
    (item, index, items) => items.findIndex(
      (other) => other.name === item.name && other.locale === item.locale
    ) === index
  );

  return NextResponse.json({
    posts: (posts ?? []).map((post) => ({ ...post, tags: tagsByPost.get(post.post_id) ?? [] })),
    categories,
    total: count ?? 0,
    page,
    perPage,
  });
}

export async function POST(request: NextRequest) {
  const access = await requireBlogCapability('edit');
  if (access.error || !access.supabase) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = (await request.json()) as BlogPostInput;
  const validationError = validateBlogInput(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  body.content = sanitizeHtml(body.content);

  try {
    const payload = await buildBlogPayload(access.supabase, body);
    const { data, error } = await access.supabase
      .from(blogDb.posts)
      .insert(payload.post)
      .select(POST_COLUMNS)
      .single();
    if (error) throw error;

    try {
      await replaceBlogTags(access.supabase, payload.postId, body.locale, payload.tags);
      await ensureBlogCategory(access.supabase, payload.post.category, body.locale);
      await syncAlternateLink(
        access.supabase,
        { postId: payload.postId, slug: payload.post.slug },
        payload.alternate
      );
    } catch (relatedError) {
      await access.supabase.from(blogDb.tags).delete().eq('post_id', payload.postId).eq('site', BLOG_SITE);
      await access.supabase.from(blogDb.posts).delete().eq('id', data.id).eq('site', BLOG_SITE);
      throw relatedError;
    }

    return NextResponse.json({ post: { ...data, tags: payload.tags } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Blog yazısı oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
