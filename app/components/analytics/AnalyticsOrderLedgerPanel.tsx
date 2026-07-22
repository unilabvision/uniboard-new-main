'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Search,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  Gift,
} from 'lucide-react';
import type { CashflowSummary, OrderLedgerEntry } from '@/app/lib/analytics/types';

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
  searchPlaceholder: string;
  moneyIn: string;
  discountGiven: string;
  listVolume: string;
  orders: string;
  cartOrders: string;
  freeOrders: string;
  uniqueBuyers: string;
  orderNo: string;
  date: string;
  buyer: string;
  email: string;
  payment: string;
  status: string;
  items: string;
  list: string;
  paid: string;
  discount: string;
  codes: string;
  cart: string;
  expand: string;
  collapse: string;
  type: string;
};

export default function AnalyticsOrderLedgerPanel({
  locale,
  orders,
  cashflow,
  labels,
}: {
  locale: string;
  orders: OrderLedgerEntry[];
  cashflow: CashflowSummary;
  labels: Labels;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [onlyCart, setOnlyCart] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (onlyCart && !order.is_cart) return false;
      if (!q) return true;
      if (order.order_id.toLowerCase().includes(q)) return true;
      if (order.buyer_email.toLowerCase().includes(q)) return true;
      if ((order.buyer_name || '').toLowerCase().includes(q)) return true;
      if (order.course_label.toLowerCase().includes(q)) return true;
      if (order.discount_codes.some((c) => c.toLowerCase().includes(q))) return true;
      return order.items.some(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
      );
    });
  }, [orders, query, onlyCart]);

  const toggle = (orderId: string) => {
    setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  return (
    <section
      id="ledger"
      className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-8"
    >
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#990000]" />
            {labels.title}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">{labels.hint}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <label className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyCart}
              onChange={(e) => setOnlyCart(e.target.checked)}
              className="rounded border-neutral-300"
            />
            {labels.cartOrders}
          </label>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-900/30">
        <div>
          <p className="text-[11px] text-neutral-500 flex items-center gap-1">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
            {labels.moneyIn}
          </p>
          <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
            {formatCurrency(cashflow.money_in, locale)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-500 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-amber-600" />
            {labels.discountGiven}
          </p>
          <p className="text-lg font-semibold text-amber-700 dark:text-amber-400">
            {formatCurrency(cashflow.discount_given, locale)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-500">{labels.listVolume}</p>
          <p className="text-lg font-semibold">
            {formatCurrency(cashflow.list_volume, locale)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-500">{labels.orders}</p>
          <p className="text-lg font-semibold">{cashflow.order_count}</p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-500 flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" />
            {labels.cartOrders}
          </p>
          <p className="text-lg font-semibold">{cashflow.cart_order_count}</p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-500 flex items-center gap-1">
            <Gift className="w-3 h-3" />
            {labels.freeOrders}
          </p>
          <p className="text-lg font-semibold">{cashflow.free_order_count}</p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-500">{labels.uniqueBuyers}</p>
          <p className="text-lg font-semibold">{cashflow.unique_buyers}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium w-8" />
              <th className="text-left px-2 py-3 font-medium">{labels.orderNo}</th>
              <th className="text-left px-4 py-3 font-medium">{labels.date}</th>
              <th className="text-left px-4 py-3 font-medium">{labels.buyer}</th>
              <th className="text-left px-4 py-3 font-medium">{labels.items}</th>
              <th className="text-left px-4 py-3 font-medium">{labels.payment}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.list}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.paid}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.discount}</th>
              <th className="text-left px-6 py-3 font-medium">{labels.codes}</th>
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
              filtered.map((order) => {
                const isOpen = Boolean(expanded[order.order_id]);
                const itemPreview = order.items
                  .slice(0, 2)
                  .map((i) => i.title)
                  .join(', ');
                return (
                  <React.Fragment key={order.order_id}>
                    <tr className="border-t border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/30">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggle(order.order_id)}
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
                        <div className="font-mono text-xs sm:text-sm font-medium">
                          {order.order_id}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.is_cart && (
                            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {labels.cart}
                            </span>
                          )}
                          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                            {order.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleString(
                              locale === 'tr' ? 'tr-TR' : 'en-US'
                            )
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs sm:text-sm">
                          {order.buyer_email || '—'}
                        </div>
                        {order.buyer_name && (
                          <div className="text-[11px] text-neutral-500">
                            {order.buyer_name}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                        <div className="truncate max-w-[220px]" title={itemPreview}>
                          {itemPreview || order.course_label || '—'}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {order.items.length} {labels.items.toLowerCase()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                        {order.payment_method || '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-500">
                        {formatCurrency(order.list_total, locale)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(order.paid_total, locale)}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-700 dark:text-amber-400">
                        {formatCurrency(order.discount_amount, locale)}
                      </td>
                      <td className="px-6 py-3">
                        {order.discount_codes.length === 0 ? (
                          '—'
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {order.discount_codes.map((code) => (
                              <span
                                key={`${order.order_id}-${code}`}
                                className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#990000]/10 text-[#990000]"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-neutral-50/80 dark:bg-neutral-900/40">
                        <td colSpan={10} className="px-6 py-4">
                          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                            <table className="w-full text-xs sm:text-sm">
                              <thead className="bg-white dark:bg-neutral-800">
                                <tr>
                                  <th className="text-left px-4 py-2 font-medium">
                                    {labels.items}
                                  </th>
                                  <th className="text-left px-4 py-2 font-medium">
                                    {labels.type}
                                  </th>
                                  <th className="text-right px-4 py-2 font-medium">
                                    {labels.list}
                                  </th>
                                  <th className="text-right px-4 py-2 font-medium">
                                    {labels.paid}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item, idx) => (
                                  <tr
                                    key={`${order.order_id}-${item.id}-${idx}`}
                                    className="border-t border-neutral-100 dark:border-neutral-700"
                                  >
                                    <td className="px-4 py-2">{item.title}</td>
                                    <td className="px-4 py-2">
                                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700">
                                        {item.type}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2 text-right text-neutral-500">
                                      {item.paid_price < item.list_price - 0.009 ? (
                                        <span className="line-through">
                                          {formatCurrency(item.list_price, locale)}
                                        </span>
                                      ) : (
                                        formatCurrency(item.list_price, locale)
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium">
                                      {formatCurrency(item.paid_price, locale)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
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
