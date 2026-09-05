'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Send,
  Trash2,
} from 'lucide-react';
import type { SiteApplication, SiteApplicationStatusHistory } from '@/app/types/siteApplications';
import {
  formatFileSize,
  getAllowedStatusesForApplication,
  isEventSiteApplication,
  parseSubmissionFileMeta,
} from '@/app/lib/siteApplications';
import { formatPackagePrice } from '@/app/lib/siteApplications/packages';

type FieldAttachment = {
  field_key: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  storage_path: string;
  url: string | null;
};

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
    delete: 'Başvuruyu Sil',
    confirmDelete: 'Bu başvuruyu kalıcı olarak silmek istediğinize emin misiniz?',
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
    paymentFailed: 'Ödeme başarısız',
    paymentNone: 'Ödeme gerekmez',
    paymentPaid: 'Ödendi',
    paymentSuperseded: 'Mükerrer (başka kayıt ödenmiş)',
    attachment: 'Ek Dosya',
    download: 'Dosyayı İndir',
    openFile: 'Dosyayı Aç',
    expires: 'Silinme tarihi',
    noAttachment: 'Ek dosya yok',
    attachmentExpired: 'Dosya süresi doldu veya silindi',
    fieldFiles: 'Formdaki dosya alanları',
    storageHint: 'Dosyalar güvenli depolamada tutulur; admin imzalı link ile açar/indirir.',
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
    delete: 'Delete Application',
    confirmDelete: 'Are you sure you want to permanently delete this application?',
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
    paymentFailed: 'Payment failed',
    paymentNone: 'No payment required',
    paymentPaid: 'Paid',
    paymentSuperseded: 'Duplicate (paid on another registration)',
    attachment: 'Attachment',
    download: 'Download File',
    openFile: 'Open File',
    expires: 'Expires on',
    noAttachment: 'No attachment',
    attachmentExpired: 'File expired or was removed',
    fieldFiles: 'File fields from the form',
    storageHint: 'Files are stored securely; admins open/download via signed links.',
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
  const pathname = usePathname() || '';
  const isEventsHub = pathname.includes('/events/registrations');
  const listHref = isEventsHub
    ? `/${locale}/events/registrations`
    : `/${locale}/site-applications/applications`;

  type FormFieldDef = {
    field_key: string;
    label_tr: string;
    label_en: string;
    order_index: number;
    field_type: string;
    options?: Array<{ label_tr: string; label_en: string; value: string }> | unknown;
  };

  const [app, setApp] = useState<SiteApplication | null>(null);
  const [history, setHistory] = useState<SiteApplicationStatusHistory[]>([]);
  const [formFields, setFormFields] = useState<FormFieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingField, setDownloadingField] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [fieldAttachments, setFieldAttachments] = useState<FieldAttachment[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailFlash, setEmailFlash] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState<boolean | null>(null);
  const [statusEmailCheck, setStatusEmailCheck] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        setFieldAttachments(
          Array.isArray(data.field_attachments) ? (data.field_attachments as FieldAttachment[]) : []
        );
        if (Array.isArray(data.form_fields)) {
          setFormFields(data.form_fields as FormFieldDef[]);
        }
      } catch {
        setApp(null);
        setLoadError(t.notFound);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, t.notFound]);

  useEffect(() => {
    fetch('/api/site-applications/smtp-config')
      .then((r) => r.json())
      .then((data) => setSmtpConfigured(!!data.config?.is_verified))
      .catch(() => setSmtpConfigured(false));
  }, []);

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
        if (Array.isArray(data.field_attachments)) {
          setFieldAttachments(data.field_attachments as FieldAttachment[]);
        }
      }
      if (!url) throw new Error('URL missing');
      window.open(url, '_blank', 'noopener');
    } catch {
      setAttachmentError(t.attachmentExpired);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadFieldFile = async (fieldKey: string) => {
    setDownloadingField(fieldKey);
    setAttachmentError(null);
    try {
      let item = fieldAttachments.find((f) => f.field_key === fieldKey);
      let url = item?.url || null;
      if (!url) {
        const res = await fetch(`/api/site-applications/applications/${id}`);
        const data = await res.json();
        const list = Array.isArray(data.field_attachments)
          ? (data.field_attachments as FieldAttachment[])
          : [];
        setFieldAttachments(list);
        item = list.find((f) => f.field_key === fieldKey);
        url = item?.url || null;
      }
      if (!url) throw new Error('URL missing');
      window.open(url, '_blank', 'noopener');
    } catch {
      setAttachmentError(t.attachmentExpired);
    } finally {
      setDownloadingField(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t.confirmDelete)) return;
    setDeleting(true);
    setStatusMessage(null);
    try {
      // Use the specific LMS endpoint if coming from LMS, or general site-applications endpoint
      const endpoint = pathname.includes('/lms/') 
        ? `/api/lms/course-applications/${id}` 
        : `/api/site-applications/applications/${id}`;
        
      const res = await fetch(endpoint, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete');
      }
      // Redirect back to list
      window.location.href = listHref;
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Delete error');
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">{t.loading}</div>;
  }

  if (!app) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">{loadError || t.notFound}</p>
        <Link href={listHref} className="text-[#990000]">
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

  const fieldFileKeys = new Set(fieldAttachments.map((f) => f.field_key));

  const detailFields = (() => {
    if (!app.submission_data || Object.keys(app.submission_data).length === 0) {
      return isEvent
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
    }

    if (formFields.length > 0) {
      const sub = app.submission_data as Record<string, unknown>;
      // Map contact field keys to top-level application columns
      const contactFieldMap: Record<string, unknown> = {
        email: app.email,
        phone: app.phone,
        first_name: app.first_name,
        last_name: app.last_name,
      };
      return formFields
        .filter((f) => !fieldFileKeys.has(f.field_key) && !INTERNAL_SUBMISSION_KEYS.has(f.field_key))
        .map((f) => {
          const val = sub[f.field_key] ?? contactFieldMap[f.field_key] ?? null;
          return [f.field_key, val] as [string, unknown];
        });
    }

    const entries = Object.entries(app.submission_data).filter(
      ([key, value]) =>
        !INTERNAL_SUBMISSION_KEYS.has(key) &&
        !fieldFileKeys.has(key) &&
        !parseSubmissionFileMeta(value)
    );

    return entries;
  })();

  const getFieldLabel = (key: string): string => {
    if (formFields.length > 0) {
      const def = formFields.find((f) => f.field_key === key);
      if (def) return locale === 'en' ? def.label_en : def.label_tr;
    }
    return (
      t.fields[key as keyof typeof t.fields] ||
      String(key).replace(/_/g, ' ')
    );
  };

  const resolveOptionValue = (key: string, rawValue: unknown): React.ReactNode => {
    const def = formFields.find((f) => f.field_key === key);
    const optArr = def && Array.isArray(def.options)
      ? (def.options as Array<{ label_tr?: string; label_en?: string; value?: string }>)
      : null;

    const resolveOne = (v: string): string => {
      if (!optArr) return v;
      const match = optArr.find((o) => o.value === v || o.value === v.trim());
      if (!match) return v;
      return (locale === 'en' ? match.label_en : match.label_tr) || v;
    };

    // Array (multi-select checkbox stored as array)
    if (Array.isArray(rawValue)) {
      const labels = rawValue.map((v) => resolveOne(String(v)));
      return (
        <ul className="list-disc list-inside space-y-0.5">
          {labels.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      );
    }

    if (typeof rawValue !== 'string') return String(rawValue ?? '');

    // Space-separated or comma-separated multi-value string like "option_3 option_5"
    // Only split if it looks like it contains option_ keys
    if (optArr && /option_\d+/.test(rawValue)) {
      const parts = rawValue.trim().split(/[\s,]+/).filter(Boolean);
      if (parts.length > 1) {
        const labels = parts.map(resolveOne);
        return (
          <ul className="list-disc list-inside space-y-0.5">
            {labels.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        );
      }
    }

    return resolveOne(rawValue);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={listHref}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-[#990000]"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          {t.delete}
        </button>
      </div>

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
                        : paymentStatus === 'failed'
                          ? t.paymentFailed
                          : paymentStatus === 'superseded'
                            ? t.paymentSuperseded
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
              const isEmpty = value === null || value === undefined || value === '';
              if (isEmpty && formFields.length === 0) return null;
              const label = getFieldLabel(String(key));
              const fieldDef = formFields.find((f) => f.field_key === String(key));
              const isUrl =
                fieldDef?.field_type === 'url' ||
                String(key).includes('url') ||
                (typeof value === 'string' && /^https?:\/\//.test(value));
              return (
                <div key={String(key)} className="border-b border-neutral-100 dark:border-neutral-700 pb-3 last:border-0 last:pb-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">{label}</dt>
                  <dd className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap text-sm">
                    {isEmpty ? (
                      <span className="italic text-neutral-400">{locale === 'tr' ? 'Yanıt yok' : 'No answer'}</span>
                    ) : isUrl && typeof value === 'string' ? (
                      <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-[#990000] underline break-all">
                        {String(value)}
                      </a>
                    ) : (
                      resolveOptionValue(String(key), value)
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
          <p className="text-xs text-neutral-500 mb-4">{t.storageHint}</p>

          {app.attachment_storage_path && app.attachment_file_name ? (
            <div className="space-y-3 mb-6 pb-6 border-b border-neutral-200 dark:border-neutral-700">
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
            </div>
          ) : null}

          {fieldAttachments.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t.fieldFiles}
              </h3>
              {fieldAttachments.map((file) => {
                const label =
                  t.fields[file.field_key as keyof typeof t.fields] ||
                  file.field_key.replace(/_/g, ' ');
                return (
                  <div
                    key={file.field_key}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                        {label}
                      </p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {file.file_name}
                      </p>
                      {file.file_size != null && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {formatFileSize(file.file_size)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadFieldFile(file.field_key)}
                      disabled={downloadingField === file.field_key}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#990000] text-white rounded-lg text-sm disabled:opacity-50 shrink-0"
                    >
                      {downloadingField === file.field_key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {t.openFile}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {!app.attachment_storage_path && fieldAttachments.length === 0 ? (
            <p className="text-sm text-neutral-500">{t.noAttachment}</p>
          ) : null}

          {attachmentError && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-3">{attachmentError}</p>
          )}
        </section>

        <section className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="font-semibold mb-4">{t.status}</h2>
          {isEvent ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    app.status === 'accepted'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : app.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  {t.statusLabels[app.status as keyof typeof t.statusLabels] || app.status}
                </span>
                {app.status === 'accepted' && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                    {t.autoAccepted}
                  </span>
                )}
              </div>
              {app.status === 'accepted' ? (
                <p className="text-sm text-neutral-500">{t.autoAcceptedHint}</p>
              ) : (
                <p className="text-sm text-neutral-500">{t.eventFlowHint}</p>
              )}
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
                  onClick={async () => {
                    await updateStatus();
                    if (statusEmailCheck && smtpConfigured && app) {
                      const statusLabel = t.statusLabels[newStatus as keyof typeof t.statusLabels] || newStatus;
                      try {
                        await fetch(`/api/site-applications/applications/${app.id}/send-email`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            subject: locale === 'tr'
                              ? `Başvuru Durumu Güncellendi: ${statusLabel}`
                              : `Application Status Updated: ${statusLabel}`,
                            body_text: locale === 'tr'
                              ? `Sayın ${app.first_name} ${app.last_name},\n\nBaşvurunuzun durumu "${statusLabel}" olarak güncellenmiştir.\n\nSaygılarımızla`
                              : `Dear ${app.first_name} ${app.last_name},\n\nYour application status has been updated to "${statusLabel}".\n\nBest regards`,
                          }),
                        });
                      } catch { /* silent */ }
                    }
                    setStatusEmailCheck(false);
                  }}
                  disabled={saving || newStatus === app.status}
                  className="px-4 py-2 bg-[#990000] text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t.changeStatus}
                </button>
              </div>
              {smtpConfigured && (
                <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusEmailCheck}
                    onChange={(e) => setStatusEmailCheck(e.target.checked)}
                    className="rounded border-neutral-300"
                  />
                  {locale === 'tr' ? 'Durum değişikliğini başvurana mail ile bildir' : 'Notify applicant via email'}
                </label>
              )}
              {smtpConfigured === false && (
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                  {locale === 'tr'
                    ? 'Mail göndermek için önce E-posta Ayarları sayfasından SMTP yapılandırmanızı tamamlayın.'
                    : 'Configure your SMTP settings in Email Settings page to send emails.'}
                </p>
              )}
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

        <section className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {locale === 'tr' ? 'Başvurana Mail Gönder' : 'Send Email to Applicant'}
          </h2>

          {smtpConfigured === false ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
                {locale === 'tr'
                  ? 'Mail göndermek için önce SMTP yapılandırmanızı tamamlamanız gerekiyor.'
                  : 'You need to configure your SMTP settings before sending emails.'}
              </p>
              <a
                href={`/${locale}/site-applications/email-settings`}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#990000] hover:underline"
              >
                {locale === 'tr' ? 'E-posta Ayarlarına Git →' : 'Go to Email Settings →'}
              </a>
            </div>
          ) : !emailModalOpen ? (
            <div>
              <p className="text-sm text-neutral-500 mb-3">
                {locale === 'tr'
                  ? `Bu mail ${app.email} adresine, kurumsal SMTP ayarlarınız üzerinden gönderilecektir.`
                  : `This email will be sent to ${app.email} via your configured SMTP settings.`}
              </p>
              <button
                type="button"
                onClick={() => { setEmailModalOpen(true); setEmailConfirmed(false); setEmailFlash(null); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#990000] text-white text-sm font-medium rounded-lg hover:bg-[#7a0000] transition"
              >
                <Send className="w-4 h-4" />
                {locale === 'tr' ? 'Mail Yaz' : 'Compose Email'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-900 rounded-lg px-3 py-2">
                {locale === 'tr' ? 'Alıcı:' : 'To:'} <span className="font-medium text-neutral-700 dark:text-neutral-300">{app.email}</span>
              </div>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder={locale === 'tr' ? 'Konu' : 'Subject'}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm"
              />
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={6}
                placeholder={locale === 'tr' ? 'Mesaj içeriği...' : 'Message body...'}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailConfirmed}
                  onChange={(e) => setEmailConfirmed(e.target.checked)}
                  className="rounded border-neutral-300"
                />
                {locale === 'tr'
                  ? 'Bu mesajı göndermek istediğimi onaylıyorum'
                  : 'I confirm I want to send this message'}
              </label>
              {emailFlash && (
                <p className={`text-sm ${emailFlash.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'}`}>
                  {emailFlash.msg}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={sendingEmail || !emailSubject || !emailBody || !emailConfirmed}
                  onClick={async () => {
                    setSendingEmail(true);
                    setEmailFlash(null);
                    try {
                      const res = await fetch(`/api/site-applications/applications/${app.id}/send-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ subject: emailSubject, body_text: emailBody }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      setEmailFlash({ type: 'success', msg: locale === 'tr' ? `Mail başarıyla gönderildi: ${data.sent_to}` : `Email sent successfully to: ${data.sent_to}` });
                      setEmailSubject('');
                      setEmailBody('');
                      setEmailConfirmed(false);
                    } catch (err: unknown) {
                      setEmailFlash({ type: 'error', msg: err instanceof Error ? err.message : 'Error' });
                    } finally {
                      setSendingEmail(false);
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#990000] text-white text-sm font-medium rounded-lg hover:bg-[#7a0000] disabled:opacity-50 transition"
                >
                  <Send className="w-4 h-4" />
                  {sendingEmail ? (locale === 'tr' ? 'Gönderiliyor...' : 'Sending...') : (locale === 'tr' ? 'Gönder' : 'Send')}
                </button>
                <button
                  type="button"
                  onClick={() => { setEmailModalOpen(false); setEmailFlash(null); setEmailConfirmed(false); }}
                  className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                >
                  {locale === 'tr' ? 'İptal' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
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
