'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getLocalizedJson } from '@/app/lib/mentorship/config';
import type { MentorshipApplication } from '@/app/types/mentorship';

const statusLabels = {
  tr: {
    pending: 'Bekleyen',
    under_review: 'İncelemede',
    accepted: 'Kabul',
    rejected: 'Red',
    withdrawn: 'Çekildi',
  },
  en: {
    pending: 'Pending',
    under_review: 'Under review',
    accepted: 'Accepted',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  },
};

export default function MentorshipApplicationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [status, setStatus] = useState('');
  const [apps, setApps] = useState<MentorshipApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    setLoading(true);
    const qs = status ? `?status=${status}` : '';
    fetch(`/api/mentorship/applications${qs}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setApps(data.applications || []);
      })
      .finally(() => setLoading(false));
  }, [status]);

  const labels = statusLabels[locale as keyof typeof statusLabels] || statusLabels.tr;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            {locale === 'tr' ? 'Mentörlük Başvuruları' : 'Mentorship Applications'}
          </h1>
          <p className="text-neutral-600 mt-1">
            {locale === 'tr'
              ? 'Siteden gelen mentörlük başvurularını yönetin'
              : 'Manage mentorship applications from the site'}
          </p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
        >
          <option value="">{locale === 'tr' ? 'Tümü' : 'All'}</option>
          {Object.entries(labels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#990000]" />
        </div>
      ) : apps.length === 0 ? (
        <p className="text-center text-neutral-500 py-16">
          {locale === 'tr' ? 'Başvuru yok.' : 'No applications.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900 text-left">
              <tr>
                <th className="px-4 py-3">{locale === 'tr' ? 'Aday' : 'Applicant'}</th>
                <th className="px-4 py-3">{locale === 'tr' ? 'Duyuru' : 'Listing'}</th>
                <th className="px-4 py-3">{locale === 'tr' ? 'Durum' : 'Status'}</th>
                <th className="px-4 py-3">{locale === 'tr' ? 'Tarih' : 'Date'}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr
                  key={app.id}
                  className="border-t border-neutral-200 dark:border-neutral-800"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {app.first_name} {app.last_name}
                    </div>
                    <div className="text-neutral-500">{app.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {getLocalizedJson(app.mentorships?.title, locale, '—')}
                  </td>
                  <td className="px-4 py-3">
                    {labels[app.status as keyof typeof labels] || app.status}
                  </td>
                  <td className="px-4 py-3 text-neutral-500">
                    {new Date(app.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/${locale}/mentorship/applications/${app.id}`}
                      className="text-[#990000] hover:underline"
                    >
                      {locale === 'tr' ? 'Detay' : 'Detail'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
