'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
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
} from 'lucide-react';
import type { PublicSiteApplicationForm } from '@/app/types/siteApplicationForms';
import type { SiteApplicationFieldType } from '@/app/types/siteApplicationForms';
import {
  SITE_APPLICATION_MAX_FILE_BYTES,
  formatFileSize,
  validateAttachmentFile,
} from '@/app/lib/siteApplications';

interface DynamicSiteApplicationFormProps {
  locale: string;
  /** Form slug from /basvuru/{slug} or legacy pages */
  formSlug?: string;
  /** Event slug from /etkinlik/{eventSlug}/basvuru */
  eventSlug?: string;
}

const ui = {
  tr: {
    loading: 'Form hazırlanıyor...',
    notFound: 'Bu başvuru formu bulunamadı veya yayında değil.',
    submit: 'Başvuruyu Gönder',
    submitting: 'Gönderiliyor...',
    success: 'Başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz.',
    error: 'Başvuru gönderilirken bir hata oluştu.',
    required: 'Bu alan zorunludur',
    invalidEmail: 'Geçerli bir e-posta giriniz',
    captcha: 'Lütfen robot olmadığınızı doğrulayın.',
    spamNote: 'Bu form spam koruması içerir.',
    select: 'Seçiniz',
    attachment: 'Ek Dosya (isteğe bağlı)',
    attachmentHint: `PDF, Word, görsel vb. — en fazla ${formatFileSize(SITE_APPLICATION_MAX_FILE_BYTES)}. Dosyalar 20 gün sonra otomatik silinir.`,
    attachmentDrop: 'Dosyayı buraya bırakın veya tıklayın',
    uploadFailed: 'Dosya yüklenemedi.',
    validationError: 'Lütfen zorunlu alanları doldurun ve güvenlik doğrulamasını tamamlayın.',
    sideTitle: 'Başvurun için hazır mısın?',
    sideSubtitle: 'Birkaç dakikada tamamla — sana döneceğiz.',
    step1: 'Bilgilerini doldur',
    step2: 'Gerekirse dosya ekle',
    step3: 'Gönder ve rahatla',
    progress: 'İlerleme',
    badge: 'Açık başvuru',
    secure: 'Verilerin güvende',
    response: 'Genelde 3–5 iş günü içinde dönüş',
  },
  en: {
    loading: 'Preparing your form...',
    notFound: 'This application form was not found or is not published.',
    submit: 'Submit Application',
    submitting: 'Submitting...',
    success: 'Your application has been received. We will contact you soon.',
    error: 'An error occurred while submitting your application.',
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email',
    captcha: 'Please verify you are not a robot.',
    spamNote: 'This form includes spam protection.',
    select: 'Select',
    attachment: 'Attachment (optional)',
    attachmentHint: `PDF, Word, images, etc. — max ${formatFileSize(SITE_APPLICATION_MAX_FILE_BYTES)}. Files are automatically deleted after 20 days.`,
    attachmentDrop: 'Drop a file here or click to browse',
    uploadFailed: 'File upload failed.',
    validationError: 'Please fill required fields and complete the security check.',
    sideTitle: 'Ready to apply?',
    sideSubtitle: 'Takes just a few minutes — we will get back to you.',
    step1: 'Fill in your details',
    step2: 'Attach a file if needed',
    step3: 'Submit and relax',
    progress: 'Progress',
    badge: 'Open application',
    secure: 'Your data is secure',
    response: 'We usually respond within 3–5 business days',
  },
};

