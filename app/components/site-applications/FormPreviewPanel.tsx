'use client';

import React, { useMemo } from 'react';
import DynamicSiteApplicationForm from '@/app/components/forms/DynamicSiteApplicationForm';
import type {
  PublicSiteApplicationForm,
  SiteApplicationFormFieldInput,
} from '@/app/types/siteApplicationForms';
import { normalizeFieldOptions } from '@/app/lib/siteApplications/forms';
import {
  getMaxFileBytesForFormType,
} from '@/app/lib/siteApplications/files';
import {
  toPublicPackages,
  type EventCertificatePackageSettings,
} from '@/app/lib/siteApplications/packages';

interface FormPreviewPanelProps {
  locale: string;
  title: string;
  subtitle?: string | null;
  fields: SiteApplicationFormFieldInput[];
  packages?: EventCertificatePackageSettings;
  formType?: 'team' | 'event';
  allowsAttachment?: boolean;
}

/** Builds the same public form shape the live site consumes. */
export function buildPreviewPublicForm(opts: {
  locale: string;
  title: string;
  subtitle?: string | null;
  fields: SiteApplicationFormFieldInput[];
  packages?: EventCertificatePackageSettings;
  formType?: 'team' | 'event';
  allowsAttachment?: boolean;
}): PublicSiteApplicationForm {
  const isEn = opts.locale === 'en';
  const formType = opts.formType || 'event';
  const publicPackages =
    formType === 'event' && opts.packages
      ? toPublicPackages(opts.packages, opts.locale)
      : undefined;

  return {
    id: 'preview',
    slug: 'preview',
    title: opts.title || (isEn ? 'Untitled form' : 'Başlıksız form'),
    subtitle: opts.subtitle || null,
    success_message: null,
    allows_attachment: Boolean(opts.allowsAttachment),
    form_type: formType,
    max_file_bytes: getMaxFileBytesForFormType(formType),
    packages: publicPackages,
    fields: [...opts.fields]
      .map((field, index) => ({
        field_key: field.field_key?.trim() || `field_${index + 1}`,
        field_type: field.field_type,
        label: (isEn ? field.label_en : field.label_tr)?.trim() || '',
        placeholder:
          (isEn ? field.placeholder_en : field.placeholder_tr)?.trim() || null,
        required: Boolean(field.required),
        order_index: field.order_index ?? index,
        options: normalizeFieldOptions(field.options).map((opt) => ({
          value: opt.value,
          label: isEn ? opt.label_en : opt.label_tr,
        })),
      }))
      .sort((a, b) => a.order_index - b.order_index),
  };
}

/**
 * Admin live preview — uses DynamicSiteApplicationForm so editor === public form UI.
 */
export default function FormPreviewPanel({
  locale,
  title,
  subtitle,
  fields,
  packages,
  formType = 'event',
  allowsAttachment = false,
}: FormPreviewPanelProps) {
  const previewConfig = useMemo(
    () =>
      buildPreviewPublicForm({
        locale,
        title,
        subtitle,
        fields,
        packages,
        formType,
        allowsAttachment,
      }),
    [locale, title, subtitle, fields, packages, formType, allowsAttachment]
  );

  return (
    <div className="sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl">
      <DynamicSiteApplicationForm
        locale={locale}
        previewMode
        previewConfig={previewConfig}
      />
    </div>
  );
}
