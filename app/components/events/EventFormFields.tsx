'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  getPublicEventUrl,
  slugifyEventTitle,
} from '@/app/lib/events/config';
import type { EventStatus, EventType, MyuniEvent } from '@/app/types/events';

const texts = {
  tr: {
    basic: 'Temel Bilgiler',
    schedule: 'Tarih & Konum',
    media: 'Görsel & Organizatör',
    publish: 'Yayın',
    slug: 'URL slug',
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
    thumbnail: 'Küçük görsel URL',
    banner: 'Banner URL',
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
    slug: 'URL slug',
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
    thumbnail: 'Thumbnail URL',
    banner: 'Banner URL',
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
    is_online: event.is_online,
    location_name: event.location_name || '',
    location_address: event.location_address || '',
    meeting_url: event.meeting_url || '',
    is_paid: event.is_paid,
    price: event.price != null ? String(event.price) : '',
    max_attendees: event.max_attendees != null ? String(event.max_attendees) : '',
    registration_deadline: event.registration_deadline
      ? event.registration_deadline.slice(0, 16)
      : '',
    is_registration_open: event.is_registration_open,
    thumbnail_url: event.thumbnail_url || '',
    banner_url: event.banner_url || '',
    organizer_name: event.organizer_name || '',
    organizer_email: event.organizer_email || '',
    organizer_linkedin: event.organizer_linkedin || '',
    category: event.category || '',
    is_active: event.is_active,
    is_featured: event.is_featured,
  };
}

export function formStateToPayload(form: EventFormState) {
  return {
    slug: form.slug.trim(),
    title: form.title.trim(),
    description: form.description.trim() || null,
    event_type: form.event_type,
    status: form.status,
    start_date: new Date(form.start_date).toISOString(),
    end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
    timezone: form.timezone,
    duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
    is_online: form.is_online,
    location_name: form.location_name.trim() || null,
    location_address: form.location_address.trim() || null,
    meeting_url: form.meeting_url.trim() || null,
    is_paid: form.is_paid,
    price: form.is_paid && form.price ? Number(form.price) : null,
    max_attendees: form.max_attendees ? Number(form.max_attendees) : null,
    registration_deadline: form.registration_deadline
      ? new Date(form.registration_deadline).toISOString()
      : null,
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
}: {
  locale: string;
  form: EventFormState;
  setForm: React.Dispatch<React.SetStateAction<EventFormState>>;
  slugTouched: boolean;
  setSlugTouched: (v: boolean) => void;
}) {
  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    if (!slugTouched && form.title) {
      setForm((prev) => ({ ...prev, slug: slugifyEventTitle(form.title) }));
    }
  }, [form.title, slugTouched, setForm]);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-semibold text-neutral-800 dark:text-neutral-200">{t.basic}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t.title} value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Field
            label={t.slug}
            value={form.slug}
            onChange={(v) => {
              setSlugTouched(true);
              setForm({ ...form, slug: v });
            }}
            required
          />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">{t.description}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-600"
            />
          </div>
          <Select
            label={t.eventType}
            value={form.event_type}
            onChange={(v) => setForm({ ...form, event_type: v as EventType })}
            options={EVENT_TYPES}
          />
          <Select
            label={t.status}
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v as EventStatus })}
            options={EVENT_STATUSES}
          />
          <Field label={t.category} value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">{t.schedule}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t.startDate} type="datetime-local" value={form.start_date} onChange={(v) => setForm({ ...form, start_date: v })} required />
          <Field label={t.endDate} type="datetime-local" value={form.end_date} onChange={(v) => setForm({ ...form, end_date: v })} />
          <Field label={t.timezone} value={form.timezone} onChange={(v) => setForm({ ...form, timezone: v })} />
          <Field label={t.duration} value={form.duration_minutes} onChange={(v) => setForm({ ...form, duration_minutes: v })} />
          <Toggle label={t.online} checked={form.is_online} onChange={(v) => setForm({ ...form, is_online: v })} />
          <Field label={t.locationName} value={form.location_name} onChange={(v) => setForm({ ...form, location_name: v })} />
          <Field label={t.locationAddress} value={form.location_address} onChange={(v) => setForm({ ...form, location_address: v })} />
          <Field label={t.meetingUrl} value={form.meeting_url} onChange={(v) => setForm({ ...form, meeting_url: v })} />
          <Toggle label={t.paid} checked={form.is_paid} onChange={(v) => setForm({ ...form, is_paid: v })} />
          {form.is_paid && (
            <Field label={t.price} value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
          )}
          <Field label={t.maxAttendees} value={form.max_attendees} onChange={(v) => setForm({ ...form, max_attendees: v })} />
          <Field label={t.registrationDeadline} type="datetime-local" value={form.registration_deadline} onChange={(v) => setForm({ ...form, registration_deadline: v })} />
          <Toggle label={t.registrationOpen} checked={form.is_registration_open} onChange={(v) => setForm({ ...form, is_registration_open: v })} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">{t.media}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t.thumbnail} value={form.thumbnail_url} onChange={(v) => setForm({ ...form, thumbnail_url: v })} />
          <Field label={t.banner} value={form.banner_url} onChange={(v) => setForm({ ...form, banner_url: v })} />
          <Field label={t.organizerName} value={form.organizer_name} onChange={(v) => setForm({ ...form, organizer_name: v })} />
          <Field label={t.organizerEmail} value={form.organizer_email} onChange={(v) => setForm({ ...form, organizer_email: v })} />
          <Field label={t.organizerLinkedin} value={form.organizer_linkedin} onChange={(v) => setForm({ ...form, organizer_linkedin: v })} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t.publish}</h2>
        <Toggle label={t.active} checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
        <Toggle label={t.featured} checked={form.is_featured} onChange={(v) => setForm({ ...form, is_featured: v })} />
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
