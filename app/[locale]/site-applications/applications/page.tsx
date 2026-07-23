'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  RefreshCw,
  Eye,
  Calendar,
  Mail,
  ChevronLeft,
  ChevronRight,
  FileText,
  Award,
  CalendarDays,
} from 'lucide-react';
import { inferFormType } from '@/app/lib/siteApplications/formTypes';
import {
  type SiteApplicationStatus,
  isEventSiteApplication,
} from '@/app/lib/siteApplications/config';
import { formatPackagePrice } from '@/app/lib/siteApplications/packages';
import type { SiteApplication } from '@/app/types/siteApplications';
import type { SiteApplicationForm } from '@/app/types/siteApplicationForms';

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
    subtitleEvent: 'Bu etkinliğe gelen kayıtlar',
    tabTeam: 'Ekip Başvuruları',
    tabEvent: 'Etkinlik Başvuruları',
    tabAll: 'Tümü',
    eventLabel: 'Etkinlik',
    package: 'Paket',
    payment: 'Ödeme',
    packageFree: 'Ücretsiz',
    packageCertificate: 'Sertifika',
    paymentPaid: 'Ödendi',
    paymentPending: 'Bekliyor',
    paymentSuperseded: 'Mükerrer',
    paymentNone: '—',
    filterPackage: 'Paket filtresi',
    filterPayment: 'Ödeme filtresi',
    backToEvents: 'Etkinlik özetine dön',
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
    remind: 'Hatırlat',
    reminding: '…',
    remindOk: 'Hatırlatma gönderildi',
    remindFail: 'Hatırlatma gönderilemedi',
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
    subtitleEvent: 'Registrations for this event',
    tabTeam: 'Team Applications',
    tabEvent: 'Event Applications',
    tabAll: 'All',
    eventLabel: 'Event',
    package: 'Package',
    payment: 'Payment',
    packageFree: 'Free',
    packageCertificate: 'Certificate',
    paymentPaid: 'Paid',
    paymentPending: 'Pending',
    paymentSuperseded: 'Duplicate',
    paymentNone: '—',
    filterPackage: 'Package filter',
    filterPayment: 'Payment filter',
    backToEvents: 'Back to events overview',
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
    remind: 'Remind',
    reminding: '…',
    remindOk: 'Reminder sent',
    remindFail: 'Failed to send reminder',
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

function paymentColor(status: string) {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'superseded':
      return 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300';
    default:
      return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
  }
}

