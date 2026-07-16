'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Copy,
  Check,
  Tag,
  Mail,
  Search,
  RefreshCw,
  X,
  Clock,
  Users,
  Percent,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  daysLeft,
  getCodeStatus,
  normalizeDiscountCode,
  type CodeStatus,
  type InfluencerDiscountCode,
} from '@/app/lib/influencer/codes';

type UsageRow = {
  orderid: string;
  useremail: string;
  coursename: string | null;
  amount: number;
  discountamount: number;
  created_at: string;
  commission_amount: number;
  commission_rate: number;
};

type UsageSummary = {
  totalUses: number;
  uniqueEmails: number;
  totalAmount: number;
  totalCommission: number;
};

type FilterKey = 'all' | CodeStatus;

const texts = {
  tr: {
    title: 'Kodlarım',
    subtitle:
      'Kendi indirim kodlarınızı oluşturun, yalnızca size ait kodları görün ve hangi e-postaların kullandığını takip edin.',
    create: 'Yeni kod',
    refresh: 'Yenile',
    search: 'Kod ara…',
    filters: { all: 'Tümü', active: 'Aktif', used: 'Kullanıldı', expired: 'Süresi doldu' },
    emptyTitle: 'Henüz kodunuz yok',
    emptySubtitle: 'İlk indirim kodunuzu oluşturarak satış takibine başlayın.',
    copy: 'Kopyala',
    copied: 'Kopyalandı',
    uses: 'kullanım',
    emails: 'e-posta',
    detail: 'Kullananlar',
    discount: 'İndirim',
    commission: 'Komisyon',
    validUntil: 'Geçerlilik',
    oneTime: 'Tek kullanım',
    multiUse: 'Çoklu kullanım',
    daysLeft: 'gün kaldı',
    loading: 'Yükleniyor…',
    error: 'Veriler yüklenemedi',
    createTitle: 'Yeni indirim kodu',
    codeLabel: 'Kod',
    codeHint: 'Büyük harf, rakam, - ve _',
    typeLabel: 'İndirim tipi',
    percentage: 'Yüzde (%)',
    fixed: 'Sabit (₺)',
    amountLabel: 'İndirim miktarı',
    validLabel: 'Son geçerlilik tarihi',
    commissionLabel: 'Komisyon oranı (%)',
    oneTimeLabel: 'Tek kullanımlık kod',
    cancel: 'İptal',
    save: 'Oluştur',
    saving: 'Oluşturuluyor…',
    usageTitle: 'Kod kullanım detayı',
    usageEmpty: 'Bu kod henüz hiç kullanılmamış.',
    studentEmail: 'E-posta',
    course: 'Kurs',
    amount: 'Tutar',
    date: 'Tarih',
    summaryUses: 'Toplam kullanım',
    summaryEmails: 'Benzersiz e-posta',
    summarySales: 'Toplam satış',
    summaryCommission: 'Komisyon',
    close: 'Kapat',
    createError: 'Kod oluşturulamadı',
    loadUsageError: 'Kullanım bilgisi alınamadı',
  },
  en: {
    title: 'My Codes',
    subtitle:
      'Create your own discount codes, see only your codes, and track which emails used them.',
    create: 'New code',
    refresh: 'Refresh',
    search: 'Search code…',
    filters: { all: 'All', active: 'Active', used: 'Used', expired: 'Expired' },
    emptyTitle: 'No codes yet',
    emptySubtitle: 'Create your first discount code to start tracking sales.',
    copy: 'Copy',
    copied: 'Copied',
    uses: 'uses',
    emails: 'emails',
    detail: 'Users',
    discount: 'Discount',
    commission: 'Commission',
    validUntil: 'Valid until',
    oneTime: 'One-time',
    multiUse: 'Multi-use',
    daysLeft: 'days left',
    loading: 'Loading…',
    error: 'Failed to load data',
    createTitle: 'New discount code',
    codeLabel: 'Code',
    codeHint: 'Uppercase, numbers, - and _',
    typeLabel: 'Discount type',
    percentage: 'Percentage (%)',
    fixed: 'Fixed (₺)',
    amountLabel: 'Discount amount',
    validLabel: 'Valid until',
    commissionLabel: 'Commission rate (%)',
    oneTimeLabel: 'One-time code',
    cancel: 'Cancel',
    save: 'Create',
    saving: 'Creating…',
    usageTitle: 'Code usage detail',
    usageEmpty: 'This code has not been used yet.',
    studentEmail: 'Email',
    course: 'Course',
    amount: 'Amount',
    date: 'Date',
    summaryUses: 'Total uses',
    summaryEmails: 'Unique emails',
    summarySales: 'Total sales',
    summaryCommission: 'Commission',
    close: 'Close',
    createError: 'Could not create code',
    loadUsageError: 'Could not load usage',
  },
};

