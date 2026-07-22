'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Send,
  CheckSquare,
  Square,
  Award,
  GraduationCap,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { certificatesSupabase as supabase } from '@/app/_services/certificatesSupabaseClient';
import type { CertificateIssuanceRow } from '@/app/lib/certificates/issuance';

type TabKey = 'event_participation' | 'course_achievement';

type Organization = {
  id: string;
  name: string;
  slug: string;
  abbreviation?: string | null;
};

type Template = {
  id: number;
  name: string;
  organization_slug: string | null;
};

type LatestEventInfo = {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
};

const texts = {
  tr: {
    title: 'Gönderilecek Sertifikalar',
    subtitle:
      'En son etkinlikte sertifika ücreti ödeyenler (ücretsiz sertifika paketi dahil) burada listelenir. Şablon seçin, mail metnini yazın ve toplu gönderin.',
    tabEvent: 'Katılım (Etkinlik)',
    tabCourse: 'Başarı (LMS)',
    refresh: 'Yenile / Senkron',
    empty: 'Bu sekmede bekleyen kayıt yok',
    loading: 'Yükleniyor...',
    name: 'Ad Soyad',
    email: 'E-posta',
    source: 'Kaynak',
    eligible: 'Uygunluk',
    status: 'Durum',
    selectAll: 'Tümünü seç',
    clear: 'Seçimi temizle',
    organization: 'Organizasyon',
    template: 'Şablon',
    emailBody: 'E-posta metni',
    emailBodyHint: 'Sertifika mailine eklenecek özel mesaj (opsiyonel)',
    emailBodyPlaceholder:
      'Örn: Etkinliğimize katıldığınız için teşekkür ederiz. Sertifikanız ekte / bağlantıda.',
    certDescription: 'Sertifika açıklaması',
    certDescriptionHint:
      'Şablondaki isim altındaki satır (ör. “Embriyoloji 101 etkinliğine katılım”)',
    certDescriptionPlaceholder:
      'Örn: Bu belge, MyUNI tarafından düzenlenen Embriyoloji 101 etkinliğine katılımınızı belgeler.',
    aiGenerate: 'AI ile oluştur',
    aiGenerating: 'Oluşturuluyor...',
    aiNeedEvent: 'AI için önce etkinlik / kaynak adı gerekli',
    latestEvent: 'Son etkinlik',
    paidCount: 'gönderime hazır',
    issue: 'Oluştur ve e-posta gönder',
    issuing: 'Gönderiliyor...',
    needSelection: 'En az bir kişi ve şablon seçin',
    success: (issued: number, emailed: number) =>
      `${issued} sertifika oluşturuldu, ${emailed} e-posta gönderildi`,
    statusLabels: {
      ready: 'Hazır',
      pending: 'Bekliyor',
      failed: 'Hatalı',
      issued: 'Gönderildi',
      skipped: 'Atlandı',
    } as Record<string, string>,
  },
  en: {
    title: 'Certificates to Issue',
    subtitle:
      'Certificate payers from the latest event (including free certificate packages) appear here. Pick a template, write the email, and send in bulk.',
    tabEvent: 'Participation (Event)',
    tabCourse: 'Achievement (LMS)',
    refresh: 'Refresh / Sync',
    empty: 'No pending items in this tab',
    loading: 'Loading...',
    name: 'Name',
    email: 'Email',
    source: 'Source',
    eligible: 'Eligible at',
    status: 'Status',
    selectAll: 'Select all',
    clear: 'Clear selection',
    organization: 'Organization',
    template: 'Template',
    emailBody: 'Email message',
    emailBodyHint: 'Optional custom message added to the certificate email',
    emailBodyPlaceholder:
      'e.g. Thank you for attending. Your certificate is ready.',
    certDescription: 'Certificate description',
    certDescriptionHint:
      'Line under the name on the template (e.g. “Participation in Embryology 101”)',
    certDescriptionPlaceholder:
      'e.g. This certificate confirms participation in Embryology 101 organized by MyUNI.',
    aiGenerate: 'Generate with AI',
    aiGenerating: 'Generating...',
    aiNeedEvent: 'Event / source name is required for AI',
    latestEvent: 'Latest event',
    paidCount: 'ready to send',
    issue: 'Create & email',
    issuing: 'Sending...',
    needSelection: 'Select at least one person and a template',
    success: (issued: number, emailed: number) =>
      `${issued} certificates created, ${emailed} emails sent`,
    statusLabels: {
      ready: 'Ready',
      pending: 'Pending',
      failed: 'Failed',
      issued: 'Issued',
      skipped: 'Skipped',
    } as Record<string, string>,
  },
};

