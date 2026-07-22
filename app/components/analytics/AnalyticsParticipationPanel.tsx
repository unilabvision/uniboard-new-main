'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Search,
  Users,
  Package,
  ShoppingCart,
} from 'lucide-react';
import type { CourseParticipation } from '@/app/lib/analytics/types';

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
  course: string;
  enrollments: string;
  students: string;
  revenue: string;
  orders: string;
  discount: string;
  avgProgress: string;
  completed: string;
  email: string;
  name: string;
  modules: string;
  paid: string;
  list: string;
  codes: string;
  enrolledAt: string;
  orderNo: string;
  searchPlaceholder: string;
  fullCourse: string;
  certificate: string;
  expand: string;
  collapse: string;
  moduleBreakdown: string;
  studentCount: string;
  cartItems: string;
  orderList: string;
  catalogList: string;
};

export default function AnalyticsParticipationPanel({
  locale,
  courses,
  labels,
}: {
  locale: string;
  courses: CourseParticipation[];
  labels: Labels;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses
      .map((course) => {
        const courseHit = course.course_name.toLowerCase().includes(q);
        const students = course.students.filter(
          (student) =>
            student.email.toLowerCase().includes(q) ||
            (student.name || '').toLowerCase().includes(q) ||
            student.modules.some((m) => m.toLowerCase().includes(q)) ||
            student.discount_codes.some((c) => c.toLowerCase().includes(q)) ||
            student.order_refs.some((o) => o.toLowerCase().includes(q))
        );
        if (courseHit) return course;
        if (students.length === 0) return null;
        return { ...course, students };
      })
      .filter(Boolean) as CourseParticipation[];
  }, [courses, query]);

  const toggle = (courseId: string) => {
    setExpanded((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  return (
    <section
      id="enrollments"
      className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-900/50">
            <tr>
              <th className="text-left px-6 py-3 font-medium w-8" />
              <th className="text-left px-2 py-3 font-medium">{labels.course}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.enrollments}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.students}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.revenue}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.orders}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.discount}</th>
              <th className="text-right px-4 py-3 font-medium">{labels.avgProgress}</th>
              <th className="text-right px-6 py-3 font-medium">{labels.completed}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-neutral-500">
                  {labels.empty}
                </td>
              </tr>
            ) : (
              filtered.map((course) => {
                const isOpen = Boolean(expanded[course.course_id]);
                return (
                  <React.Fragment key={course.course_id}>
                    <tr className="border-t border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/30">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggle(course.course_id)}
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
                      <td className="px-2 py-3 text-neutral-900 dark:text-neutral-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{course.course_name}</span>
                          {course.is_certificate && (
                            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              {labels.certificate}
                            </span>
                          )}
                        </div>
                        {course.module_breakdown.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {course.module_breakdown.slice(0, 4).map((mod) => (
                              <span
                                key={`${course.course_id}-${mod.title}`}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                              >
                                {mod.title} · {mod.count}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{course.enrollments}</td>
                      <td className="px-4 py-3 text-right">{course.unique_students}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(course.revenue, locale)}
                      </td>
                      <td className="px-4 py-3 text-right">{course.orders}</td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(course.discount_amount, locale)}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                        {course.is_certificate
                          ? '—'
                          : `${course.avg_progress.toFixed(1)}%`}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {course.is_certificate ? '—' : course.completed}
                      </td>
                    </tr>

                    {isOpen && (
                      <tr className="bg-neutral-50/80 dark:bg-neutral-900/40">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="mb-3 flex flex-wrap gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                              <Users className="w-3 h-3" />
                              {course.students.length} {labels.studentCount}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                              <ShoppingCart className="w-3 h-3" />
                              {labels.revenue}:{' '}
                              {formatCurrency(course.revenue, locale)}
                            </span>
                            <span className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                              {labels.list}:{' '}
                              {formatCurrency(course.list_revenue || 0, locale)}
                            </span>
                            <span className="px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                              {labels.discount}:{' '}
                              {formatCurrency(course.discount_amount, locale)}
                            </span>
                          </div>

                          {course.module_breakdown.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[11px] text-neutral-500 mb-1 flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {labels.moduleBreakdown}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {course.module_breakdown.map((mod) => (
                                  <span
                                    key={`bd-${course.course_id}-${mod.title}`}
                                    className="text-xs px-2 py-1 rounded-md bg-[#990000]/10 text-[#990000] border border-[#990000]/20"
                                  >
                                    {mod.title}: {mod.count}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {course.students.length === 0 ? (
                            <div className="flex items-center gap-2 text-neutral-500 text-sm">
                              <Users className="w-4 h-4" />
                              {labels.empty}
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                              <table className="w-full text-xs sm:text-sm">
                                <thead className="bg-white dark:bg-neutral-800">
                                  <tr>
                                    <th className="text-left px-4 py-2 font-medium">
                                      {labels.email}
                                    </th>
                                    <th className="text-left px-4 py-2 font-medium">
                                      {labels.name}
                                    </th>
                                    <th className="text-left px-4 py-2 font-medium">
                                      {labels.modules}
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
                                    <th className="text-left px-4 py-2 font-medium">
                                      {labels.codes}
                                    </th>
                                    <th className="text-left px-4 py-2 font-medium">
                                      {labels.orderNo}
                                    </th>
                                    <th className="text-right px-4 py-2 font-medium">
                                      {labels.avgProgress}
                                    </th>
                                    <th className="text-right px-4 py-2 font-medium">
                                      {labels.enrolledAt}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {course.students.map((student) => (
                                    <tr
                                      key={`${course.course_id}-${student.user_id}`}
                                      className="border-t border-neutral-100 dark:border-neutral-700 align-top"
                                    >
                                      <td className="px-4 py-2 font-mono text-neutral-800 dark:text-neutral-200">
                                        <div className="min-w-[14rem] max-w-sm">
                                          <div className="break-all">
                                            {student.email || '—'}
                                          </div>
                                          {student.purchase_items.length > 0 && (
                                            <div className="mt-2 space-y-1.5">
                                              <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-sans">
                                                {labels.cartItems}
                                              </p>
                                              <ul className="space-y-1.5 font-sans">
                                                {student.purchase_items.map(
                                                  (item, idx) => {
                                                    const displayList =
                                                      item.catalog_list_price !=
                                                        null &&
                                                      item.catalog_list_price > 0
                                                        ? item.catalog_list_price
                                                        : item.list_price;
                                                    const orderDiffers =
                                                      item.catalog_list_price !=
                                                        null &&
                                                      item.catalog_list_price >
                                                        0 &&
                                                      Math.abs(
                                                        item.list_price -
                                                          item.catalog_list_price
                                                      ) > 0.5;
                                                    return (
                                                      <li
                                                        key={`${student.user_id}-${item.order_id}-${item.title}-${idx}`}
                                                        className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1.5"
                                                      >
                                                        <div className="flex items-start gap-1.5">
                                                          {item.is_cart && (
                                                            <ShoppingCart className="w-3 h-3 mt-0.5 text-neutral-400 shrink-0" />
                                                          )}
                                                          <div className="min-w-0">
                                                            <p className="text-[11px] text-neutral-800 dark:text-neutral-200 leading-snug break-words">
                                                              {item.title}
                                                            </p>
                                                            <p className="text-[10px] text-neutral-500 mt-0.5">
                                                              {labels.list}{' '}
                                                              {formatCurrency(
                                                                displayList,
                                                                locale
                                                              )}
                                                              {' · '}
                                                              {labels.paid}{' '}
                                                              {formatCurrency(
                                                                item.paid_price,
                                                                locale
                                                              )}
                                                            </p>
                                                            {orderDiffers && (
                                                              <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                                                                {labels.orderList}:{' '}
                                                                {formatCurrency(
                                                                  item.list_price,
                                                                  locale
                                                                )}
                                                              </p>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </li>
                                                    );
                                                  }
                                                )}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-2">
                                        {student.name || '—'}
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="flex flex-wrap gap-1">
                                          {(student.modules.length
                                            ? student.modules
                                            : [labels.fullCourse]
                                          ).map((mod) => (
                                            <span
                                              key={`${student.user_id}-${mod}`}
                                              className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200"
                                            >
                                              {mod}
                                            </span>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-4 py-2 text-right text-neutral-500">
                                        <div>
                                          {formatCurrency(
                                            student.list_amount || 0,
                                            locale
                                          )}
                                        </div>
                                        {student.order_list_amount > 0 &&
                                          Math.abs(
                                            student.order_list_amount -
                                              student.list_amount
                                          ) > 0.5 && (
                                            <div
                                              className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5"
                                              title={labels.orderList}
                                            >
                                              {labels.orderList}:{' '}
                                              {formatCurrency(
                                                student.order_list_amount,
                                                locale
                                              )}
                                            </div>
                                          )}
                                      </td>
                                      <td className="px-4 py-2 text-right font-medium">
                                        {formatCurrency(student.paid_amount, locale)}
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                        {formatCurrency(
                                          student.discount_amount,
                                          locale
                                        )}
                                      </td>
                                      <td className="px-4 py-2">
                                        {student.discount_codes.length === 0 ? (
                                          '—'
                                        ) : (
                                          <div className="flex flex-wrap gap-1">
                                            {student.discount_codes.map((code) => (
                                              <span
                                                key={`${student.user_id}-${code}`}
                                                className="font-mono px-1.5 py-0.5 rounded bg-[#990000]/10 text-[#990000]"
                                              >
                                                {code}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 font-mono text-[11px] text-neutral-500">
                                        {student.order_refs.length
                                          ? student.order_refs.slice(0, 2).join(', ')
                                          : '—'}
                                        {student.order_refs.length > 2
                                          ? ` +${student.order_refs.length - 2}`
                                          : ''}
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                        {course.is_certificate
                                          ? '—'
                                          : `${student.progress.toFixed(0)}%`}
                                      </td>
                                      <td className="px-4 py-2 text-right text-neutral-500">
                                        {student.enrolled_at
                                          ? new Date(
                                              student.enrolled_at
                                            ).toLocaleDateString(
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
