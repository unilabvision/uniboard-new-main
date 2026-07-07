'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, ExternalLink, Loader2, Plus, Pencil } from 'lucide-react';
import { getPublicEventUrl } from '@/app/lib/events/config';
import type { MyuniEvent } from '@/app/types/events';

const texts = {
  tr: {
    title: 'Etkinlik Yönetimi',
    subtitle: 'myunilab.net/tr/etkinlik sayfasında yayınlanan etkinlikler',
    new: 'Yeni Etkinlik',
    loading: 'Yükleniyor...',
    empty: 'Henüz etkinlik yok.',
    active: 'Aktif',
    inactive: 'Pasif',
    featured: 'Öne çıkan',
    edit: 'Düzenle',
    viewSite: 'Sitede gör',
    attendees: 'katılımcı',
  },
  en: {
    title: 'Event Management',
    subtitle: 'Events published on myunilab.net',
    new: 'New Event',
    loading: 'Loading...',
    empty: 'No events yet.',
    active: 'Active',
    inactive: 'Inactive',
    featured: 'Featured',
    edit: 'Edit',
    viewSite: 'View on site',
    attendees: 'attendees',
  },
};

export default function EventsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [events, setEvents] = useState<MyuniEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    fetch('/api/events')
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setEvents(data.events || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-neutral-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        {t.loading}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-7 h-7 text-[#990000]" />
            {t.title}
          </h1>
          <p className="text-neutral-600 mt-1">{t.subtitle}</p>
        </div>
        <Link
          href={`/${locale}/events/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#990000] text-white rounded-lg hover:bg-[#800000]"
        >
          <Plus className="w-4 h-4" />
          {t.new}
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-neutral-500">
          {t.empty}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border bg-white dark:bg-neutral-800/50 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
            >
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">{event.title}</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  <code>{event.slug}</code> · {event.event_type} · {event.status}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {event.start_date
                    ? new Date(event.start_date).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')
                    : '—'}
                  {event.current_attendees != null && (
                    <span>
                      {' '}
                      · {event.current_attendees} {t.attendees}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      event.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {event.is_active ? t.active : t.inactive}
                  </span>
                  {event.is_featured && (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                      {t.featured}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {event.is_active && (
                  <a
                    href={getPublicEventUrl(locale, event.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-neutral-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t.viewSite}
                  </a>
                )}
                <Link
                  href={`/${locale}/events/${event.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-[#990000] text-white rounded-lg hover:bg-[#800000]"
                >
                  <Pencil className="w-4 h-4" />
                  {t.edit}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