const fieldIcon: Record<SiteApplicationFieldType, React.ElementType> = {
  text: FileText,
  email: Mail,
  tel: Phone,
  textarea: AlignLeft,
  number: Hash,
  date: Calendar,
  url: Link2,
  select: List,
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
}: DynamicSiteApplicationFormProps) {
  const t = ui[locale as keyof typeof ui] || ui.tr;
  const captchaRef = useRef<HCaptcha>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [formConfig, setFormConfig] = useState<PublicSiteApplicationForm | null>(null);
  const [resolvedFormSlug, setResolvedFormSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const siteKey =
    process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '7bcc41da-10a0-4fd6-933e-ee34e3787d3a';

  useEffect(() => {
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
  }, [formSlug, eventSlug, locale]);

  const progress = useMemo(() => {
    if (!formConfig) return 0;
    const required = formConfig.fields.filter((f) => f.required);
    if (required.length === 0) return 100;
    const filled = required.filter((f) => values[f.field_key]?.trim()).length;
    return Math.round((filled / required.length) * 100);
  }, [formConfig, values]);

  const validateClient = () => {
    if (!formConfig) return { valid: false, fieldErrors: {} as Record<string, string> };
    const nextErrors: Record<string, string> = {};

    for (const field of formConfig.fields) {
      const value = values[field.field_key]?.trim() || '';
      if (field.required && !value) {
        nextErrors[field.field_key] = t.required;
      }
      if (field.field_type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        nextErrors[field.field_key] = t.invalidEmail;
      }
    }

    const captchaRequired =
      process.env.NODE_ENV === 'production' ||
      Boolean(process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY);

    if (captchaRequired && !captchaToken) {
      nextErrors.captcha = t.captcha;
    }

    setErrors(nextErrors);
    return { valid: Object.keys(nextErrors).length === 0, fieldErrors: nextErrors };
  };

  const scrollToFirstError = (errorKeys: Record<string, string>) => {
    const firstKey = Object.keys(errorKeys)[0];
    if (!firstKey || !formRef.current) return;
    if (firstKey === 'captcha') {
      formRef.current.querySelector('[data-captcha]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const el = formRef.current.querySelector(`[data-field-key="${firstKey}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleFile = (file: File | undefined) => {
    if (!file) {
      setAttachment(null);
      return;
    }
    const err = validateAttachmentFile(file);
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
            hCaptchaToken: captchaToken,
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

      const res = await fetch('/api/site-applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formSlug: resolvedFormSlug || formSlug,
          eventSlug: eventSlug || undefined,
          locale,
          fields: values,
          honeypot,
          hCaptchaToken: captchaToken,
          ...attachmentMeta,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors && typeof data.fieldErrors === 'object') {
          const mapped: Record<string, string> = {};
          for (const [key, code] of Object.entries(data.fieldErrors as Record<string, string>)) {
            mapped[key] =
              code === 'required'
                ? t.required
                : code === 'invalid_email'
                  ? t.invalidEmail
                  : t.error;
          }
          setErrors(mapped);
          scrollToFirstError(mapped);
        }
        throw new Error(data.error || t.error);
      }

      setSuccess(true);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : t.error);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
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
          {t.notFound}
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
            {formConfig.success_message || t.success}
          </p>
          <div className="mt-8 inline-flex items-center gap-2 text-sm text-emerald-700/80 dark:text-emerald-300/80">
            <Heart className="w-4 h-4" />
            {t.response}
          </div>
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
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Sol panel — masaüstünde nefes alan alan */}
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-[#990000]" />
              {t.response}
            </span>
          </div>
        </aside>

        {/* Form kartı */}
        <div className="lg:col-span-8 order-2">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="rounded-3xl border border-neutral-200/80 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800/70 backdrop-blur-sm shadow-xl shadow-neutral-200/30 dark:shadow-none overflow-hidden"
          >
            <div className="px-6 md:px-10 pt-8 pb-6 border-b border-neutral-100 dark:border-neutral-700/80 bg-gradient-to-r from-neutral-50/80 to-white dark:from-neutral-800/50 dark:to-neutral-800/30">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
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

              {formConfig.fields.map((field) => {
                const Icon = fieldIcon[field.field_type] || FileText;
                return (
                  <div key={field.field_key} className="group" data-field-key={field.field_key}>
                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#990000]/8 text-[#990000] group-focus-within:bg-[#990000]/15 transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      {field.label}
                      {field.required && <span className="text-[#990000]">*</span>}
                    </label>

                    {field.field_type === 'textarea' ? (
                      <textarea
                        rows={4}
                        value={values[field.field_key] || ''}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [field.field_key]: e.target.value }))
                        }
                        placeholder={field.placeholder || ''}
                        className={inputClass}
                      />
                    ) : field.field_type === 'select' ? (
                      <select
                        value={values[field.field_key] || ''}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [field.field_key]: e.target.value }))
                        }
                        className={inputClass}
                      >
                        <option value="">{t.select}</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          field.field_type === 'email'
                            ? 'email'
                            : field.field_type === 'tel'
                              ? 'tel'
                              : field.field_type === 'number'
                                ? 'number'
                                : field.field_type === 'date'
                                  ? 'date'
                                  : field.field_type === 'url'
                                    ? 'url'
                                    : 'text'
                        }
                        value={values[field.field_key] || ''}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [field.field_key]: e.target.value }))
                        }
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
                  <p className="text-xs text-neutral-500 mt-2">{t.attachmentHint}</p>
                </div>
              )}

              <div className="rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/40 border border-neutral-100 dark:border-neutral-700 p-4" data-captcha>
                <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                  <Shield className="w-4 h-4 text-[#990000]" />
                  {t.spamNote}
                </div>
                <HCaptcha
                  ref={captchaRef}
                  sitekey={siteKey}
                  onVerify={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                />
                {errors.captcha && (
                  <p className="text-sm text-red-600 mt-2">{errors.captcha}</p>
                )}
              </div>

              {generalError && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 p-4 text-red-700 dark:text-red-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{generalError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
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
