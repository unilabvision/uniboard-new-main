'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

export type CoursePackageDraft = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: string;
  original_price: string;
  early_bird_price: string;
  early_bird_deadline: string;
  is_full_course: boolean;
  includes_qa: boolean;
  is_registration_open: boolean;
  is_active: boolean;
  order_index: number;
  session_labels: string;
};

type Props = {
  courseId: string;
  locale?: string;
};

const texts = {
  tr: {
    title: 'Satış paketleri',
    hint: 'myunilab.net kurs sayfasında görünen paketler. Aktif paketler sitede listelenir; “Tam eğitim” paketi diğerleriyle birlikte seçilemez.',
    loading: 'Paketler yükleniyor...',
    empty: 'Henüz paket yok. Sitede paket satışı için en az bir paket ekleyin.',
    add: 'Paket ekle',
    save: 'Paketleri kaydet',
    saving: 'Kaydediliyor...',
    saved: 'Paketler kaydedildi',
    saveError: 'Paketler kaydedilemedi',
    loadError: 'Paketler yüklenemedi',
    deactivate: 'Sil',
    deleteConfirm: 'Bu paketi kalıcı olarak silmek istiyor musunuz? Bu işlem geri alınamaz.',
    deleted: 'Paket silindi',
    deleteError: 'Paket silinemedi',
    name: 'Paket adı',
    slug: 'Kısa ad',
    description: 'Açıklama',
    price: 'Fiyat',
    original: 'Orijinal fiyat',
    earlyBird: 'Erken kayıt fiyatı',
    earlyDeadline: 'Erken kayıt son tarihi',
    sessionLabels: 'Oturum etiketleri',
    sessionHint: 'Virgülle ayırın. Kısmi paketin erişimini ders/bölüm başlıklarıyla eşleştirir.',
    fullCourse: 'Tam eğitim paketi',
    includesQa: 'Soru-cevap dahil',
    registrationOpen: 'Kayıt açık',
    active: 'Sitede aktif',
    newPackageTitle: 'Yeni paket',
  },
  en: {
    title: 'Sales packages',
    hint: 'Packages shown on the myunilab.net course page. Active packages are listed on the site; a “full course” package cannot be combined with others.',
    loading: 'Loading packages...',
    empty: 'No packages yet. Add at least one package to sell on the site.',
    add: 'Add package',
    save: 'Save packages',
    saving: 'Saving...',
    saved: 'Packages saved',
    saveError: 'Could not save packages',
    loadError: 'Could not load packages',
    deactivate: 'Delete',
    deleteConfirm: 'Permanently delete this package? This cannot be undone.',
    deleted: 'Package deleted',
    deleteError: 'Could not delete package',
    name: 'Package name',
    slug: 'Slug',
    description: 'Description',
    price: 'Price',
    original: 'Original price',
    earlyBird: 'Early-bird price',
    earlyDeadline: 'Early-bird deadline',
    sessionLabels: 'Session labels',
    sessionHint: 'Comma-separated. Matches partial package access to lesson/section titles.',
    fullCourse: 'Full course package',
    includesQa: 'Includes Q&A',
    registrationOpen: 'Registration open',
    active: 'Active on site',
    newPackageTitle: 'New package',
  },
};

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function mapApiToDraft(row: {
  id: string;
  title: string;
  slug: string | null;
  description?: string | null;
  price: number;
  original_price: number | null;
  early_bird_price?: number | null;
  early_bird_deadline?: string | null;
  is_full_course: boolean;
  includes_qa?: boolean;
  is_registration_open?: boolean;
  is_active: boolean;
  order_index: number;
  session_labels?: string[];
}): CoursePackageDraft {
  return {
    id: row.id,
    title: row.title || '',
    slug: row.slug || '',
    description: row.description || '',
    price: String(row.price ?? 0),
    original_price: row.original_price != null ? String(row.original_price) : '',
    early_bird_price: row.early_bird_price != null ? String(row.early_bird_price) : '',
    early_bird_deadline: toDatetimeLocal(row.early_bird_deadline),
    is_full_course: row.is_full_course === true,
    includes_qa: row.includes_qa === true,
    is_registration_open: row.is_registration_open !== false,
    is_active: row.is_active !== false,
    order_index: row.order_index || 0,
    session_labels: (row.session_labels || []).join(', '),
  };
}

