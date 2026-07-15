'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Users,
  Award,
  CreditCard,
  Clock,
  RefreshCw,
  ChevronRight,
  Search,
} from 'lucide-react';
import { formatPackagePrice } from '@/app/lib/siteApplications/packages';

type EventStatsRow = {
  event_id: string | null;
  event_key: string;
  event_name: string;
  event_slug: string | null;
  total: number;
  accepted: number;
  pending: number;
  rejected: number;
  free: number;
  certificate: number;
  certificate_paid: number;
  certificate_pending: number;
  certificate_revenue: number;
  currency: string;
};

type Totals = {
  events: number;
  applications: number;
  free: number;
  certificate: number;
  certificate_paid: number;
  certificate_pending: number;
  certificate_revenue: number;
};

const texts = {
  tr: {
    title: 'Etkinlik Özeti',
    subtitle: 'Etkinliklere göre kayıtlar, sertifika paketleri ve ödemeler',
    refresh: 'Yenile',
    search: 'Etkinlik ara...',
    loading: 'Yükleniyor...',
    error: 'Etkinlik özeti yüklenemedi',
    empty: 'Henüz etkinlik kaydı yok',
    events: 'Etkinlik',
    applications: 'Kayıt',
    free: 'Ücretsiz',
    certificate: 'Sertifika',
    paid: 'Ödendi',
    paymentPending: 'Ödeme bekliyor',
    revenue: 'Sertifika geliri',
    accepted: 'Kabul',
    pending: 'Bekleyen',
    viewRegistrations: 'Kayıtları gör',
    viewPaid: 'Ödenen sertifikalar',
    viewPendingPay: 'Bekleyen ödemeler',
    noApps: 'Bu etkinlikte henüz kayıt yok',
  },
  en: {
    title: 'Events Overview',
    subtitle: 'Registrations, certificate packages and payments by event',
    refresh: 'Refresh',
    search: 'Search events...',
    loading: 'Loading...',
    error: 'Failed to load events overview',
    empty: 'No event registrations yet',
    events: 'Events',
    applications: 'Registrations',
    free: 'Free',
    certificate: 'Certificate',
    paid: 'Paid',
    paymentPending: 'Payment pending',
    revenue: 'Certificate revenue',
    accepted: 'Accepted',
    pending: 'Pending',
    viewRegistrations: 'View registrations',
    viewPaid: 'Paid certificates',
    viewPendingPay: 'Pending payments',
    noApps: 'No registrations for this event yet',
  },
};

function applicationsHref(
  locale: string,
  event: EventStatsRow,
  extra?: { registrationTier?: string; paymentStatus?: string }
) {
  const qs = new URLSearchParams({ category: 'event' });
  if (event.event_id) qs.set('eventId', event.event_id);
  else qs.set('eventName', event.event_name);
  if (extra?.registrationTier) qs.set('registrationTier', extra.registrationTier);
  if (extra?.paymentStatus) qs.set('paymentStatus', extra.paymentStatus);
  return `/${locale}/site-applications/applications?${qs.toString()}`;
}

export default function SiteApplicationsEventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [events, setEvents] = useState<EventStatsRow[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/site-applications/stats/by-event');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setEvents((data.events as EventStatsRow[]) || []);
      setTotals(data.totals || null);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr');
    if (!q) return events;
    return events.filter((e) => e.event_name.toLocaleLowerCase('tr').includes(q));
  }, [events, search]);

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">{t.loading}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            {t.title}
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">{t.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          {t.refresh}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: t.events, value: totals.events, icon: CalendarDays },
            { label: t.applications, value: totals.applications, icon: Users },
            {
              label: t.certificate,
              value: `${totals.certificate_paid}/${totals.certificate}`,
              icon: Award,
              hint: `${t.paid} / ${t.certificate}`,
            },
            {
              label: t.revenue,
              value: formatPackagePrice(totals.certificate_revenue, 'TRY', locale),
              icon: CreditCard,
              hint: `${totals.certificate_pending} ${t.paymentPending}`,
            },
          ].map(({ label, value, icon: Icon, hint }) => (
            <div
              key={label}
              className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5"
            >
              <Icon className="w-5 h-5 text-[#990000] mb-2" />
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</div>
              <div className="text-sm text-neutral-500">{label}</div>
              {hint && <div className="text-xs text-neutral-400 mt-1">{hint}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.search}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-10 text-center text-neutral-500">
          {t.empty}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((event) => (
            <article
              key={event.event_key}
              className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 sm:p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="w-5 h-5 text-[#990000] shrink-0" />
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {event.event_name}
                    </h2>
                  </div>
                  {event.event_slug && (
                    <p className="text-xs text-neutral-500 font-mono ml-7">{event.event_slug}</p>
                  )}
                </div>

                <Link
                  href={applicationsHref(locale, event)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#990000] hover:underline shrink-0"
                >
                  {t.viewRegistrations}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {event.total === 0 ? (
                <p className="mt-4 text-sm text-neutral-500">{t.noApps}</p>
              ) : (
                <>
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Metric label={t.applications} value={event.total} />
                    <Metric label={t.accepted} value={event.accepted} tone="green" />
                    <Metric label={t.pending} value={event.pending} tone="amber" />
                    <Metric label={t.free} value={event.free} />
                    <Metric label={t.certificate} value={event.certificate} />
                    <Metric
                      label={t.revenue}
                      value={formatPackagePrice(event.certificate_revenue, event.currency, locale)}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 text-xs font-medium">
                      <Award className="w-3.5 h-3.5" />
                      {t.paid}: {event.certificate_paid}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 px-3 py-1 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {t.paymentPending}: {event.certificate_pending}
                    </span>
                    <Link
                      href={applicationsHref(locale, event, {
                        registrationTier: 'certificate',
                        paymentStatus: 'paid',
                      })}
                      className="text-xs text-[#990000] hover:underline px-2 py-1"
                    >
                      {t.viewPaid}
                    </Link>
                    <Link
                      href={applicationsHref(locale, event, {
                        registrationTier: 'certificate',
                        paymentStatus: 'pending',
                      })}
                      className="text-xs text-[#990000] hover:underline px-2 py-1"
                    >
                      {t.viewPendingPay}
                    </Link>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'green' | 'amber';
}) {
  const toneClass =
    tone === 'green'
      ? 'text-green-700 dark:text-green-400'
      : tone === 'amber'
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-neutral-900 dark:text-neutral-100';

  return (
    <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/80 dark:border-neutral-700 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-0.5">{label}</div>
      <div className={`text-base font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
