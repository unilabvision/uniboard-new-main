'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered,
  Heading2, Link as LinkIcon, RemoveFormatting,
} from 'lucide-react';
import { sanitizeHtml } from '@/app/lib/lms/htmlContent';

interface HtmlDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  helperText?: string;
}

export default function HtmlDescriptionEditor({
  value,
  onChange,
  placeholder = 'Kurs açıklamasını yazın...',
  minHeight = '160px',
  helperText,
}: HtmlDescriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || isInternalChange.current) return;

    const nextHtml = value || '';
    if (el.innerHTML !== nextHtml) {
      el.innerHTML = nextHtml;
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    isInternalChange.current = true;
    onChange(sanitizeHtml(el.innerHTML));
    requestAnimationFrame(() => {
      isInternalChange.current = false;
    });
  }, [onChange]);

  const exec = (command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    editorRef.current?.focus();
    emitChange();
  };

  const addLink = () => {
    const url = window.prompt('Link URL (https://...)');
    if (!url) return;
    exec('createLink', url.startsWith('http') ? url : `https://${url}`);
  };

  const toolbarBtn =
    'p-2 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors';

  return (
    <div className="border border-neutral-300 dark:border-neutral-600 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80">
        <button type="button" onClick={() => exec('bold')} className={toolbarBtn} title="Kalın">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('italic')} className={toolbarBtn} title="İtalik">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('underline')} className={toolbarBtn} title="Altı çizili">
          <Underline className="w-4 h-4" />
        </button>
        <span className="w-px h-6 bg-neutral-200 dark:bg-neutral-600 mx-1" />
        <button type="button" onClick={() => exec('formatBlock', 'h2')} className={toolbarBtn} title="Başlık">
          <Heading2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('insertUnorderedList')} className={toolbarBtn} title="Madde işaretli liste">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('insertOrderedList')} className={toolbarBtn} title="Numaralı liste">
          <ListOrdered className="w-4 h-4" />
        </button>
        <button type="button" onClick={addLink} className={toolbarBtn} title="Link ekle">
          <LinkIcon className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('removeFormat')} className={toolbarBtn} title="Biçimi temizle">
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder={placeholder}
        className="px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-400"
        style={{ minHeight }}
      />

      {helperText && (
        <p className="px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
          {helperText}
        </p>
      )}
    </div>
  );
}