export default function CertificateIssuancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [tab, setTab] = useState<TabKey>('event_participation');
  const [items, setItems] = useState<CertificateIssuanceRow[]>([]);
  const [latestEvent, setLatestEvent] = useState<LatestEventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState('');
  const [certificateDescription, setCertificateDescription] = useState('');
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [orgSlug, setOrgSlug] = useState('');
  const [templateId, setTemplateId] = useState<number | ''>('');

  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    params.then((p) => setLocale(p.locale === 'en' ? 'en' : 'tr'));
  }, [params]);

  useEffect(() => {
    const loadMeta = async () => {
      const [{ data: orgs }, { data: tpls }] = await Promise.all([
        supabase.from('organizations').select('id, name, slug, abbreviation').order('name'),
        supabase
          .from('certificate_templates')
          .select('id, name, organization_slug')
          .order('name'),
      ]);
      setOrganizations((orgs as Organization[]) || []);
      setTemplates((tpls as Template[]) || []);
      if (orgs?.[0]?.slug) setOrgSlug(orgs[0].slug);
    };
    loadMeta().catch(() => undefined);
  }, []);

  const filteredTemplates = useMemo(() => {
    if (!orgSlug) return templates;
    return templates.filter(
      (tpl) => !tpl.organization_slug || tpl.organization_slug === orgSlug
    );
  }, [templates, orgSlug]);

  useEffect(() => {
    if (
      templateId &&
      !filteredTemplates.some((tpl) => tpl.id === templateId)
    ) {
      setTemplateId(filteredTemplates[0]?.id || '');
    } else if (!templateId && filteredTemplates[0]) {
      // Etkinlik sekmesinde Katılım şablonunu tercih et
      const preferred =
        tab === 'event_participation'
          ? filteredTemplates.find((tpl) =>
              /katilim|katılım|participation/i.test(tpl.name)
            )
          : null;
      setTemplateId(preferred?.id || filteredTemplates[0].id);
    }
  }, [filteredTemplates, templateId, tab]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const res = await fetch(`/api/certificates/issuance?kind=${tab}&sync=1`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setItems((data.items as CertificateIssuanceRow[]) || []);
      const event = (data.latestEvent as LatestEventInfo) || null;
      setLatestEvent(event);
      setSelected(new Set());
      if (tab === 'event_participation' && event?.title) {
        setCertificateDescription((prev) => {
          if (prev.trim()) return prev;
          return locale === 'en'
            ? `Participation in ${event.title}`
            : `${event.title} etkinliğine katılım`;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loading);
    } finally {
      setLoading(false);
    }
  }, [tab, t.loading, locale]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(items.map((i) => i.id)));
  };

  const eventOrCourseName = useMemo(() => {
    if (tab === 'event_participation') {
      return latestEvent?.title || items[0]?.event_name || '';
    }
    return items[0]?.course_name || '';
  }, [tab, latestEvent, items]);

  const generateDescriptionWithAi = async () => {
    const courseName = eventOrCourseName.trim();
    if (!courseName) {
      setError(t.aiNeedEvent);
      return;
    }

    const org = organizations.find((o) => o.slug === orgSlug);
    const isEvent = tab === 'event_participation';

    try {
      setGeneratingDescription(true);
      setError(null);

      const customPrompt = isEvent
        ? locale === 'en'
          ? `This is an EVENT PARTICIPATION certificate (not a full course). Write a complete professional description in 2-3 sentences (about 180-350 characters). Mention that the recipient participated in "${courseName}" organized by ${org?.name || 'MyUNI'}. End with a period. Do not truncate.`
          : `Bu bir ETKİNLİK KATILIM sertifikası (tam kurs değil). 2-3 tam cümlelik, resmi ve profesyonel bir açıklama yaz (yaklaşık 180-350 karakter). Katılımcının ${org?.name || 'MyUNI'} tarafından düzenlenen "${courseName}" etkinliğine katıldığını belirt. Cümleleri yarıda kesme; nokta ile bitir.`
        : locale === 'en'
          ? `Write a complete professional course-completion description in 2-3 sentences (about 200-350 characters). Mention successful completion of "${courseName}". Do not truncate.`
          : `2-3 tam cümlelik resmi kurs tamamlama açıklaması yaz (yaklaşık 200-350 karakter). "${courseName}" programını başarıyla tamamladığını belirt. Cümleyi yarıda kesme.`;

      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateDescription',
          data: {
            courseName,
            organization: org?.name || 'MyUNI',
            customPrompt,
            language: locale === 'en' ? 'en' : 'tr',
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI failed');
      }

      const text = String(data.response || '')
        .replace(/^["'«“]|["'»”]$/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!text) {
        throw new Error(locale === 'tr' ? 'AI boş yanıt döndü' : 'AI returned empty text');
      }

      setCertificateDescription(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI failed');
    } finally {
      setGeneratingDescription(false);
    }
  };

  const issue = async () => {
    if (!selected.size || !templateId || !orgSlug) {
      setError(t.needSelection);
      return;
    }
    const org = organizations.find((o) => o.slug === orgSlug);
    try {
      setIssuing(true);
      setError(null);
      setMessage(null);
      const res = await fetch('/api/certificates/issuance/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueIds: [...selected],
          templateId,
          organizationSlug: orgSlug,
          organizationName: org?.name,
          organizationAbbreviation: org?.abbreviation,
          customMessage,
          description: certificateDescription.trim() || undefined,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Issue failed');
      setMessage(t.success(data.issued || 0, data.emailed || 0));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Issue failed');
    } finally {
      setIssuing(false);
    }
  };

  const eventDateLabel = latestEvent
    ? new Date(
        latestEvent.end_date || latestEvent.start_date
      ).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            {t.title}
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400 max-w-3xl">
            {t.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t.refresh}
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-neutral-200 dark:border-neutral-700">
        {(
          [
            ['event_participation', t.tabEvent, Award],
            ['course_achievement', t.tabCourse, GraduationCap],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === key
                ? 'border-[#990000] text-[#990000]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'event_participation' && latestEvent && (
        <div className="mb-4 rounded-xl border border-[#990000]/25 bg-[#990000]/5 dark:bg-[#990000]/10 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[#990000]/80 font-medium">
            {t.latestEvent}
          </p>
          <p className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
            {latestEvent.title}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {eventDateLabel}
            {items.length > 0 ? ` · ${items.length} ${t.paidCount}` : ''}
          </p>
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4">
        <label className="text-sm">
          <span className="block text-neutral-500 mb-1">{t.organization}</span>
          <select
            value={orgSlug}
            onChange={(e) => setOrgSlug(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.slug}>
                {org.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-neutral-500 mb-1">{t.template}</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(Number(e.target.value))}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2"
          >
            {filteredTemplates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-2">
          <button
            type="button"
            onClick={selectAll}
            className="px-3 py-2 text-sm border rounded-lg border-neutral-300 dark:border-neutral-600"
          >
            {t.selectAll}
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="px-3 py-2 text-sm border rounded-lg border-neutral-300 dark:border-neutral-600"
          >
            {t.clear}
          </button>
          <button
            type="button"
            onClick={issue}
            disabled={issuing || selected.size === 0}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-[#990000] text-white rounded-lg text-sm disabled:opacity-50"
          >
            {issuing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {issuing ? t.issuing : `${t.issue} (${selected.size})`}
          </button>
        </div>
        <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-neutral-500">{t.certDescription}</span>
            <button
              type="button"
              onClick={generateDescriptionWithAi}
              disabled={generatingDescription || !eventOrCourseName.trim()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#990000]/30 text-[#990000] hover:bg-[#990000]/10 disabled:opacity-50"
            >
              {generatingDescription ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {generatingDescription ? t.aiGenerating : t.aiGenerate}
            </button>
          </div>
          <textarea
            value={certificateDescription}
            onChange={(e) => setCertificateDescription(e.target.value)}
            rows={4}
            placeholder={t.certDescriptionPlaceholder}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-sm resize-y min-h-[96px]"
          />
          <span className="block text-xs text-neutral-500">
            {t.certDescriptionHint}
          </span>
        </div>
        <label className="text-sm sm:col-span-2 lg:col-span-4">
          <span className="block text-neutral-500 mb-1">{t.emailBody}</span>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            rows={3}
            placeholder={t.emailBodyPlaceholder}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-sm resize-y min-h-[80px]"
          />
          <span className="mt-1 block text-xs text-neutral-500">{t.emailBodyHint}</span>
        </label>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm">
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="w-10 px-3 py-3" />
                <th className="text-left px-4 py-3 font-medium">{t.name}</th>
                <th className="text-left px-4 py-3 font-medium">{t.email}</th>
                <th className="text-left px-4 py-3 font-medium">{t.source}</th>
                <th className="text-left px-4 py-3 font-medium">{t.eligible}</th>
                <th className="text-left px-4 py-3 font-medium">{t.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                    {t.loading}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                    {t.empty}
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const checked = selected.has(item.id);
                  const sourceLabel =
                    item.kind === 'event_participation'
                      ? item.event_name || '—'
                      : item.course_name || '—';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 cursor-pointer"
                      onClick={() => toggle(item.id)}
                    >
                      <td className="px-3 py-3 text-neutral-500">
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-[#990000]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                        {item.recipient_name}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                        {item.recipient_email}
                      </td>
                      <td className="px-4 py-3">{sourceLabel}</td>
                      <td className="px-4 py-3 text-neutral-500">
                        {new Date(item.eligible_at).toLocaleDateString(
                          locale === 'tr' ? 'tr-TR' : 'en-US'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-700">
                          {t.statusLabels[item.status] || item.status}
                        </span>
                        {item.error && (
                          <div className="text-xs text-red-500 mt-1 max-w-xs truncate">
                            {item.error}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
