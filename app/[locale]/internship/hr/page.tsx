'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Users, RefreshCw, GraduationCap, FileInput } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { internshipDb } from '@/app/lib/internship/config';
import type { InternshipApplication, InternshipVote, OpportunityApplication } from '@/app/types/internship';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || '',
});

export default function InternshipHrPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [internshipApps, setInternshipApps] = useState<InternshipApplication[]>([]);
  const [opportunityApps, setOpportunityApps] = useState<OpportunityApplication[]>([]);
  const [votes, setVotes] = useState<InternshipVote[]>([]);
  const [reviewerCount, setReviewerCount] = useState(0);
  const [formConfigCount, setFormConfigCount] = useState(0);
  const [careerTagCount, setCareerTagCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isLoaded } = useUser();

  const t =
    locale === 'tr'
      ? {
          title: 'İK Özeti',
          subtitle: 'Staj, fırsat ve değerlendirme verilerinin özeti',
          byPosition: 'Staj pozisyonları',
          bySchool: 'Okullar',
          bySource: 'Kaynak',
          reviewers: 'Aktif değerlendiriciler',
          stats: 'Kayıt özeti',
          statInternshipApps: 'Staj başvuruları',
          statOpportunityApps: 'Fırsat başvuruları',
          statReviewers: 'Değerlendiriciler',
          statCareerTags: 'Kariyer etiketleri',
          statFormConfigs: 'Form yapılandırmaları',
          refresh: 'Yenile',
          count: 'kayıt',
        }
      : {
          title: 'HR Overview',
          subtitle: 'Summary of internship, opportunity and review data',
          byPosition: 'Internship positions',
          bySchool: 'Schools',
          bySource: 'Source',
          reviewers: 'Active reviewers',
          stats: 'Record summary',
          statInternshipApps: 'Internship applications',
          statOpportunityApps: 'Opportunity applications',
          statReviewers: 'Reviewers',
          statCareerTags: 'Career tags',
          statFormConfigs: 'Form configurations',
          refresh: 'Refresh',
          count: 'records',
        };

  useEffect(() => {
    params.then((p) => setLocale(p.locale || 'tr'));
  }, [params]);

  const loadData = async () => {
    setLoading(true);
    const [appsRes, oppRes, votesRes, revRes, formRes, tagRes] = await Promise.all([
      supabase.from(internshipDb.applications).select('*'),
      supabase.from(internshipDb.opportunityApplications).select('id, status, applicant_email'),
      supabase.from(internshipDb.votes).select('*'),
      supabase.from(internshipDb.reviewers).select('id', { count: 'exact', head: true }),
      supabase.from(internshipDb.formConfigs).select('id', { count: 'exact', head: true }),
      supabase.from(internshipDb.careerTags).select('id', { count: 'exact', head: true }),
    ]);

    setInternshipApps((appsRes.data || []) as InternshipApplication[]);
    setOpportunityApps((oppRes.data || []) as OpportunityApplication[]);
    setVotes((votesRes.data || []) as InternshipVote[]);
    setReviewerCount(revRes.count ?? 0);
    setFormConfigCount(formRes.count ?? 0);
    setCareerTagCount(tagRes.count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    if (isLoaded) loadData();
  }, [isLoaded]);

  const byPosition = useMemo(() => {
    const map = new Map<string, number>();
    internshipApps.forEach((a) => {
      const key = a.position || '—';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [internshipApps]);

  const bySchool = useMemo(() => {
    const map = new Map<string, number>();
    internshipApps.forEach((a) => {
      const key = a.school || '—';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [internshipApps]);

  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    internshipApps.forEach((a) => {
      const key = a.source || 'direct';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [internshipApps]);

  const voters = useMemo(() => {
    const map = new Map<string, { name: string; email: string; count: number }>();
    votes.forEach((v) => {
      const existing = map.get(v.voter_id);
      if (existing) existing.count += 1;
      else
        map.set(v.voter_id, {
          name: v.voter_name,
          email: v.voter_email,
          count: 1,
        });
    });
    return [...map.values()].sort((a, b) => b.count - a.count);
  }, [votes]);

  const tableStats = [
    { label: t.statInternshipApps, value: internshipApps.length },
    { label: t.statOpportunityApps, value: opportunityApps.length },
    { label: t.statReviewers, value: reviewerCount },
    { label: t.statCareerTags, value: careerTagCount },
    { label: t.statFormConfigs, value: formConfigCount },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse h-40 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
        ) : (
          <>
            <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {tableStats.map((row) => (
                <div
                  key={row.label}
                  className="bg-white dark:bg-neutral-800 rounded-lg border p-4 text-center"
                >
                  <p className="text-2xl font-bold text-[#990000]">{row.value}</p>
                  <p className="text-xs text-neutral-500 mt-1 truncate">{row.label}</p>
                </div>
              ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-white dark:bg-neutral-800 rounded-lg border p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#990000]" />
                  {t.byPosition}
                </h2>
                <ul className="space-y-2 text-sm">
                  {byPosition.map(([name, count]) => (
                    <li key={name} className="flex justify-between">
                      <span className="truncate pr-4">{name}</span>
                      <span className="text-neutral-500">{count}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-white dark:bg-neutral-800 rounded-lg border p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#990000]" />
                  {t.bySchool}
                </h2>
                <ul className="space-y-2 text-sm">
                  {bySchool.map(([name, count]) => (
                    <li key={name} className="flex justify-between">
                      <span className="truncate pr-4">{name}</span>
                      <span className="text-neutral-500">{count}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-white dark:bg-neutral-800 rounded-lg border p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <FileInput className="w-5 h-5 text-[#990000]" />
                  {t.bySource}
                </h2>
                <ul className="space-y-2 text-sm">
                  {bySource.map(([name, count]) => (
                    <li key={name} className="flex justify-between">
                      <span>{name}</span>
                      <span className="text-neutral-500">{count}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-white dark:bg-neutral-800 rounded-lg border p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#990000]" />
                  {t.reviewers}
                </h2>
                <ul className="space-y-3 text-sm">
                  {voters.map((r) => (
                    <li key={r.email} className="p-2 rounded bg-neutral-50 dark:bg-neutral-900/50">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-neutral-500">{r.email}</p>
                      <p className="text-xs mt-1">{r.count} oy</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
