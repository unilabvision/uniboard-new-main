'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Search,
  Tag,
  Users,
  Percent,
  Mail,
} from 'lucide-react';
import type { DiscountCodeDetail } from '@/app/lib/analytics/types';

function formatCurrency(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount);
}

type Labels = {
  title: string;
  hint: string;
  empty: string;
  code: string;
  usage: string;
  discount: string;
  paid: string;
  list: string;
  course: string;
  influencer: string;
  email: string;
  module: string;
  date: string;
  orderNo: string;
  searchPlaceholder: string;
  expand: string;
  collapse: string;
  noInfluencer: string;
  type: string;
  uniqueBuyers: string;
  commission: string;
  estimatedCommission: string;
  dbUsage: string;
  validUntil: string;
  buyersPreview: string;
};

export default function AnalyticsDiscountUsagePanel({
  locale,
  codes,
  labels,
}: {
  locale: string;
  codes: DiscountCodeDetail[];
  labels: Labels;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return codes;
    return codes.filter((row) => {
      if (row.code.toLowerCase().includes(q)) return true;
      if ((row.influencer_name || '').toLowerCase().includes(q)) return true;
      if ((row.influencer_email || '').toLowerCase().includes(q)) return true;
      return row.usages.some(
        (u) =>
          u.buyer_email.toLowerCase().includes(q) ||
          u.course_name.toLowerCase().includes(q) ||
          u.order_ref.toLowerCase().includes(q)
      );
    });
  }, [codes, query]);

  const summary = useMemo(() => {
    const uniqueEmails = new Set<string>();
    let totalDiscount = 0;
    let totalPaid = 0;
    let totalUses = 0;
    codes.forEach((row) => {
      totalDiscount += row.total_discount;
      totalPaid += row.total_paid;
      totalUses += row.usage_count;
      row.usages.forEach((u) => {
        if (u.buyer_email) uniqueEmails.add(u.buyer_email);
      });
    });
    return {
      codes: codes.length,
      uses: totalUses,
      buyers: uniqueEmails.size,
      discount: totalDiscount,
      paid: totalPaid,
    };
  }, [codes]);

  const toggle = (code: string) => {
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <section className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#990000]" />
            {labels.title}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">{labels.hint}</p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-900/30">
        <div>
          <p className="text-[11px] text-neutral-500">{labels.code}</p>
          <p className="text-lg font-semibold">{summary.codes}</p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-500">{labels.usage}</p>
          <p className="text-lg font-semibold">{summary.uses}</p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-500">{labels.uniqueBuyers}</p>
          <p className="text-lg font-semibold">{summary.buyers}</p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-500">{labels.discount}</p>
          <p className="text-lg font-semibold">
            {formatCurrency(summary.discount, locale)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-500">{labels.paid}</p>
          <p className="text-lg font-semibold">
            {formatCurrency(summary.paid, locale)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium w-8" />
              <th className="text-left px-2 py-3 font-medium">{labels.code}</th>
              <th className="text-left px-4 py-3 font-medium">{labels.influencer}</th>
              <th className="text-left px-4 py-3 font-medium">{labels.type}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.usage}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.uniqueBuyers}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.discount}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.paid}</th>
              <th className="text-right px-4 py-3 font-medium">
                {labels.estimatedCommission}
              </th>
              <th className="text-left px-6 py-3 font-medium">{labels.course}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-neutral-500">
                  {labels.empty}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const isOpen = Boolean(expanded[row.code]);
                const typeLabel =
                  row.discount_type && row.discount_value != null
                    ? row.discount_type === 'percentage'
                      ? `%${row.discount_value}`
                      : formatCurrency(row.discount_value, locale)
                    : '—';
                const buyerPreview = [
                  ...new Set(
                    row.usages.map((u) => u.buyer_email).filter(Boolean)
                  ),
                ].slice(0, 3);

                return (
                  <React.Fragment key={row.code}>
                    <tr className="border-t border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/30">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggle(row.code)}
                          className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
                          aria-label={isOpen ? labels.collapse : labels.expand}
                        >
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-2 py-3">
                        <div className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                          {row.code}
                        </div>
                        {(row.db_usage_count != null || row.max_usage != null) && (
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            {labels.dbUsage}: {row.db_usage_count ?? 0}
                            {row.max_usage != null ? ` / ${row.max_usage}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-neutral-900 dark:text-neutral-100">
                          {row.influencer_name || labels.noInfluencer}
                        </div>
                        {row.influencer_email && (
                          <div className="text-xs font-mono text-neutral-500">
                            {row.influencer_email}
                          </div>
                        )}
                        {row.commission != null && (
                          <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            {labels.commission}: %{row.commission}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                        {typeLabel}
                        {row.valid_until && (
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            {labels.validUntil}:{' '}
                            {new Date(row.valid_until).toLocaleDateString(
                              locale === 'tr' ? 'tr-TR' : 'en-US'
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{row.usage_count}</td>
                      <td className="px-4 py-3 text-right">{row.unique_buyers}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(row.total_discount, locale)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(row.total_paid, locale)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(row.estimated_commission, locale)}
                      </td>
                      <td className="px-6 py-3 text-neutral-600 dark:text-neutral-400">
                        <div>
                          {row.courses.slice(0, 2).join(', ')}
                          {row.courses.length > 2
                            ? ` +${row.courses.length - 2}`
                            : ''}
                        </div>
                        {buyerPreview.length > 0 && (
                          <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {labels.buyersPreview}: {buyerPreview.join(', ')}
                              {row.unique_buyers > buyerPreview.length
                                ? ` +${row.unique_buyers - buyerPreview.length}`
                                : ''}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-neutral-50/80 dark:bg-neutral-900/40">
                        <td colSpan={10} className="px-6 py-4">
                          <div className="mb-3 flex flex-wrap gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                              <Users className="w-3 h-3" />
                              {row.unique_buyers} {labels.uniqueBuyers}
                            </span>
                            <span className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                              {labels.list}: {formatCurrency(row.total_list, locale)}
                            </span>
                            <span className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                              {labels.discount}:{' '}
                              {formatCurrency(row.total_discount, locale)}
                            </span>
                            <span className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                              {labels.paid}: {formatCurrency(row.total_paid, locale)}
                            </span>
                          </div>

                          {row.usages.length === 0 ? (
                            <p className="text-sm text-neutral-500">{labels.empty}</p>
                          ) : (
                            <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                              <table className="w-full text-xs sm:text-sm">
                                <thead className="bg-white dark:bg-neutral-800">
                                  <tr>
                                    <th className="text-left px-4 py-2 font-medium">
                                      {labels.orderNo}
                                    </th>
                                    <th className="text-left px-4 py-2 font-medium">
                                      {labels.email}
                                    </th>
                                    <th className="text-left px-4 py-2 font-medium">
                                      {labels.course}
                                    </th>
                                    <th className="text-left px-4 py-2 font-medium">
                                      {labels.module}
                                    </th>
                                    <th className="text-right px-4 py-2 font-medium">
                                      {labels.list}
                                    </th>
                                    <th className="text-right px-4 py-2 font-medium">
                                      {labels.paid}
                                    </th>
                                    <th className="text-right px-4 py-2 font-medium">
                                      {labels.discount}
                                    </th>
                                    <th className="text-right px-4 py-2 font-medium">
                                      {labels.date}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.usages.map((usage, idx) => (
                                    <tr
                                      key={`${row.code}-${usage.order_ref}-${idx}`}
                                      className="border-t border-neutral-100 dark:border-neutral-700"
                                    >
                                      <td className="px-4 py-2 font-mono text-[11px]">
                                        {usage.order_ref}
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="font-mono">
                                          {usage.buyer_email || '—'}
                                        </div>
                                        {usage.buyer_name && (
                                          <div className="text-[11px] text-neutral-500">
                                            {usage.buyer_name}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-4 py-2">{usage.course_name}</td>
                                      <td className="px-4 py-2">
                                        {usage.module_title || '—'}
                                      </td>
                                      <td className="px-4 py-2 text-right text-neutral-500">
                                        {formatCurrency(usage.list_amount, locale)}
                                      </td>
                                      <td className="px-4 py-2 text-right font-medium">
                                        {formatCurrency(usage.paid_amount, locale)}
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                        {formatCurrency(
                                          usage.discount_amount,
                                          locale
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-right text-neutral-500">
                                        {usage.created_at
                                          ? new Date(
                                              usage.created_at
                                            ).toLocaleString(
                                              locale === 'tr' ? 'tr-TR' : 'en-US'
                                            )
                                          : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
