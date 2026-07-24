'use client';

import React, { useState } from 'react';
import { Link2, FolderOpen, X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import type { CourseNote } from '@/app/types/course';

interface ResourceLinkModalProps {
  lessonId: string;
  mode: 'url' | 'resource';
  onSaved: (note: CourseNote) => void;
  onClose: () => void;
  orderIndex?: number;
}

export default function ResourceLinkModal({
  lessonId,
  mode,
  onSaved,
  onClose,
  orderIndex = 0,
}: ResourceLinkModalProps) {
  const isUrl = mode === 'url';
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) {
      setStatus('error');
      setMessage('Başlık ve URL zorunludur.');
      return;
    }

    try {
      // Basic URL check
      // eslint-disable-next-line no-new
      new URL(url.trim());
    } catch {
      setStatus('error');
      setMessage('Geçerli bir URL girin (https://...).');
      return;
    }

    setStatus('saving');
    setMessage('');

    try {
      const res = await fetch('/api/lms/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          title: title.trim(),
          content: description.trim() || (isUrl ? 'Harici bağlantı' : 'Eğitim kaynağı'),
          content_type: 'text',
          file_url: url.trim(),
          order_index: orderIndex,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Kaydedilemedi');

      setStatus('success');
      setMessage('Kaydedildi');
      onSaved(data.note as CourseNote);
      setTimeout(onClose, 600);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Kayıt hatası');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              {isUrl ? (
                <Link2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <FolderOpen className="w-5 h-5 text-amber-600" />
              )}
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                {isUrl ? 'Harici URL Ekle' : 'Kaynak / Dosya Linki'}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Başlık</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isUrl ? 'Örn. Canva sunumu' : 'Örn. Modül 1 PDF'}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">URL</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border px-3 py-2 text-sm font-mono dark:bg-neutral-900"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Açıklama (opsiyonel)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-neutral-900"
              />
            </div>

            {message && (
              <p
                className={`text-sm flex items-center gap-1.5 ${
                  status === 'error' ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {status === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {message}
              </p>
            )}
          </div>

          <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={status === 'saving'}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[#990000] text-white disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {status === 'saving' ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
