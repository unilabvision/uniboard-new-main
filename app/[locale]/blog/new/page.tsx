'use client';

import React, { useEffect, useState } from 'react';
import BlogPostForm from '@/app/components/blog/BlogPostForm';

export default function NewBlogPostPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState('tr');
  useEffect(() => { params.then((value) => setLocale(value.locale)); }, [params]);
  return <BlogPostForm locale={locale} />;
}
