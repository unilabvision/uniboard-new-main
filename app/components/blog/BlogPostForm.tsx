'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  ImagePlus,
  Languages,
  Loader2,
  Save,
  Star,
  Trash2,
} from 'lucide-react';
import HtmlDescriptionEditor from '@/app/components/lms/HtmlDescriptionEditor';
import { getPublicBlogUrl, slugifyBlogTitle } from '@/app/lib/blog/config';
import type { BlogLocale, BlogPost, BlogPostInput } from '@/app/types/blog';

type Category = { name: string; locale: string };

interface BlogPostFormProps {
  locale: string;
  post?: BlogPost | null;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function initialForm(post?: BlogPost | null): BlogPostInput {
  return {
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    category: post?.category ?? '',
    excerpt: post?.excerpt ?? '',
    content: post?.content ?? '',
    image: post?.image ?? '',
    date: post?.date ?? today(),
    featured: post?.featured ?? false,
    locale: post?.locale ?? 'tr',
    tags: post?.tags ?? [],
    alternateId: null,
  };
}

export default function BlogPostForm({ locale, post }: BlogPostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<BlogPostInput>(() => initialForm(post));
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [tagInput, setTagInput] = useState((post?.tags ?? []).join(', '));
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isEdit = Boolean(post?.id);
  const isTr = locale === 'tr';

  useEffect(() => {
    fetch('/api/blog-management?perPage=100')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Blog verileri yüklenemedi');
        setPosts(data.posts ?? []);
        setCategories(data.categories ?? []);
        if (post?.alternate_post_id) {
          const alternate = (data.posts as BlogPost[]).find(
            (item) => item.post_id === post.alternate_post_id
          );
          if (alternate) setForm((current) => ({ ...current, alternateId: alternate.id }));
        }
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Yüklenemedi'));
  }, [post?.alternate_post_id]);

  const localeCategories = useMemo(
    () => categories.filter((item) => item.locale === form.locale),
    [categories, form.locale]
  );
  const alternatePosts = useMemo(
    () => posts.filter((item) => item.locale !== form.locale && item.id !== post?.id),
    [form.locale, post?.id, posts]
  );

  const update = <K extends keyof BlogPostInput>(key: K, value: BlogPostInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const handleTitle = (title: string) => {
    setForm((current) => ({
      ...current,
      title,
      slug: slugTouched ? current.slug : slugifyBlogTitle(title),
    }));
    setSaved(false);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('slug', form.slug || form.title || 'blog');
      const response = await fetch('/api/blog-management/upload', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Görsel yüklenemedi');
      update('image', data.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Görsel yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = {
        ...form,
        tags: tagInput.split(',').map((tag) => tag.trim()).filter(Boolean),
      };
      const response = await fetch(
        isEdit ? `/api/blog-management/${post!.id}` : '/api/blog-management',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Kaydedilemedi');
      if (!isEdit) {
        router.push(`/${locale}/blog/${data.post.id}`);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async () => {
    if (!post || !window.confirm(isTr ? 'Bu yazı kalıcı olarak silinsin mi?' : 'Delete this post permanently?')) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/blog-management/${post.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Silinemedi');
      router.push(`/${locale}/blog`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Silinemedi');
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={submit} className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <Link href={`/${locale}/blog`} className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#990000] dark:text-neutral-300">
            <ArrowLeft className="h-4 w-4" />
            {isTr ? 'Yazılara dön' : 'Back to posts'}
          </Link>
          <div className="flex items-center gap-2">
            {isEdit && (
              <a href={getPublicBlogUrl(form.locale, form.slug)} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900 sm:inline-flex">
                <ExternalLink className="h-4 w-4" /> {isTr ? 'Sitede aç' : 'Open on site'}
              </a>
            )}
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#990000] px-4 py-2 text-sm font-medium text-white hover:bg-[#7d0000] disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isTr ? 'Kaydet ve yayınla' : 'Save and publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <main className="space-y-6">
          <div>
            <p className="mb-2 text-sm text-[#990000]">{isEdit ? (isTr ? 'Yazıyı düzenle' : 'Edit post') : (isTr ? 'Yeni yazı' : 'New post')}</p>
            <input value={form.title} onChange={(event) => handleTitle(event.target.value)} placeholder={isTr ? 'Yazının başlığı' : 'Post title'} className="w-full border-0 bg-transparent p-0 text-3xl font-semibold tracking-tight text-neutral-950 outline-none placeholder:text-neutral-300 focus:ring-0 dark:text-white dark:placeholder:text-neutral-700 sm:text-4xl" />
          </div>

          <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <label className="mb-2 block text-sm font-medium">{isTr ? 'Kısa özet' : 'Excerpt'}</label>
            <textarea value={form.excerpt} maxLength={320} onChange={(event) => update('excerpt', event.target.value)} rows={3} placeholder={isTr ? 'Liste kartında ve arama sonuçlarında görünecek kısa açıklama.' : 'A short description shown in cards and search results.'} className="w-full resize-none rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[#990000] focus:ring-1 focus:ring-[#990000] dark:border-neutral-700" />
            <p className="mt-1 text-right text-xs text-neutral-400">{form.excerpt?.length ?? 0}/320</p>
          </section>

          <section>
            <div className="mb-2 flex items-end justify-between">
              <label className="text-sm font-medium">{isTr ? 'Yazı içeriği' : 'Post content'}</label>
              <span className="text-xs text-neutral-400">HTML</span>
            </div>
            <HtmlDescriptionEditor value={form.content} onChange={(value) => update('content', value)} minHeight="460px" placeholder={isTr ? 'Okuyucuyla paylaşmak istediğiniz içeriği yazın…' : 'Write the content you want to share…'} helperText={isTr ? 'Başlık, liste ve bağlantı araçlarıyla içeriği biçimlendirebilirsiniz.' : 'Format content with headings, lists and links.'} />
          </section>
        </main>

        <aside className="space-y-5">
          <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4 text-[#990000]" />{isTr ? 'Yayın ayarları' : 'Publishing'}</h2>
            <div className="space-y-4">
              <label className="block text-sm"><span className="mb-1.5 block text-neutral-600 dark:text-neutral-300">{isTr ? 'Dil' : 'Language'}</span><select value={form.locale} onChange={(event) => update('locale', event.target.value as BlogLocale)} className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"><option value="tr">Türkçe</option><option value="en">English</option></select></label>
              <label className="block text-sm"><span className="mb-1.5 block text-neutral-600 dark:text-neutral-300">Slug</span><input value={form.slug} onChange={(event) => { setSlugTouched(true); update('slug', slugifyBlogTitle(event.target.value)); }} required className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700" /></label>
              <label className="block text-sm"><span className="mb-1.5 block text-neutral-600 dark:text-neutral-300">{isTr ? 'Yayın tarihi' : 'Publish date'}</span><input type="date" value={form.date} onChange={(event) => update('date', event.target.value)} required className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700" /></label>
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"><span className="flex items-center gap-2 text-sm"><Star className="h-4 w-4 text-amber-500" />{isTr ? 'Öne çıkar' : 'Featured'}</span><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} className="h-4 w-4 accent-[#990000]" /></label>
            </div>
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="mb-4 font-semibold">{isTr ? 'Sınıflandırma' : 'Classification'}</h2>
            <div className="space-y-4">
              <label className="block text-sm"><span className="mb-1.5 block text-neutral-600 dark:text-neutral-300">{isTr ? 'Kategori' : 'Category'}</span><input list="blog-categories" value={form.category} onChange={(event) => update('category', event.target.value)} required className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700" /><datalist id="blog-categories">{localeCategories.map((item) => <option key={`${item.locale}-${item.name}`} value={item.name} />)}</datalist></label>
              <label className="block text-sm"><span className="mb-1.5 block text-neutral-600 dark:text-neutral-300">{isTr ? 'Etiketler' : 'Tags'}</span><input value={tagInput} onChange={(event) => { setTagInput(event.target.value); setSaved(false); }} placeholder={isTr ? 'eğitim, teknoloji, kariyer' : 'education, technology, career'} className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700" /><span className="mt-1 block text-xs text-neutral-400">{isTr ? 'Virgülle ayırın' : 'Separate with commas'}</span></label>
              <label className="block text-sm"><span className="mb-1.5 flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300"><Languages className="h-4 w-4" />{isTr ? 'Diğer dildeki karşılığı' : 'Alternate language version'}</span><select value={form.alternateId ?? ''} onChange={(event) => update('alternateId', event.target.value || null)} className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"><option value="">{isTr ? 'Eşleştirme yok' : 'No alternate'}</option>{alternatePosts.map((item) => <option key={item.id} value={item.id}>{item.locale.toUpperCase()} — {item.title}</option>)}</select></label>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="aspect-video bg-neutral-100 dark:bg-neutral-800">{form.image ? <div role="img" aria-label={form.title || 'Blog cover'} className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${form.image})` }} /> : <div className="flex h-full items-center justify-center text-neutral-400"><ImagePlus className="h-8 w-8" /></div>}</div>
            <div className="p-4"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 px-3 py-2 text-sm hover:border-[#990000] dark:border-neutral-700">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{isTr ? 'Kapak görseli yükle' : 'Upload cover image'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} /></label><p className="mt-2 text-xs text-neutral-400">1600 × 900 px · JPG, PNG, WebP · 5 MB</p></div>
          </section>

          {saved && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{isTr ? 'Değişiklikler yayınlandı.' : 'Changes published.'}</p>}
          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
          {isEdit && <button type="button" onClick={deletePost} disabled={deleting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30">{deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{isTr ? 'Yazıyı sil' : 'Delete post'}</button>}
        </aside>
      </div>
    </form>
  );
}
