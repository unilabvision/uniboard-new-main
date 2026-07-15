'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ImageIcon, Loader2, Upload, X } from 'lucide-react';
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  EVENT_BANNER_HEIGHT,
  EVENT_BANNER_WIDTH,
  EVENT_IMAGE_MAX_BYTES,
  EVENT_THUMBNAIL_HEIGHT,
  EVENT_THUMBNAIL_WIDTH,
  getPublicEventUrl,
  parseBooleanField,
  slugifyEventTitle,
  toIsoDateTime,
  toIsoDateTimeOptional,
} from '@/app/lib/events/config';
import { formatEventImageSize } from '@/app/lib/events/storage';
import type { EventStatus, EventType, MyuniEvent } from '@/app/types/events';

const texts = {
  tr: {
    basic: 'Temel Bilgiler',
    schedule: 'Tarih & Konum',
    media: 'Görsel & Organizatör',
    publish: 'Yayın',
    slug: 'Sayfa adresi',
    slugHint: 'Başlıktan otomatik oluşturulur',
    slugCustomize: 'Adresi düzenle',
    slugCustomizeHide: 'Otomatik adrese dön',
    slugPlaceholder: 'etkinlik-basligi',
    title: 'Başlık',
    description: 'Açıklama',
    eventType: 'Etkinlik türü',
    status: 'Durum',
    startDate: 'Başlangıç',
    endDate: 'Bitiş',
    timezone: 'Saat dilimi',
    duration: 'Süre (dk)',
    online: 'Online etkinlik',
    locationName: 'Mekan adı',
    locationAddress: 'Adres',
    meetingUrl: 'Toplantı linki',
    paid: 'Ücretli',
    price: 'Fiyat (₺)',
    maxAttendees: 'Maks. katılımcı',
    registrationDeadline: 'Kayıt son tarihi',
    registrationOpen: 'Kayıt açık (kapalıysa sitede görünür, kayıt alınmaz)',
    thumbnail: 'Küçük görsel',
    thumbnailHint: `Önerilen boyut: ${EVENT_THUMBNAIL_WIDTH}×${EVENT_THUMBNAIL_HEIGHT} px (liste / kart)`,
    banner: 'Banner',
    bannerHint: `Önerilen boyut: ${EVENT_BANNER_WIDTH}×${EVENT_BANNER_HEIGHT} px (sitede tam oturur)`,
    bannerPreview: 'Sitede görünüm önizlemesi',
    uploadDrop: 'Sürükleyip bırakın veya seçin',
    uploadFormats: `JPEG, PNG, WebP — en fazla ${formatEventImageSize(EVENT_IMAGE_MAX_BYTES)}`,
    uploading: 'Yükleniyor…',
    uploadError: 'Görsel yüklenemedi',
    removeImage: 'Kaldır',
    orUrl: 'veya URL yapıştır',
    hideUrl: 'URL alanını gizle',
    urlOptional: 'İsteğe bağlı — harici bir link de kullanabilirsiniz',
    organizerName: 'Organizatör',
    organizerEmail: 'Organizatör e-posta',
    organizerLinkedin: 'LinkedIn',
    active: 'Aktif (sitede görünsün)',
    featured: 'Öne çıkan',
    category: 'Kategori',
  },
  en: {
    basic: 'Basic Info',
    schedule: 'Schedule & Location',
    media: 'Media & Organizer',
    publish: 'Publishing',
    slug: 'Page address',
    slugHint: 'Generated automatically from the title',
    slugCustomize: 'Customize address',
    slugCustomizeHide: 'Use automatic address',
    slugPlaceholder: 'event-title',
    title: 'Title',
    description: 'Description',
    eventType: 'Event type',
    status: 'Status',
    startDate: 'Start',
    endDate: 'End',
    timezone: 'Timezone',
    duration: 'Duration (min)',
    online: 'Online event',
    locationName: 'Venue name',
    locationAddress: 'Address',
    meetingUrl: 'Meeting URL',
    paid: 'Paid',
    price: 'Price',
    maxAttendees: 'Max attendees',
    registrationDeadline: 'Registration deadline',
    registrationOpen: 'Registration open (if off, event stays visible; no new sign-ups)',
    thumbnail: 'Thumbnail',
    thumbnailHint: `Recommended size: ${EVENT_THUMBNAIL_WIDTH}×${EVENT_THUMBNAIL_HEIGHT} px (list / card)`,
    banner: 'Banner',
    bannerHint: `Recommended size: ${EVENT_BANNER_WIDTH}×${EVENT_BANNER_HEIGHT} px (fits the site exactly)`,
    bannerPreview: 'Site preview',
    uploadDrop: 'Drag & drop or browse',
    uploadFormats: `JPEG, PNG, WebP — max ${formatEventImageSize(EVENT_IMAGE_MAX_BYTES)}`,
    uploading: 'Uploading…',
    uploadError: 'Upload failed',
    removeImage: 'Remove',
    orUrl: 'or paste a URL',
    hideUrl: 'Hide URL field',
    urlOptional: 'Optional — you can also use an external link',
    organizerName: 'Organizer',
    organizerEmail: 'Organizer email',
    organizerLinkedin: 'LinkedIn',
    active: 'Active (visible on site)',
    featured: 'Featured',
    category: 'Category',
  },
};

