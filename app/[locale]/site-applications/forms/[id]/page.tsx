'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { use } from 'react';
import { useUserModules } from '../../../../hooks/useUserModules';
import {
  getSiteApplicationPublicPath,
  getEventApplicationPath,
} from '@/app/lib/siteApplications/config';
import {
  buildEventFormSlugs,
  getDefaultFieldsForFormType,
  getTeamFormPublicPath,
  inferFormType,
  type SiteApplicationFormType,
} from '@/app/lib/siteApplications/formTypes';
import { normalizeFieldOptions } from '@/app/lib/siteApplications/forms';
import FormFieldEditor from '@/app/components/site-applications/FormFieldEditor';
import FormPreviewPanel from '@/app/components/site-applications/FormPreviewPanel';
import type {
  SiteApplicationForm,
  SiteApplicationFormField,
  SiteApplicationFormFieldInput,
} from '@/app/types/siteApplicationForms';
import { ArrowLeft, ExternalLink, Loader2, Save } from 'lucide-react';

const texts = {
  tr: {
    back: 'Formlara Dön',
    forbidden: 'Bu sayfaya yalnızca süper admin erişebilir.',
    loading: 'Yükleniyor...',
    settings: 'Form başlığı ve ayarlar',
    fields: 'Sorular',
    saveSettings: 'Ayarları Kaydet',
    saveFields: 'Soruları Kaydet',
    saved: 'Kaydedildi',
    preview: 'Canlı önizleme',
    openForm: 'Formu aç',
    active: 'Yayında (başvuru alınsın)',
    showOnWebsite: 'Menüde göster',
    allowsAttachment: 'Ek dosya izni',
    teamBadge: 'UNILAB Ekip Başvurusu',
    eventBadge: 'Etkinlik Başvuru Formu',
    teamMenuHint: 'Ekip başvuruları Site Başvuruları → Ekip sekmesinde listelenir.',
    eventMenuHint: 'Etkinlik başvuruları Site Başvuruları → Etkinlik sekmesinde listelenir.',
    pageAddress: 'Başvuru sayfası',
    eventsLoadError: 'Etkinlik listesi yüklenemedi',
    linkedEvent: 'Bağlı etkinlik',
    noEvent: 'Etkinlik seçilmedi',
    titleTr: 'Form başlığı (TR)',
    titleEn: 'Form başlığı (EN)',
    subtitleTr: 'Açıklama (TR)',
    subtitleEn: 'Açıklama (EN)',
    successTr: 'Başarı mesajı (TR)',
    successEn: 'Başarı mesajı (EN)',
    defaultFields: 'Varsayılan soruları yükle',
    inactiveHint: 'Formu yayına almak için "Yayında" seçeneğini işaretleyin.',
  },
  en: {
    back: 'Back to Forms',
    forbidden: 'Only super admins can access this page.',
    loading: 'Loading...',
    settings: 'Form title & settings',
    fields: 'Questions',
    saveSettings: 'Save Settings',
    saveFields: 'Save Questions',
    saved: 'Saved',
    preview: 'Live preview',
    openForm: 'Open form',
    active: 'Published (accept submissions)',
    showOnWebsite: 'Show in menu',
    allowsAttachment: 'Allow attachments',
    teamBadge: 'UNILAB Team Application',
    eventBadge: 'Event Application Form',
    teamMenuHint: 'Team applications appear under Site Applications → Team tab.',
    eventMenuHint: 'Event applications appear under Site Applications → Event tab.',
    pageAddress: 'Application page',
    eventsLoadError: 'Could not load events list',
    linkedEvent: 'Linked event',
    noEvent: 'No event selected',
    titleTr: 'Form title (TR)',
    titleEn: 'Form title (EN)',
    subtitleTr: 'Description (TR)',
    subtitleEn: 'Description (EN)',
    successTr: 'Success message (TR)',
    successEn: 'Success message (EN)',
    defaultFields: 'Load default questions',
    inactiveHint: 'Check "Published" to start accepting submissions.',
  },
};

