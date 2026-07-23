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
  Copy,
  FileSpreadsheet,
  Mail,
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
  certificate_superseded: number;
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
  certificate_superseded: number;
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
    paymentSuperseded: 'Mükerrer',
    revenue: 'Sertifika geliri',
    accepted: 'Kabul',
    pending: 'Bekleyen',
    viewRegistrations: 'Kayıtları gör',
    viewPaid: 'Ödenen sertifikalar',
    viewPendingPay: 'Bekleyen ödemeler',
    viewSuperseded: 'Mükerrer kayıtlar',
    sendReminders: 'Etkinlik hatırlatma maili',
    sendingReminders: 'Gönderiliyor…',
    remindersSent: 'Etkinlik hatırlatması gönderildi',
    remindersFailed: 'Hatırlatma gönderilemedi',
    sendPaymentReminders: 'Ödeme hatırlatması',
    sendingPaymentReminders: 'Ödeme maili…',
    paymentRemindersSent: 'Ödeme hatırlatması gönderildi',
    downloadExcel: 'Excel indir',
    downloadingExcel: 'İndiriliyor…',
    excelFailed: 'Excel indirilemedi',
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
    paymentSuperseded: 'Duplicates',
    revenue: 'Certificate revenue',
    accepted: 'Accepted',
    pending: 'Pending',
    viewRegistrations: 'View registrations',
    viewPaid: 'Paid certificates',
    viewPendingPay: 'Pending payments',
    viewSuperseded: 'Duplicate registrations',
    sendReminders: 'Send event reminder',
    sendingReminders: 'Sending…',
    remindersSent: 'Event reminders sent',
    remindersFailed: 'Failed to send reminders',
    sendPaymentReminders: 'Payment reminder',
    sendingPaymentReminders: 'Payment mail…',
    paymentRemindersSent: 'Payment reminders sent',
    downloadExcel: 'Download Excel',
    downloadingExcel: 'Downloading…',
    excelFailed: 'Excel download failed',
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
  return `/${locale}/events/registrations?${qs.toString()}`;
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
  const [remindingEventId, setRemindingEventId] = useState<string | null>(null);
  const [paymentRemindingEventId, setPaymentRemindingEventId] = useState<string | null>(
    null
  );
  const [exportingEventId, setExportingEventId] = useState<string | null>(null);
  const [remindMessage, setRemindMessage] = useState<string | null>(null);

  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  const load = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) {
        setLoading(true);
        setError(null);
      }
      const res = await fetch('/api/site-applications/stats/by-event');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setEvents((data.events as EventStatsRow[]) || []);
      setTotals(data.totals || null);
    } catch {
      if (!opts?.silent) setError(t.error);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendEventReminders = async (event: EventStatsRow) => {
    if (!event.event_id || event.total === 0) return;

    const ok = confirm(
      locale === 'tr'
        ? `${event.event_name} etkinliğine kayıtlı katılımcılara (e-posta başına 1) hatırlatma maili gönderilsin mi?`
        : `Send an event reminder to all registrants of ${event.event_name} (1 email per address)?`
    );
    if (!ok) return;

    setRemindingEventId(event.event_id);
    setRemindMessage(null);
    try {
      const res = await fetch(`/api/events/${event.event_id}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRemindMessage(
        `${t.remindersSent}: ${data.sent || 0} / ${data.uniqueEmails || 0} (kayıt ${data.totalRegistrants || event.total})`
      );
    } catch {
      setRemindMessage(t.remindersFailed);
    } finally {
      setRemindingEventId(null);
    }
  };

  const sendPaymentReminders = async (event: EventStatsRow) => {
    if (!event.event_id) return;
    const pendingOrDup =
      (event.certificate_pending || 0) + (event.certificate_superseded || 0);
    if (pendingOrDup === 0) return;

    const ok = confirm(
      locale === 'tr'
        ? `${event.event_name} için ${event.certificate_pending} bekleyen ödeme (+ ${event.certificate_superseded || 0} mükerrer) maili gönderilsin mi?`
        : `Send payment reminders for ${event.certificate_pending} pending (+ ${event.certificate_superseded || 0} duplicates) on ${event.event_name}?`
    );
    if (!ok) return;

    setPaymentRemindingEventId(event.event_id);
    setRemindMessage(null);
    try {
      const res = await fetch('/api/site-applications/payments/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.event_id,
          includeSuperseded: true,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRemindMessage(
        `${t.paymentRemindersSent}: ${data.sent || 0} · skip ${data.skipped || 0} · fail ${data.failed || 0}`
      );
      await load({ silent: true });
    } catch {
      setRemindMessage(t.remindersFailed);
    } finally {
      setPaymentRemindingEventId(null);
    }
  };

  const downloadExcel = async (event: EventStatsRow) => {
    if (!event.event_id) return;
    setExportingEventId(event.event_id);
    setRemindMessage(null);
    try {
      const res = await fetch(`/api/events/${event.event_id}/registrants/export`);
      if (!res.ok) throw new Error('export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.event_slug || 'etkinlik'}-kayitlar.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setRemindMessage(t.excelFailed);
    } finally {
      setExportingEventId(null);
    }
  };

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
          onClick={() => load()}
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

      {remindMessage && (
        <div className="mb-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
          {remindMessage}
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
              hint: `${totals.certificate_pending} ${t.paymentPending} · ${totals.certificate_superseded || 0} ${t.paymentSuperseded}`,
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
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 px-3 py-1 text-xs font-medium">
                      <Copy className="w-3.5 h-3.5" />
                      {t.paymentSuperseded}: {event.certificate_superseded || 0}
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
                    <Link
                      href={applicationsHref(locale, event, {
                        registrationTier: 'certificate',
                        paymentStatus: 'superseded',
                      })}
                      className="text-xs text-[#990000] hover:underline px-2 py-1"
                    >
                      {t.viewSuperseded}
                    </Link>
                    {event.event_id && (
                      <>
                        <button
                          type="button"
                          onClick={() => downloadExcel(event)}
                          disabled={exportingEventId === event.event_id}
                          className="inline-flex items-center gap-1 text-xs font-medium border border-neutral-300 dark:border-neutral-600 rounded-full px-3 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          {exportingEventId === event.event_id
                            ? t.downloadingExcel
                            : t.downloadExcel}
                        </button>
                        <button
                          type="button"
                          onClick={() => sendEventReminders(event)}
                          disabled={remindingEventId === event.event_id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-white bg-[#990000] hover:bg-[#7a0000] disabled:opacity-50 rounded-full px-3 py-1"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {remindingEventId === event.event_id
                            ? t.sendingReminders
                            : t.sendReminders}
                        </button>
                        {((event.certificate_pending || 0) > 0 ||
                          (event.certificate_superseded || 0) > 0) && (
                          <button
                            type="button"
                            onClick={() => sendPaymentReminders(event)}
                            disabled={paymentRemindingEventId === event.event_id}
                            className="inline-flex items-center gap-1 text-xs font-medium border border-amber-300 text-amber-800 dark:text-amber-300 rounded-full px-3 py-1 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            {paymentRemindingEventId === event.event_id
                              ? t.sendingPaymentReminders
                              : t.sendPaymentReminders}
                          </button>
                        )}
                      </>
                    )}
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
