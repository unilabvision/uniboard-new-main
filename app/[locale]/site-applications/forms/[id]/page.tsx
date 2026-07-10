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
  getTeamFormPublicPath,
  inferFormType,
  TEAM_DEFAULT_FIELDS,
  type SiteApplicationFormType,
} from '@/app/lib/siteApplications/formTypes';
import { normalizeFieldOptions } from '@/app/lib/siteApplications/forms';
import type {
  SiteApplicationForm,
  SiteApplicationFormField,
  SiteApplicationFormFieldInput,
  SiteApplicationFormFieldOption,
  SiteApplicationFieldType,
} from '@/app/types/siteApplicationForms';
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';

const FIELD_TYPES: SiteApplicationFieldType[] = [
  'text',
  'email',
  'tel',
  'textarea',
  'number',
  'date',
  'url',
  'select',
];

const texts = {
  tr: {
    back: 'Formlara Dön',
    forbidden: 'Bu sayfaya yalnızca süper admin erişebilir.',
    loading: 'Yükleniyor...',
    settings: 'Form Ayarları',
    fields: 'Form Alanları',
    saveSettings: 'Ayarları Kaydet',
    saveFields: 'Alanları Kaydet',
    saved: 'Kaydedildi',
    preview: 'Önizle',
    addField: 'Alan Ekle',
    fieldKey: 'Alan anahtarı',
    labelTr: 'Etiket (TR)',
    labelEn: 'Etiket (EN)',
    required: 'Zorunlu',
    type: 'Tür',
    order: 'Sıra',
    active: 'Aktif',
    showOnWebsite: 'Sitede göster',
    teamBadge: 'UNILAB Ekip Başvurusu',
    eventBadge: 'Etkinlik Başvuru Formu',
    teamMenuHint: 'Bu form myunilab.net → Hakkımızda menüsünde görünür',
    eventMenuHint: 'Bu form seçilen etkinliğin başvuru sayfasında açılır',
    pageAddress: 'Sayfa adresi',
    placeholderTr: 'Placeholder (TR)',
    placeholderEn: 'Placeholder (EN)',
    eventsLoadError: 'Etkinlik listesi yüklenemedi',
    allowsAttachment: 'Ek dosya',
    remove: 'Sil',
    defaultFields: 'UNILAB ekip alanlarını ekle',
    defaultEventFields: 'Varsayılan alanları ekle',
    linkedEvent: 'Bağlı etkinlik',
    noEvent: 'Etkinlik seçilmedi',
    selectOptions: 'Seçenekler',
    optionValue: 'Değer',
    optionLabelTr: 'Etiket (TR)',
    optionLabelEn: 'Etiket (EN)',
    addOption: 'Seçenek ekle',
    removeOption: 'Seçeneği sil',
    selectOptionsHint: 'Select alanı için en az bir seçenek ekleyin.',
  },
  en: {
    back: 'Back to Forms',
    forbidden: 'Only super admins can access this page.',
    loading: 'Loading...',
    settings: 'Form Settings',
    fields: 'Form Fields',
    saveSettings: 'Save Settings',
    saveFields: 'Save Fields',
    saved: 'Saved',
    preview: 'Preview',
    addField: 'Add Field',
    fieldKey: 'Field key',
    labelTr: 'Label (TR)',
    labelEn: 'Label (EN)',
    required: 'Required',
    type: 'Type',
    order: 'Order',
    active: 'Active',
    showOnWebsite: 'Show on site',
    teamBadge: 'UNILAB Team Application',
    eventBadge: 'Event Application Form',
    teamMenuHint: 'Shown under About Us on myunilab.net',
    eventMenuHint: 'Opens on the linked event application page',
    pageAddress: 'Page address',
    placeholderTr: 'Placeholder (TR)',
    placeholderEn: 'Placeholder (EN)',
    eventsLoadError: 'Could not load events list',
    allowsAttachment: 'Attachments',
    remove: 'Remove',
    defaultFields: 'Add UNILAB team fields',
    defaultEventFields: 'Add default fields',
    linkedEvent: 'Linked event',
    noEvent: 'No event selected',
    selectOptions: 'Options',
    optionValue: 'Value',
    optionLabelTr: 'Label (TR)',
    optionLabelEn: 'Label (EN)',
    addOption: 'Add option',
    removeOption: 'Remove option',
    selectOptionsHint: 'Add at least one option for select fields.',
  },
};

