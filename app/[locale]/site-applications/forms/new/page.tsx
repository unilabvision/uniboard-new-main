'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserModules } from '../../../../hooks/useUserModules';
import { slugifyFormValue } from '@/app/lib/siteApplications/config';
import { ArrowLeft, Loader2 } from 'lucide-react';

const texts = {
  tr: {
    title: 'Yeni Başvuru Formu',
    back: 'Formlara Dön',
    forbidden: 'Bu sayfaya yalnızca süper admin erişebilir.',
    titleTr: 'Başlık (TR)',
    titleEn: 'Başlık (EN)',
    subtitleTr: 'Alt başlık (TR)',
    subtitleEn: 'Alt başlık (EN)',
    slugTr: 'URL slug (TR) — örn. etkinlik-basvuru',
    slugEn: 'URL slug (EN) — örn. event-application',
    successTr: 'Başarı mesajı (TR)',
    successEn: 'Başarı mesajı (EN)',
    active: 'Formu aktif et',
    showOnWebsite: 'myunilab.net ana sitede göster',
    linkedEvent: 'Bağlı etkinlik',
    noEvent: 'Etkinlik seçilmedi (ekip formu için boş bırakın)',
    eventsLoadError: 'Etkinlik listesi yüklenemedi',
    allowsAttachment: 'Ek dosya yükleme izni',
    create: 'Formu Oluştur',
    saving: 'Kaydediliyor...',
    error: 'Form oluşturulamadı',
  },
  en: {
    title: 'New Application Form',
    back: 'Back to Forms',
    forbidden: 'Only super admins can access this page.',
    titleTr: 'Title (TR)',
    titleEn: 'Title (EN)',
    subtitleTr: 'Subtitle (TR)',
    subtitleEn: 'Subtitle (EN)',
    slugTr: 'URL slug (TR)',
    slugEn: 'URL slug (EN)',
    successTr: 'Success message (TR)',
    successEn: 'Success message (EN)',
    active: 'Activate form',
    showOnWebsite: 'Show on myunilab.net homepage',
    linkedEvent: 'Linked event',
    noEvent: 'No event (leave empty for team forms)',
    eventsLoadError: 'Could not load events list',
    allowsAttachment: 'Allow file attachments',
    create: 'Create Form',
    saving: 'Saving...',
    error: 'Could not create form',
  },
};

export default function NewSiteApplicationFormPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState('tr');
  const { isSuperAdmin, loading: modulesLoading } = useUserModules();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const t = texts[locale as keyof typeof texts] || texts.tr;

  const [form, setForm] = useState({
    title_tr: '',
    title_en: '',
    subtitle_tr: '',
    subtitle_en: '',
    slug_tr: '',
    slug_en: '',
    success_message_tr: '',
    success_message_en: '',
    is_active: false,
    show_on_website: false,
    allows_attachment: false,
    event_id: '' as string,
  });

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    fetch('/api/site-applications/events')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'events');
        setEvents(data.events ?? []);
        setEventsError(null);
      })
      .catch((err) => {
        setEvents([]);
        setEventsError(
          err instanceof Error && err.message !== 'events'
            ? err.message
            : locale === 'tr'
              ? 'Etkinlik listesi yüklenemedi'
              : 'Could not load events list'
        );
      });
  }, [locale]);

  useEffect(() => {
    if (form.title_tr && !form.slug_tr) {
      setForm((prev) => ({ ...prev, slug_tr: slugifyFormValue(form.title_tr) }));
    }
    if (form.title_en && !form.slug_en) {
      setForm((prev) => ({ ...prev, slug_en: slugifyFormValue(form.title_en) }));
    }
  }, [form.title_tr, form.title_en, form.slug_tr, form.slug_en]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/site-applications/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          event_id: form.event_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.error);
      router.push(`/${locale}/site-applications/forms/${data.form.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setSaving(false);
    }
  };

  if (modulesLoading) {
    return (
      <div className="p-8 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-lg">
        <p className="text-red-600">{t.forbidden}</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <Link
        href={`/${locale}/site-applications/forms`}
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-[#990000] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.back}
      </Link>

      <h1 className="text-2xl font-bold mb-6">{t.title}</h1>

      <form onSubmit={handleCreate} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">{t.linkedEvent}</label>
          <select
            value={form.event_id}
            onChange={(e) => setForm({ ...form, event_id: e.target.value })}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:bg-neutral-800 dark:border-neutral-600"
          >
            <option value="">{t.noEvent}</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.slug})
              </option>
            ))}
          </select>
          {eventsError && (
            <p className="text-xs text-red-600 mt-1">{eventsError}</p>
          )}
          {!eventsError && events.length === 0 && (
            <p className="text-xs text-neutral-500 mt-1">
              {locale === 'tr' ? 'Aktif etkinlik bulunamadı.' : 'No active events found.'}
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t.titleTr} value={form.title_tr} onChange={(v) => setForm({ ...form, title_tr: v })} required />
          <Field label={t.titleEn} value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} required />
          <Field label={t.subtitleTr} value={form.subtitle_tr} onChange={(v) => setForm({ ...form, subtitle_tr: v })} />
          <Field label={t.subtitleEn} value={form.subtitle_en} onChange={(v) => setForm({ ...form, subtitle_en: v })} />
          <Field label={t.slugTr} value={form.slug_tr} onChange={(v) => setForm({ ...form, slug_tr: v })} required />
          <Field label={t.slugEn} value={form.slug_en} onChange={(v) => setForm({ ...form, slug_en: v })} required />
          <Field label={t.successTr} value={form.success_message_tr} onChange={(v) => setForm({ ...form, success_message_tr: v })} />
          <Field label={t.successEn} value={form.success_message_en} onChange={(v) => setForm({ ...form, success_message_en: v })} />
        </div>

        <div className="space-y-3">
          <Toggle label={t.active} checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          <Toggle label={t.showOnWebsite} checked={form.show_on_website} onChange={(v) => setForm({ ...form, show_on_website: v })} />
          <Toggle label={t.allowsAttachment} checked={form.allows_attachment} onChange={(v) => setForm({ ...form, allows_attachment: v })} />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#990000] text-white rounded-lg hover:bg-[#800000] disabled:opacity-60"
        >
          {saving ? t.saving : t.create}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:bg-neutral-800 dark:border-neutral-600"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
