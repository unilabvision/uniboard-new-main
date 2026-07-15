'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Clock, CheckCircle, ChevronRight, FormInput, CalendarDays } from 'lucide-react';
import type { SiteApplication } from '@/app/types/siteApplications';

const texts = {
  tr: {
    title: 'Site Başvuruları',
    subtitle: 'myunilab.net formlarından gelen başvuruları yönetin',
    total: 'Toplam',
    forms: 'Aktif Form',
    pending: 'Bekleyen',
    accepted: 'Kabul',
    recent: 'Son Başvurular',
    viewAll: 'Tümünü Gör',
    manageForms: 'Formları Yönet',
    eventsOverview: 'Etkinlik Özeti',
    eventsOverviewHint: 'Etkinliklere göre kayıt, sertifika ve ödemeler',
    noApplications: 'Henüz başvuru yok',
    loading: 'Yükleniyor...',
  },
  en: {
    title: 'Site Applications',
    subtitle: 'Manage applications from myunilab.net forms',
    total: 'Total',
    forms: 'Active Forms',
    pending: 'Pending',
    accepted: 'Accepted',
    recent: 'Recent Applications',
    viewAll: 'View All',
    manageForms: 'Manage Forms',
    eventsOverview: 'Events Overview',
    eventsOverviewHint: 'Registrations, certificates and payments by event',
    noApplications: 'No applications yet',
    loading: 'Loading...',
  },
};

export default function SiteApplicationsDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [apps, setApps] = useState<SiteApplication[]>([]);
  const [stats, setStats] = useState({ total: 0, forms: 0, pending: 0, accepted: 0 });
  const [loading, setLoading] = useState(true);
  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/site-applications/stats');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');

        setApps((data.recent as SiteApplication[]) || []);
        setStats(data.stats || { total: 0, forms: 0, pending: 0, accepted: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">{t.loading}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{t.title}</h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/site-applications/events`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#990000] text-white rounded-lg hover:bg-[#800000]"
          >
            <CalendarDays className="w-4 h-4" />
            {t.eventsOverview}
          </Link>
          <Link
            href={`/${locale}/site-applications/forms`}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <FormInput className="w-4 h-4" />
            {t.manageForms}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: t.total, value: stats.total, icon: Users },
          { label: t.forms, value: stats.forms, icon: FormInput },
          { label: t.pending, value: stats.pending, icon: Clock },
          { label: t.accepted, value: stats.accepted, icon: CheckCircle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
            <Icon className="w-5 h-5 text-[#990000] mb-2" />
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-neutral-500">{label}</div>
          </div>
        ))}
      </div>

      <Link
        href={`/${locale}/site-applications/events`}
        className="mb-8 flex items-center justify-between gap-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/30"
      >
        <div className="flex items-center gap-3 min-w-0">
          <CalendarDays className="w-5 h-5 text-[#990000] shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100">{t.eventsOverview}</div>
            <div className="text-sm text-neutral-500 truncate">{t.eventsOverviewHint}</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
      </Link>

      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="font-semibold">{t.recent}</h2>
          <Link href={`/${locale}/site-applications/applications`} className="text-sm text-[#990000] flex items-center gap-1">
            {t.viewAll} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {apps.length === 0 ? (
          <p className="p-8 text-center text-neutral-500">{t.noApplications}</p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {apps.map((app) => (
              <li key={app.id}>
                <Link
                  href={`/${locale}/site-applications/applications/${app.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/30"
                >
                  <div>
                    <div className="font-medium">{app.first_name} {app.last_name}</div>
                    <div className="text-sm text-neutral-500">
                      {app.email}
                      {app.event_name ? ` · ${app.event_name}` : ''}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
