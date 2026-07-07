'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Search,
  RefreshCw,
  Eye,
  Calendar,
  Mail,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { siteApplicationsDb, type SiteApplicationStatus } from '@/app/lib/siteApplications/config';
import type { SiteApplication } from '@/app/types/siteApplications';
import type { SiteApplicationForm } from '@/app/types/siteApplicationForms';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || '',
});

const STATUS_FILTERS: SiteApplicationStatus[] = [
  'pending',
  'under_review',
  'accepted',
  'rejected',
];

const texts = {
  tr: {
    title: 'Tüm Başvurular',
    titlePending: 'Bekleyen Başvurular',
    titleUnderReview: 'İncelemedeki Başvurular',
    titleAccepted: 'Kabul Edilen Başvurular',
    titleRejected: 'Reddedilen Başvurular',
    subtitle: 'Site formlarından gelen başvuruları görüntüleyin',
    subtitleFiltered: 'Seçili duruma göre filtrelenmiş liste',
    all: 'Tümü',
    allForms: 'Tüm formlar',
    clearFilter: 'Filtreyi temizle',
    filterActive: 'Aktif filtre',
    search: 'İsim veya e-posta ara...',
    applicant: 'Başvuran',
    form: 'Form',
    status: 'Durum',
    date: 'Tarih',
    actions: 'İşlemler',
    view: 'Detay',
    loading: 'Yükleniyor...',
    error: 'Veriler yüklenemedi',
    noResults: 'Başvuru bulunamadı',
    refresh: 'Yenile',
    statusLabels: {
      pending: 'Bekliyor',
      under_review: 'İncelemede',
      accepted: 'Kabul',
      rejected: 'Red',
    },
    page: 'Sayfa',
    of: '/',
  },
  en: {
    title: 'All Applications',
    titlePending: 'Pending Applications',
    titleUnderReview: 'Applications Under Review',
    titleAccepted: 'Accepted Applications',
    titleRejected: 'Rejected Applications',
    subtitle: 'View applications from site forms',
    subtitleFiltered: 'List filtered by selected status',
    all: 'All',
    allForms: 'All forms',
    clearFilter: 'Clear filter',
    filterActive: 'Active filter',
    search: 'Search name or email...',
    applicant: 'Applicant',
    form: 'Form',
    status: 'Status',
    date: 'Date',
    actions: 'Actions',
    view: 'View',
    loading: 'Loading...',
    error: 'Failed to load data',
    noResults: 'No applications found',
    refresh: 'Refresh',
    statusLabels: {
      pending: 'Pending',
      under_review: 'Under Review',
      accepted: 'Accepted',
      rejected: 'Rejected',
    },
    page: 'Page',
    of: 'of',
  },
};

function statusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'under_review':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'accepted':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
}

export default function SiteApplicationsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [apps, setApps] = useState<SiteApplication[]>([]);
  const [forms, setForms] = useState<SiteApplicationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formFilter, setFormFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const statusFilter =
    statusParam && STATUS_FILTERS.includes(statusParam as SiteApplicationStatus)
      ? (statusParam as SiteApplicationStatus)
      : null;

  const t = texts[locale as keyof typeof texts] || texts.tr;

  const pageTitle = useMemo(() => {
    if (!statusFilter) return t.title;
    const titles: Record<SiteApplicationStatus, string> = {
      pending: t.titlePending,
      under_review: t.titleUnderReview,
      accepted: t.titleAccepted,
      rejected: t.titleRejected,
    };
    return titles[statusFilter];
  }, [statusFilter, t]);

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    fetch('/api/site-applications/forms')
      .then((r) => r.json())
      .then((d) => setForms(d.forms || []))
      .catch(() => setForms([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, formFilter, search]);

  const formTitleBySlug = useCallback(
    (slug: string) => {
      const form = forms.find((f) => f.slug_tr === slug || f.slug_en === slug);
      if (!form) return slug;
      return locale === 'en' ? form.title_en : form.title_tr;
    },
    [forms, locale]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from(siteApplicationsDb.applications)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (formFilter !== 'all') {
        query = query.eq('application_type', formFilter);
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      if (search.trim()) {
        const q = `%${search.trim()}%`;
        query = query.or(`first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`);
      }

      const from = (page - 1) * perPage;
      const { data, error: qErr, count } = await query.range(from, from + perPage - 1);
      if (qErr) throw qErr;

      setApps((data as SiteApplication[]) || []);
      setTotal(count || 0);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [formFilter, search, page, statusFilter, t.error]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const baseListPath = `/${locale}/site-applications/applications`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          {pageTitle}
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          {statusFilter ? t.subtitleFiltered : t.subtitle}
        </p>
        {statusFilter && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-500">{t.filterActive}:</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(statusFilter)}`}>
              {t.statusLabels[statusFilter]}
            </span>
            <Link
              href={baseListPath}
              className="text-xs text-[#990000] hover:underline"
            >
              {t.clearFilter}
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={baseListPath}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            !statusFilter
              ? 'bg-[#990000] text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          {t.all}
        </Link>
        {STATUS_FILTERS.map((status) => (
          <Link
            key={status}
            href={`${baseListPath}?status=${status}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              statusFilter === status
                ? 'bg-[#990000] text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {t.statusLabels[status]}
          </Link>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t.search}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
          />
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={formFilter}
            onChange={(e) => { setFormFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
          >
            <option value="all">{t.allForms}</option>
            {forms.map((form) => (
              <option key={form.id} value={locale === 'en' ? form.slug_en : form.slug_tr}>
                {locale === 'en' ? form.title_en : form.title_tr}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            title={t.refresh}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t.applicant}</th>
                <th className="text-left px-4 py-3 font-medium">{t.form}</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{t.status}</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">{t.date}</th>
                <th className="text-right px-4 py-3 font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">{t.loading}</td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-neutral-500">{t.noResults}</td>
                </tr>
              ) : (
                apps.map((app) => (
                  <tr key={app.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {app.first_name} {app.last_name}
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {app.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                        <FileText className="w-3.5 h-3.5" />
                        {formTitleBySlug(app.application_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(app.status)}`}>
                        {t.statusLabels[app.status as keyof typeof t.statusLabels] || app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(app.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/${locale}/site-applications/applications/${app.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#990000] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                        {t.view}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-sm text-neutral-500">{t.page} {page} {t.of} {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
