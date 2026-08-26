'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2, Save } from 'lucide-react';
import FormFieldEditor from '@/app/components/site-applications/FormFieldEditor';
import FormPreviewPanel from '@/app/components/site-applications/FormPreviewPanel';
import type {
  SiteApplicationForm,
  SiteApplicationFormField,
  SiteApplicationFormFieldInput,
} from '@/app/types/siteApplicationForms';

type Props = {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  locale?: string;
};

const texts = {
  tr: {
    title: 'Kurs başvuru formu',
    hint: 'Katılımcılar myunilab.net üzerinde /tr/kurs/{slug}/basvuru adresinden bu formu görür. Kursa özel soruları buradan ekleyin; “Kaydet ve yayınla” ile siteye yansır.',
    loading: 'Form yükleniyor...',
    loadError: 'Başvuru formu yüklenemedi',
    settings: 'Yayın ayarları',
    titleTr: 'Başlık (TR)',
    titleEn: 'Başlık (EN)',
    subtitleTr: 'Alt başlık (TR)',
    subtitleEn: 'Alt başlık (EN)',
    publish: 'Sitede yayınla',
    publishHint: 'İşaretli + kaydet = katılımcılar başvuru ekranını görür.',
    allowAttach: 'Dosya eki izin ver',
    saveSettings: 'Ayarları kaydet',
    saveFields: 'Soruları kaydet ve yayınla',
    saving: 'Kaydediliyor...',
    saved: 'Kaydedildi',
    saveError: 'Kayıt başarısız',
    openLive: 'Canlı formu aç',
    questions: 'Kursa özel sorular',
    preview: 'Önizleme',
    migration: 'Uyarı',
  },
  en: {
    title: 'Course application form',
    hint: 'Applicants see this form at /en/course/{slug}/application on myunilab.net. Add course-specific questions here; “Save and publish” pushes to the site.',
    loading: 'Loading form...',
    loadError: 'Could not load application form',
    settings: 'Publish settings',
    titleTr: 'Title (TR)',
    titleEn: 'Title (EN)',
    subtitleTr: 'Subtitle (TR)',
    subtitleEn: 'Subtitle (EN)',
    publish: 'Publish on site',
    publishHint: 'Checked + save = applicants see the form.',
    allowAttach: 'Allow file attachment',
    saveSettings: 'Save settings',
    saveFields: 'Save questions and publish',
    saving: 'Saving...',
    saved: 'Saved',
    saveError: 'Save failed',
    openLive: 'Open live form',
    questions: 'Course-specific questions',
    preview: 'Preview',
    migration: 'Warning',
  },
};

function toFieldInputs(rows: SiteApplicationFormField[]): SiteApplicationFormFieldInput[] {
  return rows.map((row) => ({
    client_id: row.id,
    field_key: row.field_key,
    field_type: row.field_type,
    label_tr: row.label_tr,
    label_en: row.label_en,
    placeholder_tr: row.placeholder_tr || undefined,
    placeholder_en: row.placeholder_en || undefined,
    required: row.required,
    order_index: row.order_index,
    options: row.options || [],
    is_contact: row.is_contact,
  }));
}

