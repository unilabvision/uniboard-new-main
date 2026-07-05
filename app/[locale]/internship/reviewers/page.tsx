'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, RefreshCw, Mail, Shield, Check, X } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { internshipDb } from '@/app/lib/internship/config';
import type { InternshipReviewer } from '@/app/types/internship';

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL2 || '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 || '',
});

function BoolBadge({ value, label }: { value: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
        value
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700'
      }`}
    >
      {value ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default function InternshipReviewersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [reviewers, setReviewers] = useState<InternshipReviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const t =
    locale === 'tr'
      ? {
          title: 'Reviewer Yönetimi',
          subtitle: 'internship_reviewers tablosu',
          empty: 'Reviewer kaydı yok',
          refresh: 'Yenile',
          name: 'Ad',
          email: 'E-posta',
          role: 'Rol',
          active: 'Aktif',
          vote: 'Oy',
          status: 'Durum',
          notes: 'Not',
          you: 'Siz',
        }
      : {
          title: 'Reviewer Management',
          subtitle: 'internship_reviewers table',
          empty: 'No reviewers',
          refresh: 'Refresh',
          name: 'Name',
          email: 'Email',
          role: 'Role',
          active: 'Active',
          vote: 'Vote',
          status: 'Status',
          notes: 'Notes',
          you: 'You',
        };

  useEffect(() => {
    params.then((p) => setLocale(p.locale || 'tr'));
  }, [params]);

  const loadReviewers = async () => {
    setLoading(true);
    setError(null);
    const { data, error: qError } = await supabase
      .from(internshipDb.reviewers)
      .select(
        'id, clerk_id, email, name, role, is_active, can_vote, can_change_status, can_add_notes, created_at, updated_at'
      )
      .order('created_at', { ascending: false });

    if (qError) setError(qError.message);
    else setReviewers((data || []) as InternshipReviewer[]);
    setLoading(false);
  };

  useEffect(() => {
    loadReviewers();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCheck className="w-7 h-7 text-[#990000]" />
              {t.title}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={loadReviewers}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="animate-pulse h-40 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
        ) : reviewers.length === 0 ? (
          <p className="text-neutral-500">{t.empty}</p>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">{t.name}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.email}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.role}</th>
                  <th className="text-left px-4 py-3 font-medium">{t.active}</th>
                  <th className="text-left px-4 py-3 font-medium">{locale === 'tr' ? 'Yetkiler' : 'Permissions'}</th>
                </tr>
              </thead>
              <tbody>
                {reviewers.map((row) => {
                  const isCurrentUser = user?.id === row.clerk_id;
                  return (
                    <tr
                      key={row.id}
                      className={`border-t border-neutral-100 dark:border-neutral-700 ${
                        isCurrentUser ? 'bg-[#990000]/5' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {row.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-[#990000]">({t.you})</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
                          <Mail className="w-3 h-3 shrink-0" />
                          {row.email}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-xs">
                          {row.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <BoolBadge value={row.is_active} label={t.active} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <BoolBadge value={row.can_vote} label={t.vote} />
                          <BoolBadge value={row.can_change_status} label={t.status} />
                          <BoolBadge value={row.can_add_notes} label={t.notes} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-neutral-500 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          clerk_id · can_vote · can_change_status · can_add_notes
        </p>
      </div>
    </div>
  );
}
