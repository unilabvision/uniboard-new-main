'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useUserModules } from '../../../../hooks/useUserModules';
import {
  getAbsoluteSiteApplicationPublicPath,
  getAbsoluteEventApplicationPath,
} from '@/app/lib/siteApplications/config';
import {
  buildEventFormSlugs,
  getDefaultFieldsForFormType,
  getAbsoluteTeamFormPublicPath,
  inferFormType,
  type SiteApplicationFormType,
} from '@/app/lib/siteApplications/formTypes';
import { normalizeFieldOptions } from '@/app/lib/siteApplications/forms';
import FormFieldEditor from '@/app/components/site-applications/FormFieldEditor';
import FormPreviewPanel from '@/app/components/site-applications/FormPreviewPanel';
import EventPackageSettingsPanel from '@/app/components/site-applications/EventPackageSettingsPanel';
import {
  normalizePackageSettings,
  parsePackageSettingsFromForm,
  type EventCertificatePackageSettings,
} from '@/app/lib/siteApplications/packages';
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
    saveFields: 'Kaydet ve yayınla',
    saved: 'Kaydedildi',
    savedAll: 'Ayarlar ve sorular kaydedildi',
    preview: 'Canlı önizleme',
    openForm: 'Formu aç',
    active: 'Yayında (başvuru alınsın)',
    showOnWebsite: 'Menüde göster',
    allowsAttachment: 'Ek dosya izni',
    teamFileLimit: 'Ekip formu dosya limiti: en fazla 10 MB (depolama).',
    teamBadge: 'UNILAB Ekip Başvurusu',
    eventBadge: 'Etkinlik Başvuru Formu',
    teamMenuHint: 'Ekip başvuruları → Site Başvuruları (Ekip) modülünde listelenir.',
    eventMenuHint: 'Etkinlik formları → Etkinlik Yönetimi → Formlar. Kayıtlar Dashboard’da izlenir.',
    pageAddress: 'Başvuru sayfası (canlı site)',
    connectionTitle: 'Site bağlantısı',
    connectionOk:
      'Bağlı: yayın ayarları kaydedildi. Ekip formları slug ile, etkinlik formları etkinlik slug’ı (/etkinlik/{slug}/basvuru) ile sitede açılır.',
    connectionNeedPublish:
      'Form henüz yayında değil — veya etkinlik formu için etkinlik seçilmedi. Sitede görünmez.',
    connectionVerifyOk: 'DB + site API senkron',
    connectionVerifyFail: 'Site API formu bulamadı. Yayında mı, etkinliğe bağlı mı ve en az bir soru kaydedildi mi kontrol edin.',
    syncMismatch:
      'Dikkat: sitedeki /basvuru başka bir form ID’sine bağlı. Bu paneli kaydetmek o formu güncellemez — aşağıdaki form ID ile SQL’deki kaydı karşılaştırın.',
    syncDbOk: 'Sorular veritabanına yazıldı',
    formIdLabel: 'Form ID (SQL ile aynı olmalı)',
    openLive: 'Canlı sitede aç',
    sitePreviewHint:
      'Soldaki “Site Önizleme” etkinlik listesini açar. Form değişiklikleri için bu sayfadaki başvuru linkini kullanın (.../basvuru).',
    questionHint:
      'Soru metnini üstteki TR/EN satırlarına yazın. Ortadaki kesik çizgili kutu yalnızca önizlemedir — oraya yazılamaz.',
    eventsLoadError: 'Etkinlik listesi yüklenemedi',
    linkedEvent: 'Bağlı etkinlik',
    noEvent: 'Etkinlik seçilmedi',
    eventRequired: 'Sitede görünmesi için önce bir etkinlik seçip kaydedin.',
    eventInactive:
      'Bağlı etkinlik yayında değil. Sitede form açılmaz — önce etkinliği aktif edin.',
    titleTr: 'Form başlığı (TR)',
    titleEn: 'Form başlığı (EN)',
    subtitleTr: 'Açıklama (TR)',
    subtitleEn: 'Açıklama (EN)',
    successTr: 'Başarı mesajı (TR)',
    successEn: 'Başarı mesajı (EN)',
    defaultFields: 'Varsayılan soruları yükle',
    inactiveHint:
      'Formu yayına almak için "Yayında" işaretleyin, etkinlik seçin ve "Kaydet ve yayınla"ya basın. Yalnızca soruları kaydetmek sitede yayınlamaz.',
  },
  en: {
    back: 'Back to Forms',
    forbidden: 'Only super admins can access this page.',
    loading: 'Loading...',
    settings: 'Form title & settings',
    fields: 'Questions',
    saveSettings: 'Save Settings',
    saveFields: 'Save & publish',
    saved: 'Saved',
    savedAll: 'Settings and questions saved',
    preview: 'Live preview',
    openForm: 'Open form',
    active: 'Published (accept submissions)',
    showOnWebsite: 'Show in menu',
    allowsAttachment: 'Allow attachments',
    teamFileLimit: 'Team form file limit: max 10 MB (storage).',
    teamBadge: 'UNILAB Team Application',
    eventBadge: 'Event Application Form',
    teamMenuHint: 'Team applications are listed under Team Applications.',
    eventMenuHint: 'Event forms live under Event Management → Forms. Registrations appear on the Events Dashboard.',
    pageAddress: 'Application page (live site)',
    connectionTitle: 'Site connection',
    connectionOk:
      'Connected: publish settings saved. Team forms open by slug; event forms open at /event/{slug}/basvuru.',
    connectionNeedPublish:
      'Form is not published — or event form has no linked event. It will not appear on the site.',
    connectionVerifyOk: 'DB + site API in sync',
    connectionVerifyFail:
      'Site API could not find this form. Check Published + linked event + at least one saved question.',
    syncMismatch:
      'Warning: the live /basvuru URL is bound to a different form ID. Saving this panel will not update that form — compare Form ID with SQL.',
    syncDbOk: 'Questions written to database',
    formIdLabel: 'Form ID (must match SQL)',
    openLive: 'Open on live site',
    sitePreviewHint:
      '“Site Preview” opens the event list. Use the /basvuru application link on this page to see form changes.',
    questionHint:
      'Type the question in the TR/EN rows above. The dashed box is answer preview only — it is not editable.',
    eventsLoadError: 'Could not load events list',
    linkedEvent: 'Linked event',
    noEvent: 'No event selected',
    eventRequired: 'Select and save a linked event before it appears on the site.',
    eventInactive:
      'The linked event is inactive. The public form will not open until the event is activated.',
    titleTr: 'Form title (TR)',
    titleEn: 'Form title (EN)',
    subtitleTr: 'Description (TR)',
    subtitleEn: 'Description (EN)',
    successTr: 'Success message (TR)',
    successEn: 'Success message (EN)',
    defaultFields: 'Load default questions',
    inactiveHint:
      'To publish: check "Published", link an event, then click "Save & publish". Saving questions alone does not publish to the site.',
  },
};

