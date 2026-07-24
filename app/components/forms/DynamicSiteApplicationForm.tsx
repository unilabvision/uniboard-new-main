'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader,
  Paperclip,
  Shield,
  Sparkles,
  Send,
  FileText,
  Mail,
  Phone,
  Link2,
  Hash,
  Calendar,
  AlignLeft,
  List,
  PartyPopper,
  Heart,
  Clock,
  Award,
  Check,
  CheckSquare,
  Circle,
  CloudUpload,
  Star,
  TextCursorInput,
} from 'lucide-react';
import type { PublicSiteApplicationForm } from '@/app/types/siteApplicationForms';
import type { SiteApplicationFieldType } from '@/app/types/siteApplicationForms';
import type { RegistrationPackageId } from '@/app/lib/siteApplications/packages';
import {
  SITE_APPLICATION_MAX_FILE_BYTES,
  formatFileSize,
  getMaxFileBytesForFormType,
  validateAttachmentFile,
} from '@/app/lib/siteApplications';
import { formatPackagePrice } from '@/app/lib/siteApplications/packages';

interface DynamicSiteApplicationFormProps {
  locale: string;
  /** Form slug from /basvuru/{slug} or legacy pages */
  formSlug?: string;
  /** Event slug from /etkinlik/{eventSlug}/basvuru */
  eventSlug?: string;
  /** Admin editor preview — same UI as the public form */
  previewConfig?: PublicSiteApplicationForm | null;
  previewMode?: boolean;
}

const ui = {
  tr: {
    loading: 'Form hazırlanıyor...',
    notFound: 'Bu başvuru formu bulunamadı veya yayında değil.',
    submit: 'Başvuruyu Gönder',
    submitting: 'Gönderiliyor...',
    success: 'Başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz.',
    eventSuccessFallback: 'Etkinliğe kaydınız başarıyla alınmıştır.',
    error: 'Başvuru gönderilirken bir hata oluştu.',
    required: 'Bu alan zorunludur',
    invalidEmail: 'Geçerli bir e-posta giriniz',
    invalidUrl: 'Geçerli bir web adresi giriniz',
    invalidTel: 'Geçerli bir telefon numarası giriniz',
    invalidNumber: 'Geçerli bir sayı giriniz',
    select: 'Seçiniz',
    attachment: 'Ek Dosya (isteğe bağlı)',
    attachmentHint: 'PDF, Word, görsel vb. Dosyalar 20 gün sonra otomatik silinir.',
    attachmentDrop: 'Dosyayı buraya bırakın veya tıklayın',
    uploadFailed: 'Dosya yüklenemedi.',
    validationError: 'Lütfen zorunlu alanları doldurun.',
    sideTitle: 'Başvurun için hazır mısın?',
    sideSubtitle: 'Birkaç dakikada tamamla — sana döneceğiz.',
    step1: 'Bilgilerini doldur',
    step2: 'Gerekirse dosya ekle',
    step3: 'Gönder ve rahatla',
    progress: 'İlerleme',
    badge: 'Açık başvuru',
    secure: 'Verilerin güvende',
    response: 'Genelde 3–5 iş günü içinde dönüş',
    choosePackage: 'Kayıt paketinizi seçin',
    packageHint: 'Kayıt ücretsizdir. İsterseniz sertifika paketini ekleyebilirsiniz.',
    paymentNote: 'Sertifika ücreti ödeme adımında alınacaktır.',
  },
  en: {
    loading: 'Preparing your form...',
    notFound: 'This application form was not found or is not published.',
    submit: 'Submit Application',
    submitting: 'Submitting...',
    success: 'Your application has been received. We will contact you soon.',
    eventSuccessFallback: 'Your event registration has been successfully received.',
    error: 'An error occurred while submitting your application.',
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email',
    invalidUrl: 'Please enter a valid URL',
    invalidTel: 'Please enter a valid phone number',
    invalidNumber: 'Please enter a valid number',
    select: 'Select',
    attachment: 'Attachment (optional)',
    attachmentHint: 'PDF, Word, images, etc. Files are automatically deleted after 20 days.',
    attachmentDrop: 'Drop a file here or click to browse',
    uploadFailed: 'File upload failed.',
    validationError: 'Please fill in the required fields.',
    sideTitle: 'Ready to apply?',
    sideSubtitle: 'Takes just a few minutes — we will get back to you.',
    step1: 'Fill in your details',
    step2: 'Attach a file if needed',
    step3: 'Submit and relax',
    progress: 'Progress',
    badge: 'Open application',
    secure: 'Your data is secure',
    response: 'We usually respond within 3–5 business days',
    choosePackage: 'Choose your registration package',
    packageHint: 'Registration is free. You can add the certificate package if you wish.',
    paymentNote: 'Certificate fee will be collected at the payment step.',
  },
};

