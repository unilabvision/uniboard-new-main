'use client';

import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

function normalizeLatexDelimiters(content: string): string {
  return content
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g)
    .map((section, index) => {
      if (index % 2 === 1) return section;

      return section
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, expression: string) => `$$${expression}$$`)
        .replace(/\\\((.*?)\\\)/g, (_, expression: string) => `$${expression}$`);
    })
    .join('');
}

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  if (!content.trim()) return null;

  return (
    <article
      className={`prose prose-sm sm:prose-base prose-neutral dark:prose-invert max-w-none
        prose-headings:scroll-mt-6 prose-headings:font-semibold prose-headings:tracking-tight
        prose-p:leading-7 prose-a:text-[#990000] prose-a:underline prose-a:underline-offset-2
        prose-blockquote:border-l-[#990000] prose-blockquote:bg-neutral-50 prose-blockquote:px-4 prose-blockquote:py-1
        dark:prose-blockquote:bg-neutral-900/60
        prose-code:rounded prose-code:bg-neutral-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em]
        prose-code:before:content-none prose-code:after:content-none dark:prose-code:bg-neutral-800
        prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:border prose-pre:border-neutral-200
        prose-pre:bg-neutral-950 prose-pre:text-neutral-100 dark:prose-pre:border-neutral-700
        prose-img:mx-auto prose-img:rounded-lg prose-img:border prose-img:border-neutral-200 dark:prose-img:border-neutral-700
        prose-table:block prose-table:overflow-x-auto prose-table:whitespace-nowrap
        prose-th:bg-neutral-100 prose-th:px-3 prose-th:py-2 dark:prose-th:bg-neutral-800
        prose-td:px-3 prose-td:py-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          input: (props) => <input {...props} disabled className="mr-2 accent-[#990000]" />,
        }}
      >
        {normalizeLatexDelimiters(content)}
      </ReactMarkdown>
    </article>
  );
}
