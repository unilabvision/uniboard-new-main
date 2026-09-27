'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import BlogPostForm from '@/app/components/blog/BlogPostForm';
import type { BlogPost } from '@/app/types/blog';

export default function EditBlogPostPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const [locale, setLocale] = useState('tr');
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async ({ locale: nextLocale, id }) => {
      setLocale(nextLocale);
      try {
        const response = await fetch(`/api/blog-management/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Blog yazısı yüklenemedi');
        setPost(data.post);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Blog yazısı yüklenemedi');
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#990000]" /></div>;
  if (error || !post) return <div className="mx-auto max-w-xl p-8 text-red-700">{error || 'Not found'}</div>;
  return <BlogPostForm locale={locale} post={post} />;
}
