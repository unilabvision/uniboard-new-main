'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, Sparkles, ArrowRight, Briefcase } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { internshipDb } from '@/app/lib/internship/config';
import type { InternshipApplication } from '@/app/types/internship';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || '',
});

export default function InternshipMatchingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [apps, setApps] = useState<Pick<InternshipApplication, 'id' | 'first_name' | 'last_name' | 'position' | 'status' | 'created_at'>[]>([]);
  const [loading, setLoading] = useState(true);

  const tr = locale === 'tr';

  useEffect(() => {
    params.then((p) => setLocale(p.locale || 'tr'));
  }, [params]);

  useEffect(() => {
    supabase
      .from(internshipDb.applications)
      .select('id, first_name, last_name, position, status, created_at')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setApps(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-7 h-7 text-[#990000]" />
            {tr ? 'AI Agent Eşleştirme' : 'AI Agent Matching'}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            {tr
              ? '3 aşamalı otonom analiz: profil çıkarımı → ilan profili → skor & mülakat önerisi'
              : '3-step autonomous analysis: profile → job profile → score & interview tips'}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#990000]" />
            {tr ? 'Nasıl çalışır?' : 'How it works'}
          </h2>
          <ol className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2 list-decimal list-inside">
            <li>{tr ? 'Aday metninden beceri ve deneyim profili çıkarılır' : 'Extract skills & experience from application text'}</li>
            <li>{tr ? 'Pozisyon ve kariyer etiketleriyle ilan profili oluşturulur' : 'Build job profile from position and career tags'}</li>
            <li>{tr ? 'Etiket ön eşleştirmesi + nihai skor, mülakat soruları, İK adımları' : 'Keyword pre-match + final score, interview Qs, HR actions'}</li>
          </ol>
        </div>

        <section className="bg-white dark:bg-neutral-800 rounded-xl border p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#990000]" />
            {tr ? 'Başvurular — detayda agent çalıştır' : 'Applications — run agent on detail'}
          </h2>
          {loading ? (
            <div className="animate-pulse h-24 bg-neutral-100 dark:bg-neutral-700 rounded" />
          ) : apps.length === 0 ? (
            <p className="text-sm text-neutral-500">{tr ? 'Başvuru yok' : 'No applications'}</p>
          ) : (
            <ul className="space-y-2">
              {apps.map((app) => (
                <li key={app.id}>
                  <Link
                    href={`/${locale}/internship/applications/${app.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900/50 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {app.first_name} {app.last_name}
                      </p>
                      <p className="text-xs text-neutral-500">{app.position || '—'}</p>
                    </div>
                    <span className="text-xs text-[#990000] flex items-center gap-1">
                      {tr ? 'Agent' : 'Agent'}
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