const DEFAULT_EVENT_FIELDS: SiteApplicationFormFieldInput[] = [
  { field_key: 'first_name', field_type: 'text', label_tr: 'Ad', label_en: 'First Name', required: true, order_index: 0, is_contact: true },
  { field_key: 'last_name', field_type: 'text', label_tr: 'Soyad', label_en: 'Last Name', required: true, order_index: 1, is_contact: true },
  { field_key: 'email', field_type: 'email', label_tr: 'E-posta', label_en: 'Email', required: true, order_index: 2, is_contact: true },
  { field_key: 'phone', field_type: 'tel', label_tr: 'Telefon', label_en: 'Phone', required: false, order_index: 3, is_contact: true },
  { field_key: 'message', field_type: 'textarea', label_tr: 'Mesaj', label_en: 'Message', required: false, order_index: 4 },
];

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
      const res = await fetch(`/api/site-applications/forms/${id}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setMessage(t.saved);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error');
    } finally {
      setSavingFields(false);
    }
  };

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        field_key: `field_${prev.length + 1}`,
        field_type: 'text',
        label_tr: '',
        label_en: '',
        required: false,
        order_index: prev.length,
      },
    ]);
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
  const defaultFieldsTemplate = isTeam ? TEAM_DEFAULT_FIELDS : DEFAULT_EVENT_FIELDS;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
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
            {t.preview}
          </a>
        )}
      </div>

      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-[#990000]">
          {isTeam ? t.teamBadge : t.eventBadge}
        </span>
        <h1 className="text-2xl font-bold mt-1">
          {locale === 'en' ? form.title_en : form.title_tr}
        </h1>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-2 text-sm">
          {message}
        </div>
      )}

      <section className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-4">
        <h2 className="text-lg font-semibold">{t.settings}</h2>
        <p className="text-sm text-neutral-500">
          {isTeam ? t.teamMenuHint : t.eventMenuHint}
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {!isTeam && (
            <div className="sm:col-span-2">
              <label className="text-xs text-neutral-500 block mb-1">{t.linkedEvent}</label>
              <select
                value={form.event_id || ''}
                onChange={(e) => setForm({ ...form, event_id: e.target.value || null })}
                className="w-full rounded border px-3 py-2 text-sm dark:bg-neutral-900"
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
          {isTeam && (
            <div className="sm:col-span-2">
              <label className="text-xs text-neutral-500 block mb-1">{t.pageAddress}</label>
              <div className="rounded border bg-neutral-50 dark:bg-neutral-900/40 px-3 py-2 text-sm font-mono break-all">
                {previewHref}
              </div>
            </div>
          )}
          <Input label="TR slug" value={form.slug_tr} onChange={(v) => setForm({ ...form, slug_tr: v })} />
          <Input label="EN slug" value={form.slug_en} onChange={(v) => setForm({ ...form, slug_en: v })} />
          <Input label="Title TR" value={form.title_tr} onChange={(v) => setForm({ ...form, title_tr: v })} />
          <Input label="Title EN" value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} />
          <Input label="Subtitle TR" value={form.subtitle_tr || ''} onChange={(v) => setForm({ ...form, subtitle_tr: v })} />
          <Input label="Subtitle EN" value={form.subtitle_en || ''} onChange={(v) => setForm({ ...form, subtitle_en: v })} />
        </div>
        <div className="flex flex-wrap gap-4">
          <Check label={t.active} checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
          <Check label={t.showOnWebsite} checked={form.show_on_website} onChange={(v) => setForm({ ...form, show_on_website: v })} />
          <Check label={t.allowsAttachment} checked={form.allows_attachment} onChange={(v) => setForm({ ...form, allows_attachment: v })} />
        </div>
        <button
          onClick={saveSettings}
          disabled={savingSettings}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#990000] text-white rounded-lg"
        >
          <Save className="w-4 h-4" />
          {savingSettings ? '...' : t.saveSettings}
        </button>
      </section>

      <section className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.fields}</h2>
          <div className="flex gap-2">
            {fields.length === 0 && (
              <button
                type="button"
                onClick={() => setFields(defaultFieldsTemplate)}
                className="text-sm px-3 py-1.5 border rounded-lg"
              >
                {isTeam ? t.defaultFields : t.defaultEventFields}
              </button>
            )}
            <button type="button" onClick={addField} className="inline-flex items-center gap-1 text-sm px-3 py-1.5 border rounded-lg">
              <Plus className="w-4 h-4" />
              {t.addField}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 space-y-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Input label={t.fieldKey} value={field.field_key} onChange={(v) => updateField(index, { field_key: v }, setFields)} />
                <Input label={t.labelTr} value={field.label_tr} onChange={(v) => updateField(index, { label_tr: v }, setFields)} />
                <Input label={t.labelEn} value={field.label_en} onChange={(v) => updateField(index, { label_en: v }, setFields)} />
                <Input label={t.placeholderTr} value={field.placeholder_tr || ''} onChange={(v) => updateField(index, { placeholder_tr: v }, setFields)} />
                <Input label={t.placeholderEn} value={field.placeholder_en || ''} onChange={(v) => updateField(index, { placeholder_en: v }, setFields)} />
                <div>
                  <label className="text-xs text-neutral-500">{t.type}</label>
                  <select
                    value={field.field_type}
                    onChange={(e) => {
                      const nextType = e.target.value as SiteApplicationFieldType;
                      const patch: Partial<SiteApplicationFormFieldInput> = { field_type: nextType };
                      if (nextType === 'select' && !field.options?.length) {
                        patch.options = [
                          { value: 'option_1', label_tr: 'Seçenek 1', label_en: 'Option 1' },
                        ];
                      }
                      updateField(index, patch, setFields);
                    }}
                    className="w-full rounded border px-2 py-1.5 text-sm"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                </div>
                <Input label={t.order} value={String(field.order_index ?? index)} onChange={(v) => updateField(index, { order_index: Number(v) || 0 }, setFields)} />
              </div>
              {field.field_type === 'select' && (
                <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.selectOptions}</p>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          index,
                          {
                            options: [
                              ...(field.options || []),
                              {
                                value: `option_${(field.options?.length || 0) + 1}`,
                                label_tr: `Seçenek ${(field.options?.length || 0) + 1}`,
                                label_en: `Option ${(field.options?.length || 0) + 1}`,
                              },
                            ],
                          },
                          setFields
                        )
                      }
                      className="text-xs px-2.5 py-1 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      {t.addOption}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500">{t.selectOptionsHint}</p>
                  {(field.options || []).map((opt, optIndex) => (
                    <div key={`${field.field_key}-opt-${optIndex}`} className="grid sm:grid-cols-4 gap-2 items-end">
                      <Input
                        label={t.optionValue}
                        value={opt.value}
                        onChange={(v) => updateSelectOption(index, optIndex, { value: v }, setFields)}
                      />
                      <Input
                        label={t.optionLabelTr}
                        value={opt.label_tr}
                        onChange={(v) => updateSelectOption(index, optIndex, { label_tr: v }, setFields)}
                      />
                      <Input
                        label={t.optionLabelEn}
                        value={opt.label_en}
                        onChange={(v) => updateSelectOption(index, optIndex, { label_en: v }, setFields)}
                      />
                      <button
                        type="button"
                        onClick={() => removeSelectOption(index, optIndex, setFields)}
                        className="text-xs text-red-600 hover:underline mb-1"
                      >
                        {t.removeOption}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <Check label={t.required} checked={!!field.required} onChange={(v) => updateField(index, { required: v }, setFields)} />
                <button type="button" onClick={() => setFields((prev) => prev.filter((_, i) => i !== index))} className="p-2 text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={saveFields}
          disabled={savingFields || fields.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#990000] text-white rounded-lg disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {savingFields ? '...' : t.saveFields}
        </button>
      </section>
    </div>
  );
}

function updateField(
  index: number,
  patch: Partial<SiteApplicationFormFieldInput>,
  setFields: React.Dispatch<React.SetStateAction<SiteApplicationFormFieldInput[]>>
) {
  setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
}

function updateSelectOption(
  fieldIndex: number,
  optionIndex: number,
  patch: Partial<SiteApplicationFormFieldOption>,
  setFields: React.Dispatch<React.SetStateAction<SiteApplicationFormFieldInput[]>>
) {
  setFields((prev) =>
    prev.map((field, i) => {
      if (i !== fieldIndex) return field;
      const options = [...(field.options || [])];
      options[optionIndex] = { ...options[optionIndex], ...patch };
      return { ...field, options };
    })
  );
}

function removeSelectOption(
  fieldIndex: number,
  optionIndex: number,
  setFields: React.Dispatch<React.SetStateAction<SiteApplicationFormFieldInput[]>>
) {
  setFields((prev) =>
    prev.map((field, i) => {
      if (i !== fieldIndex) return field;
      return {
        ...field,
        options: (field.options || []).filter((_, idx) => idx !== optionIndex),
      };
    })
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-neutral-500">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border px-2 py-1.5 text-sm dark:bg-neutral-800" />
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
