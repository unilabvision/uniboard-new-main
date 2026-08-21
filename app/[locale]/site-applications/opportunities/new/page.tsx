'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useUserModules } from '../../../../hooks/useUserModules';
import {
  getAbsoluteOpportunityListingPath,
  getAbsoluteSiteApplicationPublicPath,
  slugifyFormValue,
} from '@/app/lib/siteApplications/config';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { OpportunityImageUpload } from '@/app/components/site-applications/OpportunityBannerUpload';

const texts = {
  tr: {
    title: 'Yeni ilan',
    back: 'Geri',
    forbidden: 'Bu sayfaya erişiminiz yok.',
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
    slugHint: 'Başlıktan otomatik oluşur; isterseniz değiştirin',
    publish: 'Sitede yayınla',
    featured: 'Öne çıkar',
    create: 'Kaydet',
    saving: 'Kaydediliyor...',
    error: 'Kaydedilemedi',
    liveListing: 'İlan linki',
    liveForm: 'Başvuru linki',
    hint: 'Kayıt hem ilan sayfasını hem başvuru formunu oluşturur. Kapak ve banner’ı aşağıdan yükleyebilirsiniz.',
    banner: 'Banner (detay sayfası)',
    bannerHint: 'Detay sayfasının üst görseli. Önerilen: 1920×600.',
    bannerUpload: 'Görsel seç',
    bannerRemove: 'Kaldır',
    bannerUploading: 'Yükleniyor...',
    cover: 'Kapak fotoğrafı (liste kartı)',
    coverHint: '/stajlar listesindeki kart görseli. Önerilen: 800×450.',
    coverUpload: 'Kapak seç',
    coverRemove: 'Kaldır',
    coverUploading: 'Yükleniyor...',
  },
  en: {
    title: 'New listing',
    back: 'Back',
    forbidden: 'You do not have access.',
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
    slugHint: 'Auto from title; editable',
    publish: 'Publish on site',
    featured: 'Featured',
    create: 'Save',
    saving: 'Saving...',
    error: 'Could not save',
    liveListing: 'Listing link',
    liveForm: 'Apply link',
    hint: 'Creates both the listing page and the application form. Upload cover and banner below.',
    banner: 'Banner (detail page)',
    bannerHint: 'Hero image on the detail page. Recommended: 1920×600.',
    bannerUpload: 'Choose image',
    bannerRemove: 'Remove',
    bannerUploading: 'Uploading...',
    cover: 'Cover photo (list card)',
    coverHint: 'Image on the /stajlar list card. Recommended: 800×450.',
    coverUpload: 'Choose cover',
    coverRemove: 'Remove',
    coverUploading: 'Uploading...',
  },
};

export default function NewOpportunityPage() {
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

  const [titleTr, setTitleTr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [descriptionTr, setDescriptionTr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [opportunityType, setOpportunityType] = useState('staj');
  const [workMode, setWorkMode] = useState('hybrid');
  const [location, setLocation] = useState('');
  const [deadline, setDeadline] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugManual) setSlug(slugifyFormValue(titleTr));
  }, [titleTr, slugManual]);

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
    try {
      const res = await fetch('/api/site-applications/opportunities', {
        method: 'POST',
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
          thumbnail_url: thumbnailUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.error);
        return;
      }
      router.push(`${base}/${data.opportunity.id}`);
    } catch {
      setError(t.error);
    } finally {
      setSaving(false);
    }
  };

  if (modulesLoading) {
    return (
      <div className="p-8 flex items-center gap-2 text-neutral-600">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!canManage) {
    return <div className="p-8 text-neutral-600">{t.forbidden}</div>;
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
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">{t.title}</h1>
      <p className="text-sm text-neutral-500 mb-6">{t.hint}</p>

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
            onChange={(e) => {
              setSlugManual(true);
              setSlug(slugifyFormValue(e.target.value) || e.target.value);
            }}
            required
          />
          <p className="text-xs text-neutral-500 mt-1">{t.slugHint}</p>
        </div>

        <OpportunityImageUpload
          kind="cover"
          value={thumbnailUrl}
          onChange={setThumbnailUrl}
          slug={slug}
          label={t.cover}
          hint={t.coverHint}
          uploadLabel={t.coverUpload}
          removeLabel={t.coverRemove}
          uploadingLabel={t.coverUploading}
        />

        <OpportunityImageUpload
          kind="banner"
          value={bannerUrl}
          onChange={setBannerUrl}
          slug={slug}
          label={t.banner}
          hint={t.bannerHint}
          uploadLabel={t.bannerUpload}
          removeLabel={t.bannerRemove}
          uploadingLabel={t.bannerUploading}
        />

        {(listingPreview || formPreview) && (
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
        )}

        <div className="flex flex-wrap gap-6">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            {t.publish}
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            {t.featured}
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? t.saving : t.create}
        </button>
      </form>
    </div>
  );
}
