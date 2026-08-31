'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useUserModules } from '../../../hooks/useUserModules';
import type { Opportunity } from '@/app/types/internship';
import {
  getAbsoluteOpportunityListingPath,
  getAbsoluteSiteApplicationPublicPath,
} from '@/app/lib/siteApplications/config';
import { formatWorkMode } from '@/app/lib/internship/displayLabels';
import {
  Briefcase,
  ExternalLink,
  FormInput,
  Info,
  Loader2,
  Plus,
  Settings,
} from 'lucide-react';

type OpportunityRow = Opportunity & {
  form_slug_tr?: string | null;
  form_slug_en?: string | null;
  site_form_id?: string | null;
};

type UnlinkedForm = {
  id: string;
  title_tr: string | null;
  title_en: string | null;
  slug_tr: string | null;
  slug_en: string | null;
  is_active: boolean | null;
  show_on_website: boolean | null;
};

const texts = {
  tr: {
    title: 'Staj / Fırsat İlanları',
    subtitle: 'Sitede görünen ilan sayfasını buradan yönetin. Başvuru soruları ayrı formda.',
    howTitle: 'Kısaca',
    how1: 'İlan: sitedeki tanıtım sayfası (banner, metin, kurum).',
    how2: 'Form: başvurunun doldurulduğu sayfa.',
    how3: 'Banner yüklemek için önce ilanı oluşturun, sonra Düzenle’ye girin.',
    new: 'Yeni ilan',
    loading: 'Yükleniyor...',
    empty: 'Henüz ilan yok.',
    emptyHint: 'Aşağıdaki formu ilana çevirin veya “Yeni ilan” deyin.',
    forbidden: 'Bu sayfaya erişiminiz yok.',
    active: 'Yayında',
    inactive: 'Taslak',
    featured: 'Öne çıkan',
    edit: 'Düzenle',
    listing: 'Sitede gör',
    apply: 'Başvuru formu',
    listingsTitle: 'İlanlarınız',
    unlinkedTitle: 'Hazır form — henüz ilan yok',
    unlinkedHint:
      'Bu form sitede var ama ilan sayfasına bağlı değil. Aşağıdan bağlayın; sonra banner buradan yüklenir.',
    createFromForm: 'İlan yap',
    creating: 'Oluşturuluyor...',
    linkExisting: 'Sitedeki ilanı bağla',
    linkSlugLabel: 'Sitedeki adresin sonu',
    linkSlugHint: 'Örnek: gonullu-ekip-basvurusu  (adres: …/stajlar/gonullu-ekip-basvurusu)',
    linkSlugPlaceholder: 'gonullu-ekip-basvurusu',
    linkSubmit: 'Bağla',
    linking: 'Bağlanıyor...',
    linkNotFound: 'Adresin sonunu yazın. Örnek: gonullu-ekip-basvurusu',
    linkHintCreate: 'Kayıt yoksa aynı isimle ilan oluşturulur ve forma bağlanır.',
    type: {
      staj: 'Staj',
      gonullu: 'Gönüllü',
      is: 'İş',
    } as Record<string, string>,
  },
  en: {
    title: 'Internship / Opportunity listings',
    subtitle: 'Manage the public listing page here. Application questions live on the form.',
    howTitle: 'In short',
    how1: 'Listing: the public page (banner, text, company).',
    how2: 'Form: where people apply.',
    how3: 'To upload a banner: create/link a listing, then open Edit.',
    new: 'New listing',
    loading: 'Loading...',
    empty: 'No listings yet.',
    emptyHint: 'Turn a form into a listing below, or create a new one.',
    forbidden: 'You do not have access.',
    active: 'Live',
    inactive: 'Draft',
    featured: 'Featured',
    edit: 'Edit',
    listing: 'View on site',
    apply: 'Application form',
    listingsTitle: 'Your listings',
    unlinkedTitle: 'Form ready — no listing yet',
    unlinkedHint:
      'This form exists on the site but is not linked to a listing. Link it below; then upload the banner from Edit.',
    createFromForm: 'Make listing',
    creating: 'Creating...',
    linkExisting: 'Link site listing',
    linkSlugLabel: 'End of the site URL',
    linkSlugHint: 'Example: gonullu-ekip-basvurusu  (full: …/stajlar/gonullu-ekip-basvurusu)',
    linkSlugPlaceholder: 'gonullu-ekip-basvurusu',
    linkSubmit: 'Link',
    linking: 'Linking...',
    linkNotFound: 'Enter the URL ending. Example: gonullu-ekip-basvurusu',
    linkHintCreate: 'If missing in the database, a listing is created and linked to the form.',
    type: {
      staj: 'Internship',
      gonullu: 'Volunteer',
      is: 'Job',
    } as Record<string, string>,
  },
};