function formatMoney(value: number, locale: string) {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusClass(status: CodeStatus) {
  if (status === 'used') {
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  }
  if (status === 'expired') {
    return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
  }
  return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
}

function defaultValidUntil() {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

export default function InfluencerCodesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const { user, isLoaded } = useUser();

  const [codes, setCodes] = useState<
    (InfluencerDiscountCode & {
      usage?: { uses: number; emails: number; totalAmount: number };
    })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_amount: '15',
    valid_until: defaultValidUntil(),
    commission: '15',
    is_one_time: false,
  });

  const [selectedCode, setSelectedCode] = useState<InfluencerDiscountCode | null>(null);
  const [usages, setUsages] = useState<UsageRow[]>([]);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/influencer/discount-codes');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.error);
      setCodes((data.codes || []) as InfluencerDiscountCode[]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  }, [t.error]);

  useEffect(() => {
    if (isLoaded && user) {
      void loadCodes();
    }
  }, [isLoaded, user, loadCodes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return codes.filter((code) => {
      const status = getCodeStatus(code);
      if (filter !== 'all' && status !== filter) return false;
      if (q && !code.code.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [codes, filter, search]);

  const filterCounts = useMemo(() => {
    const base = { all: codes.length, active: 0, used: 0, expired: 0 };
    codes.forEach((c) => {
      base[getCodeStatus(c)] += 1;
    });
    return base;
  }, [codes]);

  const copyCode = async (code: InfluencerDiscountCode) => {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopiedId(code.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const openUsage = async (code: InfluencerDiscountCode) => {
    setSelectedCode(code);
    setUsageLoading(true);
    setUsageError(null);
    setUsages([]);
    setUsageSummary(null);
    try {
      const res = await fetch(`/api/influencer/discount-codes/${code.id}/usage`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.loadUsageError);
      setUsages(data.usages || []);
      setUsageSummary(data.summary || null);
      setCodes((prev) =>
        prev.map((c) =>
          c.id === code.id
            ? {
                ...c,
                usage: {
                  uses: data.summary?.totalUses ?? 0,
                  emails: data.summary?.uniqueEmails ?? 0,
                  totalAmount: data.summary?.totalAmount ?? 0,
                },
              }
            : c
        )
      );
    } catch (err) {
      setUsageError(err instanceof Error ? err.message : t.loadUsageError);
    } finally {
      setUsageLoading(false);
    }
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/influencer/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: normalizeDiscountCode(form.code),
          discount_type: form.discount_type,
          discount_amount: Number(form.discount_amount),
          valid_until: form.valid_until,
          commission: Number(form.commission),
          is_one_time: form.is_one_time,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.createError);
      setShowCreate(false);
      setForm({
        code: '',
        discount_type: 'percentage',
        discount_amount: '15',
        valid_until: defaultValidUntil(),
        commission: '15',
        is_one_time: false,
      });
      await loadCodes();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t.createError);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-500">
        {t.loading}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Lütfen giriş yapınız.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {t.title}
            </h1>
            <div className="w-8 h-px bg-[#990000] mt-2 mb-3" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl">
              {t.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadCodes()}
              className="inline-flex items-center px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              {t.refresh}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center px-3 py-2 text-sm rounded-lg bg-[#990000] text-white hover:bg-[#880000]"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {t.create}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(t.filters) as FilterKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  filter === key
                    ? 'bg-[#990000] text-white'
                    : 'bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {t.filters[key]}
                <span className="ml-1.5 opacity-70">{filterCounts[key]}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-neutral-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            {t.loading}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300 p-4">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 p-10 text-center">
            <Tag className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
            <h2 className="font-medium text-neutral-900 dark:text-neutral-100">{t.emptyTitle}</h2>
            <p className="text-sm text-neutral-500 mt-1 mb-4">{t.emptySubtitle}</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center px-3 py-2 text-sm rounded-lg bg-[#990000] text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {t.create}
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((code) => {
              const status = getCodeStatus(code);
              const counts = code.usage;
              return (
                <div
                  key={code.id}
                  className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-mono text-lg font-semibold tracking-wide text-neutral-900 dark:text-neutral-100">
                        {code.code}
                      </p>
                      <span
                        className={`inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusClass(status)}`}
                      >
                        {t.filters[status]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void copyCode(code)}
                      className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                      title={t.copy}
                    >
                      {copiedId === code.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400 mb-4 flex-1">
                    <p className="flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5" />
                      {t.discount}:{' '}
                      <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                        {code.discount_type === 'percentage'
                          ? `%${code.discount_amount}`
                          : formatMoney(code.discount_amount, locale)}
                      </span>
                    </p>
                    <p>
                      {t.commission}:{' '}
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        %{code.commission ?? 15}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {t.validUntil}: {formatDate(code.valid_until, locale)}
                      {status === 'active' && (
                        <span className="text-xs text-neutral-500">
                          · {daysLeft(code.valid_until)} {t.daysLeft}
                        </span>
                      )}
                    </p>
                    <p className="text-xs">
                      {code.is_one_time ? t.oneTime : t.multiUse}
                      {code.is_one_time && code.used_by ? ` · ${code.used_by}` : ''}
                    </p>
                    {counts && (
                      <p className="flex items-center gap-1.5 text-xs pt-1">
                        <Users className="w-3.5 h-3.5" />
                        {counts.uses} {t.uses} · {counts.emails} {t.emails}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void openUsage(code)}
                    className="w-full inline-flex items-center justify-between px-3 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-900/50 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      {t.detail}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="font-semibold">{t.createTitle}</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitCreate} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">{t.codeLabel}</label>
                <input
                  required
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: normalizeDiscountCode(e.target.value) }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono uppercase dark:bg-neutral-900 dark:border-neutral-600"
                  placeholder="ORNEK10"
                />
                <p className="text-[11px] text-neutral-500 mt-1">{t.codeHint}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">{t.typeLabel}</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        discount_type: e.target.value as 'percentage' | 'fixed',
                      }))
                    }
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-600"
                  >
                    <option value="percentage">{t.percentage}</option>
                    <option value="fixed">{t.fixed}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.amountLabel}</label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.discount_amount}
                    onChange={(e) => setForm((f) => ({ ...f, discount_amount: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">{t.validLabel}</label>
                  <input
                    required
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">{t.commissionLabel}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.commission}
                    onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-600"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_one_time}
                  onChange={(e) => setForm((f) => ({ ...f, is_one_time: e.target.checked }))}
                />
                {t.oneTimeLabel}
              </label>
              {createError && <p className="text-xs text-red-600">{createError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-2 text-sm rounded-lg border dark:border-neutral-600"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-2 text-sm rounded-lg bg-[#990000] text-white disabled:opacity-50"
                >
                  {saving ? t.saving : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usage drawer */}
      {selectedCode && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-lg h-full bg-white dark:bg-neutral-900 shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <div>
                <p className="text-xs text-neutral-500">{t.usageTitle}</p>
                <p className="font-mono font-semibold text-lg">{selectedCode.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCode(null)}
                className="p-1"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {usageSummary && (
              <div className="grid grid-cols-2 gap-2 p-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3">
                  <p className="text-[11px] text-neutral-500">{t.summaryUses}</p>
                  <p className="font-semibold">{usageSummary.totalUses}</p>
                </div>
                <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3">
                  <p className="text-[11px] text-neutral-500">{t.summaryEmails}</p>
                  <p className="font-semibold">{usageSummary.uniqueEmails}</p>
                </div>
                <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3">
                  <p className="text-[11px] text-neutral-500">{t.summarySales}</p>
                  <p className="font-semibold">
                    {formatMoney(usageSummary.totalAmount, locale)}
                  </p>
                </div>
                <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800 p-3">
                  <p className="text-[11px] text-neutral-500">{t.summaryCommission}</p>
                  <p className="font-semibold text-[#990000]">
                    {formatMoney(usageSummary.totalCommission, locale)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {usageLoading ? (
                <div className="flex items-center gap-2 text-neutral-500 py-8 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.loading}
                </div>
              ) : usageError ? (
                <p className="text-sm text-red-600">{usageError}</p>
              ) : usages.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-8">{t.usageEmpty}</p>
              ) : (
                <div className="space-y-2">
                  {usages.map((u) => (
                    <div
                      key={u.orderid}
                      className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 break-all flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                            {u.useremail || '—'}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1 truncate">
                            {u.coursename || t.course}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">
                            {formatMoney(u.amount, locale)}
                          </p>
                          <p className="text-[11px] text-[#990000]">
                            {formatMoney(u.commission_amount, locale)}
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-2">
                        {formatDate(u.created_at, locale)} · #{u.orderid}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