function readSubmission(app: SiteApplication) {
  return app.submission_data && typeof app.submission_data === 'object'
    ? app.submission_data
    : {};
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
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [remindFlash, setRemindFlash] = useState<string | null>(null);
  const perPage = 20;
  const searchParams = useSearchParams();
  const pathname = usePathname() || '';
  const isEventsHub = pathname.includes('/events/registrations');
  const statusParam = searchParams.get('status');
  const categoryParam = searchParams.get('category');
  const eventIdParam = searchParams.get('eventId')?.trim() || '';
  const eventNameParam = searchParams.get('eventName')?.trim() || '';
  const registrationTierParam =
    searchParams.get('registrationTier') === 'certificate' ||
    searchParams.get('registrationTier') === 'free'
      ? searchParams.get('registrationTier')!
      : '';
  const paymentStatusParam =
    searchParams.get('paymentStatus') === 'paid' ||
    searchParams.get('paymentStatus') === 'pending' ||
    searchParams.get('paymentStatus') === 'none' ||
    searchParams.get('paymentStatus') === 'superseded'
      ? searchParams.get('paymentStatus')!
      : '';

  const categoryFilter = isEventsHub
    ? 'event'
    : 'team';
  const statusFilter =
    statusParam && STATUS_FILTERS.includes(statusParam as SiteApplicationStatus)
      ? (statusParam as SiteApplicationStatus)
      : null;

  const showEventColumns = categoryFilter === 'event' || Boolean(eventIdParam || eventNameParam);
  const hasEventScope = Boolean(eventIdParam || eventNameParam);

  const t = texts[locale as keyof typeof texts] || texts.tr;
  const baseListPath = isEventsHub
    ? `/${locale}/events/registrations`
    : `/${locale}/site-applications/applications`;
  const eventsOverviewPath = `/${locale}/events/overview`;
  const detailBasePath = isEventsHub
    ? `/${locale}/events/registrations`
    : `/${locale}/site-applications/applications`;

  const pageTitle = useMemo(() => {
    if (hasEventScope && eventNameParam) return eventNameParam;
    if (hasEventScope) return t.subtitleEvent;
    if (!statusFilter) return t.title;
    const titles: Record<SiteApplicationStatus, string> = {
      pending: t.titlePending,
      under_review: t.titleUnderReview,
      accepted: t.titleAccepted,
      rejected: t.titleRejected,
    };
    return titles[statusFilter];
  }, [statusFilter, t, hasEventScope, eventNameParam]);

  const visibleStatusFilters = useMemo(
    () =>
      categoryFilter === 'event'
        ? STATUS_FILTERS.filter((status) => status !== 'under_review')
        : STATUS_FILTERS,
    [categoryFilter]
  );

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
  }, [
    statusFilter,
    formFilter,
    search,
    categoryFilter,
    eventIdParam,
    eventNameParam,
    registrationTierParam,
    paymentStatusParam,
  ]);

  const formTitleBySlug = useCallback(
    (slug: string, app?: SiteApplication) => {
      const form = forms.find((f) => f.slug_tr === slug || f.slug_en === slug);
      if (form) return locale === 'en' ? form.title_en : form.title_tr;
      if (app?.event_name) return app.event_name;
      return slug;
    },
    [forms, locale]
  );

  const buildListHref = (overrides: {
    status?: string | null;
    category?: string;
    eventId?: string | null;
    eventName?: string | null;
    registrationTier?: string | null;
    paymentStatus?: string | null;
  }) => {
    const qs = new URLSearchParams();
    const status = overrides.status !== undefined ? overrides.status : statusFilter;
    const category = overrides.category !== undefined ? overrides.category : categoryFilter;
    const eventId = overrides.eventId !== undefined ? overrides.eventId : eventIdParam;
    const eventName = overrides.eventName !== undefined ? overrides.eventName : eventNameParam;
    const registrationTier =
      overrides.registrationTier !== undefined
        ? overrides.registrationTier
        : registrationTierParam;
    const paymentStatus =
      overrides.paymentStatus !== undefined ? overrides.paymentStatus : paymentStatusParam;

    if (status) qs.set('status', status);
    qs.set('category', category === 'all' ? categoryFilter : category);
    if (eventId) qs.set('eventId', eventId);
    if (eventName) qs.set('eventName', eventName);
    if (registrationTier) qs.set('registrationTier', registrationTier);
    if (paymentStatus) qs.set('paymentStatus', paymentStatus);
    const query = qs.toString();
    return query ? `${baseListPath}?${query}` : baseListPath;
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (formFilter !== 'all') params.set('form', formFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('category', categoryFilter);
      if (search.trim()) params.set('search', search.trim());
      if (eventIdParam) params.set('eventId', eventIdParam);
      if (eventNameParam) params.set('eventName', eventNameParam);
      if (registrationTierParam) params.set('registrationTier', registrationTierParam);
      if (paymentStatusParam) params.set('paymentStatus', paymentStatusParam);

      const res = await fetch(`/api/site-applications/applications?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      let rows = (data.applications as SiteApplication[]) || [];
      // Ek güvenlik: ekip sekmesine etkinlik kaydı sızmasın
      if (categoryFilter === 'team') {
        rows = rows.filter((app) => !isEventSiteApplication(app));
      } else if (categoryFilter === 'event') {
        rows = rows.filter((app) => isEventSiteApplication(app));
      }

      setApps(rows);
      setTotal(data.total || 0);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [
    formFilter,
    search,
    page,
    statusFilter,
    categoryFilter,
    eventIdParam,
    eventNameParam,
    registrationTierParam,
    paymentStatusParam,
    t.error,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const sendRemind = async (applicationId: string) => {
    setRemindingId(applicationId);
    setRemindFlash(null);
    try {
      const res = await fetch('/api/site-applications/payments/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const row = data.results?.[0];
      if (row?.status === 'sent') setRemindFlash(t.remindOk);
      else if (row?.status === 'skipped' && row.reason === 'already_paid') {
        setRemindFlash(
          locale === 'tr'
            ? 'Ödeme zaten alınmış — mail gönderilmedi'
            : 'Already paid — reminder skipped'
        );
        load();
      } else setRemindFlash(t.remindFail);
    } catch {
      setRemindFlash(t.remindFail);
    } finally {
      setRemindingId(null);
    }
  };

  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      const type = form.form_type ?? inferFormType(form);
      return categoryFilter === type;
    });
  }, [forms, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const colCount = showEventColumns ? 7 : 5;

  const activeEventLabel =
    eventNameParam ||
    apps.find((a) => a.event_name)?.event_name ||
    (eventIdParam ? eventIdParam.slice(0, 8) : null);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        {hasEventScope && (
          <Link
            href={eventsOverviewPath}
            className="inline-flex items-center gap-1.5 text-sm text-[#990000] hover:underline mb-3"
          >
            <CalendarDays className="w-4 h-4" />
            {t.backToEvents}
          </Link>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          {pageTitle}
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          {hasEventScope
            ? t.subtitleEvent
            : statusFilter
              ? t.subtitleFiltered
              : t.subtitle}
        </p>
        {remindFlash && (
          <p className="mt-2 text-sm text-[#990000]">{remindFlash}</p>
        )}
        {(statusFilter || hasEventScope || registrationTierParam || paymentStatusParam) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-500">{t.filterActive}:</span>
            {hasEventScope && activeEventLabel && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-[#990000] dark:bg-red-900/20 dark:text-red-300">
                {t.eventLabel}: {activeEventLabel}
              </span>
            )}
            {statusFilter && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(statusFilter)}`}>
                {t.statusLabels[statusFilter]}
              </span>
            )}
            {registrationTierParam && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                {t.filterPackage}:{' '}
                {registrationTierParam === 'certificate' ? t.packageCertificate : t.packageFree}
              </span>
            )}
            {paymentStatusParam && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${paymentColor(paymentStatusParam)}`}>
                {t.filterPayment}:{' '}
                {paymentStatusParam === 'paid'
                  ? t.paymentPaid
                  : paymentStatusParam === 'pending'
                    ? t.paymentPending
                    : paymentStatusParam === 'superseded'
                      ? t.paymentSuperseded
                      : t.paymentNone}
              </span>
            )}
            <Link
              href={
                hasEventScope
                  ? buildListHref({
                      status: null,
                      registrationTier: null,
                      paymentStatus: null,
                      eventId: eventIdParam || null,
                      eventName: eventNameParam || null,
                      category: 'event',
                    })
                  : baseListPath
              }
              className="text-xs text-[#990000] hover:underline"
            >
              {t.clearFilter}
            </Link>
            {hasEventScope && (
              <Link href={baseListPath} className="text-xs text-neutral-500 hover:underline">
                {locale === 'tr' ? 'Tüm başvurular' : 'All applications'}
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href={buildListHref({ status: null, category: categoryFilter })}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            !statusFilter
              ? 'bg-[#990000] text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          {t.all}
        </Link>
        {visibleStatusFilters.map((status) => (
          <Link
            key={status}
            href={buildListHref({ status, category: categoryFilter })}
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

      {showEventColumns && (
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs text-neutral-500 self-center mr-1">{t.package}:</span>
          {(
            [
              ['', t.all],
              ['free', t.packageFree],
              ['certificate', t.packageCertificate],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key || 'all-pkg'}
              href={buildListHref({
                registrationTier: key || null,
                category: 'event',
              })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                registrationTierParam === key
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {label}
            </Link>
          ))}
          <span className="text-xs text-neutral-500 self-center ml-2 mr-1">{t.payment}:</span>
          {(
            [
              ['', t.all],
              ['paid', t.paymentPaid],
              ['pending', t.paymentPending],
              ['superseded', t.paymentSuperseded],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key || 'all-pay'}
              href={buildListHref({
                paymentStatus: key || null,
                category: 'event',
                registrationTier: key
                  ? registrationTierParam || 'certificate'
                  : registrationTierParam || null,
              })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                paymentStatusParam === key
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t.search}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
          />
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={formFilter}
            onChange={(e) => {
              setFormFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
          >
            <option value="all">{t.allForms}</option>
            {filteredForms.map((form) => (
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
                {showEventColumns && (
                  <>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">{t.package}</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{t.payment}</th>
                  </>
                )}
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{t.status}</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">{t.date}</th>
                <th className="text-right px-4 py-3 font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-neutral-500">
                    {t.loading}
                  </td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-neutral-500">
                    {t.noResults}
                  </td>
                </tr>
              ) : (
                apps.map((app) => {
                  const submission = readSubmission(app);
                  const tier = String(submission.registration_tier || 'free');
                  const pay = String(submission.payment_status || 'none');
                  const price = Number(submission.package_price);
                  const currency = String(submission.package_currency || 'TRY');

                  return (
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
                          {formTitleBySlug(app.application_type, app)}
                        </span>
                        {app.event_name && (
                          <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {t.eventLabel}: {app.event_name}
                          </div>
                        )}
                      </td>
                      {showEventColumns && (
                        <>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="font-medium text-neutral-800 dark:text-neutral-200">
                              {tier === 'certificate' ? t.packageCertificate : t.packageFree}
                            </div>
                            {tier === 'certificate' && Number.isFinite(price) && price > 0 && (
                              <div className="text-xs text-neutral-500 mt-0.5">
                                {formatPackagePrice(price, currency, locale)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {tier === 'certificate' ? (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${paymentColor(pay)}`}
                              >
                                {pay === 'paid'
                                  ? t.paymentPaid
                                  : pay === 'pending'
                                    ? t.paymentPending
                                    : pay === 'superseded'
                                      ? t.paymentSuperseded
                                      : t.paymentNone}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400">{t.paymentNone}</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(app.status)}`}
                        >
                          {t.statusLabels[app.status as keyof typeof t.statusLabels] || app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(app.created_at).toLocaleDateString(
                            locale === 'tr' ? 'tr-TR' : 'en-US'
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {(pay === 'pending' || pay === 'superseded') && (
                            <button
                              type="button"
                              onClick={() => sendRemind(app.id)}
                              disabled={remindingId === app.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg disabled:opacity-50"
                              title={t.remind}
                            >
                              <Mail className="w-4 h-4" />
                              {remindingId === app.id ? t.reminding : t.remind}
                            </button>
                          )}
                          <Link
                            href={`${detailBasePath}/${app.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#990000] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                            {t.view}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-sm text-neutral-500">
              {t.page} {page} {t.of} {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
