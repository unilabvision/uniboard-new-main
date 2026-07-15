'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Save,
  PartyPopper,
  Users,
  Paperclip,
  Download,
  Loader2,
} from 'lucide-react';
import type { SiteApplication, SiteApplicationStatusHistory } from '@/app/types/siteApplications';
import { formatFileSize, getAllowedStatusesForApplication, isEventSiteApplication } from '@/app/lib/siteApplications';
import { formatPackagePrice } from '@/app/lib/siteApplications/packages';

const INTERNAL_SUBMISSION_KEYS = new Set([
  'registration_tier',
  'package_title',
  'package_price',
  'package_currency',
  'payment_status',
  'payment_method',
  'order_id',
  'paid_at',
  'event_slug',
  'event_title',
]);

const texts = {
  tr: {
    back: 'Listeye Dön',
    personal: 'Kişisel Bilgiler',
    application: 'Başvuru Bilgileri',
    status: 'Durum',
    notes: 'Yönetici Notları',
    saveNotes: 'Notları Kaydet',
    changeStatus: 'Durumu Güncelle',
    approvalEmailSent: 'Onay e-postası başvurana gönderildi.',
    approvalEmailFailed: 'Durum güncellendi ancak onay e-postası gönderilemedi.',
    eventFlowHint:
      'Etkinlik kayıtları sistem tarafından otomatik onaylanır; admin onayı gerekmez. Kayıt anında bilgi e-postası gider.',
    autoAccepted: 'Otomatik onaylandı',
    autoAcceptedHint:
      'Bu kayıt başvuru anında otomatik kabul edildi. Admin durumu değiştirmez.',
    history: 'Durum Geçmişi',
    loading: 'Yükleniyor...',
    notFound: 'Başvuru bulunamadı',
    statusLabels: {
      pending: 'Bekliyor',
      under_review: 'İncelemede',
      accepted: 'Kabul',
      rejected: 'Red',
    },
    typeLabels: { event: 'Etkinlik', team: 'Ekip' },
    fields: {
      event_name: 'Etkinlik Adı',
      event_date: 'Tarih',
      participant_count: 'Katılımcı Sayısı',
      organization: 'Kurum',
      role_interest: 'Rol',
      experience: 'Deneyim',
      portfolio_url: 'Portfolyo',
      motivation: 'Motivasyon',
      message: 'Mesaj',
      registration_tier: 'Kayıt paketi',
      package_title: 'Paket',
      package_price: 'Ücret',
      package_currency: 'Para birimi',
      payment_status: 'Ödeme durumu',
    },
    packageSection: 'Kayıt paketi',
    packageFree: 'Ücretsiz kayıt',
    packageCertificate: 'Sertifika paketi',
    paymentPending: 'Ödeme bekleniyor',
    paymentNone: 'Ödeme gerekmez',
    paymentPaid: 'Ödendi',
    attachment: 'Ek Dosya',
    download: 'Dosyayı İndir',
    expires: 'Silinme tarihi',
    noAttachment: 'Ek dosya yok',
    attachmentExpired: 'Dosya süresi doldu veya silindi',
  },
  en: {
    back: 'Back to List',
    personal: 'Personal Information',
    application: 'Application Details',
    status: 'Status',
    notes: 'Admin Notes',
    saveNotes: 'Save Notes',
    changeStatus: 'Update Status',
    approvalEmailSent: 'Approval email sent to the applicant.',
    approvalEmailFailed: 'Status updated but the approval email could not be sent.',
    eventFlowHint:
      'Event registrations are auto-approved by the system; no admin approval is required. A confirmation email is sent on submission.',
    autoAccepted: 'Auto-approved',
    autoAcceptedHint:
      'This registration was accepted automatically on submit. Admins do not change its status.',
    history: 'Status History',
    loading: 'Loading...',
    notFound: 'Application not found',
    statusLabels: {
      pending: 'Pending',
      under_review: 'Under Review',
      accepted: 'Accepted',
      rejected: 'Rejected',
    },
    typeLabels: { event: 'Event', team: 'Team' },
    fields: {
      event_name: 'Event Name',
      event_date: 'Date',
      participant_count: 'Participants',
      organization: 'Organization',
      role_interest: 'Role',
      experience: 'Experience',
      portfolio_url: 'Portfolio',
      motivation: 'Motivation',
      message: 'Message',
      registration_tier: 'Registration package',
      package_title: 'Package',
      package_price: 'Price',
      package_currency: 'Currency',
      payment_status: 'Payment status',
    },
    packageSection: 'Registration package',
    packageFree: 'Free registration',
    packageCertificate: 'Certificate package',
    paymentPending: 'Payment pending',
    paymentNone: 'No payment required',
    paymentPaid: 'Paid',
    attachment: 'Attachment',
    download: 'Download File',
    expires: 'Expires on',
    noAttachment: 'No attachment',
    attachmentExpired: 'File expired or was removed',
  },
};

