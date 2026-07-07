'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUserModules } from '../../../hooks/useUserModules';
import { getSiteApplicationPublicPath } from '@/app/lib/siteApplications/config';
import type { SiteApplicationForm } from '@/app/types/siteApplicationForms';
import {
  Plus,
  ExternalLink,
  Settings,
  Loader2,
  FileText,
  Globe,
} from 'lucide-react';

const texts = {
  tr: {
    title: 'Başvuru Formları',
    subtitle: 'myunilab.net üzerinde yayınlanacak formları yapılandırın',
    newForm: 'Yeni Form',
    superAdminOnly: 'Form yapılandırması yalnızca süper admin tarafından yapılabilir.',
    loading: 'Yükleniyor...',
    empty: 'Henüz form oluşturulmadı.',
    active: 'Aktif',
    inactive: 'Pasif',
    onWebsite: 'Sitede görünür',
    edit: 'Düzenle',
    preview: 'Önizle',
    slugTr: 'TR slug',
    slugEn: 'EN slug',
  },
  en: {
    title: 'Application Forms',
    subtitle: 'Configure forms published on myunilab.net',
    newForm: 'New Form',
    superAdminOnly: 'Form configuration is available to super admins only.',
    loading: 'Loading...',
    empty: 'No forms created yet.',
    active: 'Active',
    inactive: 'Inactive',
    onWebsite: 'Visible on site',
    edit: 'Edit',
    preview: 'Preview',
    slugTr: 'TR slug',
    slugEn: 'EN slug',
  },
};

export default function SiteApplicationFormsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [forms, setForms] = useState<SiteApplicationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin, loading: modulesLoading } = useUserModules();
  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/site-applications/forms');
        if (res.ok) {
          const data = await res.json();
          setForms(data.forms || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (modulesLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-neutral-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        {t.loading}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {t.title}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">{t.subtitle}</p>
        </div>
        {isSuperAdmin && (
          <Link
            href={`/${locale}/site-applications/forms/new`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#990000] text-white rounded-lg hover:bg-[#800000]"
          >
            <Plus className="w-4 h-4" />
            {t.newForm}
          </Link>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-800 dark:text-amber-200 text-sm">
          {t.superAdminOnly}
        </div>
      )}

      {forms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center text-neutral-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
          {t.empty}
        </div>
      ) : (
        <div className="space-y-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {locale === 'en' ? form.title_en : form.title_tr}
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    {t.slugTr}: <code>{form.slug_tr}</code> · {t.slugEn}:{' '}
                    <code>{form.slug_en}</code>
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        form.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {form.is_active ? t.active : t.inactive}
                    </span>
                    {form.show_on_website && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 inline-flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {t.onWebsite}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.is_active && (
                    <a
                      href={getSiteApplicationPublicPath(
                        locale,
                        locale === 'en' ? form.slug_en : form.slug_tr
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t.preview}
                    </a>
                  )}
                  {isSuperAdmin && (
                    <Link
                      href={`/${locale}/site-applications/forms/${form.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-[#990000] text-white rounded-lg hover:bg-[#800000]"
                    >
                      <Settings className="w-4 h-4" />
                      {t.edit}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