export default function EditSiteApplicationFormPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const router = useRouter();
  const pathname = usePathname() || '';
  const isEventsHub = pathname.includes('/events/forms');
  const formsBase = isEventsHub
    ? `/${locale}/events/forms`
    : `/${locale}/site-applications/forms`;
  const { isSuperAdmin, loading: modulesLoading } = useUserModules();
  const t = texts[locale as keyof typeof texts] || texts.tr;

  const [form, setForm] = useState<SiteApplicationForm | null>(null);
  const [fields, setFields] = useState<SiteApplicationFormFieldInput[]>([]);
  const [events, setEvents] = useState<
    Array<{ id: string; slug: string; title: string; is_active?: boolean }>
  >([]);
  const [linkedEvent, setLinkedEvent] = useState<{
    id: string;
    slug: string;
    title: string;
    is_active?: boolean;
  } | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [packageSettings, setPackageSettings] = useState<EventCertificatePackageSettings>(
    normalizePackageSettings(null)
  );

  useEffect(() => {
    const load = async () => {
      try {
        const formRes = await fetch(`/api/site-applications/forms/${id}`);
        if (formRes.ok) {
          const data = await formRes.json();
          const loaded = data.form;
          const type = loaded.form_type ?? inferFormType(loaded);

          // Event forms belong only under Event Management — keep Site Applications team-only
          if (!isEventsHub && type === 'event') {
            router.replace(`/${locale}/events/forms/${id}`);
            return;
          }
          if (isEventsHub && type === 'team') {
            router.replace(`/${locale}/site-applications/forms/${id}`);
            return;
          }

          setForm(loaded);
          setPackageSettings(parsePackageSettingsFromForm(loaded));
          setLinkedEvent(loaded.linked_event ?? null);
          setFields(
            (loaded.fields as SiteApplicationFormField[] | undefined)?.map((f, i) => ({
              client_id: f.id || `loaded_${i}_${f.field_key}`,
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
  }, [id, t.eventsLoadError, isEventsHub, locale, router]);

  const showMessage = (text: string, isError = false) => {
    setMessageIsError(isError);
    setMessage(text || null);
  };

  const persistSettings = async (
    overrides?: Partial<SiteApplicationForm>
  ): Promise<{ ok: boolean; warning?: string; error?: string }> => {
    if (!form) return { ok: false, error: 'Form not found' };

    const next = { ...form, ...overrides };
    const nextPackages =
      overrides && 'package_settings' in overrides && overrides.package_settings
        ? normalizePackageSettings(overrides.package_settings)
        : packageSettings;
    const formType: SiteApplicationFormType = next.form_type ?? inferFormType(next);
    if (formType === 'event' && next.is_active && !next.event_id) {
      return { ok: false, error: t.eventRequired };
    }
    if (
      formType === 'event' &&
      next.is_active &&
      next.event_id &&
      linkedEvent?.id === next.event_id &&
      linkedEvent.is_active === false &&
      !overrides?.event_id
    ) {
      return { ok: false, error: t.eventInactive };
    }

    // Align with myunilab.net: event forms must be show_on_website when published
    const showOnWebsite =
      formType === 'event' && next.is_active ? true : next.show_on_website;

    const res = await fetch(`/api/site-applications/forms/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug_tr: next.slug_tr,
        slug_en: next.slug_en,
        title_tr: next.title_tr,
        title_en: next.title_en,
        subtitle_tr: next.subtitle_tr,
        subtitle_en: next.subtitle_en,
        success_message_tr: next.success_message_tr,
        success_message_en: next.success_message_en,
        is_active: next.is_active,
        show_on_website: showOnWebsite,
        allows_attachment: next.allows_attachment,
        event_id: next.event_id,
        form_type: formType,
        package_settings: nextPackages,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || 'Error' };
    }
    if (data.form) {
      setForm((prev) => (prev ? { ...prev, ...data.form } : data.form));
      if (data.form.package_settings) {
        setPackageSettings(parsePackageSettingsFromForm(data.form));
      }
    }
    return { ok: true, warning: data.warning };
  };

  const saveSettings = async () => {
    if (!form) return;
    setSavingSettings(true);
    showMessage('');
    try {
      const result = await persistSettings();
      if (!result.ok) {
        showMessage(result.error || 'Error', true);
        return;
      }
      showMessage(result.warning || t.saved, Boolean(result.warning));
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Error', true);
    } finally {
      setSavingSettings(false);
    }
  };

  const saveFields = async () => {
    setSavingFields(true);
    showMessage('');
    try {
      // Publish + event link live in settings — persist them with questions
      // so "Kaydet ve yayınla" actually reaches the public site.
      const settingsResult = await persistSettings();
      if (!settingsResult.ok) {
        showMessage(settingsResult.error || 'Error', true);
        return;
      }

      const normalized = fields.map((field, index) => {
        const labelTr = field.label_tr?.trim() || '';
        const labelEn = field.label_en?.trim() || labelTr;
        const payload = {
          ...field,
          label_tr: labelTr,
          label_en: labelEn,
          order_index: index,
        };
        delete (payload as { client_id?: string }).client_id;
        return payload;
      });

      const missingLabel = normalized.find((f) => !f.label_tr);
      if (missingLabel) {
        throw new Error(
          locale === 'en'
            ? 'Every question needs TR text before publish.'
            : 'Yayınlamadan önce her sorunun TR metni dolu olmalı.'
        );
      }

      const res = await fetch(`/api/site-applications/forms/${id}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: normalized }),
      });
      const saved = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(saved.error || 'Save failed');
      }
      if (!saved.synced || !Array.isArray(saved.fields)) {
        throw new Error(
          locale === 'en'
            ? 'Database did not confirm the write.'
            : 'Veritabanı yazmayı onaylamadı.'
        );
      }

      setFields(
        saved.fields.map(
          (
            f: SiteApplicationFormField & { client_id?: string },
            i: number
          ) => ({
            client_id: f.id || fields[i]?.client_id || `saved_${i}_${f.field_key}`,
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
          })
        )
      );

      // Round-trip: reload from DB so panel state == SQL
      const reload = await fetch(`/api/site-applications/forms/${id}`, {
        cache: 'no-store',
      });
      if (reload.ok) {
        const reloadData = await reload.json();
        if (reloadData.form) {
          setForm((prev) => (prev ? { ...prev, ...reloadData.form } : reloadData.form));
          if (Array.isArray(reloadData.form.fields)) {
            setFields(
              reloadData.form.fields.map(
                (f: SiteApplicationFormField, i: number) => ({
                  client_id: f.id || `reloaded_${i}_${f.field_key}`,
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
                })
              )
            );
          }
        }
      }

      const eventIdForVerify = form?.event_id ?? null;
      const verify = await verifyPublicFormLive({
        formId: id,
        eventSlug:
          events.find((e) => e.id === eventIdForVerify)?.slug ||
          linkedEvent?.slug ||
          undefined,
      });
      if (verify.ok) {
        const pkgInfo =
          typeof verify.packages === 'number' && verify.packages > 0
            ? `, ${verify.packages} paket`
            : '';
        showMessage(
          settingsResult.warning ||
            `${t.syncDbOk} (${saved.field_count} soru) — ${t.connectionVerifyOk}: ${verify.count} soru${pkgInfo}`,
          Boolean(settingsResult.warning)
        );
      } else if (verify.detail?.includes('başka forma')) {
        showMessage(`${t.syncDbOk} — ${t.syncMismatch} (${verify.detail})`, true);
      } else {
        showMessage(
          `${t.syncDbOk} — ${t.connectionVerifyFail}${verify.detail ? ` (${verify.detail})` : ''}`,
          true
        );
      }
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Error', true);
    } finally {
      setSavingFields(false);
    }
  };

  const verifyPublicFormLive = async (opts?: {
    eventSlug?: string;
    formId?: string;
  }): Promise<{
    ok: boolean;
    count: number;
    packages?: number;
    detail?: string;
  }> => {
    if (!form) return { ok: false, count: 0 };
    const formTypeNow: SiteApplicationFormType = form.form_type ?? inferFormType(form);
    const eventSlug =
      opts?.eventSlug ||
      events.find((e) => e.id === form.event_id)?.slug ||
      linkedEvent?.slug ||
      '';
    const formSlug = locale === 'en' ? form.slug_en : form.slug_tr;

    const url =
      formTypeNow === 'event' && eventSlug
        ? `/api/site-applications/public/forms/by-event/${encodeURIComponent(eventSlug)}?locale=${locale}`
        : `/api/site-applications/public/forms/${encodeURIComponent(formSlug)}?locale=${locale}`;

    try {
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, count: 0, detail: data.error || String(res.status) };
      }
      const count = Array.isArray(data.form?.fields) ? data.form.fields.length : 0;
      const packages = Array.isArray(data.form?.packages) ? data.form.packages.length : 0;
      if (opts?.formId && data.form?.id && data.form.id !== opts.formId) {
        return {
          ok: false,
          count,
          packages,
          detail: `slug başka forma bağlı (${data.form.id})`,
        };
      }
      return {
        ok: count > 0,
        count,
        packages,
        detail: count === 0 ? 'fields empty' : undefined,
      };
    } catch (err) {
      return {
        ok: false,
        count: 0,
        detail: err instanceof Error ? err.message : 'fetch failed',
      };
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

  if (!form) {
    return <div className="p-8">Form not found</div>;
  }

  const formType: SiteApplicationFormType = form.form_type ?? inferFormType(form);
  const isTeam = formType === 'team';

  if (!isSuperAdmin && !(isEventsHub && !isTeam)) {
    return <div className="p-8 text-red-600">{t.forbidden}</div>;
  }

  const previewSlug = locale === 'en' ? form.slug_en : form.slug_tr;
  const eventFromList = events.find((e) => e.id === form.event_id);
  const resolvedLinkedEvent = eventFromList || linkedEvent;
  const liveHref = isTeam
    ? getAbsoluteTeamFormPublicPath(locale, previewSlug)
    : resolvedLinkedEvent
      ? getAbsoluteEventApplicationPath(locale, resolvedLinkedEvent.slug)
      : getAbsoluteSiteApplicationPublicPath(locale, previewSlug);
  const linkedEventInactive =
    Boolean(form.event_id) &&
    resolvedLinkedEvent != null &&
    resolvedLinkedEvent.is_active === false;
  const isConnectedToSite =
    form.is_active &&
    !linkedEventInactive &&
    (isTeam || Boolean(resolvedLinkedEvent));
  const defaultFieldsTemplate = getDefaultFieldsForFormType(formType);
  const displayTitle = locale === 'en' ? form.title_en : form.title_tr;
  const displaySubtitle = locale === 'en' ? form.subtitle_en : form.subtitle_tr;

  const handleEventChange = async (eventId: string) => {
    if (!form) return;
    const selected = events.find((ev) => ev.id === eventId);
    const patch: Partial<SiteApplicationForm> = { event_id: eventId || null };
    if (selected) {
      const slugs = buildEventFormSlugs(selected.slug);
      patch.slug_tr = slugs.slug_tr;
      patch.slug_en = slugs.slug_en;
      if (!form.title_tr) patch.title_tr = `${selected.title} Başvurusu`;
      if (!form.title_en) patch.title_en = `${selected.title} Application`;
      setLinkedEvent({ ...selected, is_active: selected.is_active ?? true });
    } else {
      setLinkedEvent(null);
    }
    setForm({ ...form, ...patch });

    // Persist immediately so /etkinlik/{slug}/basvuru binds to this form (packages included).
    setSavingSettings(true);
    showMessage('');
    try {
      const result = await persistSettings({
        event_id: patch.event_id ?? null,
        slug_tr: patch.slug_tr,
        slug_en: patch.slug_en,
        title_tr: patch.title_tr,
        title_en: patch.title_en,
      });
      if (!result.ok) {
        showMessage(result.error || 'Error', true);
        return;
      }
      if (selected?.slug) {
        const verify = await verifyPublicFormLive({
          eventSlug: selected.slug,
          formId: id,
        });
        if (verify.ok) {
          showMessage(
            result.warning ||
              `${t.saved} — ${selected.slug} slug’ına bağlandı (${verify.count} soru${
                verify.packages ? `, ${verify.packages} paket` : ''
              })`,
            Boolean(result.warning)
          );
        } else {
          showMessage(
            `${t.saved} — slug doğrulanamadı: ${verify.detail || t.connectionVerifyFail}. Yayında işaretleyip tekrar kaydedin.`,
            true
          );
        }
      } else {
        showMessage(result.warning || t.saved, Boolean(result.warning));
      }
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Error', true);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`${formsBase}?tab=${isTeam ? 'team' : 'event'}`}
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-[#990000]"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>
        {form.is_active &&
          (isTeam || (resolvedLinkedEvent && !linkedEventInactive)) && (
          <a
            href={liveHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[#990000]"
          >
            <ExternalLink className="w-4 h-4" />
            {t.openLive}
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
        <p className="mt-2 text-xs text-neutral-500">
          {t.formIdLabel}:{' '}
          <code className="font-mono text-neutral-800 dark:text-neutral-200 break-all">
            {form.id}
          </code>
        </p>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          isConnectedToSite
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100 dark:border-emerald-800'
            : 'border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100'
        }`}
      >
        <p className="font-medium">{t.connectionTitle}</p>
        <p className="mt-1">{isConnectedToSite ? t.connectionOk : t.connectionNeedPublish}</p>
        <p className="mt-2 text-xs opacity-90">{t.sitePreviewHint}</p>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-2 text-sm border ${
            messageIsError
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          {message}
        </div>
      )}

      {(!form.is_active || (!isTeam && !form.event_id) || linkedEventInactive) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {linkedEventInactive
            ? t.eventInactive
            : !isTeam && !form.event_id
              ? t.eventRequired
              : t.inactiveHint}
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
              {resolvedLinkedEvent && (
                <p className="text-xs text-neutral-500 mt-2">
                  {locale === 'en' ? 'Public slug' : 'Site slug'}:{' '}
                  <span className="font-mono text-neutral-800 dark:text-neutral-200">
                    {resolvedLinkedEvent.slug}
                  </span>
                  {' → '}
                  <span className="font-mono">
                    /{locale === 'en' ? 'en/event' : 'tr/etkinlik'}/
                    {resolvedLinkedEvent.slug}/basvuru
                  </span>
                  . {locale === 'en'
                    ? 'Packages + questions on this form are served at that URL after publish.'
                    : 'Paketler + sorular yayından sonra bu adreste sunulur. Etkinlik seçimi otomatik kaydedilir.'}
                </p>
              )}
            </div>
          )}
          <div className="sm:col-span-2 space-y-2">
            <label className="text-sm font-medium block">{t.pageAddress}</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 rounded-xl border bg-neutral-50 dark:bg-neutral-900/40 px-3 py-2.5 text-sm font-mono break-all">
                {liveHref}
              </div>
              <a
                href={liveHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl border text-sm text-[#990000] shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                {t.openLive}
              </a>
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
          {isTeam && (
            <p className="text-xs text-amber-700 dark:text-amber-300 sm:col-span-2">
              {t.teamFileLimit}
            </p>
          )}
        </div>
        {!isTeam && (
          <EventPackageSettingsPanel
            locale={locale}
            settings={packageSettings}
            onChange={setPackageSettings}
          />
        )}
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
            <span className="text-xs text-neutral-500">
              {fields.length} {locale === 'en' ? 'questions' : 'soru'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.questionHint}</p>
          {fields.length === 0 && (
            <button
              type="button"
              onClick={() => setFields(defaultFieldsTemplate)}
              className="text-sm px-3 py-1.5 border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800"
            >
              {t.defaultFields}
            </button>
          )}
          <FormFieldEditor
            locale={locale}
            fields={fields}
            setFields={setFields}
            formType={formType === 'event' ? 'event' : 'team'}
          />
          <button
            onClick={saveFields}
            disabled={savingFields || savingSettings || fields.length === 0}
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
            packages={!isTeam ? packageSettings : undefined}
            formType={isTeam ? 'team' : 'event'}
            allowsAttachment={form.allows_attachment}
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
