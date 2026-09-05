'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getLocalizedJson } from '@/app/lib/mentorship/config';
import type { MentorshipApplication, MentorshipApplicationStatus } from '@/app/types/mentorship';

const STATUSES: MentorshipApplicationStatus[] = [
  'pending',
  'under_review',
  'accepted',
  'rejected',
  'withdrawn',
];

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

export default function MentorshipApplicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [id, setId] = useState('');
  const [app, setApp] = useState<MentorshipApplication | null>(null);
  const [history, setHistory] = useState<
    Array<{ id: string; from_status: string | null; to_status: string; created_at: string; note: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<MentorshipApplicationStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => {
      setLocale(p.locale);
      setId(p.id);
    });
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/mentorship/applications/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        setApp(data.application);
        setHistory(data.history || []);
        setStatus(data.application.status);
        setAdminNotes(data.application.admin_notes || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/mentorship/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, admin_notes: adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setApp(data.application);
      // refresh history
      const detail = await fetch(`/api/mentorship/applications/${id}`).then((r) => r.json());
      setHistory(detail.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const labels = statusLabels[locale as keyof typeof statusLabels] || statusLabels.tr;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#990000]" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-8 text-center text-neutral-500">
        {error || (locale === 'tr' ? 'Bulunamadı' : 'Not found')}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <Link
        href={`/${locale}/mentorship/applications`}
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-[#990000] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {locale === 'tr' ? 'Başvurulara dön' : 'Back to applications'}
      </Link>

      <h1 className="text-2xl font-bold mb-2">
        {app.first_name} {app.last_name}
      </h1>
      <p className="text-neutral-500 mb-6">
        {getLocalizedJson(app.mentorships?.title, locale, '—')}
      </p>

      <div className="space-y-4 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-neutral-900 mb-6">
        <Row label="Email" value={app.email} />
        <Row label={locale === 'tr' ? 'Telefon' : 'Phone'} value={app.phone} />
        <Row label={locale === 'tr' ? 'Okul' : 'School'} value={app.school} />
        <Row label={locale === 'tr' ? 'Bölüm' : 'Department'} value={app.department} />
        <Row label={locale === 'tr' ? 'Sınıf' : 'Grade'} value={app.grade} />
        <Row label="LinkedIn" value={app.linkedin_url} />
        <Row label={locale === 'tr' ? 'Motivasyon' : 'Motivation'} value={app.motivation} multiline />
        <Row label={locale === 'tr' ? 'Hedefler' : 'Goals'} value={app.goals} multiline />
        <Row label={locale === 'tr' ? 'Deneyim' : 'Experience'} value={app.experience} multiline />
      </div>

      <div className="space-y-4 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-neutral-900 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            {locale === 'tr' ? 'Durum' : 'Status'}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as MentorshipApplicationStatus)}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {locale === 'tr' ? 'Admin notu' : 'Admin notes'}
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 bg-[#990000] text-white rounded-lg disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : locale === 'tr' ? 'Kaydet' : 'Save'}
        </button>
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">
            {locale === 'tr' ? 'Durum geçmişi' : 'Status history'}
          </h2>
          <ul className="space-y-2 text-sm text-neutral-600">
            {history.map((h) => (
              <li key={h.id} className="border-l-2 border-neutral-300 pl-3">
                {(h.from_status || '—') + ' → ' + h.to_status}
                <span className="text-neutral-400 ml-2">
                  {new Date(h.created_at).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                </span>
                {h.note && <div className="text-neutral-500">{h.note}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-neutral-500 mb-0.5">{label}</div>
      <div className={multiline ? 'whitespace-pre-wrap' : ''}>{value}</div>
    </div>
  );
}
