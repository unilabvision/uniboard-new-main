'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tag, Briefcase, RefreshCw, Link2 } from 'lucide-react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  internshipDb,
  getCareerTagLabel,
  getOpportunityTitle,
} from '@/app/lib/internship/config';
import type {
  CareerTag,
  Opportunity,
  OpportunityApplication,
  OpportunityCareerTagLink,
  InternshipApplication,
} from '@/app/types/internship';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || '',
});

function statusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
}

export default function InternshipJobsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [careerTags, setCareerTags] = useState<CareerTag[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [opportunityApps, setOpportunityApps] = useState<OpportunityApplication[]>([]);
  const [tagLinks, setTagLinks] = useState<OpportunityCareerTagLink[]>([]);
  const [internshipApps, setInternshipApps] = useState<Pick<InternshipApplication, 'position'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const t =
    locale === 'tr'
      ? {
          title: 'Kariyer & Fırsatlar',
          subtitle: 'myuni_opportunities · myuni_career_tags · başvurular',
          tags: 'Kariyer etiketleri',
          opportunities: 'Açık fırsatlar',
          tagLinks: 'Fırsat–etiket bağları',
          opportunityApps: 'Fırsat başvuruları',
          email: 'E-posta',
          status: 'Durum',
          opportunity: 'Fırsat',
          company: 'Şirket',
          location: 'Konum',
          workMode: 'Çalışma',
          deadline: 'Son tarih',
          active: 'Aktif',
          featured: 'Öne çıkan',
          date: 'Tarih',
          cv: 'CV',
          internshipPositions: 'Staj pozisyonları',
          viewInternship: 'Staj başvuruları',
          empty: 'Kayıt yok',
          refresh: 'Yenile',
          tag: 'Etiket',
        }
      : {
          title: 'Career & Opportunities',
          subtitle: 'myuni_opportunities · myuni_career_tags · applications',
          tags: 'Career tags',
          opportunities: 'Open opportunities',
          tagLinks: 'Opportunity–tag links',
          opportunityApps: 'Opportunity applications',
          email: 'Email',
          status: 'Status',
          opportunity: 'Opportunity',
          company: 'Company',
          location: 'Location',
          workMode: 'Work mode',
          deadline: 'Deadline',
          active: 'Active',
          featured: 'Featured',
          date: 'Date',
          cv: 'CV',
          internshipPositions: 'Internship positions',
          viewInternship: 'Internship applications',
          empty: 'No records',
          refresh: 'Refresh',
          tag: 'Tag',
        };

  useEffect(() => {
    params.then((p) => setLocale(p.locale || 'tr'));
  }, [params]);

  const loadData = async () => {
    setLoading(true);
    const errs: string[] = [];

    const [tagsRes, oppsRes, linksRes, oppRes, internRes] = await Promise.all([
      supabase
        .from(internshipDb.careerTags)
        .select('id, slug, name, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from(internshipDb.opportunities)
        .select(
          'id, slug, title, description, company_name, location, work_mode, application_deadline, is_active, is_featured, order_index, created_at'
        )
        .order('order_index', { ascending: true })
        .limit(50),
      supabase.from(internshipDb.opportunityCareerTags).select('opportunity_id, tag_id'),
      supabase
        .from(internshipDb.opportunityApplications)
        .select(
          'id, opportunity_id, user_id, applicant_email, status, cv_file_name, created_at, reviewed_at'
        )
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from(internshipDb.applications).select('position'),
    ]);

    if (tagsRes.error) errs.push(tagsRes.error.message);
    else setCareerTags((tagsRes.data || []) as CareerTag[]);

    if (oppsRes.error) errs.push(oppsRes.error.message);
    else setOpportunities((oppsRes.data || []) as Opportunity[]);

    if (linksRes.error) errs.push(linksRes.error.message);
    else setTagLinks((linksRes.data || []) as OpportunityCareerTagLink[]);

    if (oppRes.error) errs.push(oppRes.error.message);
    else setOpportunityApps((oppRes.data || []) as OpportunityApplication[]);

    if (!internRes.error) setInternshipApps(internRes.data || []);

    setErrors(errs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const tagById = useMemo(() => {
    const map = new Map<string, CareerTag>();
    careerTags.forEach((tag) => map.set(tag.id, tag));
    return map;
  }, [careerTags]);

  const opportunityById = useMemo(() => {
    const map = new Map<string, Opportunity>();
    opportunities.forEach((opp) => map.set(opp.id, opp));
    return map;
  }, [opportunities]);

  const opportunityLabel = (id: string) => {
    const opp = opportunityById.get(id);
    if (opp) {
      const title = getOpportunityTitle(opp, locale);
      if (title !== '—') return title;
    }
    return `${id.slice(0, 8)}…`;
  };

  const linksWithLabels = useMemo(
    () =>
      tagLinks.map((link) => ({
        ...link,
        opportunityLabel: opportunityLabel(link.opportunity_id),
        tagLabel: tagById.get(link.tag_id)
          ? getCareerTagLabel(tagById.get(link.tag_id)!, locale)
          : link.tag_id.slice(0, 8),
      })),
    [tagLinks, tagById, opportunityById, locale]
  );

  const positionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    internshipApps.forEach((row) => {
      const key = row.position?.trim() || '—';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [internshipApps]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between mb-8 gap-4">
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

        {errors.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border text-sm space-y-1">
            {errors.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse h-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
        ) : (
          <div className="space-y-6">
            <section className="bg-white dark:bg-neutral-800 rounded-lg border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#990000]" />
                {t.opportunities} ({opportunities.length})
              </h2>
              {opportunities.length === 0 ? (
                <p className="text-sm text-neutral-500">{t.empty}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-neutral-500 border-b">
                        <th className="py-2 pr-4">{t.opportunity}</th>
                        <th className="py-2 pr-4">{t.company}</th>
                        <th className="py-2 pr-4">{t.location}</th>
                        <th className="py-2 pr-4">{t.workMode}</th>
                        <th className="py-2 pr-4">{t.deadline}</th>
                        <th className="py-2">{t.active}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.map((opp) => (
                        <tr key={opp.id} className="border-b border-neutral-100 dark:border-neutral-700">
                          <td className="py-2 pr-4 font-medium">
                            {getOpportunityTitle(opp, locale)}
                            {opp.is_featured && (
                              <span className="ml-1 text-xs text-[#990000]">★</span>
                            )}
                          </td>
                          <td className="py-2 pr-4">{opp.company_name || '—'}</td>
                          <td className="py-2 pr-4">{opp.location || '—'}</td>
                          <td className="py-2 pr-4">{opp.work_mode || '—'}</td>
                          <td className="py-2 pr-4 text-neutral-500">
                            {opp.application_deadline
                              ? formatDate(opp.application_deadline)
                              : '—'}
                          </td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                opp.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-neutral-100 text-neutral-500'
                              }`}
                            >
                              {opp.is_active ? (locale === 'tr' ? 'Aktif' : 'Active') : (locale === 'tr' ? 'Pasif' : 'Inactive')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-neutral-800 rounded-lg border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#990000]" />
                {t.tags} ({careerTags.length})
              </h2>
              {careerTags.length === 0 ? (
                <p className="text-sm text-neutral-500">{t.empty}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {careerTags.map((tag) => (
                    <span
                      key={tag.id}
                      title={tag.slug}
                      className="px-3 py-1 rounded-full bg-[#990000]/10 text-[#990000] text-sm"
                    >
                      {getCareerTagLabel(tag, locale)}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-neutral-800 rounded-lg border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#990000]" />
                {t.tagLinks} ({linksWithLabels.length})
              </h2>
              {linksWithLabels.length === 0 ? (
                <p className="text-sm text-neutral-500">{t.empty}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-neutral-500 border-b">
                        <th className="py-2 pr-4">{t.opportunity}</th>
                        <th className="py-2">{t.tag}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linksWithLabels.slice(0, 20).map((row) => (
                        <tr key={`${row.opportunity_id}-${row.tag_id}`} className="border-b border-neutral-100 dark:border-neutral-700">
                          <td className="py-2 pr-4">{row.opportunityLabel}</td>
                          <td className="py-2">{row.tagLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-neutral-800 rounded-lg border p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#990000]" />
                {t.opportunityApps} ({opportunityApps.length})
              </h2>
              {opportunityApps.length === 0 ? (
                <p className="text-sm text-neutral-500">{t.empty}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-neutral-500 border-b">
                        <th className="py-2 pr-4">{t.email}</th>
                        <th className="py-2 pr-4">{t.status}</th>
                        <th className="py-2 pr-4">{t.opportunity}</th>
                        <th className="py-2 pr-4">{t.cv}</th>
                        <th className="py-2">{t.date}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunityApps.map((row) => (
                        <tr key={row.id} className="border-b border-neutral-100 dark:border-neutral-700">
                          <td className="py-2 pr-4">{row.applicant_email}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 rounded text-xs ${statusColor(row.status)}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-2 pr-4">{opportunityLabel(row.opportunity_id)}</td>
                          <td className="py-2 pr-4 text-xs truncate max-w-[120px]">
                            {row.cv_file_name || '—'}
                          </td>
                          <td className="py-2 text-neutral-500">{formatDate(row.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="bg-white dark:bg-neutral-800 rounded-lg border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">{t.internshipPositions}</h2>
                <Link href={`/${locale}/internship/applications`} className="text-sm text-[#990000] hover:underline">
                  {t.viewInternship}
                </Link>
              </div>
              <ul className="space-y-2 text-sm">
                {positionCounts.map(([position, count]) => (
                  <li key={position} className="flex justify-between">
                    <span>{position}</span>
                    <span className="text-neutral-500">{count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
