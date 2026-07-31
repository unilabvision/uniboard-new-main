'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Award, Loader2, Save } from 'lucide-react';

type TemplateOption = {
  id: number;
  name: string;
  organization_slug: string;
  is_default: boolean;
};

type CertSettings = {
  template_id: number | null;
  certificate_description: string | null;
  certificate_auto_issue: boolean;
  certificate_delay_minutes: number;
  form_id: string | null;
};

const texts = {
  tr: {
    title: 'Katılım sertifikası (otomatik gönderim)',
    hint: 'Etkinlik bitişinden sonra girdiğiniz süre dolunca, sertifika paketini alan katılımcılara e-posta ile katılım sertifikası iletilir.',
    autoIssue: 'Otomatik sertifika gönderimini aç',
    delay: 'Bekleme süresi (dakika)',
    delayHint: 'Örn. Biyoinformatik 101 için 60 = etkinlik bitiminden 1 saat sonra. 0 = biter bitmez.',
    template: 'Sertifika şablonu',
    templateHint: 'Otomatik gönderimde kullanılacak şablon. Organizasyon şablondan alınır.',
    description: 'Sertifika açıklaması',
    descriptionHint: 'Boş bırakılırsa varsayılan katılım metni kullanılır.',
    noForm: 'Bu etkinliğe bağlı başvuru formu yok. Önce Site Başvuruları’ndan etkinlik formu bağlayın; otomatik gönderim ayarı forma da yazılır.',
    save: 'Sertifika ayarlarını kaydet',
    saved: 'Sertifika ayarları kaydedildi',
    selectTemplate: 'Şablon seçin',
  },
  en: {
    title: 'Participation certificate (auto-send)',
    hint: 'After the wait period from event end, certificate-package attendees receive their participation certificate by email.',
    autoIssue: 'Enable automatic certificate delivery',
    delay: 'Wait time (minutes)',
    delayHint: 'e.g. 60 = 1 hour after the event ends. 0 = right at end.',
    template: 'Certificate template',
    templateHint: 'Template used for auto-send. Organization is taken from the template.',
    description: 'Certificate description',
    descriptionHint: 'Leave blank to use the default participation text.',
    noForm: 'No application form is linked to this event. Link a form under Site Applications first; auto-send settings are also stored on the form.',
    save: 'Save certificate settings',
    saved: 'Certificate settings saved',
    selectTemplate: 'Select a template',
  },
};

export default function EventCertificateSettingsPanel({
  locale,
  eventId,
  endDate,
}: {
  locale: string;
  eventId: string;
  endDate?: string;
}) {
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [settings, setSettings] = useState<CertSettings>({
    template_id: null,
    certificate_description: null,
    certificate_auto_issue: false,
    certificate_delay_minutes: 60,
    form_id: null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/certificate-settings`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Load failed');
      setSettings({
        template_id: data.settings?.template_id ?? null,
        certificate_description: data.settings?.certificate_description ?? null,
        certificate_auto_issue: Boolean(data.settings?.certificate_auto_issue),
        certificate_delay_minutes:
          Number(data.settings?.certificate_delay_minutes) >= 0
            ? Number(data.settings.certificate_delay_minutes)
            : 60,
        form_id: data.settings?.form_id ?? null,
      });
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (settings.certificate_auto_issue && !settings.template_id) {
        throw new Error(
          locale === 'en'
            ? 'Select a certificate template for auto-send'
            : 'Otomatik gönderim için bir sertifika şablonu seçin'
        );
      }
      const res = await fetch(`/api/events/${eventId}/certificate-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: settings.template_id,
          certificate_description: settings.certificate_description,
          certificate_auto_issue: settings.certificate_auto_issue,
          certificate_delay_minutes: settings.certificate_delay_minutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      if (data.settings) {
        setSettings((prev) => ({
          ...prev,
          template_id: data.settings.template_id,
          certificate_description: data.settings.certificate_description,
          certificate_auto_issue: data.settings.certificate_auto_issue,
          certificate_delay_minutes: data.settings.certificate_delay_minutes,
          form_id: data.settings.form_id,
        }));
      }
      setMessage(t.saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const selectedTemplate = templates.find((tpl) => tpl.id === settings.template_id);
  const previewEligibleAt = (() => {
    if (!endDate || !settings.certificate_auto_issue) return null;
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) return null;
    const at = new Date(end.getTime() + settings.certificate_delay_minutes * 60_000);
    return at.toLocaleString(locale === 'en' ? 'en-GB' : 'tr-TR');
  })();

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5 flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-2">
          <Award className="w-4 h-4" />
          {t.title}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">{t.hint}</p>
      </div>

      {!settings.form_id && (
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
          {t.noForm}
        </p>
      )}

      <label className="inline-flex items-start gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={settings.certificate_auto_issue}
          onChange={(e) =>
            setSettings((prev) => ({ ...prev, certificate_auto_issue: e.target.checked }))
          }
          className="mt-0.5 rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
        />
        <span className="font-medium">{t.autoIssue}</span>
      </label>

      {settings.certificate_auto_issue && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">{t.delay}</label>
            <input
              type="number"
              min={0}
              step={1}
              value={settings.certificate_delay_minutes}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  certificate_delay_minutes: Math.max(0, Math.round(Number(e.target.value) || 0)),
                }))
              }
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
            />
            <p className="text-xs text-neutral-500 mt-1">{t.delayHint}</p>
            {previewEligibleAt && (
              <p className="text-xs text-[#990000] mt-1">
                {locale === 'en' ? 'Scheduled send:' : 'Planlanan gönderim:'} {previewEligibleAt}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">{t.template}</label>
            <select
              value={settings.template_id ?? ''}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  template_id: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
            >
              <option value="">{t.selectTemplate}</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.organization_slug})
                  {tpl.is_default ? ' ★' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              {t.templateHint}
              {selectedTemplate ? ` · ${selectedTemplate.organization_slug}` : ''}
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">{t.description}</label>
            <textarea
              rows={2}
              value={settings.certificate_description || ''}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  certificate_description: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
            />
            <p className="text-xs text-neutral-500 mt-1">{t.descriptionHint}</p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#990000] text-white text-sm hover:bg-[#7a0000] disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t.save}
      </button>
    </section>
  );
}
