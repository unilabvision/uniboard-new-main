'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  FileText,
  ExternalLink,
  Search,
  Trash2,
} from 'lucide-react';

type ApplicationRow = {
  id: string;
  form_id: string;
  course_id?: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone?: string | null;
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
    exportExcel: 'Excel İndir',
    exporting: 'İndiriliyor...',
    exportEmpty: 'Dışa aktarılacak başvuru yok',
    exportError: 'Excel indirilemedi',
    loading: 'Yükleniyor...',
    empty:
      'Henüz kimse form doldurmadı. Formu yayınladıysanız bu normal — kayıtlar, sitede başvuru gönderildikçe burada görünür.',
    applicant: 'Başvuran',
    phone: 'Telefon',
    form: 'Form',
    status: 'Durum',
    date: 'Tarih',
    view: 'Detay',
    openForm: 'Formu düzenle',
    error: 'Başvurular yüklenemedi',
    hint: 'Form ayarı: Kurs düzenle → Başvuru Formu. Bu sayfa siteden gelen başvuranları listeler.',
    publishedForms: 'Yayındaki kurs formları',
    noPublished:
      'Yayında kurs formu yok. Kurs düzenle → Başvuru Formu → “Sitede yayınla” + kaydet.',
    draft: 'Taslak',
    live: 'Yayında',
    editCourse: 'Kursa git',
    applicants: 'Başvuranlar',
    searchPlaceholder: 'Ad, e-posta veya telefon ara…',
    allForms: 'Tüm formlar',
    allStatuses: 'Tüm durumlar',
    count: (n: number) => `${n} başvuru`,
    delete: 'Sil',
    confirmDelete: 'Bu başvuruyu kalıcı olarak silmek istediğinize emin misiniz?',
  },
  en: {
    title: 'Course Applications',
    subtitle: 'Submissions filled out by applicants on the site',
    refresh: 'Refresh',
    exportExcel: 'Export Excel',
    exporting: 'Downloading...',
    exportEmpty: 'No applications to export',
    exportError: 'Could not download Excel',
    loading: 'Loading...',
    empty:
      'No one has submitted yet. If you published the form, that is expected — rows appear here after someone applies on the site.',
    applicant: 'Applicant',
    phone: 'Phone',
    form: 'Form',
    status: 'Status',
    date: 'Date',
    view: 'View',
    openForm: 'Edit form',
    error: 'Could not load applications',
    hint: 'Form setup: Course edit → Application Form. This page lists applicants from the site.',
    publishedForms: 'Published course forms',
    noPublished:
      'No published course forms. Course edit → Application Form → “Publish on site” + save.',
    draft: 'Draft',
    live: 'Live',
    editCourse: 'Open course',
    applicants: 'Applicants',
    searchPlaceholder: 'Search name, email or phone…',
    allForms: 'All forms',
    allStatuses: 'All statuses',
    count: (n: number) => `${n} applications`,
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to permanently delete this application?',
  },
};

export default function LmsCourseApplicationsPage() {
  const params = useParams();
  const searchParamsHook = useSearchParams();
  const locale = (params?.locale as string) || 'tr';
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Pre-filter by courseId from URL query param
  const initialCourseId = searchParamsHook?.get('courseId') || '';

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [forms, setForms] = useState<FormRow[]>([]);
  const [search, setSearch] = useState('');
  const [formFilter, setFormFilter] = useState(initialCourseId ? '' : ''); // will be set after forms load
  const [statusFilter, setStatusFilter] = useState('');

  const formById = useMemo(() => {
    const map = new Map<string, FormRow>();
    forms.forEach((f) => map.set(f.id, f));
    return map;
  }, [forms]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => {
      if (a.status) set.add(a.status);
    });
    return [...set].sort();
  }, [applications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((row) => {
      if (formFilter && row.form_id !== formFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (!q) return true;
      const name = [row.first_name, row.last_name].filter(Boolean).join(' ').toLowerCase();
      const email = (row.email || '').toLowerCase();
      const phone = (row.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [applications, formFilter, statusFilter, search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lms/course-applications');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.error);
      const loadedForms: FormRow[] = data.forms || [];
      setApplications(data.applications || []);
      setForms(loadedForms);

      // Auto-select form filter if courseId provided in URL
      if (initialCourseId) {
        const matchingForm = loadedForms.find(
          (f) => String(f.course_id || '') === initialCourseId
        );
        if (matchingForm) setFormFilter(matchingForm.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [t.error, initialCourseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleExport = async () => {
    if (applications.length === 0) {
      setError(t.exportEmpty);
      return;
    }
    setExporting(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set('locale', locale);
      if (formFilter) {
        const form = formById.get(formFilter);
        if (form?.course_id) qs.set('courseId', form.course_id);
      }
      if (statusFilter) qs.set('status', statusFilter);

      const res = await fetch(`/api/lms/course-applications/export?${qs.toString()}`);
      if (res.status === 204) {
        setError(t.exportEmpty);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.exportError);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = locale === 'tr' ? 'kurs-basvurulari.xlsx' : 'course-applications.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.exportError);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/lms/course-applications/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete');
      }
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          {initialCourseId && (
            <Link
              href={`/${locale}/lms`}
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-[#990000] mb-2"
            >
              ← {locale === 'tr' ? 'Kurs Yönetimi' : 'Course Management'}
            </Link>
          )}
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#990000]" />
            {initialCourseId && formFilter
              ? (() => {
                  const form = forms.find((f) => f.id === formFilter);
                  const courseName = locale === 'en' ? form?.title_en || form?.title_tr : form?.title_tr || form?.title_en;
                  return courseName ? `${courseName} — ${t.title}` : t.title;
                })()
              : t.title}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">{t.subtitle}</p>
          <p className="text-xs text-neutral-500 mt-1">{t.hint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting || applications.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[#990000] text-white disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting ? t.exporting : t.exportExcel}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600"
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
        </div>
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

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            {t.applicants}
            {!loading && (
              <span className="ml-2 font-normal text-neutral-500">{t.count(filtered.length)}</span>
            )}
          </h2>
        </div>

        {!loading && applications.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
              />
            </div>
            <select
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
            >
              <option value="">{t.allForms}</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {locale === 'en' ? f.title_en || f.title_tr : f.title_tr || f.title_en || f.id}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
            >
              <option value="">{t.allStatuses}</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-neutral-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t.loading}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-neutral-500">{t.empty}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">{t.applicant}</th>
                  <th className="px-4 py-3 font-medium">{t.phone}</th>
                  <th className="px-4 py-3 font-medium">{t.form}</th>
                  <th className="px-4 py-3 font-medium">{t.status}</th>
                  <th className="px-4 py-3 font-medium">{t.date}</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
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
                      <td className="px-4 py-3 whitespace-nowrap">{row.phone || '—'}</td>
                      <td className="px-4 py-3">
                        {locale === 'en' ? form?.title_en || form?.title_tr : form?.title_tr || '—'}
                      </td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString(
                          locale === 'en' ? 'en-US' : 'tr-TR'
                        )}
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
                            className="inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-900 dark:hover:text-neutral-300 text-xs"
                          >
                            {t.openForm}
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => void handleDelete(row.id)}
                          disabled={deletingId === row.id}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 disabled:opacity-50 text-xs ml-2"
                        >
                          {deletingId === row.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          {t.delete}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
