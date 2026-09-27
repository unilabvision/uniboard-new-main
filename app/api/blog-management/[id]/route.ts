import { NextRequest, NextResponse } from 'next/server';
import { sanitizeHtml } from '@/app/lib/lms/htmlContent';
import { blogDb, BLOG_SITE } from '@/app/lib/blog/config';
import {
  buildBlogPayload,
  ensureBlogCategory,
  getBlogPost,
  POST_COLUMNS,
  replaceBlogTags,
  syncAlternateLink,
  validateBlogInput,
} from '@/app/lib/blog/posts';
import type { BlogPostInput } from '@/app/types/blog';
import { requireBlogCapability, requireBlogModuleUser } from '../_helpers';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const access = await requireBlogModuleUser();
  if (access.error || !access.supabase) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  try {
    const post = await getBlogPost(access.supabase, (await context.params).id);
    if (!post) return NextResponse.json({ error: 'Blog yazısı bulunamadı' }, { status: 404 });
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Yüklenemedi' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const access = await requireBlogCapability('edit');
  if (access.error || !access.supabase) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const id = (await context.params).id;
  const body = (await request.json()) as BlogPostInput;
  const validationError = validateBlogInput(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
  body.content = sanitizeHtml(body.content);

  try {
    const existing = await getBlogPost(access.supabase, id);
    if (!existing) return NextResponse.json({ error: 'Blog yazısı bulunamadı' }, { status: 404 });
    const payload = await buildBlogPayload(access.supabase, body, existing.post_id);
    const { data, error } = await access.supabase
      .from(blogDb.posts)
      .update(payload.post)
      .eq('id', id)
      .eq('site', BLOG_SITE)
      .select(POST_COLUMNS)
      .single();
    if (error) throw error;

    await replaceBlogTags(access.supabase, payload.postId, body.locale, payload.tags);
    await ensureBlogCategory(access.supabase, payload.post.category, body.locale);
    await syncAlternateLink(
      access.supabase,
      { postId: payload.postId, slug: payload.post.slug },
      payload.alternate
    );
    return NextResponse.json({ post: { ...data, tags: payload.tags } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Güncellenemedi' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const access = await requireBlogCapability('delete');
  if (access.error || !access.supabase) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const id = (await context.params).id;
  try {
    const existing = await getBlogPost(access.supabase, id);
    if (!existing) return NextResponse.json({ error: 'Blog yazısı bulunamadı' }, { status: 404 });
    await access.supabase
      .from(blogDb.posts)
      .update({ alternate_post_id: null, alternate_slug: null })
      .eq('alternate_post_id', existing.post_id)
      .eq('site', BLOG_SITE);
    const { error: tagsError } = await access.supabase
      .from(blogDb.tags)
      .delete()
      .eq('post_id', existing.post_id)
      .eq('site', BLOG_SITE);
    if (tagsError) throw tagsError;
    const { error } = await access.supabase
      .from(blogDb.posts)
      .delete()
      .eq('id', id)
      .eq('site', BLOG_SITE);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Silinemedi' }, { status: 500 });
  }
}
