'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUserModules } from '../../../hooks/useUserModules';
import {
  getSiteApplicationPublicPath,
  getEventApplicationPath,
} from '@/app/lib/siteApplications/config';
import {
  getTeamFormPublicPath,
  inferFormType,
  type SiteApplicationFormType,
} from '@/app/lib/siteApplications/formTypes';
import type { SiteApplicationForm } from '@/app/types/siteApplicationForms';
import {
  ExternalLink,
  Settings,
  Loader2,
  FileText,
  Globe,
  Users,
  Calendar,
} from 'lucide-react';

type FormWithEvent = SiteApplicationForm & {
  myuni_events?: { id: string; slug: string; title: string } | null;
  form_type?: SiteApplicationFormType;
};

const texts = {
  tr: {
    title: 'Başvuru Formları',
    subtitle: 'Ekip ve etkinlik başvuru formlarını ayrı ayrı yönetin',
    newTeamForm: 'Yeni Ekip Formu',
    newEventForm: 'Yeni Etkinlik Formu',
    tabTeam: 'Ekip Başvuruları',
    tabEvent: 'Etkinlik Başvuruları',
    tabAll: 'Tümü',
    superAdminOnly: 'Form yapılandırması yalnızca süper admin tarafından yapılabilir.',
    loading: 'Yükleniyor...',
    emptyTeam: 'Henüz ekip başvuru formu yok.',
    emptyEvent: 'Henüz etkinlik başvuru formu yok.',
    emptyAll: 'Henüz form oluşturulmadı.',
    active: 'Aktif',
    inactive: 'Pasif',
    onWebsite: 'Sitede görünür',
    edit: 'Düzenle',
    preview: 'Önizle',
    teamBadge: 'Ekip',
    eventBadge: 'Etkinlik',
    linkedEvent: 'Bağlı etkinlik',
    menuPlacement: 'Menü',
    teamMenu: 'Hakkımızda',
    eventMenu: 'Etkinlikler',
    noLinkedEvent: '—',
  },
  en: {
    title: 'Application Forms',
    subtitle: 'Manage team and event application forms separately',
    newTeamForm: 'New Team Form',
    newEventForm: 'New Event Form',
    tabTeam: 'Team Applications',
    tabEvent: 'Event Applications',
    tabAll: 'All',
    superAdminOnly: 'Form configuration is available to super admins only.',
    loading: 'Loading...',
    emptyTeam: 'No team application forms yet.',
    emptyEvent: 'No event application forms yet.',
    emptyAll: 'No forms created yet.',
    active: 'Active',
    inactive: 'Inactive',
    onWebsite: 'Visible on site',
    edit: 'Edit',
    preview: 'Preview',
    teamBadge: 'Team',
    eventBadge: 'Event',
    linkedEvent: 'Linked event',
    menuPlacement: 'Menu',
    teamMenu: 'About Us',
    eventMenu: 'Events',
    noLinkedEvent: '—',
  },
};

function FormsListContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [tab, setTab] = useState<SiteApplicationFormType | 'all'>(
    initialTab === 'event' ? 'event' : initialTab === 'team' ? 'team' : 'team'
  );
  const [forms, setForms] = useState<FormWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin, loading: modulesLoading } = useUserModules();
  const t = texts[locale as keyof typeof texts] || texts.tr;

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

  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      const type = form.form_type ?? inferFormType(form);
      if (tab === 'all') return true;
      return type === tab;
    });
  }, [forms, tab]);

  if (modulesLoading || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-neutral-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        {t.loading}
      </div>
    );
  }

  const emptyMessage =
    tab === 'team' ? t.emptyTeam : tab === 'event' ? t.emptyEvent : t.emptyAll;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t.title}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">{t.subtitle}</p>
        </div>
        {isSuperAdmin && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/${locale}/site-applications/forms/new?type=team`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#990000] text-white rounded-lg hover:bg-[#800000]"
            >
              <Users className="w-4 h-4" />
              {t.newTeamForm}
            </Link>
            <Link
              href={`/${locale}/site-applications/forms/new?type=event`}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#990000] text-[#990000] rounded-lg hover:bg-[#990000]/5"
            >
              <Calendar className="w-4 h-4" />
              {t.newEventForm}
            </Link>
          </div>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-800 dark:text-amber-200 text-sm">
          {t.superAdminOnly}
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-neutral-200 dark:border-neutral-700">
        {([
          ['team', t.tabTeam, Users],
          ['event', t.tabEvent, Calendar],
          ['all', t.tabAll, FileText],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-[#990000] text-[#990000]'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {filteredForms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center text-neutral-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredForms.map((form) => {
            const type = form.form_type ?? inferFormType(form);
            const isTeam = type === 'team';
            const linkedEvent = form.myuni_events;
            const previewHref = isTeam
              ? getTeamFormPublicPath(locale, locale === 'en' ? form.slug_en : form.slug_tr)
              : linkedEvent
                ? getEventApplicationPath(locale, linkedEvent.slug)
                : getSiteApplicationPublicPath(locale, locale === 'en' ? form.slug_en : form.slug_tr);

            return (
              <div
                key={form.id}
                className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          isTeam
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                        }`}
                      >
                        {isTeam ? <Users className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                        {isTeam ? t.teamBadge : t.eventBadge}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {locale === 'en' ? form.title_en : form.title_tr}
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      {t.menuPlacement}:{' '}
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        {isTeam ? t.teamMenu : t.eventMenu}
                      </span>
                    </p>
                    {!isTeam && (
                      <p className="text-sm text-neutral-500 mt-1">
                        {t.linkedEvent}:{' '}
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {linkedEvent?.title || t.noLinkedEvent}
                        </span>
                      </p>
                    )}
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
                        href={previewHref}
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
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SiteApplicationFormsPage({
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
      <FormsListContent locale={locale} />
    </Suspense>
  );
}