const fieldIcon: Record<SiteApplicationFieldType, React.ElementType> = {
  text: TextCursorInput,
  email: Mail,
  tel: Phone,
  textarea: AlignLeft,
  number: Hash,
  date: Calendar,
  time: Clock,
  url: Link2,
  select: Circle,
  checkbox: CheckSquare,
  dropdown: List,
  linear_scale: Hash,
  rating: Star,
  file: CloudUpload,
};

const inputClass =
  'w-full rounded-xl border border-neutral-200 dark:border-neutral-600 bg-white/90 dark:bg-neutral-900/80 px-4 py-3 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 transition-all duration-200 focus:ring-2 focus:ring-[#990000]/30 focus:border-[#990000] focus:outline-none hover:border-neutral-300 dark:hover:border-neutral-500';

function FormShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-[#990000]/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-rose-300/20 blur-3xl"
      />
      {children}
    </div>
  );
}

export default function DynamicSiteApplicationForm({
  locale,
  formSlug,
  eventSlug,
  previewConfig = null,
  previewMode = false,
}: DynamicSiteApplicationFormProps) {
  const t = ui[locale as keyof typeof ui] || ui.tr;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [formConfig, setFormConfig] = useState<PublicSiteApplicationForm | null>(
    previewMode ? previewConfig : null
  );
  const [resolvedFormSlug, setResolvedFormSlug] = useState<string>(
    previewMode ? previewConfig?.slug || '' : ''
  );
  const [loading, setLoading] = useState(!previewMode);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [fieldFiles, setFieldFiles] = useState<Record<string, File>>({});
  const [honeypot, setHoneypot] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const maxFileBytes =
    formConfig?.max_file_bytes ??
    getMaxFileBytesForFormType(formConfig?.form_type) ??
    SITE_APPLICATION_MAX_FILE_BYTES;

  const attachmentHint =
    locale === 'en'
      ? `PDF, Word, images, etc. — max ${formatFileSize(maxFileBytes)}. Files are automatically deleted after 20 days.`
      : `PDF, Word, görsel vb. — en fazla ${formatFileSize(maxFileBytes)}. Dosyalar 20 gün sonra otomatik silinir.`;

  const validateFile = (file: File) =>
    validateAttachmentFile(file, {
      maxBytes: maxFileBytes,
      locale: locale === 'en' ? 'en' : 'tr',
    });

  const isEventForm = Boolean(
    eventSlug || (formConfig?.packages?.length ?? 0) > 0 || formConfig?.form_type === 'event'
  );
  const [selectedPackage, setSelectedPackage] = useState<RegistrationPackageId>('free');

  useEffect(() => {
    if (previewMode) {
      setFormConfig(previewConfig);
      setResolvedFormSlug(previewConfig?.slug || '');
      setLoading(false);
      setSuccess(false);
      return;
    }

    const load = async () => {
      try {
        const url = eventSlug
          ? `/api/site-applications/public/forms/by-event/${encodeURIComponent(eventSlug)}?locale=${locale}`
          : `/api/site-applications/public/forms/${encodeURIComponent(formSlug || '')}?locale=${locale}`;

        const res = await fetch(url);
        if (!res.ok) {
          setFormConfig(null);
          setResolvedFormSlug('');
          return;
        }
        const data = await res.json();
        setFormConfig(data.form);
        setResolvedFormSlug(data.form?.slug || formSlug || '');
        setSelectedPackage('free');
      } catch {
        setFormConfig(null);
        setResolvedFormSlug('');
      } finally {
        setLoading(false);
      }
    };
    if (formSlug || eventSlug) {
      setLoading(true);
      load();
    } else {
      setFormConfig(null);
      setLoading(false);
    }
  }, [previewMode, previewConfig, formSlug, eventSlug, locale]);

  const progress = useMemo(() => {
    if (!formConfig) return 0;
    const required = formConfig.fields.filter((f) => f.required);
    if (required.length === 0) return 100;
    const filled = required.filter((f) => {
      const raw = values[f.field_key]?.trim() || '';
      if (!raw) return false;
      if (f.field_type === 'checkbox') {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) && parsed.length > 0;
        } catch {
          return false;
        }
      }
      return true;
    }).length;
    return Math.round((filled / required.length) * 100);
  }, [formConfig, values]);

  const packages = formConfig?.packages ?? [];
  const hasPackageChoice = packages.length > 1;

  const updateValue = (fieldKey: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldKey]: value }));
    setErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    if (generalError) setGeneralError(null);
  };

  const validateClient = () => {
    if (!formConfig) return { valid: false, fieldErrors: {} as Record<string, string> };
    const nextErrors: Record<string, string> = {};

    for (const field of formConfig.fields) {
      const raw = values[field.field_key]?.trim() || '';

      if (field.field_type === 'checkbox') {
        let list: string[] = [];
        try {
          const parsed = JSON.parse(raw || '[]');
          list = Array.isArray(parsed) ? parsed : [];
        } catch {
          list = [];
        }
        if (field.required && list.length === 0) {
          nextErrors[field.field_key] = t.required;
        }
        continue;
      }

      if (field.field_type === 'file') {
        if (field.required && !fieldFiles[field.field_key] && !raw) {
          nextErrors[field.field_key] = t.required;
        }
        continue;
      }

      if (field.required && !raw) {
        nextErrors[field.field_key] = t.required;
        continue;
      }
      if (!raw) continue;

      if (field.field_type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        nextErrors[field.field_key] = t.invalidEmail;
      }
      if (field.field_type === 'url') {
        try {
          const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
          if (!parsed.hostname) nextErrors[field.field_key] = t.invalidUrl;
        } catch {
          nextErrors[field.field_key] = t.invalidUrl;
        }
      }
      if (field.field_type === 'tel' && raw.replace(/\D/g, '').length < 7) {
        nextErrors[field.field_key] = t.invalidTel;
      }
      if (
        (field.field_type === 'number' ||
          field.field_type === 'linear_scale' ||
          field.field_type === 'rating') &&
        !Number.isFinite(Number(raw))
      ) {
        nextErrors[field.field_key] = t.invalidNumber;
      }
    }

    setErrors(nextErrors);
    return { valid: Object.keys(nextErrors).length === 0, fieldErrors: nextErrors };
  };

  const scrollToFirstError = (errorKeys: Record<string, string>) => {
    const firstKey = Object.keys(errorKeys)[0];
    if (!firstKey || !formRef.current) return;
    const el = formRef.current.querySelector(`[data-field-key="${firstKey}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFile = (file: File | undefined) => {
    if (!file) {
      setAttachment(null);
      return;
    }
    const err = validateFile(file);
    if (err) {
      setGeneralError(err);
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setAttachment(file);
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previewMode) return;
    if (!formConfig) return;

    const { valid, fieldErrors } = validateClient();
    if (!valid) {
      setGeneralError(t.validationError);
      scrollToFirstError(fieldErrors);
      return;
    }

    setSubmitting(true);
    setGeneralError(null);

    try {
      let attachmentMeta: Record<string, unknown> = {};
      const submissionFields: Record<string, string> = { ...values };

      if (attachment && formConfig.allows_attachment) {
        const uploadRes = await fetch('/api/site-applications/files/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formSlug: resolvedFormSlug || formSlug,
            eventSlug: eventSlug || undefined,
            locale,
            fileName: attachment.name,
            fileSize: attachment.size,
            mimeType: attachment.type,
          }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || t.uploadFailed);

        const putRes = await fetch(uploadData.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': uploadData.mimeType || attachment.type },
          body: attachment,
        });
        if (!putRes.ok) throw new Error(t.uploadFailed);

        attachmentMeta = {
          attachmentStoragePath: uploadData.storageRef,
          attachmentFileName: attachment.name,
          attachmentMimeType: attachment.type,
          attachmentFileSize: attachment.size,
        };
      }

      for (const [fieldKey, file] of Object.entries(fieldFiles)) {
        const uploadRes = await fetch('/api/site-applications/files/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formSlug: resolvedFormSlug || formSlug,
            eventSlug: eventSlug || undefined,
            locale,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || t.uploadFailed);
        const putRes = await fetch(uploadData.signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': uploadData.mimeType || file.type },
          body: file,
        });
        if (!putRes.ok) throw new Error(t.uploadFailed);
        submissionFields[fieldKey] = JSON.stringify({
          storagePath: uploadData.storageRef,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        });
      }

      const res = await fetch('/api/site-applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formSlug: resolvedFormSlug || formSlug,
          eventSlug: eventSlug || undefined,
          locale,
          fields: submissionFields,
          registrationTier: selectedPackage,
          honeypot,
          ...attachmentMeta,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Aynı e-posta ile sertifika zaten ödenmiş → success (tekrar Iyzico yok)
        if (res.status === 409 && data.alreadyPaid && data.applicationId) {
          const paymentBase =
            process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net';
          const origin = paymentBase.replace(/\/$/, '');
          if (!/localhost|127\.0\.0\.1/i.test(origin)) {
            const qs = new URLSearchParams({
              type: 'event_application',
              applicationId: String(data.applicationId),
              alreadyPaid: '1',
            });
            if (eventSlug) qs.set('eventSlug', eventSlug);
            window.location.href = `${origin}/${locale}/payment-success?${qs.toString()}`;
            return;
          }
          window.location.href = `https://myunilab.net/${locale}/payment-success?type=event_application&applicationId=${encodeURIComponent(String(data.applicationId))}${eventSlug ? `&eventSlug=${encodeURIComponent(eventSlug)}` : ''}&alreadyPaid=1`;
          return;
        }
        if (data.fieldErrors && typeof data.fieldErrors === 'object') {
          const mapped: Record<string, string> = {};
          for (const [key, code] of Object.entries(data.fieldErrors as Record<string, string>)) {
            mapped[key] =
              code === 'required'
                ? t.required
                : code === 'invalid_email'
                  ? t.invalidEmail
                  : code === 'invalid_url'
                    ? t.invalidUrl
                    : code === 'invalid_option'
                      ? t.error
                      : t.error;
          }
          setErrors(mapped);
          scrollToFirstError(mapped);
        }
        throw new Error(data.error || t.error);
      }

      if (data.requiresPayment && data.submissionId) {
        const paymentBase =
          process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net';
        const origin = paymentBase.replace(/\/$/, '');
        const checkoutPath = `/${locale}/checkout/event-application?applicationId=${encodeURIComponent(data.submissionId)}${eventSlug ? `&eventSlug=${encodeURIComponent(eventSlug)}` : ''}`;
        const safeOrigin = /localhost|127\.0\.0\.1/i.test(origin)
          ? 'https://myunilab.net'
          : origin;
        window.location.href = `${safeOrigin}${checkoutPath}`;
        return;
      }

      setSuccess(true);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : t.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <FormShell>
        <div className="rounded-3xl border border-neutral-200/80 bg-white/70 dark:bg-neutral-800/50 backdrop-blur-sm p-10 shadow-lg shadow-neutral-200/40 dark:shadow-none">
          <div className="flex flex-col items-center gap-4 py-8 text-neutral-600 dark:text-neutral-400">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#990000] to-rose-600 flex items-center justify-center shadow-lg shadow-[#990000]/25">
                <Loader className="w-7 h-7 text-white animate-spin" />
              </div>
            </div>
            <p className="text-sm font-medium animate-pulse">{t.loading}</p>
          </div>
        </div>
      </FormShell>
    );
  }

  if (!formConfig) {
    return (
      <FormShell>
        <div className="rounded-3xl border border-red-200 bg-red-50/90 dark:bg-red-950/30 p-8 text-center text-red-700 dark:text-red-300">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-80" />
          {previewMode
            ? locale === 'tr'
              ? 'Önizleme için soru ekleyin.'
              : 'Add questions to preview the form.'
            : t.notFound}
        </div>
      </FormShell>
    );
  }

  if (success) {
    return (
      <FormShell>
        <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-neutral-900 dark:to-teal-950/30 p-10 md:p-14 text-center shadow-xl shadow-emerald-100/50 dark:shadow-none">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-300/40 mb-6">
            <PartyPopper className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-3">
            {locale === 'tr' ? 'Harika, gönderildi!' : 'Awesome, sent!'}
          </h2>
          <p className="text-lg text-emerald-800/90 dark:text-emerald-200/90 max-w-md mx-auto leading-relaxed">
            {isEventForm
              ? (locale === 'tr'
                  ? `${values.event_name || 'Etkinlik'} etkinliğe kaydınız başarıyla alınmıştır.`
                  : `Your registration for ${values.event_name || 'the event'} has been successfully received.`)
              : (formConfig.success_message || t.success)}
          </p>
          {!isEventForm && (
          <div className="mt-8 inline-flex items-center gap-2 text-sm text-emerald-700/80 dark:text-emerald-300/80">
            <Heart className="w-4 h-4" />
            {t.response}
          </div>
          )}
        </div>
      </FormShell>
    );
  }

  const steps = [
    { icon: Sparkles, text: t.step1 },
    { icon: Paperclip, text: t.step2 },
    { icon: Send, text: t.step3 },
  ];

  return (
    <FormShell>
      <div
        className={
          previewMode
            ? 'w-full'
            : 'grid lg:grid-cols-12 gap-8 lg:gap-10 items-start'
        }
      >
        {!previewMode && (
        <aside className="lg:col-span-4 space-y-5 order-1">
          <div className="rounded-3xl bg-gradient-to-br from-[#990000] via-[#b30000] to-rose-700 p-6 md:p-8 text-white shadow-xl shadow-[#990000]/20">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider bg-white/15 rounded-full px-3 py-1 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              {t.badge}
            </span>
            <h2 className="text-2xl font-bold leading-snug mb-2">{t.sideTitle}</h2>
            <p className="text-white/85 text-sm leading-relaxed">{t.sideSubtitle}</p>
          </div>

          <ul className="space-y-3">
            {steps.map((step, i) => (
              <li
                key={step.text}
                className="flex items-start gap-3 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 bg-white/80 dark:bg-neutral-800/60 backdrop-blur-sm p-4 shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#990000]/10 text-[#990000] font-bold text-sm">
                  {i + 1}
                </span>
                <div className="flex items-center gap-2 pt-1.5 text-sm text-neutral-700 dark:text-neutral-300">
                  <step.icon className="w-4 h-4 text-[#990000] shrink-0" />
                  {step.text}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3 text-xs text-neutral-600 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5">
              <Shield className="w-3.5 h-3.5 text-[#990000]" />
              {t.secure}
            </span>
            {!isEventForm && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-[#990000]" />
              {t.response}
            </span>
            )}
          </div>
        </aside>
        )}

        {/* Form kartı */}
        <div className={previewMode ? 'w-full' : 'lg:col-span-8 order-2'}>
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className={`rounded-3xl border border-neutral-200/80 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/70 backdrop-blur-sm shadow-xl shadow-neutral-200/30 dark:shadow-none overflow-hidden ${
              previewMode ? 'pointer-events-auto' : ''
            }`}
          >
            {previewMode && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800 text-[11px] font-medium text-amber-800 dark:text-amber-200">
                {locale === 'tr'
                  ? 'Canlı form önizlemesi — gönderim kapalı. Kaydet ve yayınla ile siteye yazılır.'
                  : 'Live form preview — submit disabled. Save & publish to push to the site.'}
              </div>
            )}
            <div className={`border-b border-neutral-100 dark:border-neutral-700/80 bg-gradient-to-r from-neutral-50/80 to-white dark:from-neutral-800/50 dark:to-neutral-800/30 ${
              previewMode ? 'px-5 pt-5 pb-4' : 'px-6 md:px-10 pt-8 pb-6'
            }`}>
              <h1 className={`font-bold text-neutral-900 dark:text-neutral-50 mb-2 ${
                previewMode ? 'text-xl' : 'text-2xl md:text-3xl'
              }`}>
                {formConfig.title}
              </h1>
              {formConfig.subtitle && (
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {formConfig.subtitle}
                </p>
              )}
              <div className="mt-5">
                <div className="flex justify-between text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                  <span>{t.progress}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-200/80 dark:bg-neutral-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#990000] to-rose-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 md:px-10 py-8 space-y-6">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {hasPackageChoice && (
                <div className="space-y-3" data-field-key="registration_package">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                      <Award className="w-4 h-4 text-[#990000]" />
                      {t.choosePackage}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">{t.packageHint}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {packages.map((pkg) => {
                      const selected = selectedPackage === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPackage(pkg.id)}
                          className={`text-left rounded-2xl border-2 p-4 transition-all duration-200 ${
                            selected
                              ? 'border-[#990000] bg-[#990000]/5 shadow-md shadow-[#990000]/10'
                              : 'border-neutral-200 dark:border-neutral-600 hover:border-[#990000]/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              {pkg.badge && (
                                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#990000] mb-1">
                                  {pkg.badge}
                                </span>
                              )}
                              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {pkg.title}
                              </p>
                            </div>
                            {selected && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#990000] text-white shrink-0">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-lg font-bold text-[#990000] mt-2">
                            {formatPackagePrice(pkg.price, pkg.currency, locale)}
                          </p>
                          {pkg.description && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                              {pkg.description}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedPackage === 'certificate' && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2">
                      {t.paymentNote}
                    </p>
                  )}
                </div>
              )}

              {formConfig.fields.map((field) => {
                const Icon = fieldIcon[field.field_type] || FileText;
                const inputId = `field-${field.field_key}`;
                return (
                  <div key={field.field_key} className="group" data-field-key={field.field_key}>
                    <label
                      htmlFor={inputId}
                      className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#990000]/8 text-[#990000] group-focus-within:bg-[#990000]/15 transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      {field.label}
                      {field.required && <span className="text-[#990000]">*</span>}
                    </label>

                    {field.field_type === 'textarea' ? (
                      <textarea
                        id={inputId}
                        rows={4}
                        value={values[field.field_key] || ''}
                        onChange={(e) => updateValue(field.field_key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={inputClass}
                      />
                    ) : field.field_type === 'select' ? (
                      <div className="space-y-2" role="radiogroup" aria-labelledby={inputId}>
                        {(field.options || []).map((opt) => {
                          const checked = values[field.field_key] === opt.value;
                          return (
                            <label
                              key={opt.value}
                              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                                checked
                                  ? 'border-[#990000] bg-[#990000]/5'
                                  : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={field.field_key}
                                className="sr-only"
                                checked={checked}
                                onChange={() => updateValue(field.field_key, opt.value)}
                              />
                              <span
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                  checked ? 'border-[#990000]' : 'border-neutral-300'
                                }`}
                              >
                                {checked && <span className="w-2 h-2 rounded-full bg-[#990000]" />}
                              </span>
                              <span className="text-sm text-neutral-800 dark:text-neutral-200">
                                {opt.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : field.field_type === 'checkbox' ? (
                      <div className="space-y-2">
                        {(field.options || []).map((opt) => {
                          let selected: string[] = [];
                          try {
                            const parsed = JSON.parse(values[field.field_key] || '[]');
                            selected = Array.isArray(parsed) ? parsed : [];
                          } catch {
                            selected = [];
                          }
                          const checked = selected.includes(opt.value);
                          return (
                            <label
                              key={opt.value}
                              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                                checked
                                  ? 'border-[#990000] bg-[#990000]/5'
                                  : 'border-neutral-200 dark:border-neutral-600 hover:border-neutral-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={checked}
                                onChange={() => {
                                  const next = checked
                                    ? selected.filter((v) => v !== opt.value)
                                    : [...selected, opt.value];
                                  updateValue(field.field_key, JSON.stringify(next));
                                }}
                              />
                              <span
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  checked ? 'border-[#990000] bg-[#990000]' : 'border-neutral-300'
                                }`}
                              >
                                {checked && <Check className="w-3 h-3 text-white" />}
                              </span>
                              <span className="text-sm text-neutral-800 dark:text-neutral-200">
                                {opt.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : field.field_type === 'dropdown' ? (
                      <select
                        id={inputId}
                        value={values[field.field_key] || ''}
                        onChange={(e) => updateValue(field.field_key, e.target.value)}
                        className={inputClass}
                      >
                        <option value="">{t.select}</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.field_type === 'linear_scale' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
                          <span>{locale === 'en' ? 'Low' : 'Düşük'}</span>
                          <span>{locale === 'en' ? 'High' : 'Yüksek'}</span>
                        </div>
                        <div className="relative flex items-center justify-between gap-1 px-1 py-1">
                          <div
                            aria-hidden
                            className="absolute left-4 right-4 top-1/2 h-0.5 -translate-y-1/2 bg-neutral-200 dark:bg-neutral-600 rounded-full"
                          />
                          {(field.options || []).map((opt) => {
                            const active = values[field.field_key] === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updateValue(field.field_key, opt.value)}
                                className={`relative z-[1] flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                                  active
                                    ? 'border-[#990000] bg-[#990000] text-white scale-105 shadow-md'
                                    : 'border-neutral-300 dark:border-neutral-500 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:border-[#990000]/60'
                                }`}
                                aria-pressed={active}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : field.field_type === 'rating' ? (
                      <div className="flex items-center gap-1" role="radiogroup">
                        {(field.options || []).map((opt) => {
                          const selected = Number(values[field.field_key] || 0);
                          const valueNum = Number(opt.value);
                          const filled = selected > 0 && valueNum <= selected;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateValue(field.field_key, opt.value)}
                              className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#990000]/40"
                              aria-label={`${opt.label} / ${(field.options || []).length}`}
                              aria-pressed={values[field.field_key] === opt.value}
                            >
                              <Star
                                className={`w-8 h-8 transition-colors ${
                                  filled
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-neutral-300 dark:text-neutral-600'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    ) : field.field_type === 'file' ? (
                      <label className="flex flex-col items-center justify-center gap-2 cursor-pointer rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-600 px-4 py-6 hover:border-[#990000]/40 transition-colors">
                        <CloudUpload className="w-6 h-6 text-[#990000]" />
                        <span className="text-sm text-neutral-500">
                          {fieldFiles[field.field_key]?.name ||
                            values[field.field_key] ||
                            field.placeholder ||
                            t.attachmentDrop}
                        </span>
                        <input
                          id={inputId}
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) {
                              setFieldFiles((prev) => {
                                const next = { ...prev };
                                delete next[field.field_key];
                                return next;
                              });
                              updateValue(field.field_key, '');
                              return;
                            }
                            const err = validateFile(file);
                            if (err) {
                              setGeneralError(err);
                              return;
                            }
                            setFieldFiles((prev) => ({ ...prev, [field.field_key]: file }));
                            updateValue(field.field_key, file.name);
                          }}
                        />
                      </label>
                    ) : (
                      <input
                        id={inputId}
                        type={
                          field.field_type === 'email'
                            ? 'email'
                            : field.field_type === 'tel'
                              ? 'tel'
                              : field.field_type === 'number'
                                ? 'number'
                                : field.field_type === 'date'
                                  ? 'date'
                                  : field.field_type === 'time'
                                    ? 'time'
                                    : field.field_type === 'url'
                                      ? 'url'
                                      : 'text'
                        }
                        value={values[field.field_key] || ''}
                        onChange={(e) => updateValue(field.field_key, e.target.value)}
                        placeholder={field.placeholder || ''}
                        className={inputClass}
                      />
                    )}

                    {errors[field.field_key] && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors[field.field_key]}
                      </p>
                    )}
                  </div>
                );
              })}

              {formConfig.allows_attachment && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <Paperclip className="w-4 h-4 text-[#990000]" />
                    {t.attachment}
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFile(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all duration-200 ${
                      dragOver
                        ? 'border-[#990000] bg-[#990000]/5 scale-[1.01]'
                        : attachment
                          ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-neutral-200 dark:border-neutral-600 hover:border-[#990000]/40 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                    {attachment ? (
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        {attachment.name}
                      </p>
                    ) : (
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t.attachmentDrop}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">{attachmentHint}</p>
                </div>
              )}

              {generalError && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || previewMode}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-3.5 rounded-2xl bg-gradient-to-r from-[#990000] to-rose-700 text-white font-semibold shadow-lg shadow-[#990000]/25 hover:shadow-xl hover:shadow-[#990000]/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t.submit}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </FormShell>
  );
}
