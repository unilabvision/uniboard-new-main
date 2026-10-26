'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Globe2, Save, Search } from 'lucide-react';
import type {
  MembershipBenefit,
  MembershipCatalogItem,
  MembershipPlan,
  MembershipResourceType,
} from '@/app/lib/memberships/types';

type PlanDraft = {
  family_code: string;
  code: string;
  duration_months: 1 | 3 | 6;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  price: string;
  currency: string;
};

const RESOURCE_TYPES: MembershipResourceType[] = [
  'course',
  'product',
  'event',
];

const resourceLabels = {
  tr: { course: 'Eğitimler', product: 'Dergi ve ürünler', event: 'Etkinlikler' },
  en: { course: 'Courses', product: 'Magazines and products', event: 'Events' },
};

function emptyDraft(): PlanDraft {
  return {
    family_code: 'MYUNI_ACCESS',
    code: 'MYUNI_1_MONTH',
    duration_months: 1,
    name_tr: '1 Aylık MyUNI',
    name_en: '1 Month MyUNI',
    description_tr: '',
    description_en: '',
    price: '0',
    currency: 'TRY',
  };
}

function planCodeForDuration(months: PlanDraft['duration_months']): string {
  return `MYUNI_${months}_${months === 1 ? 'MONTH' : 'MONTHS'}`;
}

function planToDraft(plan: MembershipPlan | null): PlanDraft {
  if (!plan) return emptyDraft();
  return {
    family_code: plan.family_code,
    code: plan.code,
    duration_months: plan.duration_months,
    name_tr: plan.name_tr,
    name_en: plan.name_en ?? '',
    description_tr: plan.description_tr ?? '',
    description_en: plan.description_en ?? '',
    price: String(plan.price),
    currency: plan.currency,
  };
}

function contentBenefitsForType(
  type: (typeof RESOURCE_TYPES)[number],
  catalog: MembershipCatalogItem[],
  selectedIds: Set<string>,
  catalogScopes: Set<string>
): MembershipBenefit[] {
  const capability = type === 'event' ? 'participate' : 'view';
  if (catalogScopes.has(type)) {
    return [{ resource_type: type, access_scope: 'catalog', resource_id: null, capability }];
  }

  return catalog
    .filter((item) => item.type === type && selectedIds.has(item.id))
    .map((item) => ({
      resource_type: type,
      access_scope: 'specific',
      resource_id: item.id,
      capability,
      label_tr: item.title,
      label_en: item.title,
    }));
}

function certificateBenefits(
  catalog: MembershipCatalogItem[],
  selectedIds: Set<string>,
  catalogScopes: Set<string>
): MembershipBenefit[] {
  if (catalogScopes.has('course')) {
    return [{
      resource_type: 'course',
      access_scope: 'catalog',
      resource_id: null,
      capability: 'certificate',
    }];
  }

  return catalog
    .filter((item) => item.type === 'course' && selectedIds.has(item.id))
    .map((course) => ({
      resource_type: 'course',
      access_scope: 'specific',
      resource_id: course.id,
      capability: 'certificate',
      label_tr: `${course.title} sertifikası`,
      label_en: `${course.title} certificate`,
    }));
}

