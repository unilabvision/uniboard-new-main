'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Award, Eye, Loader2, Mail, Save } from 'lucide-react';

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

type QueuePreview = {
  readyDue: number;
  pendingWait: number;
  failed: number;
  failedDue?: number;
  wouldIssue?: number;
  issued: number;
  totalInQueue: number;
  paidCertificateApps?: number;
  pendingCertificateApps?: number;
  sampleDue?: Array<{ id?: string; email: string; name: string }>;
};

const texts = {
  tr: {
    title: 'Katılım sertifikası gönderimi',
    hint: 'Etkinlik bitişinden sonra girdiğiniz bekleme süresi dolunca sertifikalar gönderime hazır olur. Yalnızca ödenmiş sertifika paketi sahiplerine gider (0₺ paket submit’te ödenmiş sayılır). Vercel cron kısıtı nedeniyle gönderimi aşağıdaki butonla manuel başlatın.',
    autoIssue: 'Etkinlik sonrası sertifika gönderimini planla',
    delay: 'Bekleme süresi (dakika)',
    delayHint:
      'Örn. Biyoinformatik 101 için 60 = etkinlik bitiminden 1 saat sonra. 0 = biter bitmez.',
    template: 'Sertifika şablonu',
    templateHint:
      'Gönderimde kullanılacak şablon. Organizasyon şablondan alınır. Göndermeden önce ayarlar kaydedilir.',
    description: 'Sertifika açıklaması',
    descriptionHint: 'Boş bırakılırsa varsayılan katılım metni kullanılır.',
    noForm:
      'Bu etkinliğe bağlı başvuru formu yok. Önce Site Başvuruları’ndan etkinlik formu bağlayın; paket/plan formu ile senkron kalır.',
    save: 'Sertifika ayarlarını kaydet',
    saved: 'Sertifika ayarları kaydedildi',
    selectTemplate: 'Şablon seçin',
    send: 'Süresi dolan sertifikaları şimdi gönder',
    sending: 'Sertifikalar gönderiliyor…',
    dryRun: 'Önizleme (dry-run)',
    dryRunning: 'Önizleniyor…',
    confirmSend:
      'Bekleme süresi dolmuş, ödenmiş sertifika paketi sahiplerine sertifika oluşturulup e-posta gönderilsin mi?',
    needTemplate: 'Gönderim için bir sertifika şablonu seçin',
    queueTitle: 'Kuyruk / ödeme özeti',
    queueReady: 'gönderime hazır',
    queueWait: 'beklemede',
    queueFailed: 'hatalı',
    queueIssued: 'gönderilmiş',
    queueWould: 'şimdi gidecek',
    paidApps: 'ödenmiş sertifika başvurusu',
    pendingApps: 'bekleyen ödeme',
  },
  en: {
    title: 'Participation certificate delivery',
    hint: 'Certificates become ready after the configured wait period. Only paid certificate-package holders are queued (₺0 packages are marked paid on submit). Due to Vercel cron limits, start delivery manually using the button below.',
    autoIssue: 'Schedule post-event certificate delivery',
    delay: 'Wait time (minutes)',
    delayHint: 'e.g. 60 = 1 hour after the event ends. 0 = right at end.',
    template: 'Certificate template',
    templateHint:
      'Template used for delivery. Organization is taken from the template. Settings are saved before send.',
    description: 'Certificate description',
    descriptionHint: 'Leave blank to use the default participation text.',
    noForm:
      'No application form is linked to this event. Link a form under Site Applications first so package/plan settings stay in sync.',
    save: 'Save certificate settings',
    saved: 'Certificate settings saved',
    selectTemplate: 'Select a template',
    send: 'Send due certificates now',
    sending: 'Sending certificates…',
    dryRun: 'Preview (dry-run)',
    dryRunning: 'Previewing…',
    confirmSend:
      'Create and email certificates for paid certificate-package holders whose wait period has elapsed?',
    needTemplate: 'Select a certificate template to send',
    queueTitle: 'Queue / payment summary',
    queueReady: 'ready to send',
    queueWait: 'waiting',
    queueFailed: 'failed',
    queueIssued: 'issued',
    queueWould: 'would send now',
    paidApps: 'paid certificate applications',
    pendingApps: 'pending payment',
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
  const [sending, setSending] = useState(false);
  const [dryRunning, setDryRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [queue, setQueue] = useState<QueuePreview | null>(null);
  const [settings, setSettings] = useState<CertSettings>({
    template_id: null,
    certificate_description: null,
    certificate_auto_issue: false,
    certificate_delay_minutes: 60,
    form_id: null,
  });
  const [dirty, setDirty] = useState(false);

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
      setQueue(data.queue || null);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const patchSettings = (partial: Partial<CertSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    setDirty(true);
  };

  const saveSettings = async (opts?: { quiet?: boolean }): Promise<CertSettings> => {
    if (!settings.template_id && settings.certificate_auto_issue) {
      throw new Error(t.needTemplate);
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

    const next: CertSettings = {
      template_id: data.settings?.template_id ?? settings.template_id,
      certificate_description:
        data.settings?.certificate_description ?? settings.certificate_description,
      certificate_auto_issue: Boolean(
        data.settings?.certificate_auto_issue ?? settings.certificate_auto_issue
      ),
      certificate_delay_minutes:
        Number(data.settings?.certificate_delay_minutes) >= 0
          ? Number(data.settings.certificate_delay_minutes)
          : settings.certificate_delay_minutes,
      form_id: data.settings?.form_id ?? settings.form_id,
    };
    setSettings(next);
    setDirty(false);
    if (!opts?.quiet) setMessage(t.saved);
    return next;
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await saveSettings();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDryRun = async () => {
    if (!settings.template_id) {
      setError(t.needTemplate);
      return;
    }
    setDryRunning(true);
    setError(null);
    setMessage(null);
    try {
      await saveSettings({ quiet: true });
      const res = await fetch(`/api/events/${eventId}/issue-certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Dry-run failed');
      setMessage(data.message || `Dry-run: ${data.wouldIssue || 0}`);
      if (Array.isArray(data.recipients) && data.recipients.length) {
        const sample = data.recipients
          .slice(0, 8)
          .map((r: { name?: string; email?: string }) => `${r.name || '—'} <${r.email || ''}>`)
          .join('; ');
        setMessage(
          `${data.message}${data.recipients.length > 8 ? ` · örn: ${sample}…` : ` · ${sample}`}`
        );
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setDryRunning(false);
    }
  };

  const handleSend = async () => {
    if (!settings.template_id) {
      setError(t.needTemplate);
      return;
    }
    if (!confirm(t.confirmSend)) return;

    setSending(true);
    setError(null);
    setMessage(null);
    try {
      await saveSettings({ quiet: true });

      const res = await fetch(`/api/events/${eventId}/issue-certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');

      if (data.eligibleAt && !data.issued) {
        const date = new Date(data.eligibleAt).toLocaleString(
          locale === 'en' ? 'en-GB' : 'tr-TR'
        );
        setMessage(`${data.message} ${date}`);
      } else {
        setMessage(data.message || `${data.issued || 0} sertifika gönderildi.`);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSending(false);
    }
  };

  const selectedTemplate = templates.find((tpl) => tpl.id === settings.template_id);
  const previewEligibleAt = (() => {
    if (!endDate || !settings.certificate_auto_issue) return null;
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) return null;
    const at = new Date(
      end.getTime() + settings.certificate_delay_minutes * 60_000
    );
    return at.toLocaleString(locale === 'en' ? 'en-GB' : 'tr-TR');
  })();

  const busy = saving || sending || dryRunning;
  const canAct = Boolean(settings.template_id) && !busy;

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

      {queue && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/40 px-3 py-2 text-xs text-neutral-600 dark:text-neutral-300 space-y-1.5">
          <p className="font-medium text-neutral-800 dark:text-neutral-200">
            {t.queueTitle}
          </p>
          <p>
            {queue.wouldIssue ?? queue.readyDue} {t.queueWould}
            {' · '}
            {queue.readyDue} {t.queueReady}
            {' · '}
            {queue.pendingWait} {t.queueWait}
            {' · '}
            {queue.failed} {t.queueFailed}
            {' · '}
            {queue.issued} {t.queueIssued}
          </p>
          <p>
            {queue.paidCertificateApps ?? 0} {t.paidApps}
            {' · '}
            {queue.pendingCertificateApps ?? 0} {t.pendingApps}
          </p>
          {queue.sampleDue && queue.sampleDue.length > 0 && (
            <ul className="list-disc pl-4 space-y-0.5 max-h-28 overflow-y-auto">
              {queue.sampleDue.map((r) => (
                <li key={r.id || r.email}>
                  {r.name} &lt;{r.email}&gt;
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <label className="inline-flex items-start gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={settings.certificate_auto_issue}
          onChange={(e) =>
            patchSettings({ certificate_auto_issue: e.target.checked })
          }
          className="mt-0.5 rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
        />
        <span className="font-medium">{t.autoIssue}</span>
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        {settings.certificate_auto_issue && (
          <div>
            <label className="text-sm font-medium block mb-1">{t.delay}</label>
            <input
              type="number"
              min={0}
              step={1}
              value={settings.certificate_delay_minutes}
              onChange={(e) =>
                patchSettings({
                  certificate_delay_minutes: Math.max(
                    0,
                    Math.round(Number(e.target.value) || 0)
                  ),
                })
              }
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
            />
            <p className="text-xs text-neutral-500 mt-1">{t.delayHint}</p>
            {previewEligibleAt && (
              <p className="text-xs text-[#990000] mt-1">
                {locale === 'en' ? 'Ready after:' : 'Gönderime hazır olacağı zaman:'}{' '}
                {previewEligibleAt}
              </p>
            )}
          </div>
        )}

        <div className={settings.certificate_auto_issue ? '' : 'sm:col-span-2'}>
          <label className="text-sm font-medium block mb-1">{t.template}</label>
          <select
            value={settings.template_id ?? ''}
            onChange={(e) =>
              patchSettings({
                template_id: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
          >
            <option value="">{t.selectTemplate}</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} ({tpl.organization_slug || '—'})
                {tpl.is_default ? ' ★' : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-neutral-500 mt-1">
            {t.templateHint}
            {selectedTemplate
              ? ` · ${selectedTemplate.organization_slug || 'slug yok'}`
              : ''}
            {dirty
              ? locale === 'en'
                ? ' · unsaved changes'
                : ' · kaydedilmemiş değişiklikler'
              : ''}
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium block mb-1">{t.description}</label>
          <textarea
            rows={2}
            value={settings.certificate_description || ''}
            onChange={(e) =>
              patchSettings({ certificate_description: e.target.value })
            }
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 px-3 py-2 text-sm bg-white dark:bg-neutral-900"
          />
          <p className="text-xs text-neutral-500 mt-1">{t.descriptionHint}</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-600 break-words">{message}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t.save}
        </button>
        <button
          type="button"
          onClick={handleDryRun}
          disabled={!canAct}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#990000]/40 text-[#990000] text-sm hover:bg-[#990000]/10 disabled:opacity-50"
        >
          {dryRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {dryRunning ? t.dryRunning : t.dryRun}
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={!canAct}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#990000] text-white text-sm hover:bg-[#7a0000] disabled:opacity-50"
          title={
            settings.template_id
              ? undefined
              : locale === 'en'
                ? 'Select a template first'
                : 'Önce şablon seçin'
          }
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {sending ? t.sending : t.send}
        </button>
      </div>
    </section>
  );
}