export default function CoursePackagesPanel({ courseId, locale = 'tr' }: Props) {
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const [packages, setPackages] = useState<CoursePackageDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/lms/courses/${encodeURIComponent(courseId)}/packages`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.loadError);
      setPackages((data.packages || []).map(mapApiToDraft));
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : t.loadError,
        error: true,
      });
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, t.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchDraft = (id: string, partial: Partial<CoursePackageDraft>) => {
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...partial } : p)));
  };

  const addPackage = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/lms/courses/${encodeURIComponent(courseId)}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: t.newPackageTitle,
          price: 0,
          is_active: true,
          is_registration_open: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.saveError);
      if (data.package) {
        setPackages((prev) => [...prev, mapApiToDraft(data.package)]);
      } else {
        await load();
      }
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : t.saveError,
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const deletePackage = async (id: string) => {
    if (!confirm(t.deleteConfirm)) {
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/lms/courses/${encodeURIComponent(courseId)}/packages?id=${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.deleteError);
      setPackages((prev) => prev.filter((p) => p.id !== id));
      setMessage({
        text: data.warning || t.deleted,
        error: Boolean(data.softDeleted),
      });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : t.deleteError,
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAll = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updates = packages.map((pkg) => ({
        id: pkg.id,
        title: pkg.title.trim(),
        slug: pkg.slug.trim() || undefined,
        description: pkg.description.trim() || null,
        price: pkg.price === '' ? 0 : Number(pkg.price),
        original_price: pkg.original_price === '' ? null : Number(pkg.original_price),
        early_bird_price: pkg.early_bird_price === '' ? null : Number(pkg.early_bird_price),
        early_bird_deadline: pkg.early_bird_deadline
          ? new Date(pkg.early_bird_deadline).toISOString()
          : null,
        is_full_course: pkg.is_full_course,
        includes_qa: pkg.includes_qa,
        is_registration_open: pkg.is_registration_open,
        is_active: pkg.is_active,
        order_index: pkg.order_index,
        session_labels: pkg.session_labels,
      }));

      for (const u of updates) {
        if (!u.title) throw new Error(t.name + ' *');
        if (!Number.isFinite(u.price as number)) throw new Error(t.saveError);
      }

      const res = await fetch(`/api/lms/courses/${encodeURIComponent(courseId)}/packages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.saveError);
      if (Array.isArray(data.packages)) {
        setPackages(data.packages.map(mapApiToDraft));
      }
      setMessage({ text: t.saved });
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : t.saveError,
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-[#990000] focus:border-transparent';

  return (
    <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t.title}
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl">{t.hint}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void addPackage()}
            disabled={saving || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {t.add}
          </button>
          <button
            type="button"
            onClick={() => void saveAll()}
            disabled={saving || loading || packages.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-[#990000] text-white hover:bg-[#7a0000] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? t.saving : t.save}
          </button>
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.error ? 'text-red-600' : 'text-emerald-600'}`}>
          {message.text}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t.loading}
        </p>
      ) : packages.length === 0 ? (
        <p className="text-sm text-neutral-500">{t.empty}</p>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-xl border p-4 space-y-3 ${
                pkg.is_active
                  ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/20'
                  : 'border-dashed border-neutral-300 dark:border-neutral-600 opacity-70'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.name} *
                  </label>
                  <input
                    value={pkg.title}
                    onChange={(e) => patchDraft(pkg.id, { title: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.slug}
                  </label>
                  <input
                    value={pkg.slug}
                    onChange={(e) => patchDraft(pkg.id, { slug: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.description}
                  </label>
                  <textarea
                    rows={2}
                    value={pkg.description}
                    onChange={(e) => patchDraft(pkg.id, { description: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.price}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={pkg.price}
                    onChange={(e) => patchDraft(pkg.id, { price: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.original}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={pkg.original_price}
                    onChange={(e) => patchDraft(pkg.id, { original_price: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.earlyBird}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={pkg.early_bird_price}
                    onChange={(e) => patchDraft(pkg.id, { early_bird_price: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.earlyDeadline}
                  </label>
                  <input
                    type="datetime-local"
                    value={pkg.early_bird_deadline}
                    onChange={(e) =>
                      patchDraft(pkg.id, { early_bird_deadline: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    {t.sessionLabels}
                  </label>
                  <input
                    value={pkg.session_labels}
                    onChange={(e) => patchDraft(pkg.id, { session_labels: e.target.value })}
                    placeholder="Bulk RNA-seq, Single Cell..."
                    className={inputClass}
                  />
                  <p className="text-[11px] text-neutral-500 mt-1">{t.sessionHint}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkg.is_full_course}
                    onChange={(e) => patchDraft(pkg.id, { is_full_course: e.target.checked })}
                    className="rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
                  />
                  {t.fullCourse}
                </label>
                <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkg.includes_qa}
                    onChange={(e) => patchDraft(pkg.id, { includes_qa: e.target.checked })}
                    className="rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
                  />
                  {t.includesQa}
                </label>
                <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkg.is_registration_open}
                    onChange={(e) =>
                      patchDraft(pkg.id, { is_registration_open: e.target.checked })
                    }
                    className="rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
                  />
                  {t.registrationOpen}
                </label>
                <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pkg.is_active}
                    onChange={(e) => patchDraft(pkg.id, { is_active: e.target.checked })}
                    className="rounded border-neutral-300 text-[#990000] focus:ring-[#990000]"
                  />
                  {t.active}
                </label>
                <button
                    type="button"
                    onClick={() => void deletePackage(pkg.id)}
                    disabled={saving}
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 ml-auto disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.deactivate}
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
