'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useUserModules } from '../../../../hooks/useUserModules';
import type { Opportunity } from '@/app/types/internship';
import {
  getAbsoluteOpportunityListingPath,
  getAbsoluteSiteApplicationPublicPath,
  slugifyFormValue,
} from '@/app/lib/siteApplications/config';
import { ArrowLeft, ExternalLink, FormInput, Loader2, Trash2 } from 'lucide-react';
import { OpportunityBannerUpload } from '@/app/components/site-applications/OpportunityBannerUpload';

const texts = {
  tr: {
    title: 'İlanı düzenle',
    back: 'Geri',
    forbidden: 'Bu sayfaya erişiminiz yok.',
    loading: 'Yükleniyor...',
    notFound: 'İlan bulunamadı',
    titleTr: 'Başlık (Türkçe)',
    titleEn: 'Başlık (İngilizce)',
    descTr: 'Açıklama (Türkçe)',
    descEn: 'Açıklama (İngilizce)',
    company: 'Kurum adı',
    type: 'Ne tür ilan?',
    typeStaj: 'Staj',
    typeGonullu: 'Gönüllü',
    typeIs: 'İş',
    workMode: 'Çalışma şekli',
    modeRemote: 'Uzaktan',
    modeHybrid: 'Hibrit',
    modeOnsite: 'Ofiste',
    location: 'Şehir / konum',
    deadline: 'Son başvuru günü',
    slug: 'Sitedeki adres (son kısım)',
    publish: 'Sitede yayınla',
    publishHint: 'Açıkken hem ilan hem başvuru formu görünür.',
    featured: 'Öne çıkar',
    save: 'Kaydet',
    saving: 'Kaydediliyor...',
    saved: 'Kaydedildi',
    error: 'Kaydedilemedi',
    liveListing: 'İlan linki',
    liveForm: 'Başvuru linki',
    editForm: 'Başvuru sorularını düzenle',
    delete: 'İlanı sil',
    deleteConfirm: 'İlan silinsin mi? Form pasife alınır.',
    deleting: 'Siliniyor...',
    banner: 'Banner (üst görsel)',
    bannerHint: 'Sitedeki büyük üst görsel. Buradan yükleyin.',
    bannerUpload: 'Görsel seç',
    bannerRemove: 'Kaldır',
    bannerUploading: 'Yükleniyor...',
  },
  en: {
    title: 'Edit listing',
    back: 'Back',
    forbidden: 'You do not have access.',
    loading: 'Loading...',
    notFound: 'Listing not found',
    titleTr: 'Title (Turkish)',
    titleEn: 'Title (English)',
    descTr: 'Description (Turkish)',
    descEn: 'Description (English)',
    company: 'Company name',
    type: 'Listing type',
    typeStaj: 'Internship',
    typeGonullu: 'Volunteer',
    typeIs: 'Job',
    workMode: 'Work style',
    modeRemote: 'Remote',
    modeHybrid: 'Hybrid',
    modeOnsite: 'On-site',
    location: 'Location',
    deadline: 'Application deadline',
    slug: 'URL ending',
    publish: 'Publish on site',
    publishHint: 'When on, both listing and form are visible.',
    featured: 'Featured',
    save: 'Save',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Could not save',
    liveListing: 'Listing link',
    liveForm: 'Apply link',
    editForm: 'Edit application questions',
    delete: 'Delete listing',
    deleteConfirm: 'Delete this listing? The form will be deactivated.',
    deleting: 'Deleting...',
    banner: 'Banner image',
    bannerHint: 'Large image at the top of the listing. Upload here.',
    bannerUpload: 'Choose image',
    bannerRemove: 'Remove',
    bannerUploading: 'Uploading...',
  },
};

function workModeValue(raw: string | null | undefined): string {
  const v = (raw || '').toLowerCase();
  if (v.includes('uzak') || v === 'remote') return 'remote';
  if (v.includes('hibrit') || v === 'hybrid') return 'hybrid';
  if (v.includes('yerinde') || v.includes('onsite') || v.includes('on-site') || v === 'office') {
    return 'onsite';
  }
  return 'hybrid';
}

function deadlineInput(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.slice(0, 10);
}

