'use client';

import React, { useRef, useState } from 'react';
import {
  Link2,
  FolderOpen,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Upload,
  Loader2,
  FileText,
} from 'lucide-react';
import type { CourseNote } from '@/app/types/course';
import { MAX_RESOURCE_PDF_BYTES, hasPdfSignature } from '@/app/lib/lms/resourceStorage';

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
  const [status, setStatus] = useState<
    'idle' | 'uploading' | 'saving' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedStorageRef, setUploadedStorageRef] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBusy = status === 'uploading' || status === 'saving';

  const cleanupUploadedPdf = async (storageRef = uploadedStorageRef) => {
    if (!storageRef) return;
    await fetch('/api/lms/resources/finalize', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storage_ref: storageRef }),
    }).catch(() => undefined);
  };

  const handleClose = () => {
    if (isBusy) return;
    if (uploadedStorageRef) void cleanupUploadedPdf();
    onClose();
  };

  const handlePdfUpload = async (file: File | undefined) => {
    if (!file) return;

    if (
      !file.name.toLowerCase().endsWith('.pdf') ||
      (file.type && file.type !== 'application/pdf')
    ) {
      setStatus('error');
      setMessage('Yalnızca PDF dosyası yükleyebilirsiniz.');
      return;
    }
    if (!file.size || file.size > MAX_RESOURCE_PDF_BYTES) {
      setStatus('error');
      setMessage('PDF dosyası boş olmamalı ve en fazla 5 MB olmalıdır.');
      return;
    }

    const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    if (!hasPdfSignature(signature)) {
      setStatus('error');
      setMessage('Seçilen dosya geçerli bir PDF değil.');
      return;
    }

    setStatus('uploading');
    setMessage('PDF yükleniyor ve doğrulanıyor...');
    let pendingStorageRef = '';

    try {
      const previousStorageRef = uploadedStorageRef;
      const uploadUrlResponse = await fetch('/api/lms/resources/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          file_name: file.name,
          file_size: file.size,
          mime_type: 'application/pdf',
        }),
      });
      const uploadInfo = await uploadUrlResponse.json().catch(() => ({}));
      if (!uploadUrlResponse.ok || !uploadInfo.signedUrl || !uploadInfo.storageRef) {
        throw new Error(uploadInfo.error || 'Yükleme adresi oluşturulamadı.');
      }
      pendingStorageRef = uploadInfo.storageRef;

      const uploadResponse = await fetch(uploadInfo.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
          'x-upsert': 'false',
        },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error('PDF bucket\'a yüklenemedi.');

      const finalizeResponse = await fetch('/api/lms/resources/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_ref: uploadInfo.storageRef }),
      });
      const finalized = await finalizeResponse.json().catch(() => ({}));
      if (!finalizeResponse.ok || !finalized.url) {
        throw new Error(finalized.error || 'Yüklenen PDF doğrulanamadı.');
      }

      if (previousStorageRef) await cleanupUploadedPdf(previousStorageRef);
      setUrl(finalized.url);
      setUploadedUrl(finalized.url);
      setUploadedStorageRef(uploadInfo.storageRef);
      pendingStorageRef = '';
      setUploadedFileName(file.name);
      if (!title.trim()) setTitle(file.name.replace(/\.pdf$/i, ''));
      setStatus('success');
      setMessage('PDF yüklendi. Kaydet düğmesiyle derse ekleyin.');
    } catch (error) {
      if (pendingStorageRef) await cleanupUploadedPdf(pendingStorageRef);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'PDF yüklenemedi.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) {
      setStatus('error');
      setMessage('Başlık ve URL zorunludur.');
      return;
    }

    try {
      const parsedUrl = new URL(url.trim());
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('invalid protocol');
    } catch {
      setStatus('error');
      setMessage('Geçerli bir URL girin (https://...).');
      return;
    }

    setStatus('saving');
    setMessage('');

    try {
      if (uploadedStorageRef && url.trim() !== uploadedUrl) {
        await cleanupUploadedPdf();
        setUploadedStorageRef('');
        setUploadedUrl('');
        setUploadedFileName('');
      }
      const content = description.trim() || (isUrl ? 'Harici bağlantı' : 'Eğitim kaynağı');
      const res = await fetch('/api/lms/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          title: title.trim(),
          content,
          content_type: 'text',
          file_url: url.trim(),
          order_index: orderIndex,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Kaydedilemedi');

      setStatus('success');
      setMessage('Kaydedildi');
      setUploadedStorageRef('');
      onSaved({ ...data.note, content } as CourseNote);
      setTimeout(onClose, 600);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Kayıt hatası');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/30" onClick={isBusy ? undefined : handleClose} />
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
                {isUrl ? 'Harici URL Ekle' : 'Kaynak / PDF'}
              </h2>
            </div>
            <button type="button" onClick={handleClose} className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {!isUrl && (
              <div>
                <label className="text-sm font-medium block mb-1.5">PDF yükle</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={isBusy}
                  onChange={(event) => void handlePdfUpload(event.target.files?.[0])}
                  className="sr-only"
                />
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700 px-4 py-4 text-sm hover:bg-amber-50 dark:hover:bg-amber-950/20 disabled:opacity-60"
                >
                  <span className="flex items-center justify-center gap-2 font-medium">
                    {status === 'uploading' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : uploadedFileName ? (
                      <FileText className="h-5 w-5 text-amber-600" />
                    ) : (
                      <Upload className="h-5 w-5 text-amber-600" />
                    )}
                    {status === 'uploading'
                      ? 'Yükleniyor...'
                      : uploadedFileName || 'Bilgisayardan PDF seç'}
                  </span>
                  <span className="mt-1 block text-xs text-neutral-500">En fazla 5 MB</span>
                </button>
                <div className="my-3 flex items-center gap-3 text-xs text-neutral-400">
                  <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                  veya PDF bağlantısı
                  <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
                </div>
              </div>
            )}
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
              <label className="text-sm font-medium block mb-1">
                {isUrl ? 'URL' : 'PDF URL'}
              </label>
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
              onClick={handleClose}
              disabled={isBusy}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-neutral-50 dark:hover:bg-neutral-700"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isBusy}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-[#990000] text-white disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {status === 'saving'
                ? 'Kaydediliyor...'
                : status === 'uploading'
                  ? 'PDF yükleniyor...'
                  : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