export default function PlanEditor({
  locale,
  plan,
  catalog,
  saving,
  canEdit,
  onSave,
}: {
  locale: string;
  plan: MembershipPlan | null;
  catalog: MembershipCatalogItem[];
  saving: boolean;
  canEdit: boolean;
  onSave: (payload: { plan: PlanDraft; benefits: MembershipBenefit[] }) => Promise<void>;
}) {
  const [draft, setDraft] = useState<PlanDraft>(() => planToDraft(plan));
  const [activeType, setActiveType] = useState<(typeof RESOURCE_TYPES)[number]>('course');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [catalogScopes, setCatalogScopes] = useState<Set<string>>(new Set());
  const [includeCertificates, setIncludeCertificates] = useState(false);
  const isTr = locale === 'tr';
  const isEditable = canEdit && (!plan || plan.status === 'draft');

  useEffect(() => {
    setDraft(planToDraft(plan));
    const benefits = plan?.myuni_membership_plan_benefits ?? [];
    setSelectedIds(
      new Set(
        benefits
          .filter((benefit) => benefit.access_scope === 'specific' && benefit.capability !== 'certificate')
          .map((benefit) => benefit.resource_id)
          .filter((id): id is string => Boolean(id))
      )
    );
    setCatalogScopes(
      new Set(
        benefits
          .filter((benefit) => benefit.access_scope === 'catalog' && benefit.capability !== 'certificate')
          .map((benefit) => benefit.resource_type)
      )
    );
    setIncludeCertificates(benefits.some((benefit) => benefit.capability === 'certificate'));
    setSearch('');
  }, [plan]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase(locale);
    return catalog.filter(
      (item) =>
        item.type === activeType &&
        (!term || item.title.toLocaleLowerCase(locale).includes(term) || item.slug?.includes(term))
    );
  }, [activeType, catalog, locale, search]);

  const update = <K extends keyof PlanDraft>(key: K, value: PlanDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const toggleItem = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCatalogScope = () => {
    setCatalogScopes((current) => {
      const next = new Set(current);
      if (next.has(activeType)) next.delete(activeType);
      else next.add(activeType);
      return next;
    });
  };

  const buildBenefits = (): MembershipBenefit[] => {
    const result = RESOURCE_TYPES.flatMap((type) =>
      contentBenefitsForType(type, catalog, selectedIds, catalogScopes)
    );
    if (includeCertificates) {
      result.push(...certificateBenefits(catalog, selectedIds, catalogScopes));
    }
    return result.map((benefit, index) => ({ ...benefit, sort_order: index }));
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#990000]">
              {plan ? `${plan.code} · v${plan.version}` : isTr ? 'Yeni paket' : 'New plan'}
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              {isEditable
                ? isTr ? 'Taslak düzenleyici' : 'Draft editor'
                : isTr ? 'Yayınlanan sürüm' : 'Published version'}
            </h2>
          </div>
          {isEditable && (
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave({ plan: draft, benefits: buildBenefits() })}
              className="inline-flex items-center gap-2 rounded-lg bg-[#990000] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#7f0000] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? (isTr ? 'Kaydediliyor…' : 'Saving…') : isTr ? 'Taslağı kaydet' : 'Save draft'}
            </button>
          )}
        </div>
      </div>

      <fieldset disabled={!isEditable || saving} className="grid gap-6 p-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] disabled:opacity-75">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">
              {isTr ? 'Süre' : 'Duration'}
              <select
                value={draft.duration_months}
                disabled={Boolean(plan)}
                onChange={(event) => {
                  const duration = Number(event.target.value) as PlanDraft['duration_months'];
                  setDraft((current) => ({
                    ...current,
                    duration_months: duration,
                    code: planCodeForDuration(duration),
                  }));
                }}
                className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 disabled:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950"
              >
                {[1, 3, 6].map((months) => (
                  <option key={months} value={months}>{months} {isTr ? 'ay' : 'months'}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              {isTr ? 'Paket kodu' : 'Plan code'}
              <input
                value={draft.code}
                disabled
                className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 font-mono text-sm disabled:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>
          </div>

          <div className="grid grid-cols-[1fr_92px] gap-3">
            <label className="text-sm font-medium">
              {isTr ? 'Paket fiyatı' : 'Plan price'}
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.price}
                onChange={(event) => update('price', event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-lg font-semibold dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>
            <label className="text-sm font-medium">
              {isTr ? 'Para' : 'Currency'}
              <input
                value={draft.currency}
                maxLength={3}
                onChange={(event) => update('currency', event.target.value.toUpperCase())}
                className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-950"
              />
            </label>
          </div>

          <label className="block text-sm font-medium">
            Türkçe ad
            <input
              required
              value={draft.name_tr}
              onChange={(event) => update('name_tr', event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
          <label className="block text-sm font-medium">
            English name
            <input
              value={draft.name_en}
              onChange={(event) => update('name_en', event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
          <label className="block text-sm font-medium">
            {isTr ? 'Kısa açıklama' : 'Short description'}
            <textarea
              rows={3}
              value={isTr ? draft.description_tr : draft.description_en}
              onChange={(event) => update(isTr ? 'description_tr' : 'description_en', event.target.value)}
              className="mt-1.5 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-950"
            />
          </label>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">{isTr ? 'Dahil edilen hizmetler' : 'Included services'}</h3>
              <p className="mt-1 text-sm text-neutral-500">
                {isTr ? 'Tüm katalog veya tek tek içerik seçin.' : 'Choose the full catalog or individual items.'}
              </p>
            </div>
            <Globe2 className="h-5 w-5 text-neutral-400" />
          </div>

          <div className="mt-4 flex gap-1 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
            {RESOURCE_TYPES.map((type) => (
              <button
                type="button"
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activeType === type ? 'bg-white text-[#990000] shadow-sm dark:bg-neutral-950' : 'text-neutral-600'
                }`}
              >
                {resourceLabels[isTr ? 'tr' : 'en'][type]}
              </button>
            ))}
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-[#990000]/25 bg-[#990000]/5 p-3">
            <input
              type="checkbox"
              checked={catalogScopes.has(activeType)}
              onChange={toggleCatalogScope}
              className="h-4 w-4 accent-[#990000]"
            />
            <span className="text-sm font-medium">
              {isTr ? `Tüm ${resourceLabels.tr[activeType].toLocaleLowerCase('tr')} dahil` : `Include all ${resourceLabels.en[activeType].toLowerCase()}`}
            </span>
          </label>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isTr ? 'İçerik ara…' : 'Search content…'}
              className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>

          <div className="mt-3 max-h-[310px] space-y-1 overflow-y-auto rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
            {visibleItems.map((item) => {
              const checked = catalogScopes.has(activeType) || selectedIds.has(item.id);
              return (
                <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={catalogScopes.has(activeType)}
                    onChange={() => toggleItem(item.id)}
                    className="mt-0.5 h-4 w-4 accent-[#990000]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-neutral-500">
                      {item.subtype || item.slug} {!item.isActive && `· ${isTr ? 'pasif' : 'inactive'}`}
                    </span>
                  </span>
                  {checked && <Check className="h-4 w-4 text-[#166534]" />}
                </label>
              );
            })}
            {visibleItems.length === 0 && (
              <p className="p-5 text-center text-sm text-neutral-500">
                {isTr ? 'Eşleşen içerik bulunamadı.' : 'No matching content.'}
              </p>
            )}
          </div>

          <label className="mt-3 flex items-center gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
            <input
              type="checkbox"
              checked={includeCertificates}
              onChange={(event) => setIncludeCertificates(event.target.checked)}
              className="h-4 w-4 accent-[#990000]"
            />
            <span className="text-sm">
              {isTr ? 'Seçili eğitimlerin sertifika hakkını dahil et' : 'Include certificate rights for selected courses'}
            </span>
          </label>
        </div>
      </fieldset>
    </section>
  );
}