export default function EditSiteApplicationFormPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const { isSuperAdmin, loading: modulesLoading } = useUserModules();
  const t = texts[locale as keyof typeof texts] || texts.tr;

  const [form, setForm] = useState<SiteApplicationForm | null>(null);
  const [fields, setFields] = useState<SiteApplicationFormFieldInput[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const formRes = await fetch(`/api/site-applications/forms/${id}`);
        if (formRes.ok) {
          const data = await formRes.json();
          setForm(data.form);
          setFields(
            (data.form.fields as SiteApplicationFormField[] | undefined)?.map((f) => ({
              field_key: f.field_key,
              field_type: f.field_type,
              label_tr: f.label_tr,
              label_en: f.label_en,
              placeholder_tr: f.placeholder_tr || undefined,
              placeholder_en: f.placeholder_en || undefined,
              required: f.required,
              order_index: f.order_index,
              options: normalizeFieldOptions(f.options),
              is_contact: f.is_contact,
            })) || []
          );
          const type = data.form.form_type ?? inferFormType(data.form);
          if (type === 'event') {
            const eventsRes = await fetch('/api/site-applications/events');
            if (eventsRes.ok) {
              const eventsData = await eventsRes.json();
              setEvents(eventsData.events ?? []);
              setEventsError(null);
            } else {
              setEventsError(t.eventsLoadError);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, t.eventsLoadError]);

  const saveSettings = async () => {
    if (!form) return;
    setSavingSettings(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/site-applications/forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug_tr: form.slug_tr,
          slug_en: form.slug_en,
          title_tr: form.title_tr,
          title_en: form.title_en,
          subtitle_tr: form.subtitle_tr,
          subtitle_en: form.subtitle_en,
          success_message_tr: form.success_message_tr,
          success_message_en: form.success_message_en,
          is_active: form.is_active,
          show_on_website: form.show_on_website,
          allows_attachment: form.allows_attachment,
          event_id: form.event_id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setMessage(t.saved);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error');
    } finally {
      setSavingSettings(false);
    }
  };

  const saveFields = async () => {
    setSavingFields(true);
    setMessage(null);
    try {
      const normalized = fields.map((field, index) => ({
        ...field,
        order_index: index,
      }));
      const res = await fetch(`/api/site-applications/forms/${id}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: normalized }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setFields(normalized);
      setMessage(t.saved);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error');
    } finally {
      setSavingFields(false);
    }
  };

  if (modulesLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        {t.loading}
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <div className="p-8 text-red-600">{t.forbidden}</div>;
  }

  if (!form) {
    return <div className="p-8">Form not found</div>;
  }

  const formType: SiteApplicationFormType = form.form_type ?? inferFormType(form);
  const isTeam = formType === 'team';
  const previewSlug = locale === 'en' ? form.slug_en : form.slug_tr;
  const linkedEvent = events.find((e) => e.id === form.event_id);
  const previewHref = isTeam
    ? getTeamFormPublicPath(locale, previewSlug)
    : linkedEvent
      ? getEventApplicationPath(locale, linkedEvent.slug)
      : getSiteApplicationPublicPath(locale, previewSlug);
  const defaultFieldsTemplate = getDefaultFieldsForFormType(formType);
  const displayTitle = locale === 'en' ? form.title_en : form.title_tr;
  const displaySubtitle = locale === 'en' ? form.subtitle_en : form.subtitle_tr;

  const handleEventChange = (eventId: string) => {
    const selected = events.find((ev) => ev.id === eventId);
    const patch: Partial<SiteApplicationForm> = { event_id: eventId || null };
    if (selected) {
      const slugs = buildEventFormSlugs(selected.slug);
      patch.slug_tr = slugs.slug_tr;
      patch.slug_en = slugs.slug_en;
      if (!form.title_tr) patch.title_tr = `${selected.title} Başvurusu`;
      if (!form.title_en) patch.title_en = `${selected.title} Application`;
    }
    setForm({ ...form, ...patch });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/${locale}/site-applications/forms?tab=${isTeam ? 'team' : 'event'}`}
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-[#990000]"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>
        {form.is_active && (
          <a
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#990000]"
          >
            <ExternalLink className="w-4 h-4" />
            {t.openForm}
          </a>
        )}
      </div>

      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-[#990000]">
          {isTeam ? t.teamBadge : t.eventBadge}
        </span>
        <h1 className="text-2xl font-bold mt-1">{displayTitle}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {isTeam ? t.teamMenuHint : t.eventMenuHint}
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-2 text-sm">
          {message}
        </div>
      )}

      {!form.is_active && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {t.inactiveHint}
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-6 space-y-5">
        <h2 className="text-lg font-semibold">{t.settings}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {!isTeam && (
            <div className="sm:col-span-2">
              <label className="text-sm font-medium block mb-1">{t.linkedEvent}</label>
              <select
                value={form.event_id || ''}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full rounded-xl border px-3 py-2.5 text-sm dark:bg-neutral-900"
              >
                <option value="">{t.noEvent}</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.slug})
                  </option>
                ))}
              </select>
              {eventsError && <p className="text-xs text-red-600 mt-1">{eventsError}</p>}
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">{t.pageAddress}</label>
            <div className="rounded-xl border bg-neutral-50 dark:bg-neutral-900/40 px-3 py-2.5 text-sm font-mono break-all">
              {previewHref}
            </div>
          </div>
          <Field label={t.titleTr} value={form.title_tr} onChange={(v) => setForm({ ...form, title_tr: v })} />
          <Field label={t.titleEn} value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} />
          <Field label={t.subtitleTr} value={form.subtitle_tr || ''} onChange={(v) => setForm({ ...form, subtitle_tr: v })} />
          <Field label={t.subtitleEn} value={form.subtitle_en || ''} onChange={(v) => setForm({ ...form, subtitle_en: v })} />
          <Field label={t.successTr} value={form.success_message_tr || ''} onChange={(v) => setForm({ ...form, success_message_tr: v })} />
          <Field label={t.successEn} value={form.success_message_en || ''} onChange={(v) => setForm({ ...form, success_message_en: v })} />
        </div>
        <div className="flex flex-wrap gap-5 pt-2">
          <Toggle label={t.active} checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          {isTeam && (
            <Toggle label={t.showOnWebsite} checked={form.show_on_website} onChange={(v) => setForm({ ...form, show_on_website: v })} />
          )}
          <Toggle label={t.allowsAttachment} checked={form.allows_attachment} onChange={(v) => setForm({ ...form, allows_attachment: v })} />
        </div>
        <button
          onClick={saveSettings}
          disabled={savingSettings}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#990000] text-white rounded-xl"
        >
          <Save className="w-4 h-4" />
          {savingSettings ? '...' : t.saveSettings}
        </button>
      </section>

      <div className="grid lg:grid-cols-5 gap-8 items-start">
        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t.fields}</h2>
            {fields.length === 0 && (
              <button
                type="button"
                onClick={() => setFields(defaultFieldsTemplate)}
                className="text-sm px-3 py-1.5 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                {t.defaultFields}
              </button>
            )}
          </div>
          <FormFieldEditor locale={locale} fields={fields} setFields={setFields} />
          <button
            onClick={saveFields}
            disabled={savingFields || fields.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#990000] text-white rounded-xl disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {savingFields ? '...' : t.saveFields}
          </button>
        </section>

        <aside className="lg:col-span-2">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">{t.preview}</p>
          <FormPreviewPanel
            locale={locale}
            title={displayTitle}
            subtitle={displaySubtitle}
            fields={fields}
          />
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-neutral-900"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
      />
      {label}
    </label>
  );
}
