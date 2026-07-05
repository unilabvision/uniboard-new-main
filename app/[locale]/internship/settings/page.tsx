'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Database, ArrowRight } from 'lucide-react';
import { internshipDb } from '@/app/lib/internship/config';

const TABLE_GROUPS = [
  {
    title_tr: 'Staj başvuru hattı',
    title_en: 'Internship pipeline',
    tables: [
      internshipDb.applications,
      internshipDb.votes,
      internshipDb.statusHistory,
      internshipDb.reviewers,
      internshipDb.formConfigs,
      internshipDb.formFields,
    ],
  },
  {
    title_tr: 'Kariyer / fırsat hattı',
    title_en: 'Career / opportunity pipeline',
    tables: [
      internshipDb.opportunities,
      internshipDb.opportunityApplications,
      internshipDb.opportunityAppStatusHistory,
      internshipDb.opportunityCourses,
      internshipDb.applicationsGeneric,
      internshipDb.applicationStatusHistory,
      internshipDb.careerTags,
      internshipDb.opportunityCareerTags,
      internshipDb.courseCareerTags,
    ],
  },
] as const;

export default function InternshipSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');

  useEffect(() => {
    params.then((p) => setLocale(p.locale || 'tr'));
  }, [params]);

  const tr = locale === 'tr';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">
          {tr ? 'Veritabanı & Yetki' : 'Database & Access'}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1 mb-8">
          {tr
            ? 'Supabase\'de kurulu tablolar — yeni tablo eklenmez'
            : 'Tables configured in Supabase — no new tables added'}
        </p>

        {TABLE_GROUPS.map((group) => (
          <section
            key={group.title_en}
            className="bg-white dark:bg-neutral-800 rounded-lg border p-6 mb-6"
          >
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-[#990000]" />
              {tr ? group.title_tr : group.title_en}
            </h2>
            <ul className="font-mono text-sm space-y-1 text-neutral-700 dark:text-neutral-300">
              {group.tables.map((table) => (
                <li key={table}>{table}</li>
              ))}
            </ul>
          </section>
        ))}

        <section className="bg-white dark:bg-neutral-800 rounded-lg border p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-[#990000]" />
            {tr ? 'Erişim' : 'Access'}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            {tr
              ? 'Platform: user_module_access → internship. Kullanıcı daveti için Yetkilendirme sayfasını kullanın.'
              : 'Platform: user_module_access → internship. Use Access Control to invite users.'}
          </p>
          <Link
            href={`/${locale}/internship/access`}
            className="inline-flex items-center gap-2 text-sm text-[#990000] hover:underline"
          >
            {tr ? 'Yetkilendirme sayfasına git' : 'Go to Access Control'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
