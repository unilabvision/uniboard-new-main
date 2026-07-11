'use client';

import React from 'react';
import type { SiteApplicationFormFieldInput } from '@/app/types/siteApplicationForms';
import { normalizeFieldOptions } from '@/app/lib/siteApplications/forms';
import {
  formatPackagePrice,
  toPublicPackages,
  type EventCertificatePackageSettings,
} from '@/app/lib/siteApplications/packages';

interface FormPreviewPanelProps {
  locale: string;
  title: string;
  subtitle?: string | null;
  fields: SiteApplicationFormFieldInput[];
  packages?: EventCertificatePackageSettings;
}

export default function FormPreviewPanel({
  locale,
  title,
  subtitle,
  fields,
  packages,
}: FormPreviewPanelProps) {
  const isEn = locale === 'en';
  const sorted = [...fields].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const publicPackages = packages ? toPublicPackages(packages, locale) : [];
  const showPackages = publicPackages.length > 1;

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-800/80 shadow-sm sticky top-6">
      <div className="px-5 py-4 border-b-4 border-[#990000] bg-gradient-to-r from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
          {isEn ? 'Preview' : 'Önizleme'}
        </p>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{title || '—'}</h3>
        {subtitle && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="px-5 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
        {showPackages && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
              {isEn ? 'Choose a package' : 'Paket seçin'}
            </p>
            <div className="grid gap-2">
              {publicPackages.map((pkg, index) => (
                <div
                  key={pkg.id}
                  className={`rounded-xl border px-3 py-2.5 text-sm ${
                    index === 0
                      ? 'border-[#990000] bg-[#990000]/5'
                      : 'border-neutral-200 dark:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      {pkg.title}
                    </span>
                    <span className="text-xs font-semibold text-[#990000]">
                      {formatPackagePrice(pkg.price, pkg.currency, locale)}
                    </span>
                  </div>
                  {pkg.description && (
                    <p className="text-xs text-neutral-500 mt-1">{pkg.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {sorted.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-6">
            {isEn ? 'Questions will appear here' : 'Sorular burada görünecek'}
          </p>
        ) : (
          sorted.map((field) => {
            const label = isEn ? field.label_en : field.label_tr;
            const placeholder = isEn ? field.placeholder_en : field.placeholder_tr;
            return (
              <div key={field.field_key}>
                <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1.5">
                  {label || (isEn ? 'Untitled question' : 'Başlıksız soru')}
                  {field.required && <span className="text-[#990000] ml-0.5">*</span>}
                </label>
                {field.field_type === 'textarea' ? (
                  <div className="h-20 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/40" />
                ) : field.field_type === 'select' ? (
                  <div className="space-y-2">
                    {normalizeFieldOptions(field.options).map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
                      >
                        <span className="w-4 h-4 rounded-full border-2 border-neutral-300" />
                        {isEn ? opt.label_en : opt.label_tr}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="h-10 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/40 flex items-center px-3 text-sm text-neutral-400">
                    {placeholder || (isEn ? 'Your answer' : 'Yanıtınız')}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div className="pt-2">
          <div className="inline-block px-6 py-2 rounded-lg bg-[#990000] text-white text-sm font-medium opacity-80">
            {isEn ? 'Submit' : 'Gönder'}
          </div>
        </div>
      </div>
    </div>
  );
}
