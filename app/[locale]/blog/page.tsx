'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ExternalLink,
  FilePlus2,
  Languages,
  Loader2,
  Pencil,
  Search,
  Star,
} from 'lucide-react';
import { getPublicBlogUrl } from '@/app/lib/blog/config';
import type { BlogPost } from '@/app/types/blog';

export default function BlogPostsPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState('tr');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'all' | 'tr' | 'en'>('all');
  const isTr = locale === 'tr';

  useEffect(() => { params.then((value) => setLocale(value.locale)); }, [params]);
  useEffect(() => {
    fetch('/api/blog-management?perPage=100')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Blog yazıları yüklenemedi');
        setPosts(data.posts ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Blog yazıları yüklenemedi'))
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US');
    return posts.filter((post) => {
      if (language !== 'all' && post.locale !== language) return false;
      if (!normalizedQuery) return true;
      return [post.title, post.category, post.slug, ...post.tags]
        .some((value) => value.toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US').includes(normalizedQuery));
    });
  }, [language, locale, posts, query]);

  const featuredCount = posts.filter((post) => post.featured).length;
  const trCount = posts.filter((post) => post.locale === 'tr').length;
  const enCount = posts.filter((post) => post.locale === 'en').length;

  if (loading) return <div className="flex items-center justify-center py-24 text-neutral-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />{isTr ? 'Yazılar yükleniyor…' : 'Loading posts…'}</div>;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#990000] text-white"><BookOpen className="h-5 w-5" /></div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">{isTr ? 'Blog yayın masası' : 'Blog publishing desk'}</h1>
          <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">{isTr ? 'myunilab.net’te yayınlanan Türkçe ve İngilizce yazıları tek yerden yönetin.' : 'Manage Turkish and English posts published on myunilab.net from one place.'}</p>
        </div>
        <Link href={`/${locale}/blog/new`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#990000] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#7d0000]"><FilePlus2 className="h-4 w-4" />{isTr ? 'Yeni yazı' : 'New post'}</Link>
      </header>

      <div className="mb-7 grid grid-cols-2 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:grid-cols-4">
        {[{ label: isTr ? 'Toplam yazı' : 'Total posts', value: total }, { label: 'Türkçe', value: trCount }, { label: 'English', value: enCount }, { label: isTr ? 'Öne çıkan' : 'Featured', value: featuredCount }].map((item, index) => (
          <div key={item.label} className={`px-5 py-4 ${index % 2 ? 'border-l' : ''} ${index > 1 ? 'border-t lg:border-t-0' : ''} lg:border-l first:lg:border-l-0 border-neutral-200 dark:border-neutral-800`}><p className="text-xs text-neutral-500">{item.label}</p><p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p></div>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isTr ? 'Başlık, kategori veya etiket ara' : 'Search title, category or tag'} className="w-full rounded-lg border border-neutral-300 bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-[#990000] dark:border-neutral-700" /></div>
          <div className="flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">{(['all', 'tr', 'en'] as const).map((value) => <button key={value} type="button" onClick={() => setLanguage(value)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${language === value ? 'bg-white text-neutral-950 shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-500'}`}>{value === 'all' ? (isTr ? 'Tümü' : 'All') : value.toUpperCase()}</button>)}</div>
        </div>

        {error ? <p className="p-6 text-red-700">{error}</p> : filteredPosts.length === 0 ? (
          <div className="p-14 text-center"><BookOpen className="mx-auto mb-3 h-9 w-9 text-neutral-300" /><h2 className="font-medium">{isTr ? 'Yazı bulunamadı' : 'No posts found'}</h2><p className="mt-1 text-sm text-neutral-500">{isTr ? 'Filtreyi değiştirin veya ilk yazınızı oluşturun.' : 'Adjust the filter or create your first post.'}</p></div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredPosts.map((post) => (
              <article key={post.id} className="group grid gap-4 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:items-center">
                <div className="aspect-video overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">{post.image ? <div role="img" aria-label={post.title} className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.03]" style={{ backgroundImage: `url(${post.image})` }} /> : <div className="flex h-full items-center justify-center"><BookOpen className="h-6 w-6 text-neutral-300" /></div>}</div>
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2"><span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">{post.locale.toUpperCase()}</span><span className="text-xs text-neutral-500">{post.category}</span>{post.featured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}</div>
                  <h2 className="truncate font-semibold text-neutral-950 dark:text-white">{post.title}</h2>
                  <p className="mt-1 flex items-center gap-2 truncate text-xs text-neutral-500"><span>{new Date(post.date).toLocaleDateString(post.locale === 'tr' ? 'tr-TR' : 'en-US')}</span>{post.alternate_post_id && <span className="inline-flex items-center gap-1"><Languages className="h-3 w-3" />{isTr ? 'Dil eşleşti' : 'Linked translation'}</span>}</p>
                </div>
                <div className="flex items-center gap-2 sm:justify-end"><a href={getPublicBlogUrl(post.locale, post.slug)} target="_blank" rel="noreferrer" aria-label={isTr ? 'Sitede aç' : 'Open on site'} className="rounded-lg border border-neutral-200 p-2 text-neutral-500 hover:border-[#990000] hover:text-[#990000] dark:border-neutral-700"><ExternalLink className="h-4 w-4" /></a><Link href={`/${locale}/blog/${post.id}`} className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium hover:border-[#990000] hover:text-[#990000] dark:border-neutral-700"><Pencil className="h-4 w-4" />{isTr ? 'Düzenle' : 'Edit'}</Link></div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
