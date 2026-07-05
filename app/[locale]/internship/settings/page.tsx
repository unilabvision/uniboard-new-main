'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, ArrowRight } from 'lucide-react';

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
          {tr ? 'Ayarlar' : 'Settings'}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-1 mb-8">
          {tr ? 'Staj & Kariyer modülü ayarları' : 'Internship & Career module settings'}
        </p>

        <section className="bg-white dark:bg-neutral-800 rounded-lg border p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-[#990000]" />
            {tr ? 'Erişim & Yetkilendirme' : 'Access & Permissions'}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            {tr
              ? 'Modüle erişim vermek ve kullanıcı daveti göndermek için Yetkilendirme sayfasını kullanın.'
              : 'Use Access Control to grant module access and invite users.'}
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