export default function SiteApplicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const { user } = useUser();

  const [app, setApp] = useState<SiteApplication | null>(null);
  const [history, setHistory] = useState<SiteApplicationStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/site-applications/applications/${id}`);
        const data = await res.json();
        if (!res.ok || !data.application) throw new Error(data.error || 'Not found');

        setApp(data.application as SiteApplication);
        const loaded = data.application as SiteApplication;
        const initialStatus =
          isEventSiteApplication(loaded) && loaded.status === 'under_review'
            ? 'pending'
            : loaded.status;
        setNewStatus(initialStatus);
        setNotes(data.application.admin_notes || '');
        setHistory((data.history as SiteApplicationStatusHistory[]) || []);
        setAttachmentUrl(data.attachment_url || null);
      } catch {
        setApp(null);
        setLoadError(t.notFound);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, t.notFound]);

  const updateStatus = async () => {
    if (!app || !user || newStatus === app.status) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/site-applications/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reviewed_by_email: user.primaryEmailAddress?.emailAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      setApp(data.application as SiteApplication);
      setHistory((data.history as SiteApplicationStatusHistory[]) || []);

      if (newStatus === 'accepted' && data.approval_email) {
        setStatusMessage(
          data.approval_email.success ? t.approvalEmailSent : t.approvalEmailFailed
        );
      }
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!app || !user) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/site-applications/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setApp(data.application as SiteApplication);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadAttachment = async () => {
    if (!app?.attachment_storage_path) return;
    if (app.attachment_expires_at && new Date(app.attachment_expires_at) < new Date()) {
      setAttachmentError(t.attachmentExpired);
      return;
    }

    setDownloading(true);
    setAttachmentError(null);
    try {
      let url = attachmentUrl;
      if (!url) {
        const res = await fetch(`/api/site-applications/applications/${id}`);
        const data = await res.json();
        url = data.attachment_url || null;
        setAttachmentUrl(url);
      }
      if (!url) throw new Error('URL missing');
      window.open(url, '_blank', 'noopener');
    } catch {
      setAttachmentError(t.attachmentExpired);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">{t.loading}</div>;
  }

  if (!app) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">{loadError || t.notFound}</p>
        <Link href={`/${locale}/site-applications/applications`} className="text-[#990000]">
          {t.back}
        </Link>
      </div>
    );
  }

  const isEvent = isEventSiteApplication(app);
  const allowedStatuses = getAllowedStatusesForApplication(app);
  const registrationTier = app.submission_data?.registration_tier as string | undefined;
  const packageTitle = app.submission_data?.package_title as string | undefined;
  const packagePrice = app.submission_data?.package_price as number | undefined;
  const packageCurrency = (app.submission_data?.package_currency as string | undefined) || 'TRY';
  const paymentStatus = app.submission_data?.payment_status as string | undefined;
  const orderId = app.submission_data?.order_id as string | undefined;

  const detailFields =
    app.submission_data && Object.keys(app.submission_data).length > 0
      ? Object.entries(app.submission_data).filter(([key]) => !INTERNAL_SUBMISSION_KEYS.has(key))
      : isEvent
        ? [
            ['event_name', app.event_name],
            ['event_date', app.event_date],
            ['participant_count', app.participant_count],
            ['organization', app.organization],
            ['motivation', app.motivation],
            ['message', app.message],
          ]
        : [
            ['role_interest', app.role_interest],
            ['experience', app.experience],
            ['portfolio_url', app.portfolio_url],
            ['motivation', app.motivation],
            ['message', app.message],
          ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Link
        href={`/${locale}/site-applications/applications`}
        className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-[#990000] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.back}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {app.first_name} {app.last_name}
        </h1>
        <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
          {isEvent ? <PartyPopper className="w-4 h-4" /> : <Users className="w-4 h-4" />}
          {isEvent ? t.typeLabels.event : t.typeLabels.team}
          {app.event_name && (
            <>
              <span>·</span>
              <span>{app.event_name}</span>
            </>
          )}
          <span>·</span>
          <Calendar className="w-4 h-4" />
          {new Date(app.created_at).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
        </div>
      </div>

      <div className="grid gap-6">
        <section className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="font-semibold mb-4">{t.personal}</h2>
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-neutral-400" />
              <a href={`mailto:${app.email}`} className="text-[#990000]">{app.email}</a>
            </div>
            {app.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-neutral-400" />
                {app.phone}
              </div>
            )}
          </dl>
        </section>

        {isEvent && registrationTier && (
          <section className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="font-semibold mb-4">{t.packageSection}</h2>
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-neutral-500 mb-1">{t.fields.registration_tier}</dt>
                <dd className="font-medium text-neutral-900 dark:text-neutral-100">
                  {registrationTier === 'certificate' ? t.packageCertificate : t.packageFree}
                  {packageTitle ? ` — ${packageTitle}` : ''}
                </dd>
              </div>
              {registrationTier === 'certificate' && packagePrice != null && (
                <div>
                  <dt className="text-neutral-500 mb-1">{t.fields.package_price}</dt>
                  <dd className="font-medium text-neutral-900 dark:text-neutral-100">
                    {formatPackagePrice(packagePrice, packageCurrency, locale)}
                  </dd>
                </div>
              )}
              {paymentStatus && (
                <div>
                  <dt className="text-neutral-500 mb-1">{t.fields.payment_status}</dt>
                  <dd className="font-medium text-neutral-900 dark:text-neutral-100">
                    {paymentStatus === 'paid'
                      ? t.paymentPaid
                      : paymentStatus === 'pending'
                        ? t.paymentPending
                        : t.paymentNone}
                  </dd>
                </div>
              )}
              {orderId && (
                <div>
                  <dt className="text-neutral-500 mb-1">Order ID</dt>
                  <dd className="font-mono text-xs text-neutral-900 dark:text-neutral-100">{orderId}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <section className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="font-semibold mb-4">{t.application}</h2>
          <dl className="space-y-4 text-sm">
            {detailFields.map((entry) => {
              const [key, value] = Array.isArray(entry) ? entry : [entry, app.submission_data[entry as string]];
              if (value === null || value === undefined || value === '') return null;
              const label =
                t.fields[key as keyof typeof t.fields] ||
                String(key).replace(/_/g, ' ');
              return (
                <div key={String(key)}>
                  <dt className="text-neutral-500 mb-1 capitalize">{label}</dt>
                  <dd className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">
                    {String(key).includes('url') && typeof value === 'string' ? (
                      <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-[#990000] break-all">
                        {String(value)}
                      </a>
                    ) : (
                      String(value)
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        <section className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            {t.attachment}
          </h2>
          {app.attachment_storage_path && app.attachment_file_name ? (
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {app.attachment_file_name}
                </p>
                {app.attachment_file_size != null && (
                  <p className="text-neutral-500 text-xs mt-1">
                    {formatFileSize(app.attachment_file_size)}
                  </p>
                )}
                {app.attachment_expires_at && (
                  <p className="text-neutral-500 text-xs mt-1">
                    {t.expires}:{' '}
                    {new Date(app.attachment_expires_at).toLocaleString(
                      locale === 'tr' ? 'tr-TR' : 'en-US'
                    )}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleDownloadAttachment}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#990000] text-white rounded-lg text-sm disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {t.download}
              </button>
              {attachmentError && (
                <p className="text-sm text-red-600 dark:text-red-400">{attachmentError}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">{t.noAttachment}</p>
          )}
        </section>

        <section className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="font-semibold mb-4">{t.status}</h2>
          {isEvent ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {t.statusLabels[app.status as keyof typeof t.statusLabels] || app.status}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                  {t.autoAccepted}
                </span>
              </div>
              <p className="text-sm text-neutral-500">{t.autoAcceptedHint}</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 items-end">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900"
                >
                  {allowedStatuses.map((status) => (
                    <option key={status} value={status}>
                      {t.statusLabels[status]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={updateStatus}
                  disabled={saving || newStatus === app.status}
                  className="px-4 py-2 bg-[#990000] text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t.changeStatus}
                </button>
              </div>
              {statusMessage && (
                <p
                  className={`mt-3 text-sm ${
                    statusMessage === t.approvalEmailSent
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {statusMessage}
                </p>
              )}
            </>
          )}
        </section>

        <section className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="font-semibold mb-4">{t.notes}</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 mb-3"
          />
          <button
            onClick={saveNotes}
            disabled={saving}
            className="px-4 py-2 bg-neutral-800 dark:bg-neutral-600 text-white rounded-lg disabled:opacity-50"
          >
            {t.saveNotes}
          </button>
        </section>

        {history.length > 0 && (
          <section className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="font-semibold mb-4">{t.history}</h2>
            <ul className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id} className="text-neutral-600 dark:text-neutral-400">
                  {h.old_status} → {h.new_status}
                  <span className="text-neutral-400 ml-2">
                    {new Date(h.created_at).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
