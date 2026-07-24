'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useUserModules } from '../../../../hooks/useUserModules';
import { slugifyFormValue } from '@/app/lib/siteApplications/config';
import {
  buildEventFormSlugs,
  emptyEventFormState,
  emptyTeamFormState,
  getTeamFormPublicPath,
  type SiteApplicationFormType,
} from '@/app/lib/siteApplications/formTypes';
import { getEventApplicationPath } from '@/app/lib/siteApplications/config';
import { ArrowLeft, Loader2, Users, Calendar } from 'lucide-react';

const texts = {
  tr: {
    teamTitle: 'Yeni Ekip Başvuru Formu',
    eventTitle: 'Yeni Etkinlik Başvuru Formu',
    back: 'Formlara Dön',
    forbidden: 'Bu sayfaya yalnızca süper admin erişebilir.',
    teamBadge: 'UNILAB Ekip Başvurusu',
    eventBadge: 'Etkinlik Başvuru Formu',
    titleTr: 'Başlık (TR)',
    titleEn: 'Başlık (EN)',
    subtitleTr: 'Alt başlık (TR)',
    subtitleEn: 'Alt başlık (EN)',
    pageAddress: 'Sayfa adresi',
    pageAddressHint: 'Başlıktan otomatik oluşturulur',
    customizeAddress: 'Adresi düzenle',
    customizeAddressHide: 'Otomatik adrese dön',
    successTr: 'Başarı mesajı (TR)',
    successEn: 'Başarı mesajı (EN)',
    active: 'Formu aktif et',
    showOnWebsite: 'myunilab.net menüsünde göster',
    linkedEvent: 'Bağlı etkinlik',
    linkedEventHint: 'Bu form seçilen etkinliğin başvuru sayfasında açılır',
    selectEvent: 'Etkinlik seçin',
    eventsLoadError: 'Etkinlik listesi yüklenemedi',
    allowsAttachment: 'Ek dosya yükleme izni',
    create: 'Formu Oluştur',
    saving: 'Kaydediliyor...',
    error: 'Form oluşturulamadı',
    eventRequired: 'Lütfen bir etkinlik seçin',
  },
  en: {
    teamTitle: 'New Team Application Form',
    eventTitle: 'New Event Application Form',
    back: 'Back to Forms',
    forbidden: 'Only super admins can access this page.',
    teamBadge: 'UNILAB Team Application',
    eventBadge: 'Event Application Form',
    titleTr: 'Title (TR)',
    titleEn: 'Title (EN)',
    subtitleTr: 'Subtitle (TR)',
    subtitleEn: 'Subtitle (EN)',
    pageAddress: 'Page address',
    pageAddressHint: 'Generated automatically from the title',
    customizeAddress: 'Customize address',
    customizeAddressHide: 'Use automatic address',
    successTr: 'Success message (TR)',
    successEn: 'Success message (EN)',
    active: 'Activate form',
    showOnWebsite: 'Show in myunilab.net menu',
    linkedEvent: 'Linked event',
    linkedEventHint: 'This form opens on the selected event application page',
    selectEvent: 'Select an event',
    eventsLoadError: 'Could not load events list',
    allowsAttachment: 'Allow file attachments',
    create: 'Create Form',
    saving: 'Saving...',
    error: 'Could not create form',
    eventRequired: 'Please select an event',
  },
};

