'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Plus, Pencil } from 'lucide-react';
import {
  getLocalizedJson,
  getPublicMentorshipUrl,
  parseBooleanField,
} from '@/app/lib/mentorship/config';
import type { Mentorship } from '@/app/types/mentorship';

const texts = {
  tr: {
    title: 'Mentörlük Duyuruları',
    subtitle: 'myunilab.net üzerinde yayınlanan mentörlük ilanları',
    new: 'Yeni Duyuru',
    loading: 'Yükleniyor...',
    empty: 'Henüz duyuru yok.',
    active: 'Yayında',
    inactive: 'Taslak',
    featured: 'Öne çıkan',
    edit: 'Düzenle',
    viewSite: 'Sitede gör',
    appsOpen: 'Başvuru açık',
    appsClosed: 'Başvuru kapalı',
  },
  en: {
    title: 'Mentorship Announcements',
    subtitle: 'Mentorship listings published on myunilab.net',
    new: 'New Announcement',
    loading: 'Loading...',
    empty: 'No announcements yet.',
    active: 'Live',
    inactive: 'Draft',
    featured: 'Featured',
    edit: 'Edit',
    viewSite: 'View on site',
    appsOpen: 'Applications open',
    appsClosed: 'Applications closed',
  },
};

export default function MentorshipListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [items, setItems] = useState<Mentorship[]>([]);
  const [loading, setLoading] = useState(true);
  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    fetch('/api/mentorship')
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setItems(data.mentorships || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {t.title}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">{t.subtitle}</p>
        </div>
        <Link
          href={`/${locale}/mentorship/new`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#990000] text-white rounded-lg hover:bg-[#800000]"
        >
          <Plus className="w-4 h-4" />
          {t.new}
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#990000]" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-neutral-500 text-center py-16">{t.empty}</p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => {
            const title = getLocalizedJson(m.title, locale, m.slug);
            const active = parseBooleanField(m.is_active, false);
            return (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="font-semibold truncate">{title}</h2>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      {active ? t.active : t.inactive}
                    </span>
                    {m.is_featured && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {t.featured}
                      </span>
                    )}
                    <span className="text-xs text-neutral-500">
                      {m.is_application_open ? t.appsOpen : t.appsClosed}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 truncate">
                    {m.mentor_name || '—'} · /{m.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {active && (
                    <a
                      href={getPublicMentorshipUrl(locale, m.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg border hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t.viewSite}
                    </a>
                  )}
                  <Link
                    href={`/${locale}/mentorship/${m.id}`}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  >
                    <Pencil className="w-4 h-4" />
                    {t.edit}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