export type EventFormState = {
  slug: string;
  title: string;
  description: string;
  event_type: EventType;
  status: EventStatus;
  start_date: string;
  end_date: string;
  timezone: string;
  duration_minutes: string;
  is_online: boolean;
  location_name: string;
  location_address: string;
  meeting_url: string;
  is_paid: boolean;
  price: string;
  max_attendees: string;
  registration_deadline: string;
  is_registration_open: boolean;
  thumbnail_url: string;
  banner_url: string;
  organizer_name: string;
  organizer_email: string;
  organizer_linkedin: string;
  category: string;
  is_active: boolean;
  is_featured: boolean;
};

export function emptyEventForm(): EventFormState {
  return {
    slug: '',
    title: '',
    description: '',
    event_type: 'seminar',
    status: 'upcoming',
    start_date: '',
    end_date: '',
    timezone: 'Europe/Istanbul',
    duration_minutes: '',
    is_online: true,
    location_name: '',
    location_address: '',
    meeting_url: '',
    is_paid: false,
    price: '',
    max_attendees: '',
    registration_deadline: '',
    is_registration_open: true,
    thumbnail_url: '',
    banner_url: '',
    organizer_name: '',
    organizer_email: '',
    organizer_linkedin: '',
    category: '',
    is_active: true,
    is_featured: false,
  };
}

export function eventToFormState(event: MyuniEvent): EventFormState {
  return {
    slug: event.slug,
    title: event.title,
    description: event.description || '',
    event_type: event.event_type,
    status: event.status,
    start_date: event.start_date ? event.start_date.slice(0, 16) : '',
    end_date: event.end_date ? event.end_date.slice(0, 16) : '',
    timezone: event.timezone || 'Europe/Istanbul',
    duration_minutes: event.duration_minutes != null ? String(event.duration_minutes) : '',
    is_online: parseBooleanField(event.is_online, true),
    location_name: event.location_name || '',
    location_address: event.location_address || '',
    meeting_url: event.meeting_url || '',
    is_paid: parseBooleanField(event.is_paid),
    price: event.price != null ? String(event.price) : '',
    max_attendees: event.max_attendees != null ? String(event.max_attendees) : '',
    registration_deadline: event.registration_deadline
      ? event.registration_deadline.slice(0, 16)
      : '',
    is_registration_open: parseBooleanField(event.is_registration_open, true),
    thumbnail_url: event.thumbnail_url || '',
    banner_url: event.banner_url || '',
    organizer_name: event.organizer_name || '',
    organizer_email: event.organizer_email || '',
    organizer_linkedin: event.organizer_linkedin || '',
    category: event.category || '',
    is_active: parseBooleanField(event.is_active, true),
    is_featured: parseBooleanField(event.is_featured),
  };
}

export function formStateToPayload(form: EventFormState) {
  const title = form.title.trim();
  const slug = form.slug.trim() || slugifyEventTitle(title);

  return {
    slug,
    title,
    description: form.description.trim() || null,
    event_type: form.event_type,
    status: form.status,
    start_date: toIsoDateTime(form.start_date, 'start_date'),
    end_date: toIsoDateTimeOptional(form.end_date),
    timezone: form.timezone,
    duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
    is_online: form.is_online,
    location_name: form.location_name.trim() || null,
    location_address: form.location_address.trim() || null,
    meeting_url: form.meeting_url.trim() || null,
    is_paid: form.is_paid,
    price: form.is_paid && form.price ? Number(form.price) : null,
    max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
    registration_deadline: toIsoDateTimeOptional(form.registration_deadline),
    is_registration_open: form.is_registration_open,
    thumbnail_url: form.thumbnail_url.trim() || null,
    banner_url: form.banner_url.trim() || null,
    organizer_name: form.organizer_name.trim() || null,
    organizer_email: form.organizer_email.trim() || null,
    organizer_linkedin: form.organizer_linkedin.trim() || null,
    category: form.category.trim() || null,
    is_active: form.is_active,
    is_featured: form.is_featured,
  };
}

