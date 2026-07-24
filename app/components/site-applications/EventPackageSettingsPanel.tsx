'use client';

import React from 'react';
import type { EventCertificatePackageSettings } from '@/app/lib/siteApplications/packages';
import { DEFAULT_PACKAGE_SETTINGS } from '@/app/lib/siteApplications/packages';

interface EventPackageSettingsPanelProps {
  locale: string;
  settings: EventCertificatePackageSettings;
  onChange: (settings: EventCertificatePackageSettings) => void;
}

const texts = {
  tr: {
    title: 'Kayıt paketleri',
    hint: 'Kayıt her zaman ücretsizdir. Sertifika paketini açtığınızda sitede iki paket kartı görünür. Paketler bağlı etkinlik slug’ına (/etkinlik/{slug}/basvuru) bu form üzerinden yazılır — “Ayarları Kaydet” veya etkinlik seçince otomatik kaydolur.',
    enableCertificate: 'Sertifika paketini aktifleştir (ücretli)',
    price: 'Sertifika ücreti',
    currency: 'Para birimi',
    titleTr: 'Paket adı (TR)',
    titleEn: 'Paket adı (EN)',
    descTr: 'Paket açıklaması (TR)',
    descEn: 'Paket açıklaması (EN)',
    freeLabel: 'Ücretsiz kayıt',
    freeHint: 'Her zaman sunulur — ücret alınmaz.',
  },
  en: {
    title: 'Registration packages',
    hint: 'Registration is always free. When the certificate package is enabled, two package cards appear on the site. Packages are stored on this form and served at the linked event slug (/event/{slug}/basvuru) after save.',
    enableCertificate: 'Enable certificate package (paid)',
    price: 'Certificate price',
    currency: 'Currency',
    titleTr: 'Package title (TR)',
    titleEn: 'Package title (EN)',
    descTr: 'Package description (TR)',
    descEn: 'Package description (EN)',
    freeLabel: 'Free registration',
    freeHint: 'Always available — no charge.',
  },
};

export default function EventPackageSettingsPanel({
  locale,
  settings,
  onChange,
}: EventPackageSettingsPanelProps) {
  const t = texts[locale as keyof typeof texts] || texts.tr;

  const patch = (partial: Partial<EventCertificatePackageSettings>) => {
    onChange({ ...settings, ...partial });
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/30 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t.title}</h3>
        <p className="text-xs text-neutral-500 mt-1">{t.hint}</p>
      </div>

      <div className="rounded-lg border border-dashed border-emerald-300/80 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{t.freeLabel}</p>
        <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">{t.freeHint}</p>
      </div>

      <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={settings.certificate_enabled}
          onChange={(e) => patch({ certificate_enabled: e.target.checked })}
          className="rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
        />
        {t.enableCertificate}
      </label>

      {settings.certificate_enabled && (
        <div className="grid sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="text-sm font-medium block mb-1">{t.price}</label>
            <input
              type="number"
              min={0}
              step={1}
              value={settings.certificate_price ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                patch({
                  certificate_price: raw === '' ? null : Math.max(0, Number(raw)),
                });
              }}
              className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t.currency}</label>
            <select
              value={settings.certificate_currency}
              onChange={(e) => patch({ certificate_currency: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-neutral-900"
            >
              <option value="TRY">TRY (₺)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t.titleTr}</label>
            <input
              value={settings.certificate_title_tr}
              onChange={(e) => patch({ certificate_title_tr: e.target.value })}
              placeholder={DEFAULT_PACKAGE_SETTINGS.certificate_title_tr}
              className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t.titleEn}</label>
            <input
              value={settings.certificate_title_en}
              onChange={(e) => patch({ certificate_title_en: e.target.value })}
              placeholder={DEFAULT_PACKAGE_SETTINGS.certificate_title_en}
              className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-neutral-900"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">{t.descTr}</label>
            <textarea
              rows={2}
              value={settings.certificate_description_tr}
              onChange={(e) => patch({ certificate_description_tr: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-neutral-900"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium block mb-1">{t.descEn}</label>
            <textarea
              rows={2}
              value={settings.certificate_description_en}
              onChange={(e) => patch({ certificate_description_en: e.target.value })}
              className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-neutral-900"
            />
          </div>
        </div>
      )}
    </div>
  );
}