export default function EditOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'tr';
  const id = params?.id as string;
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const base = `/${locale}/site-applications/opportunities`;
  const formsBase = `/${locale}/site-applications/forms`;

  const { isSuperAdmin, memberships, loading: modulesLoading } = useUserModules();
  const canManage =
    isSuperAdmin ||
    memberships.some(
      (m) =>
        m.moduleKey === 'site-applications' &&
        (m.capabilities == null || m.capabilities.includes('forms'))
    );

  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [titleTr, setTitleTr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionTr, setDescriptionTr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [opportunityType, setOpportunityType] = useState('staj');
  const [workMode, setWorkMode] = useState('hibrit');
  const [location, setLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback((row: Opportunity) => {
    setOpp(row);
    const title = row.title || {};
    const desc = row.description || {};
    setTitleTr(title.tr || '');
    setTitleEn(title.en || '');
    setDescriptionTr(desc.tr || '');
    setDescriptionEn(desc.en || '');
    setCompanyName(row.company_name || '');
    setOpportunityType(row.opportunity_type || 'staj');
    setWorkMode(workModeValue(row.work_mode));
    setLocation(row.location || '');
    setDeadline(deadlineInput(row.application_deadline));
    setSlug(row.slug || '');
    setIsActive(Boolean(row.is_active));
    setIsFeatured(Boolean(row.is_featured));
    setBannerUrl(row.banner_url || '');
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/site-applications/opportunities/${id}`)
      .then(async (r) => {
        if (!r.ok) return null;
        const data = await r.json();
        return data.opportunity as Opportunity;
      })
      .then((row) => {
        if (row) hydrate(row);
      })
      .finally(() => setLoading(false));
  }, [id, hydrate]);

  const listingPreview = useMemo(
    () => (slug ? getAbsoluteOpportunityListingPath(locale, slug) : ''),
    [locale, slug]
  );
  const formPreview = useMemo(
    () => (slug ? getAbsoluteSiteApplicationPublicPath(locale, slug) : ''),
    [locale, slug]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFlash(null);
    try {
      const res = await fetch(`/api/site-applications/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title_tr: titleTr,
          title_en: titleEn || titleTr,
          description_tr: descriptionTr,
          description_en: descriptionEn || descriptionTr,
          company_name: companyName,
          opportunity_type: opportunityType,
          work_mode: workMode,
          location,
          application_deadline: deadline || null,
          slug,
          is_active: isActive,
          is_featured: isFeatured,
          banner_url: bannerUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.error);
        return;
      }
      hydrate(data.opportunity);
      setFlash(t.saved);
    } catch {
      setError(t.error);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm(t.deleteConfirm)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/site-applications/opportunities/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.error);
        return;
      }
      router.push(base);
    } finally {
      setDeleting(false);
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

  if (!opp) {
    return <div className="p-8 text-neutral-600">{t.notFound}</div>;
  }

  const inputClass =
    'w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm';
  const labelClass = 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1';

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <Link
        href={base}
        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.back}
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t.title}</h1>
        {opp.site_form_id && (
          <Link
            href={`${formsBase}/${opp.site_form_id}`}
            className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          >
            <FormInput className="w-4 h-4" />
            {t.editForm}
          </Link>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t.titleTr}</label>
            <input className={inputClass} value={titleTr} onChange={(e) => setTitleTr(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>{t.titleEn}</label>
            <input className={inputClass} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t.descTr}</label>
            <textarea
              className={`${inputClass} min-h-[120px]`}
              value={descriptionTr}
              onChange={(e) => setDescriptionTr(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>{t.descEn}</label>
            <textarea
              className={`${inputClass} min-h-[120px]`}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t.company}</label>
          <input className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>{t.type}</label>
            <select
              className={inputClass}
              value={opportunityType}
              onChange={(e) => setOpportunityType(e.target.value)}
            >
              <option value="staj">{t.typeStaj}</option>
              <option value="gonullu">{t.typeGonullu}</option>
              <option value="is">{t.typeIs}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{t.workMode}</label>
            <select className={inputClass} value={workMode} onChange={(e) => setWorkMode(e.target.value)}>
              <option value="remote">{t.modeRemote}</option>
              <option value="hybrid">{t.modeHybrid}</option>
              <option value="onsite">{t.modeOnsite}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{t.location}</label>
            <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t.deadline}</label>
          <input
            type="date"
            className={inputClass}
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>{t.slug}</label>
          <input
            className={inputClass}
            value={slug}
            onChange={(e) => setSlug(slugifyFormValue(e.target.value) || e.target.value)}
            required
          />
        </div>

        <OpportunityBannerUpload
          value={bannerUrl}
          onChange={setBannerUrl}
          slug={slug}
          label={t.banner}
          hint={t.bannerHint}
          uploadLabel={t.bannerUpload}
          removeLabel={t.bannerRemove}
          uploadingLabel={t.bannerUploading}
        />

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4 space-y-2 text-sm">
          {listingPreview && (
            <a
              href={listingPreview}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:underline break-all"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>
                {t.liveListing}: {listingPreview}
              </span>
            </a>
          )}
          {formPreview && (
            <a
              href={formPreview}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 hover:underline break-all"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>
                {t.liveForm}: {formPreview}
              </span>
            </a>
          )}
        </div>

        <div className="space-y-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {t.publish}
          </label>
          <p className="text-xs text-neutral-500 pl-6">{t.publishHint}</p>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            {t.featured}
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {flash && <p className="text-sm text-emerald-600">{flash}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? t.saving : t.save}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? t.deleting : t.delete}
          </button>
        </div>
      </form>
    </div>
  );
}
