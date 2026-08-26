'use client';

import React, { useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import {
  COURSE_BANNER_ASPECT_CLASS,
  COURSE_BANNER_HEIGHT,
  COURSE_BANNER_WIDTH,
  COURSE_THUMBNAIL_ASPECT_CLASS,
  COURSE_THUMBNAIL_HEIGHT,
  COURSE_THUMBNAIL_WIDTH,
  type CourseImageKind,
} from '@/app/lib/lms/courseMedia';

type Props = {
  courseId: string;
  kind: CourseImageKind;
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint: string;
  uploadLabel: string;
  removeLabel: string;
  uploadingLabel: string;
};

export default function CourseImageUpload({
  courseId,
  kind,
  value,
  onChange,
  label,
  hint,
  uploadLabel,
  removeLabel,
  uploadingLabel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBanner = kind === 'banner';
  const aspectClass = isBanner ? COURSE_BANNER_ASPECT_CLASS : COURSE_THUMBNAIL_ASPECT_CLASS;
  const dimLabel = isBanner
    ? `${COURSE_BANNER_WIDTH}×${COURSE_BANNER_HEIGHT} px`
    : `${COURSE_THUMBNAIL_WIDTH}×${COURSE_THUMBNAIL_HEIGHT} px`;

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('kind', kind);
      body.append('persist', 'true');
      const res = await fetch(`/api/lms/courses/${encodeURIComponent(courseId)}/media`, {
        method: 'POST',
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Yükleme başarısız');
      }
      onChange(data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme başarısız');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
        <span className="text-xs text-neutral-500 whitespace-nowrap">{dimLabel}</span>
      </div>
      <p className="text-xs text-neutral-500">{hint}</p>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void uploadFile(file);
        }}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors cursor-pointer ${aspectClass} ${
          dragging
            ? 'border-[#990000] bg-[#990000]/5'
            : 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/40 hover:border-neutral-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
          disabled={uploading}
        />

        {value.trim() ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.trim()}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/35 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 text-neutral-900 text-xs font-medium px-3 py-1.5">
                <Upload className="w-3.5 h-3.5" />
                {uploadLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80"
              aria-label={removeLabel}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-500 px-4 text-center">
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">{uploadingLabel}</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 opacity-60" />
                <span className="text-sm">{uploadLabel}</span>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
