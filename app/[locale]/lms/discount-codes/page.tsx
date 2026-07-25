'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Copy,
  CheckCircle,
  X,
  Loader2,
  Percent,
} from 'lucide-react';

interface DiscountCodeRow {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: string;
  valid_until: string;
  applicable_courses: string[] | null;
  max_usage: number;
  usage_count: number;
  has_balance_limit: boolean;
  remaining_balance: number | null;
  initial_balance?: number | null;
  minimum_order_amount?: number | null;
  maximum_order_amount?: number | null;
  full_course_only?: boolean;
  is_campaign: boolean;
  campaign_name: string | null;
  campaign_description: string | null;
  created_at: string | null;
}

interface CourseOption {
  id: string;
  title: string;
  slug: string;
}

const emptyForm = {
  code: '',
  discount_amount: 15,
  discount_type: 'percentage' as 'percentage' | 'fixed',
  valid_until: '',
  max_usage: 100,
  applicable_course_ids: [] as string[],
  has_balance_limit: false,
  remaining_balance: 0,
  initial_balance: 0,
  minimum_order_amount: 0,
  maximum_order_amount: 0,
  full_course_only: false,
  is_campaign: false,
  campaign_name: '',
  campaign_description: '',
};

export default function LmsDiscountCodesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'tr';
  const isTr = locale === 'tr';

  const [list, setList] = useState<DiscountCodeRow[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [courseSearch, setCourseSearch] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lms/discount-codes');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || (isTr ? 'Liste alınamadı' : 'Failed to load'));
        setList([]);
        return;
      }
      setList(Array.isArray(json.data) ? json.data : []);
    } catch {
      setError(isTr ? 'Bağlantı hatası' : 'Connection error');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [isTr]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch('/api/lms/courses');
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) setCourses(json.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchList();
    fetchCourses();
  }, [fetchList, fetchCourses]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCourseSearch('');
    setSubmitError(null);
    setModalOpen(true);
  };

  const openEdit = (row: DiscountCodeRow) => {
    setEditingId(row.id);
    setForm({
      code: row.code,
      discount_amount: row.discount_amount,
      discount_type: row.discount_type === 'fixed' ? 'fixed' : 'percentage',
      valid_until: row.valid_until || '',
      max_usage: row.max_usage,
      applicable_course_ids: Array.isArray(row.applicable_courses) ? row.applicable_courses : [],
      has_balance_limit: row.has_balance_limit,
      remaining_balance: row.remaining_balance ?? 0,
      // DB may not have initial_balance yet — fall back to remaining for the form seed.
      initial_balance: row.initial_balance ?? row.remaining_balance ?? 0,
      minimum_order_amount: row.minimum_order_amount ?? 0,
      maximum_order_amount: row.maximum_order_amount ?? 0,
      full_course_only: !!row.full_course_only,
      is_campaign: row.is_campaign,
      campaign_name: row.campaign_name || '',
      campaign_description: row.campaign_description || '',
    });
    setCourseSearch('');
    setSubmitError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      const balanceSeed = Math.max(
        Number(form.remaining_balance) || 0,
        Number(form.initial_balance) || 0
      );
      const payload = {
        code: form.code.trim(),
        discount_amount: Number(form.discount_amount),
        discount_type: form.discount_type,
        valid_until: form.valid_until.trim(),
        max_usage: Math.max(1, Number(form.max_usage) || 1),
        applicable_courses: form.applicable_course_ids.length
          ? form.applicable_course_ids
          : null,
        has_balance_limit: form.has_balance_limit,
        // Prefer explicit remaining; otherwise seed from initial (DB column may be absent).
        remaining_balance: form.has_balance_limit
          ? Number(form.remaining_balance) || balanceSeed
          : null,
        minimum_order_amount:
          Number(form.minimum_order_amount) > 0 ? Number(form.minimum_order_amount) : null,
        maximum_order_amount:
          Number(form.maximum_order_amount) > 0 ? Number(form.maximum_order_amount) : null,
        full_course_only: form.full_course_only,
        is_campaign: form.is_campaign,
        campaign_name: form.campaign_name.trim() || null,
        campaign_description: form.campaign_description.trim() || null,
      };

      const res = await fetch(
        editingId ? `/api/lms/discount-codes/${editingId}` : '/api/lms/discount-codes',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error || (isTr ? 'Kaydedilemedi' : 'Save failed'));
        return;
      }
      closeModal();
      fetchList();
    } catch {
      setSubmitError(isTr ? 'İstek gönderilemedi' : 'Request failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(isTr ? `"${code}" silinsin mi?` : `Delete "${code}"?`)) return;
    const res = await fetch(`/api/lms/discount-codes/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      alert(json.error || (isTr ? 'Silinemedi' : 'Delete failed'));
      return;
    }
    fetchList();
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const filteredCourses = courses.filter((c) => {
    const q = courseSearch.trim().toLocaleLowerCase('tr-TR');
    if (!q) return true;
    return (
      c.title.toLocaleLowerCase('tr-TR').includes(q) ||
      c.slug.toLocaleLowerCase('tr-TR').includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {isTr ? 'İndirim Kodları' : 'Discount Codes'}
            </h1>
            <div className="w-8 h-px bg-[#990000] mt-2" />
            <p className="mt-2 text-sm text-neutral-500">
              {isTr
                ? 'Min/max sepet tutarı, kurs ataması ve yüzde/sabit indirimleri panelden yönetin.'
                : 'Manage min/max cart amounts, course assignment, and percentage/fixed discounts.'}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#990000] hover:bg-[#880000] text-white text-sm font-medium rounded-md"
          >
            <Plus className="w-4 h-4" />
            {isTr ? 'Yeni kod' : 'New code'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 p-10 text-center text-neutral-500">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {isTr ? 'Henüz indirim kodu yok' : 'No discount codes yet'}
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                      {row.code}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs rounded bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5">
                      <Percent className="w-3 h-3" />
                      {row.discount_type === 'percentage'
                        ? `%${row.discount_amount}`
                        : `${row.discount_amount}₺`}
                    </span>
                    {row.is_campaign && (
                      <span className="text-xs text-[#990000]">{isTr ? 'Kampanya' : 'Campaign'}</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {isTr ? 'Min' : 'Min'}: {row.minimum_order_amount ?? '—'}₺ ·{' '}
                    {isTr ? 'Max' : 'Max'}: {row.maximum_order_amount ?? '—'}₺ ·{' '}
                    {isTr ? 'Kurs' : 'Courses'}:{' '}
                    {row.applicable_courses?.length
                      ? row.applicable_courses.length
                      : isTr
                        ? 'tümü'
                        : 'all'}{' '}
                    · {row.usage_count}/{row.max_usage} · {row.valid_until}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyCode(row.code)}
                    className="p-2 rounded-md border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                    title={isTr ? 'Kopyala' : 'Copy'}
                  >
                    {copiedCode === row.code ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="p-2 rounded-md border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row.id, row.code)}
                    className="p-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                {editingId
                  ? isTr
                    ? 'Kodu düzenle'
                    : 'Edit code'
                  : isTr
                    ? 'Yeni indirim kodu'
                    : 'New discount code'}
              </h2>
              <button type="button" onClick={closeModal} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {submitError && (
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md p-2">{submitError}</p>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">{isTr ? 'Kod' : 'Code'}</label>
                <input
                  required
                  value={form.code}
                  disabled={!!editingId}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 disabled:opacity-60"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{isTr ? 'Tip' : 'Type'}</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        discount_type: e.target.value as 'percentage' | 'fixed',
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  >
                    <option value="percentage">{isTr ? 'Yüzde (%)' : 'Percentage (%)'}</option>
                    <option value="fixed">{isTr ? 'Sabit (₺)' : 'Fixed (₺)'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isTr ? 'Miktar' : 'Amount'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.discount_amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, discount_amount: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isTr ? 'Geçerlilik' : 'Valid until'}
                  </label>
                  <input
                    type="date"
                    required
                    value={form.valid_until}
                    onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isTr ? 'Maks. kullanım' : 'Max usage'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_usage}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, max_usage: Math.max(1, Number(e.target.value) || 1) }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isTr ? 'Min sepet (₺)' : 'Min cart (₺)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.minimum_order_amount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        minimum_order_amount: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {isTr ? 'Max sepet (₺)' : 'Max cart (₺)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.maximum_order_amount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maximum_order_amount: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  />
                </div>
              </div>
              <p className="text-xs text-neutral-500 -mt-2">
                {form.discount_type === 'percentage'
                  ? isTr
                    ? 'Yüzde kodlarda sepet tutarı bu TL aralığında olmalıdır (0 = sınırsız).'
                    : 'For percentage codes, cart total must be in this ₺ range (0 = none).'
                  : isTr
                    ? '0 = sınır yok. Sabit 2000₺+ kodlarda min otomatik (indirim+1) olabilir.'
                    : '0 = no limit. Fixed 2000₺+ may auto-raise min to discount+1.'}
              </p>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {isTr ? 'Uygulanacak kurslar (boş = tümü)' : 'Applicable courses (empty = all)'}
                </label>
                <input
                  type="search"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder={isTr ? 'Kurs ara…' : 'Search courses…'}
                  className="mb-2 w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                />
                <div className="max-h-36 overflow-y-auto rounded-lg border border-neutral-300 dark:border-neutral-600 p-2 space-y-1">
                  {filteredCourses.map((c) => {
                    const checked = form.applicable_course_ids.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setForm((f) => ({
                              ...f,
                              applicable_course_ids: checked
                                ? f.applicable_course_ids.filter((id) => id !== c.id)
                                : [...f.applicable_course_ids, c.id],
                            }))
                          }
                          className="mt-0.5 rounded border-neutral-300 text-[#990000]"
                        />
                        <span>{c.title}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {isTr ? 'Seçili' : 'Selected'}: {form.applicable_course_ids.length || (isTr ? 'tümü' : 'all')}
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.full_course_only}
                  onChange={(e) => setForm((f) => ({ ...f, full_course_only: e.target.checked }))}
                  className="rounded border-neutral-300 text-[#990000]"
                />
                {isTr ? 'Yalnızca tam eğitim paketi' : 'Full course only'}
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_campaign}
                  onChange={(e) => setForm((f) => ({ ...f, is_campaign: e.target.checked }))}
                  className="rounded border-neutral-300 text-[#990000]"
                />
                {isTr ? 'Kampanya olarak listele' : 'List as campaign'}
              </label>
              {form.is_campaign && (
                <div className="space-y-2 pl-1">
                  <input
                    value={form.campaign_name}
                    onChange={(e) => setForm((f) => ({ ...f, campaign_name: e.target.value }))}
                    placeholder={isTr ? 'Kampanya adı' : 'Campaign name'}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  />
                  <textarea
                    value={form.campaign_description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, campaign_description: e.target.value }))
                    }
                    rows={2}
                    placeholder={isTr ? 'Kampanya açıklaması' : 'Campaign description'}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 py-2 rounded-lg bg-[#990000] text-white font-medium disabled:opacity-50"
                >
                  {submitLoading
                    ? isTr
                      ? 'Kaydediliyor…'
                      : 'Saving…'
                    : editingId
                      ? isTr
                        ? 'Güncelle'
                        : 'Update'
                      : isTr
                        ? 'Ekle'
                        : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600"
                >
                  {isTr ? 'İptal' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
