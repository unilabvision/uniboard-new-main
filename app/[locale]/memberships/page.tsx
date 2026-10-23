'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, CopyPlus, Loader2, Plus, Rocket, ShieldCheck } from 'lucide-react';
import PlanEditor from './PlanEditor';
import type { MembershipCatalogItem, MembershipPlan } from '@/app/lib/memberships/types';

export default function MembershipPlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [catalog, setCatalog] = useState<MembershipCatalogItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const isTr = locale === 'tr';

  useEffect(() => {
    params.then((value) => setLocale(value.locale));
  }, [params]);

  const loadData = async (preferredId?: string) => {
    const [plansResponse, catalogResponse] = await Promise.all([
      fetch('/api/memberships/plans', { cache: 'no-store' }),
      fetch('/api/memberships/catalog', { cache: 'no-store' }),
    ]);
    const plansBody = await plansResponse.json();
    const catalogBody = await catalogResponse.json();
    if (!plansResponse.ok) throw new Error(plansBody.error || 'Plans could not be loaded');
    if (!catalogResponse.ok) throw new Error(catalogBody.error || 'Catalog could not be loaded');
    const nextPlans = (plansBody.plans ?? []) as MembershipPlan[];
    const nextCanManage = plansBody.permissions?.canManage === true;
    setPlans(nextPlans);
    setCatalog(catalogBody.items ?? []);
    setCanManage(nextCanManage);
    setSelectedId((current) => {
      if (preferredId && nextPlans.some((plan) => plan.id === preferredId)) return preferredId;
      if (current === 'new') return current;
      if (current && nextPlans.some((plan) => plan.id === current)) return current;
      return nextPlans.find((plan) => plan.status === 'draft')?.id
        ?? nextPlans[0]?.id
        ?? (nextCanManage ? 'new' : null);
    });
  };

  useEffect(() => {
    loadData()
      .catch((error) => setMessage({ tone: 'error', text: error.message }))
      .finally(() => setLoading(false));
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedId) ?? null,
    [plans, selectedId]
  );
  const publishedCount = plans.filter((plan) => plan.status === 'published').length;
  const draftCount = plans.filter((plan) => plan.status === 'draft').length;

  const runAction = async (action: () => Promise<Response>, successText: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await action();
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Operation failed');
      const preferredId = body.plan?.id as string | undefined;
      await loadData(preferredId);
      setMessage({ tone: 'ok', text: successText });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof Error ? error.message : 'Operation failed' });
    } finally {
      setBusy(false);
    }
  };

  const clonePlan = async (plan: MembershipPlan) => {
    await runAction(
      () => fetch(`/api/memberships/plans/${plan.id}/clone`, { method: 'POST' }),
      isTr ? 'Yeni taslak sürüm oluşturuldu.' : 'A new draft version was created.'
    );
  };

  const publishPlan = async (plan: MembershipPlan) => {
    const confirmed = window.confirm(
      isTr
        ? `${plan.name_tr} v${plan.version} MyUNI üzerinde yayınlansın mı? Mevcut yayın sürümü arşivlenecek.`
        : `Publish ${plan.name_en || plan.name_tr} v${plan.version} on MyUNI? The current version will be archived.`
    );
    if (!confirmed) return;
    await runAction(
      () => fetch(`/api/memberships/plans/${plan.id}/publish`, { method: 'POST' }),
      isTr ? 'Paket MyUNI için yayınlandı.' : 'Plan published for MyUNI.'
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-neutral-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        {isTr ? 'Üyelik modülü yükleniyor…' : 'Loading membership module…'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-5 lg:p-8">
      <header className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-[#990000]">
            <BadgeCheck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">MyUNI Access</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {isTr ? 'Üyelik paketleri' : 'Membership plans'}
          </h1>
          <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">
            {isTr
              ? '1, 3 ve 6 aylık paketlerin fiyatını ve dahil olduğu hizmetleri yönetin; hazır taslağı MyUNI’ye yayınlayın.'
              : 'Manage pricing and included services for 1, 3 and 6 month plans, then publish the ready draft to MyUNI.'}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setSelectedId('new')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium hover:border-[#990000] dark:border-neutral-700 dark:bg-neutral-900"
          >
            <Plus className="h-4 w-4" /> {isTr ? 'Yeni paket taslağı' : 'New plan draft'}
          </button>
        )}
      </header>

      <div className="my-5 grid gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3 dark:border-neutral-800 dark:bg-neutral-800">
        {[
          [isTr ? 'Yayındaki paket' : 'Published plans', publishedCount, '#166534'],
          [isTr ? 'Taslak sürüm' : 'Draft versions', draftCount, '#B45309'],
          [isTr ? 'Seçilebilir hizmet' : 'Available services', catalog.length, '#990000'],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="bg-white px-5 py-4 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: String(color) }}>{value}</p>
          </div>
        ))}
      </div>

      {message && (
        <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${message.tone === 'ok' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <section className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {isTr ? 'Paket sürümleri' : 'Plan versions'}
          </h2>
          <span className="text-xs text-neutral-500">
            {isTr ? 'Yayındaki sürüm değiştirilemez; yeni taslağa kopyalanır.' : 'Published versions are copied into a new draft.'}
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {plans.map((plan) => (
            <button
              type="button"
              key={plan.id}
              onClick={() => setSelectedId(plan.id)}
              className={`min-w-[220px] rounded-xl border p-4 text-left transition ${selectedId === plan.id ? 'border-[#990000] bg-[#990000]/5' : 'border-neutral-200 bg-white hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-semibold">{plan.duration_months} {isTr ? 'ay' : 'months'}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${plan.status === 'published' ? 'bg-green-100 text-green-800' : plan.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-600'}`}>
                  {plan.status}
                </span>
              </div>
              <p className="mt-3 text-xl font-semibold">{Number(plan.price).toLocaleString(isTr ? 'tr-TR' : 'en-US')} {plan.currency}</p>
              <p className="mt-1 text-xs text-neutral-500">{plan.code} · v{plan.version}</p>
            </button>
          ))}
        </div>
      </section>

      {selectedPlan?.status === 'published' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-5 w-5" />
            {isTr ? 'Bu sürüm yayında ve satın alınmış hakları korumak için salt okunur.' : 'This version is live and read-only to preserve purchased rights.'}
          </div>
          {canManage && <button
            type="button"
            disabled={busy}
            onClick={() => clonePlan(selectedPlan)}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium shadow-sm hover:text-[#990000] disabled:opacity-50"
          >
            <CopyPlus className="h-4 w-4" />
            {isTr ? 'Fiyat / hizmet güncelle' : 'Update price / services'}
          </button>}
        </div>
      )}

      <PlanEditor
        key={selectedPlan?.id ?? 'new'}
        locale={locale}
        plan={selectedId === 'new' ? null : selectedPlan}
        catalog={catalog}
        saving={busy}
        canEdit={canManage}
        onSave={async (payload) => {
          const endpoint = selectedPlan ? `/api/memberships/plans/${selectedPlan.id}` : '/api/memberships/plans';
          await runAction(
            () => fetch(endpoint, {
              method: selectedPlan ? 'PATCH' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            }),
            isTr ? 'Taslak kaydedildi.' : 'Draft saved.'
          );
        }}
      />

      {canManage && selectedPlan?.status === 'draft' && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={busy || selectedPlan.myuni_membership_plan_benefits.length === 0}
            onClick={() => publishPlan(selectedPlan)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#166534] px-5 py-3 text-sm font-semibold text-white hover:bg-[#14532d] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Rocket className="h-4 w-4" />
            {isTr ? 'MyUNI üzerinde yayınla' : 'Publish on MyUNI'}
          </button>
        </div>
      )}
    </div>
  );
}