function NewSiteApplicationFormContent({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const isEventsHub = pathname.includes('/events/forms');
  const formsBase = isEventsHub
    ? `/${locale}/events/forms`
    : `/${locale}/site-applications/forms`;
  const formType = (isEventsHub ? 'event' : 'team') as SiteApplicationFormType;
  const { isSuperAdmin, loading: modulesLoading } = useUserModules();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [slugTouchedTr, setSlugTouchedTr] = useState(false);
  const [slugTouchedEn, setSlugTouchedEn] = useState(false);
  const [showCustomSlug, setShowCustomSlug] = useState(false);
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const isTeam = formType === 'team';

  // Site Applications hub is team-only — bounce event creates to Events module
  useEffect(() => {
    if (!isEventsHub && searchParams.get('type') === 'event') {
      router.replace(`/${locale}/events/forms/new?type=event`);
    }
  }, [isEventsHub, searchParams, locale, router]);

  const [form, setForm] = useState(isTeam ? emptyTeamFormState() : emptyEventFormState());

  useEffect(() => {
    if (!isTeam) {
      fetch('/api/site-applications/events')
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'events');
          setEvents(data.events ?? []);
          setEventsError(null);
        })
        .catch(() => {
          setEvents([]);
          setEventsError(t.eventsLoadError);
        });
    }
  }, [isTeam, t.eventsLoadError]);

  useEffect(() => {
    if (!slugTouchedTr && form.title_tr) {
      setForm((prev) => ({ ...prev, slug_tr: slugifyFormValue(form.title_tr) }));
    }
    if (!slugTouchedEn && form.title_en) {
      setForm((prev) => ({ ...prev, slug_en: slugifyFormValue(form.title_en) }));
    }
  }, [form.title_tr, form.title_en, slugTouchedTr, slugTouchedEn]);

  const previewSlug = locale === 'en' ? form.slug_en : form.slug_tr;
  const previewUrl = isTeam
    ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://myunilab.net'}${getTeamFormPublicPath(locale, previewSlug || 'ekip-basvuru')}`
    : form.event_id
      ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://myunilab.net'}${getEventApplicationPath(locale, events.find((e) => e.id === form.event_id)?.slug || '')}`
      : '';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTeam && !form.event_id) {
      setError(t.eventRequired);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/site-applications/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          form_type: formType,
          event_id: isTeam ? null : form.event_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.error);
      router.push(`${formsBase}/${data.form.id}`);
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

  if (!isSuperAdmin && !(isEventsHub && !isTeam)) {
    return (
      <div className="p-8 max-w-lg">
        <p className="text-red-600">{t.forbidden}</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <Link
        href={`${formsBase}${isTeam ? '?tab=team' : '?tab=event'}`}
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-[#990000] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.back}
      </Link>

      <div className="flex items-center gap-2 mb-2">
        {isTeam ? (
          <Users className="w-5 h-5 text-[#990000]" />
        ) : (
          <Calendar className="w-5 h-5 text-[#990000]" />
        )}
        <span className="text-xs font-medium uppercase tracking-wide text-[#990000]">
          {isTeam ? t.teamBadge : t.eventBadge}
        </span>
      </div>
      <h1 className="text-2xl font-bold mb-6">{isTeam ? t.teamTitle : t.eventTitle}</h1>

      <form onSubmit={handleCreate} className="space-y-5">
        {!isTeam && (
          <div>
            <label className="block text-sm font-medium mb-1">{t.linkedEvent}</label>
            <p className="text-xs text-neutral-500 mb-2">{t.linkedEventHint}</p>
            <select
              value={form.event_id}
              onChange={(e) => {
                const eventId = e.target.value;
                const selected = events.find((ev) => ev.id === eventId);
                const slugs = selected ? buildEventFormSlugs(selected.slug) : { slug_tr: '', slug_en: '' };
                setForm((prev) => ({
                  ...prev,
                  event_id: eventId,
                  slug_tr: slugs.slug_tr || prev.slug_tr,
                  slug_en: slugs.slug_en || prev.slug_en,
                  title_tr: prev.title_tr || (selected ? `${selected.title} Başvurusu` : prev.title_tr),
                  title_en: prev.title_en || (selected ? `${selected.title} Application` : prev.title_en),
                }));
              }}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 dark:bg-neutral-800 dark:border-neutral-600"
              required
            >
              <option value="">{t.selectEvent}</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.slug})
                </option>
              ))}
            </select>
            {eventsError && <p className="text-xs text-red-600 mt-1">{eventsError}</p>}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t.titleTr} value={form.title_tr} onChange={(v) => setForm({ ...form, title_tr: v })} required />
          <Field label={t.titleEn} value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} required />
          <Field label={t.subtitleTr} value={form.subtitle_tr} onChange={(v) => setForm({ ...form, subtitle_tr: v })} />
          <Field label={t.subtitleEn} value={form.subtitle_en} onChange={(v) => setForm({ ...form, subtitle_en: v })} />
        </div>

        {isTeam && (
          <div>
            <p className="block text-sm font-medium mb-1">{t.pageAddress}</p>
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/40 px-3 py-2.5">
              <p className="text-sm text-neutral-800 dark:text-neutral-200 break-all font-mono">
                {previewUrl || '—'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t.pageAddressHint}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomSlug((open) => !open)}
              className="mt-2 text-xs text-[#990000] hover:underline"
            >
              {showCustomSlug ? t.customizeAddressHide : t.customizeAddress}
            </button>
            {showCustomSlug && (
              <div className="grid sm:grid-cols-2 gap-4 mt-3">
                <Field
                  label="TR slug"
                  value={form.slug_tr}
                  onChange={(v) => {
                    setSlugTouchedTr(true);
                    setForm({ ...form, slug_tr: slugifyFormValue(v) });
                  }}
                  required
                />
                <Field
                  label="EN slug"
                  value={form.slug_en}
                  onChange={(v) => {
                    setSlugTouchedEn(true);
                    setForm({ ...form, slug_en: slugifyFormValue(v) });
                  }}
                  required
                />
              </div>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
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

export default function NewSiteApplicationFormPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  return (
    <Suspense fallback={<div className="p-8 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /></div>}>
      <NewSiteApplicationFormContent locale={locale} />
    </Suspense>
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