export default function EventFormFields({
  locale,
  form,
  setForm,
  slugTouched,
  setSlugTouched,
  isEdit = false,
}: {
  locale: string;
  form: EventFormState;
  setForm: React.Dispatch<React.SetStateAction<EventFormState>>;
  slugTouched: boolean;
  setSlugTouched: (v: boolean) => void;
  isEdit?: boolean;
}) {
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const [showCustomSlug, setShowCustomSlug] = useState(false);

  const patch = (partial: Partial<EventFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const previewSlug = form.slug || slugifyEventTitle(form.title) || t.slugPlaceholder;
  const previewUrl = getPublicEventUrl(locale, previewSlug);

  const toggleCustomSlug = () => {
    if (showCustomSlug) {
      setShowCustomSlug(false);
      if (!isEdit) {
        setSlugTouched(false);
        if (form.title) {
          setForm((prev) => ({ ...prev, slug: slugifyEventTitle(prev.title) }));
        }
      }
      return;
    }
    setShowCustomSlug(true);
  };

  useEffect(() => {
    if (!slugTouched && form.title) {
      setForm((prev) => ({ ...prev, slug: slugifyEventTitle(prev.title) }));
    }
  }, [form.title, slugTouched, setForm]);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-semibold text-neutral-800 dark:text-neutral-200">{t.basic}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label={t.title} value={form.title} onChange={(v) => patch({ title: v })} required />
          </div>
          <div className="sm:col-span-2">
            <p className="block text-sm font-medium mb-1">{t.slug}</p>
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/40 px-3 py-2.5">
              <p className="text-sm text-neutral-800 dark:text-neutral-200 break-all font-mono">
                {previewUrl}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t.slugHint}</p>
            </div>
            <button
              type="button"
              onClick={toggleCustomSlug}
              className="mt-2 text-xs text-[#990000] hover:underline"
            >
              {showCustomSlug ? t.slugCustomizeHide : t.slugCustomize}
            </button>
            {showCustomSlug && (
              <div className="mt-3">
                <Field
                  label={t.slug}
                  value={form.slug}
                  onChange={(v) => {
                    setSlugTouched(true);
                    patch({ slug: slugifyEventTitle(v) });
                  }}
                  required
                />
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">{t.description}</label>
            <textarea
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
              rows={5}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-600"
            />
          </div>
          <Select
            label={t.eventType}
            value={form.event_type}
            onChange={(v) => patch({ event_type: v as EventType })}
            options={EVENT_TYPES}
          />
          <Select
            label={t.status}
            value={form.status}
            onChange={(v) => patch({ status: v as EventStatus })}
            options={EVENT_STATUSES}
          />
          <Field label={t.category} value={form.category} onChange={(v) => patch({ category: v })} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">{t.schedule}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t.startDate} type="datetime-local" value={form.start_date} onChange={(v) => patch({ start_date: v })} required />
          <Field label={t.endDate} type="datetime-local" value={form.end_date} onChange={(v) => patch({ end_date: v })} />
          <Field label={t.timezone} value={form.timezone} onChange={(v) => patch({ timezone: v })} />
          <Field label={t.duration} value={form.duration_minutes} onChange={(v) => patch({ duration_minutes: v })} />
          <Toggle label={t.online} checked={form.is_online} onChange={(v) => patch({ is_online: v })} />
          <Field label={t.locationName} value={form.location_name} onChange={(v) => patch({ location_name: v })} />
          <Field label={t.locationAddress} value={form.location_address} onChange={(v) => patch({ location_address: v })} />
          <Field label={t.meetingUrl} value={form.meeting_url} onChange={(v) => patch({ meeting_url: v })} />
          <Toggle label={t.paid} checked={form.is_paid} onChange={(v) => patch({ is_paid: v })} />
          {form.is_paid && (
            <Field label={t.price} value={form.price} onChange={(v) => patch({ price: v })} />
          )}
          <Field label={t.maxAttendees} value={form.max_attendees} onChange={(v) => patch({ max_attendees: v })} />
          <Field label={t.registrationDeadline} type="datetime-local" value={form.registration_deadline} onChange={(v) => patch({ registration_deadline: v })} />
          <Toggle label={t.registrationOpen} checked={form.is_registration_open} onChange={(v) => patch({ is_registration_open: v })} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">{t.media}</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <EventImageField
            label={t.thumbnail}
            hint={t.thumbnailHint}
            kind="thumbnail"
            value={form.thumbnail_url}
            onChange={(v) => patch({ thumbnail_url: v })}
            eventSlug={previewSlug}
            texts={t}
            previewWidth={EVENT_THUMBNAIL_WIDTH}
            previewHeight={EVENT_THUMBNAIL_HEIGHT}
            aspectClass="aspect-[16/9]"
          />
          <div className="sm:col-span-2">
            <EventImageField
              label={t.banner}
              hint={t.bannerHint}
              kind="banner"
              value={form.banner_url}
              onChange={(v) => patch({ banner_url: v })}
              eventSlug={previewSlug}
              texts={t}
              previewWidth={EVENT_BANNER_WIDTH}
              previewHeight={EVENT_BANNER_HEIGHT}
              aspectClass="aspect-[1920/600]"
              showSitePreviewLabel={t.bannerPreview}
            />
          </div>
          <Field label={t.organizerName} value={form.organizer_name} onChange={(v) => patch({ organizer_name: v })} />
          <Field label={t.organizerEmail} value={form.organizer_email} onChange={(v) => patch({ organizer_email: v })} />
          <Field label={t.organizerLinkedin} value={form.organizer_linkedin} onChange={(v) => patch({ organizer_linkedin: v })} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t.publish}</h2>
        <Toggle label={t.active} checked={form.is_active} onChange={(v) => patch({ is_active: v })} />
        <Toggle label={t.featured} checked={form.is_featured} onChange={(v) => patch({ is_featured: v })} />
        {form.slug && form.is_active && (
          <p className="text-sm text-neutral-600">
            Site:{' '}
            <Link
              href={getPublicEventUrl(locale, form.slug)}
              target="_blank"
              className="text-[#990000] hover:underline"
            >
              {getPublicEventUrl(locale, form.slug)}
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}

function EventImageField({
  label,
  hint,
  kind,
  value,
  onChange,
  eventSlug,
  texts: t,
  previewWidth,
  previewHeight,
  aspectClass,
  showSitePreviewLabel,
}: {
  label: string;
  hint: string;
  kind: 'thumbnail' | 'banner';
  value: string;
  onChange: (v: string) => void;
  eventSlug: string;
  texts: (typeof texts)['tr'];
  previewWidth: number;
  previewHeight: number;
  aspectClass: string;
  showSitePreviewLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('kind', kind);
      body.append('eventSlug', eventSlug);
      const res = await fetch('/api/events/upload', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error || t.uploadError);
      }
      onChange(data.url as string);
      setShowUrl(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.uploadError);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label className="block text-sm font-medium">{label}</label>
        <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
          {previewWidth}×{previewHeight} px
        </span>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>

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
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors cursor-pointer ${aspectClass} ${
          dragging
            ? 'border-[#990000] bg-[#990000]/5'
            : 'border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onFileChange}
          disabled={uploading}
        />

        {value.trim() ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.trim()}
              alt=""
              width={previewWidth}
              height={previewHeight}
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = '0.3';
              }}
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/35 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 text-neutral-900 text-xs font-medium px-3 py-1.5">
                <Upload className="w-3.5 h-3.5" />
                {t.uploadDrop}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setError(null);
              }}
              className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80"
              aria-label={t.removeImage}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-neutral-500 dark:text-neutral-400">
            {uploading ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin text-[#990000]" />
                <p className="text-sm">{t.uploading}</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 opacity-60" />
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  {t.uploadDrop}
                </p>
                <p className="text-xs">{t.uploadFormats}</p>
              </>
            )}
          </div>
        )}

        {uploading && value.trim() && (
          <div className="absolute inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-[#990000]" />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {value.trim() && showSitePreviewLabel && (
        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          {showSitePreviewLabel}
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowUrl((v) => !v)}
          className="text-xs text-[#990000] hover:underline"
        >
          {showUrl ? t.hideUrl : t.orUrl}
        </button>
        {showUrl && (
          <div className="mt-2">
            <input
              type="url"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-600"
            />
            <p className="text-xs text-neutral-500 mt-1">{t.urlOptional}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-600"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-600"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