function titleOf(opp: Opportunity, locale: string): string {
  const t = opp.title || {};
  return t[locale] || t.tr || t.en || opp.slug;
}

function formTitle(f: UnlinkedForm, locale: string): string {
  return (locale === 'en' ? f.title_en || f.title_tr : f.title_tr || f.title_en) || f.slug_tr || '—';
}

export default function OpportunitiesListPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const base = `/${locale}/site-applications/opportunities`;

  const { isSuperAdmin, memberships, loading: modulesLoading } = useUserModules();
  const canManage =
    isSuperAdmin ||
    memberships.some(
      (m) =>
        m.moduleKey === 'site-applications' &&
        (m.capabilities == null || m.capabilities.includes('forms'))
    );

  const [items, setItems] = useState<OpportunityRow[]>([]);
  const [unlinkedForms, setUnlinkedForms] = useState<UnlinkedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyFormId, setBusyFormId] = useState<string | null>(null);
  const [linkSlugByForm, setLinkSlugByForm] = useState<Record<string, string>>({});
  const [linkOpenFor, setLinkOpenFor] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/site-applications/opportunities');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Liste yüklenemedi');
        setItems([]);
        setUnlinkedForms([]);
        return;
      }
      setItems(data.opportunities || []);
      setUnlinkedForms(data.unlinkedForms || []);
    } catch {
      setError('Liste yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createFromForm = async (form: UnlinkedForm) => {
    setBusyFormId(form.id);
    setError(null);
    try {
      const slug = form.slug_tr || form.slug_en || '';
      const res = await fetch('/api/site-applications/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existing_form_id: form.id,
          title_tr: form.title_tr || slug,
          title_en: form.title_en || form.title_tr || slug,
          slug,
          opportunity_type: 'gonullu',
          work_mode: 'hybrid',
          is_active: Boolean(form.is_active),
          company_name: '',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409 && data.existing_opportunity_id) {
          setLinkOpenFor(form.id);
          setLinkSlugByForm((prev) => ({ ...prev, [form.id]: slug }));
          setError(data.error);
          return;
        }
        setError(data.error || 'İlan oluşturulamadı');
        return;
      }
      router.push(`${base}/${data.opportunity.id}`);
    } catch {
      setError('İlan oluşturulamadı');
    } finally {
      setBusyFormId(null);
    }
  };

  const linkExisting = async (form: UnlinkedForm) => {
    const slug = (linkSlugByForm[form.id] || '').trim();
    if (!slug) {
      setError(t.linkNotFound);
      return;
    }
    setBusyFormId(form.id);
    setError(null);
    try {
      const res = await fetch('/api/site-applications/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link_opportunity_slug: slug,
          existing_form_id: form.id,
          opportunity_type: 'gonullu',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Bağlama başarısız');
        return;
      }
      router.push(`${base}/${data.opportunity.id}`);
    } catch {
      setError('Bağlama başarısız');
    } finally {
      setBusyFormId(null);
    }
  };

  if (modulesLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-neutral-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        {t.loading}
      </div>
    );
  }

  if (!canManage) {
    return <div className="p-8 text-neutral-600">{t.forbidden}</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t.title}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">{t.subtitle}</p>
        </div>
        <Link
          href={`${base}/new`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#990000] text-white hover:bg-[#7a0000] text-sm font-medium shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t.new}
        </Link>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4 flex gap-3">
        <Info className="w-5 h-5 text-neutral-500 shrink-0 mt-0.5" />
        <div className="text-sm text-neutral-600 dark:text-neutral-300 space-y-1">
          <p className="font-medium text-neutral-800 dark:text-neutral-100">{t.howTitle}</p>
          <p>{t.how1}</p>
          <p>{t.how2}</p>
          <p>{t.how3}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {unlinkedForms.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t.unlinkedTitle}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">{t.unlinkedHint}</p>
          </div>
          <ul className="space-y-3">
            {unlinkedForms.map((form) => (
              <li
                key={form.id}
                className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FormInput className="w-4 h-4 text-amber-700" />
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {formTitle(form, locale)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">
                      Başvuru: /{locale}/basvuru/{form.slug_tr || form.slug_en}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyFormId === form.id}
                      onClick={() => void createFromForm(form)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white disabled:opacity-60"
                    >
                      {busyFormId === form.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      {busyFormId === form.id ? t.creating : t.createFromForm}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkOpenFor((cur) => (cur === form.id ? null : form.id));
                        setLinkSlugByForm((prev) =>
                          prev[form.id] !== undefined
                            ? prev
                            : { ...prev, [form.id]: 'gonullu-ekip-basvurusu' }
                        );
                      }}
                      className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700"
                    >
                      {t.linkExisting}
                    </button>
                    <Link
                      href={`/${locale}/site-applications/forms/${form.id}`}
                      className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Form
                    </Link>
                  </div>
                </div>
                {linkOpenFor === form.id && (
                  <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row gap-2 sm:items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        {t.linkSlugLabel}
                      </label>
                      <input
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                        placeholder={t.linkSlugPlaceholder}
                        value={linkSlugByForm[form.id] ?? ''}
                        onChange={(e) =>
                          setLinkSlugByForm((prev) => ({
                            ...prev,
                            [form.id]: e.target.value,
                          }))
                        }
                      />
                      <p className="text-xs text-neutral-500 mt-1">{t.linkSlugHint}</p>
                      <p className="text-xs text-neutral-500">{t.linkHintCreate}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busyFormId === form.id}
                      onClick={() => void linkExisting(form)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-[#990000] text-white disabled:opacity-60"
                    >
                      {busyFormId === form.id ? t.linking : t.linkSubmit}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t.listingsTitle}
        </h2>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-10 text-center text-neutral-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-neutral-700 dark:text-neutral-300">{t.empty}</p>
            <p className="text-sm mt-2 max-w-md mx-auto">{t.emptyHint}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((opp) => {
              const listingUrl = getAbsoluteOpportunityListingPath(locale, opp.slug);
              const formSlug =
                (locale === 'en' ? opp.form_slug_en : opp.form_slug_tr) ||
                opp.form_slug_tr ||
                opp.form_slug_en ||
                opp.slug;
              const formUrl = getAbsoluteSiteApplicationPublicPath(locale, formSlug);
              const typeLabel = t.type[opp.opportunity_type || 'staj'] || opp.opportunity_type;
              return (
                <li
                  key={opp.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-4"
                >
                  <div className="min-w-0 flex gap-3">
                    {(opp.thumbnail_url || opp.banner_url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={opp.thumbnail_url || opp.banner_url || ''}
                        alt=""
                        className="hidden sm:block w-20 h-12 rounded-md object-cover shrink-0"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {titleOf(opp, locale)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600">
                          {typeLabel}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            opp.is_active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {opp.is_active ? t.active : t.inactive}
                        </span>
                        {opp.is_featured && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                            {t.featured}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 truncate">
                        {opp.company_name || '—'}
                        {opp.work_mode ? ` · ${formatWorkMode(opp.work_mode, locale)}` : ''}
                        {opp.location ? ` · ${opp.location}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 px-2 py-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t.listing}
                    </a>
                    <a
                      href={formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 px-2 py-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t.apply}
                    </a>
                    <Link
                      href={`${base}/${opp.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      {t.edit}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
