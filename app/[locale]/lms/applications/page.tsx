'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ClipboardList, Eye, Loader2, RefreshCw, FileText, ExternalLink } from 'lucide-react';

type ApplicationRow = {
  id: string;
  form_id: string;
  course_id?: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  status: string;
  created_at: string;
  submission_data?: Record<string, unknown> | null;
};

type FormRow = {
  id: string;
  title_tr?: string | null;
  title_en?: string | null;
  course_id?: string | null;
  is_active?: boolean | null;
  slug_tr?: string | null;
};

const texts = {
  tr: {
    title: 'Kurs Başvuruları',
    subtitle: 'Katılımcıların siteden doldurduğu başvuru kayıtları',
    refresh: 'Yenile',
    loading: 'Yükleniyor...',
    empty:
      'Henüz kimse form doldurmadı. Formu yayınladıysanız bu normal — kayıtlar, sitede başvuru gönderildikçe burada görünür.',
    applicant: 'Başvuran',
    form: 'Form',
    status: 'Durum',
    date: 'Tarih',
    view: 'Detay',
    openForm: 'Formu düzenle',
    error: 'Başvurular yüklenemedi',
    hint: 'Form ayarı: Kurs düzenle → Başvuru Formu. Bu sayfa yalnızca gelen başvuruları listeler (form yayınını değil).',
    publishedForms: 'Yayındaki kurs formları',
    noPublished:
      'Yayında kurs formu yok. Kurs düzenle → Başvuru Formu → “Sitede yayınla” + kaydet.',
    draft: 'Taslak',
    live: 'Yayında',
    editCourse: 'Kursa git',
  },
  en: {
    title: 'Course Applications',
    subtitle: 'Submissions filled out by applicants on the site',
    refresh: 'Refresh',
    loading: 'Loading...',
    empty:
      'No one has submitted yet. If you published the form, that is expected — rows appear here after someone applies on the site.',
    applicant: 'Applicant',
    form: 'Form',
    status: 'Status',
    date: 'Date',
    view: 'View',
    openForm: 'Edit form',
    error: 'Could not load applications',
    hint: 'Form setup: Course edit → Application Form. This page lists submissions only, not form publish status.',
    publishedForms: 'Published course forms',
    noPublished:
      'No published course forms. Course edit → Application Form → “Publish on site” + save.',
    draft: 'Draft',
    live: 'Live',
    editCourse: 'Open course',
  },
};

export default function LmsCourseApplicationsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const t = texts[locale as keyof typeof texts] || texts.tr;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [forms, setForms] = useState<FormRow[]>([]);

  const formById = useMemo(() => {
    const map = new Map<string, FormRow>();
    forms.forEach((f) => map.set(f.id, f));
    return map;
  }, [forms]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lms/course-applications');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.error);
      setApplications(data.applications || []);
      setForms(data.forms || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#990000]" />
            {t.title}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">{t.subtitle}</p>
          <p className="text-xs text-neutral-500 mt-1">{t.hint}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600"
        >
          <RefreshCw className="w-4 h-4" />
          {t.refresh}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && forms.length > 0 && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#990000]" />
            {t.publishedForms}
          </h2>
          <ul className="space-y-2">
            {forms.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  {locale === 'en' ? f.title_en || f.title_tr : f.title_tr || f.title_en || '—'}
                  <span
                    className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                      f.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}
                  >
                    {f.is_active ? t.live : t.draft}
                  </span>
                </span>
                {f.course_id && (
                  <Link
                    href={`/${locale}/lms/edit/${f.course_id}?tab=applications`}
                    className="inline-flex items-center gap-1 text-xs text-[#990000]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t.editCourse}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && forms.length === 0 && (
        <p className="text-sm text-neutral-500">{t.noPublished}</p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t.loading}
        </p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-neutral-500">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">{t.applicant}</th>
                <th className="px-4 py-3 font-medium">{t.form}</th>
                <th className="px-4 py-3 font-medium">{t.status}</th>
                <th className="px-4 py-3 font-medium">{t.date}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {applications.map((row) => {
                const form = formById.get(row.form_id);
                const name = [row.first_name, row.last_name].filter(Boolean).join(' ') || '—';
                const courseId =
                  row.course_id ||
                  (typeof row.submission_data?.course_id === 'string'
                    ? row.submission_data.course_id
                    : form?.course_id) ||
                  null;
                return (
                  <tr
                    key={row.id}
                    className="border-t border-neutral-200 dark:border-neutral-700"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-neutral-500">{row.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {locale === 'en' ? form?.title_en || form?.title_tr : form?.title_tr || '—'}
                    </td>
                    <td className="px-4 py-3">{row.status}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleString(locale === 'en' ? 'en-US' : 'tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        href={`/${locale}/site-applications/applications/${row.id}`}
                        className="inline-flex items-center gap-1 text-[#990000] text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t.view}
                      </Link>
                      {courseId && (
                        <Link
                          href={`/${locale}/lms/edit/${courseId}?tab=applications`}
                          className="inline-flex items-center gap-1 text-neutral-600 text-xs"
                        >
                          {t.openForm}
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
