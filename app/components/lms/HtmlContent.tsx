'use client';

import React from 'react';
import { sanitizeHtml } from '@/app/lib/lms/htmlContent';

interface HtmlContentProps {
  html: string;
  className?: string;
}

export default function HtmlContent({ html, className = '' }: HtmlContentProps) {
  if (!html?.trim()) return null;

  return (
    <div
      className={`prose prose-sm sm:prose-base prose-neutral dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
