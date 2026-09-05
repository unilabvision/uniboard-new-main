'use client';

import React, { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import {
  MENTORSHIP_TYPES,
  MENTORSHIP_MODES,
  slugifyMentorshipTitle,
  getPublicMentorshipUrl,
} from '@/app/lib/mentorship/config';
import type { Mentorship, MentorshipInput, MentorshipMode, MentorshipType } from '@/app/types/mentorship';

export type MentorshipFormState = {
  slug: string;
  title_tr: string;
  title_en: string;
  summary_tr: string;
  summary_en: string;
  description_tr: string;
  description_en: string;
  mentor_name: string;
  mentor_title: string;
  mentor_bio_tr: string;
  mentor_bio_en: string;
  mentor_image_url: string;
  mentor_linkedin: string;
  mentorship_type: MentorshipType;
  mode: MentorshipMode;
  location_name: string;
  application_deadline: string;
  start_date: string;
  end_date: string;
  max_mentees: string;
  is_application_open: boolean;
  thumbnail_url: string;
  banner_url: string;
  tags: string;
  order_index: string;
  is_active: boolean;
  is_featured: boolean;
};

export function emptyMentorshipForm(): MentorshipFormState {
  return {
    slug: '',
    title_tr: '',
    title_en: '',
    summary_tr: '',
    summary_en: '',
    description_tr: '',
    description_en: '',
    mentor_name: '',
    mentor_title: '',
    mentor_bio_tr: '',
    mentor_bio_en: '',
    mentor_image_url: '',
    mentor_linkedin: '',
    mentorship_type: 'general',
    mode: 'online',
    location_name: '',
    application_deadline: '',
    start_date: '',
    end_date: '',
    max_mentees: '',
    is_application_open: true,
    thumbnail_url: '',
    banner_url: '',
    tags: '',
    order_index: '0',
    is_active: false,
    is_featured: false,
  };
}

function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string | null {
  if (!value?.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function mentorshipToForm(m: Mentorship): MentorshipFormState {
  return {
    slug: m.slug || '',
    title_tr: m.title?.tr || '',
    title_en: m.title?.en || '',
    summary_tr: m.summary?.tr || '',
    summary_en: m.summary?.en || '',
    description_tr: m.description?.tr || '',
    description_en: m.description?.en || '',
    mentor_name: m.mentor_name || '',
    mentor_title: m.mentor_title || '',
    mentor_bio_tr: m.mentor_bio?.tr || '',
    mentor_bio_en: m.mentor_bio?.en || '',
    mentor_image_url: m.mentor_image_url || '',
    mentor_linkedin: m.mentor_linkedin || '',
    mentorship_type: m.mentorship_type || 'general',
    mode: m.mode || 'online',
    location_name: m.location_name || '',
    application_deadline: isoToLocalInput(m.application_deadline),
    start_date: isoToLocalInput(m.start_date),
    end_date: isoToLocalInput(m.end_date),
    max_mentees: m.max_mentees != null ? String(m.max_mentees) : '',
    is_application_open: m.is_application_open ?? true,
    thumbnail_url: m.thumbnail_url || '',
    banner_url: m.banner_url || '',
    tags: (m.tags || []).join(', '),
    order_index: String(m.order_index ?? 0),
    is_active: m.is_active ?? false,
    is_featured: m.is_featured ?? false,
  };
}

export function formStateToPayload(form: MentorshipFormState): MentorshipInput {
  const tags = form.tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    slug: form.slug.trim(),
    title: { tr: form.title_tr.trim(), en: form.title_en.trim() || form.title_tr.trim() },
    summary: { tr: form.summary_tr.trim(), en: form.summary_en.trim() || form.summary_tr.trim() },
    description: {
      tr: form.description_tr.trim(),
      en: form.description_en.trim() || form.description_tr.trim(),
    },
    mentor_name: form.mentor_name.trim() || null,
    mentor_title: form.mentor_title.trim() || null,
    mentor_bio: {
      tr: form.mentor_bio_tr.trim(),
      en: form.mentor_bio_en.trim() || form.mentor_bio_tr.trim(),
    },
    mentor_image_url: form.mentor_image_url.trim() || null,
    mentor_linkedin: form.mentor_linkedin.trim() || null,
    mentorship_type: form.mentorship_type,
    mode: form.mode,
    location_name: form.location_name.trim() || null,
    application_deadline: localInputToIso(form.application_deadline),
    start_date: localInputToIso(form.start_date),
    end_date: localInputToIso(form.end_date),
    max_mentees: form.max_mentees.trim() ? Number(form.max_mentees) : null,
    is_application_open: form.is_application_open,
    thumbnail_url: form.thumbnail_url.trim() || null,
    banner_url: form.banner_url.trim() || null,
    tags: tags.length ? tags : null,
    order_index: Number(form.order_index) || 0,
    is_active: form.is_active,
    is_featured: form.is_featured,
  };
}

const typeLabels: Record<MentorshipType, { tr: string; en: string }> = {
  general: { tr: 'Genel', en: 'General' },
  career: { tr: 'Kariyer', en: 'Career' },
  academic: { tr: 'Akademik', en: 'Academic' },
  technical: { tr: 'Teknik', en: 'Technical' },
  entrepreneurship: { tr: 'Girişimcilik', en: 'Entrepreneurship' },
};

const modeLabels: Record<MentorshipMode, { tr: string; en: string }> = {
  online: { tr: 'Online', en: 'Online' },
  hybrid: { tr: 'Hibrit', en: 'Hybrid' },
  onsite: { tr: 'Yüz yüze', en: 'On-site' },
};

type Props = {
  locale: string;
  form: MentorshipFormState;
  setForm: React.Dispatch<React.SetStateAction<MentorshipFormState>>;
  slugTouched: boolean;
  setSlugTouched: (v: boolean) => void;
};

export default function MentorshipFormFields({
  locale,
  form,
  setForm,
  slugTouched,
  setSlugTouched,
}: Props) {
  const tr = locale === 'tr';
  const [uploading, setUploading] = useState<string | null>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const thumbnailRef = useRef<HTMLInputElement>(null);
  const mentorRef = useRef<HTMLInputElement>(null);
  const fileRefs = {
    banner: bannerRef,
    thumbnail: thumbnailRef,
    mentor: mentorRef,
  };

  const update = <K extends keyof MentorshipFormState>(
    key: K,
    value: MentorshipFormState[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (!slugTouched && (key === 'title_tr' || key === 'title_en')) {
        const source = key === 'title_tr' ? String(value) : prev.title_tr || String(value);
        next.slug = slugifyMentorshipTitle(source);
      }
      return next;
    });
  };

  const uploadImage = async (
    kind: 'banner' | 'thumbnail' | 'mentor',
    file: File
  ) => {
    setUploading(kind);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', kind);
      fd.append('slug', form.slug || 'draft');
      const res = await fetch('/api/mentorship/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      if (kind === 'banner') update('banner_url', data.url);
      if (kind === 'thumbnail') update('thumbnail_url', data.url);
      if (kind === 'mentor') update('mentor_image_url', data.url);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const fieldClass =
    'w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm';
  const labelClass = 'block text-sm font-medium mb-1 text-neutral-700 dark:text-neutral-300';

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{tr ? 'Temel bilgiler' : 'Basic info'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{tr ? 'Başlık (TR)' : 'Title (TR)'}</label>
            <input
              className={fieldClass}
              value={form.title_tr}
              onChange={(e) => update('title_tr', e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{tr ? 'Başlık (EN)' : 'Title (EN)'}</label>
            <input
              className={fieldClass}
              value={form.title_en}
              onChange={(e) => update('title_en', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>{tr ? 'Sayfa adresi (slug)' : 'Slug'}</label>
          <input
            className={fieldClass}
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              update('slug', e.target.value);
            }}
            required
          />
          {form.slug && (
            <p className="text-xs text-neutral-500 mt-1">
              {getPublicMentorshipUrl(locale, form.slug)}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{tr ? 'Özet (TR)' : 'Summary (TR)'}</label>
            <textarea
              className={fieldClass}
              rows={2}
              value={form.summary_tr}
              onChange={(e) => update('summary_tr', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>{tr ? 'Özet (EN)' : 'Summary (EN)'}</label>
            <textarea
              className={fieldClass}
              rows={2}
              value={form.summary_en}
              onChange={(e) => update('summary_en', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{tr ? 'Açıklama (TR)' : 'Description (TR)'}</label>
            <textarea
              className={fieldClass}
              rows={5}
              value={form.description_tr}
              onChange={(e) => update('description_tr', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>{tr ? 'Açıklama (EN)' : 'Description (EN)'}</label>
            <textarea
              className={fieldClass}
              rows={5}
              value={form.description_en}
              onChange={(e) => update('description_en', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>{tr ? 'Tür' : 'Type'}</label>
            <select
              className={fieldClass}
              value={form.mentorship_type}
              onChange={(e) => update('mentorship_type', e.target.value as MentorshipType)}
            >
              {MENTORSHIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t][tr ? 'tr' : 'en']}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{tr ? 'Mod' : 'Mode'}</label>
            <select
              className={fieldClass}
              value={form.mode}
              onChange={(e) => update('mode', e.target.value as MentorshipMode)}
            >
              {MENTORSHIP_MODES.map((m) => (
                <option key={m} value={m}>
                  {modeLabels[m][tr ? 'tr' : 'en']}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{tr ? 'Konum' : 'Location'}</label>
            <input
              className={fieldClass}
              value={form.location_name}
              onChange={(e) => update('location_name', e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{tr ? 'Mentör' : 'Mentor'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{tr ? 'Ad Soyad' : 'Name'}</label>
            <input
              className={fieldClass}
              value={form.mentor_name}
              onChange={(e) => update('mentor_name', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>{tr ? 'Ünvan' : 'Title'}</label>
            <input
              className={fieldClass}
              value={form.mentor_title}
              onChange={(e) => update('mentor_title', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>LinkedIn</label>
          <input
            className={fieldClass}
            value={form.mentor_linkedin}
            onChange={(e) => update('mentor_linkedin', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{tr ? 'Biyografi (TR)' : 'Bio (TR)'}</label>
            <textarea
              className={fieldClass}
              rows={3}
              value={form.mentor_bio_tr}
              onChange={(e) => update('mentor_bio_tr', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>{tr ? 'Biyografi (EN)' : 'Bio (EN)'}</label>
            <textarea
              className={fieldClass}
              rows={3}
              value={form.mentor_bio_en}
              onChange={(e) => update('mentor_bio_en', e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>{tr ? 'Mentör fotoğrafı' : 'Mentor photo'}</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRefs.mentor.current?.click()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
            >
              {uploading === 'mentor' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {tr ? 'Yükle' : 'Upload'}
            </button>
            <input
              ref={fileRefs.mentor}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadImage('mentor', f);
              }}
            />
            <input
              className={fieldClass}
              placeholder="URL"
              value={form.mentor_image_url}
              onChange={(e) => update('mentor_image_url', e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{tr ? 'Tarih & kontenjan' : 'Dates & capacity'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{tr ? 'Başvuru son tarihi' : 'Application deadline'}</label>
            <input
              type="datetime-local"
              className={fieldClass}
              value={form.application_deadline}
              onChange={(e) => update('application_deadline', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>{tr ? 'Maks. mentee' : 'Max mentees'}</label>
            <input
              type="number"
              min={0}
              className={fieldClass}
              value={form.max_mentees}
              onChange={(e) => update('max_mentees', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>{tr ? 'Başlangıç' : 'Start'}</label>
            <input
              type="datetime-local"
              className={fieldClass}
              value={form.start_date}
              onChange={(e) => update('start_date', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>{tr ? 'Bitiş' : 'End'}</label>
            <input
              type="datetime-local"
              className={fieldClass}
              value={form.end_date}
              onChange={(e) => update('end_date', e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{tr ? 'Görseller & yayın' : 'Media & publish'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['banner', 'thumbnail'] as const).map((kind) => (
            <div key={kind}>
              <label className={labelClass}>
                {kind === 'banner' ? 'Banner' : tr ? 'Küçük görsel' : 'Thumbnail'}
              </label>
              <div className="flex items-center gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => fileRefs[kind].current?.click()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm"
                >
                  {uploading === kind ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {tr ? 'Yükle' : 'Upload'}
                </button>
                <input
                  ref={fileRefs[kind]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadImage(kind, f);
                  }}
                />
              </div>
              <input
                className={fieldClass}
                placeholder="URL"
                value={kind === 'banner' ? form.banner_url : form.thumbnail_url}
                onChange={(e) =>
                  update(kind === 'banner' ? 'banner_url' : 'thumbnail_url', e.target.value)
                }
              />
            </div>
          ))}
        </div>
        <div>
          <label className={labelClass}>{tr ? 'Etiketler (virgülle)' : 'Tags (comma-separated)'}</label>
          <input
            className={fieldClass}
            value={form.tags}
            onChange={(e) => update('tags', e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => update('is_active', e.target.checked)}
            />
            {tr ? 'Sitede yayınla (myunilab.net)' : 'Publish on site (myunilab.net)'}
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => update('is_featured', e.target.checked)}
            />
            {tr ? 'Öne çıkan' : 'Featured'}
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_application_open}
              onChange={(e) => update('is_application_open', e.target.checked)}
            />
            {tr ? 'Başvuru açık' : 'Applications open'}
          </label>
        </div>
      </section>
    </div>
  );
}