export default function CourseApplicationFormPanel({
  courseId,
  courseTitle,
  courseSlug,
  locale = 'tr',
}: Props) {
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [form, setForm] = useState<SiteApplicationForm | null>(null);
  const [fields, setFields] = useState<SiteApplicationFormFieldInput[]>([]);
  const [publicUrls, setPublicUrls] = useState<{ tr: string; en: string } | null>(null);
  const [migrationHint, setMigrationHint] = useState<string | null>(null);
  const [titleTr, setTitleTr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [subtitleTr, setSubtitleTr] = useState('');
  const [subtitleEn, setSubtitleEn] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [allowsAttachment, setAllowsAttachment] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/lms/courses/${encodeURIComponent(courseId)}/application-form`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.loadError);
      const f = data.form as SiteApplicationForm;
      setForm(f);
      setFields(toFieldInputs((data.fields || []) as SiteApplicationFormField[]));
      setPublicUrls(data.publicUrls || null);
      setMigrationHint(data.migrationHint || null);
      setTitleTr(f.title_tr || `${courseTitle} Başvurusu`);
      setTitleEn(f.title_en || `${courseTitle} Application`);
      setSubtitleTr(f.subtitle_tr || '');
      setSubtitleEn(f.subtitle_en || '');
      setIsActive(Boolean(f.is_active));
      setAllowsAttachment(Boolean(f.allows_attachment));
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : t.loadError,
        error: true,
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, courseTitle, t.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSettings = async (alsoPublish?: boolean) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/lms/courses/${encodeURIComponent(courseId)}/application-form`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title_tr: titleTr,
            title_en: titleEn,
            subtitle_tr: subtitleTr,
            subtitle_en: subtitleEn,
            is_active: alsoPublish ? true : isActive,
            show_on_website: true,
            allows_attachment: allowsAttachment,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.saveError);
      if (data.form) {
        setForm(data.form);
        setIsActive(Boolean(data.form.is_active));
      }
      if (data.publicUrls) setPublicUrls(data.publicUrls);
      setMessage({ text: t.saved });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : t.saveError,
        error: true,
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const saveFields = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const settingsRes = await fetch(
        `/api/lms/courses/${encodeURIComponent(courseId)}/application-form`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title_tr: titleTr,
            title_en: titleEn,
            subtitle_tr: subtitleTr,
            subtitle_en: subtitleEn,
            is_active: true,
            show_on_website: true,
            allows_attachment: allowsAttachment,
          }),
        }
      );
      const settingsData = await settingsRes.json().catch(() => ({}));
      if (!settingsRes.ok) throw new Error(settingsData.error || t.saveError);
      if (settingsData.form) setForm(settingsData.form);
      if (settingsData.publicUrls) setPublicUrls(settingsData.publicUrls);

      const payload = fields.map((field, index) => {
        const next = { ...field, order_index: index };
        delete (next as { client_id?: string }).client_id;
        return next;
      });

      const missing = payload.find((f) => !f.label_tr?.trim());
      if (missing) {
        throw new Error(
          locale === 'en'
            ? 'Every question needs TR text.'
            : 'Her sorunun TR metni dolu olmalı.'
        );
      }

      const res = await fetch(
        `/api/lms/courses/${encodeURIComponent(courseId)}/application-form`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: payload }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.saveError);
      if (Array.isArray(data.fields)) {
        setFields(toFieldInputs(data.fields));
      }
      setIsActive(true);
      setMessage({ text: t.saved });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : t.saveError,
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm focus:ring-2 focus:ring-[#990000] focus:border-transparent';

  const liveUrl = locale === 'en' ? publicUrls?.en : publicUrls?.tr;

  if (loading) {
    return (
      <p className="text-sm text-neutral-500 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t.loading}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t.title}
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">
            {t.hint.replace('{slug}', courseSlug)}
          </p>
        </div>
        {isActive && liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[#990000] shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            {t.openLive}
          </a>
        )}
      </div>

      {migrationHint && (
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          {t.migration}: {migrationHint}
        </p>
      )}

      {message && (
        <p className={`text-sm ${message.error ? 'text-red-600' : 'text-emerald-600'}`}>
          {message.text}
        </p>
      )}

      <section className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
        <h4 className="text-sm font-medium">{t.settings}</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">{t.titleTr}</label>
            <input
              value={titleTr}
              onChange={(e) => setTitleTr(e.target.value)}
              placeholder={`${courseTitle} Başvurusu`}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t.titleEn}</label>
            <input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder={`${courseTitle} Application`}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t.subtitleTr}</label>
            <input
              value={subtitleTr}
              onChange={(e) => setSubtitleTr(e.target.value)}
              placeholder="Kursa katılmak için formu doldurun."
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t.subtitleEn}</label>
            <input
              value={subtitleEn}
              onChange={(e) => setSubtitleEn(e.target.value)}
              placeholder="Fill out the form to apply for this course."
              className={inputClass}
            />
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
          />
          <span>
            {t.publish}
            <span className="block text-xs text-neutral-500">{t.publishHint}</span>
          </span>
        </label>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={allowsAttachment}
            onChange={(e) => setAllowsAttachment(e.target.checked)}
            className="rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
          />
          {t.allowAttach}
        </label>
        <button
          type="button"
          onClick={() => void saveSettings(false)}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t.saveSettings}
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium">{t.questions}</h4>
          <button
            type="button"
            onClick={() => void saveFields()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[#990000] text-white hover:bg-[#7a0000] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t.saveFields}
          </button>
        </div>
        <FormFieldEditor
          locale={locale}
          fields={fields}
          setFields={setFields}
          formType="course"
          formId={form?.id}
        />
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-medium">{t.preview}</h4>
        <FormPreviewPanel
          locale={locale}
          title={titleTr || titleEn}
          subtitle={subtitleTr || subtitleEn}
          fields={fields}
          formType="course"
          allowsAttachment={allowsAttachment}
        />
      </section>
    </div>
  );
}
