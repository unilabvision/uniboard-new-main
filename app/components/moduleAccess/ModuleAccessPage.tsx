'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Shield,
  Search,
  UserPlus,
  Loader2,
  Mail,
  User,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { isValidAccessSearchQuery } from '@/app/lib/internship/accessQuery';
import {
  getModuleCapabilityDefs,
  labelForModuleCapability,
} from '@/app/lib/moduleAccess/capabilities';
import {
  ACCESS_LEVELS,
  ACCESS_LEVEL_LABELS,
  clampCapabilitiesToLevel,
  defaultCapabilitiesForLevel,
  type AccessLevel,
} from '@/app/lib/moduleAccess/rbac';

type ClerkSearchUser = {
  clerkUserId: string;
  email: string;
  name: string;
  imageUrl: string;
};

type PanelOrg = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
};

type AccessMember = {
  id: string;
  clerk_user_id: string;
  module_key: string;
  is_super_admin: boolean;
  granted_at: string;
  name: string;
  email: string;
  imageUrl: string | null;
  capabilities?: string[] | null;
  access_level?: AccessLevel | null;
  panel_organization_id?: string | null;
  organization?: { id: string; name: string; slug: string } | null;
};

export default function ModuleAccessPage({
  moduleKey,
  params,
  showReviewerOption = false,
}: {
  moduleKey: string;
  params: Promise<{ locale: string }>;
  showReviewerOption?: boolean;
}) {
  const capabilityDefs = useMemo(
    () => getModuleCapabilityDefs(moduleKey),
    [moduleKey]
  );

  const [locale, setLocale] = useState('tr');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClerkSearchUser[]>([]);
  const [selected, setSelected] = useState<ClerkSearchUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addAsReviewer, setAddAsReviewer] = useState(true);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('editor');
  const [capabilities, setCapabilities] = useState<string[]>(() =>
    defaultCapabilitiesForLevel(moduleKey, 'editor')
  );
  const [organizations, setOrganizations] = useState<PanelOrg[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [members, setMembers] = useState<AccessMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const tr = locale === 'tr';
  const apiBase = `/api/modules/${moduleKey}/access`;
  const levelCeiling = useMemo(
    () => new Set(defaultCapabilitiesForLevel(moduleKey, accessLevel)),
    [moduleKey, accessLevel]
  );

  const t = tr
    ? {
        title: 'Yetkilendirme',
        subtitle: 'Kurum, seviye ve özellik erişimini yönetin',
        placeholder: 'İsim veya e-posta yazın…',
        hint: 'En az 2 karakter yazın; e-posta veya isim ile arayın.',
        invite: 'Erişim Ver & Davet Gönder',
        inviting: 'Gönderiliyor…',
        reviewer: 'Değerlendirici olarak ekle (oy, durum, not)',
        orgLabel: 'Kurum',
        orgHint: 'Üyenin bağlı olacağı kurumu seçin',
        createOrg: 'Kurum oluştur',
        levelTitle: 'Yetki seviyesi',
        levelHint: 'Önce seviye seçin; ardından özellikleri daraltabilirsiniz',
        capabilitiesTitle: 'Özellik erişimi (isteğe bağlı daraltma)',
        capabilitiesHint:
          'Seviyenin tavanının üstüne çıkılamaz. İşaret kaldırarak kısıtlayın.',
        selectAll: 'Seviye varsayılanı',
        clearAll: 'Temizle',
        current: 'Mevcut erişimler',
        empty: 'Henüz kayıt yok',
        revoke: 'Kaldır',
        selected: 'Seçili kullanıcı',
        clear: 'Temizle',
        invalidQuery: 'Geçersiz arama — yalnızca isim veya e-posta kullanın.',
        noResults:
          'Clerk’te eşleşen kullanıcı bulunamadı. E-postayı tam yazıp tekrar deneyin veya davet gönderin.',
        superAdmin: 'Süper yönetici',
        fullAccess: 'Tam yetki',
        needCapability: 'En az bir özellik seçin.',
        needOrg: 'Kurum seçin.',
        noOrg: 'Kurum yok',
      }
    : {
        title: 'Access Control',
        subtitle: 'Manage organization, level, and feature access',
        placeholder: 'Type name or email…',
        hint: 'Type at least 2 characters; search by email or name.',
        invite: 'Grant Access & Send Invite',
        inviting: 'Sending…',
        reviewer: 'Add as reviewer (vote, status, notes)',
        orgLabel: 'Organization',
        orgHint: 'Select the organization for this member',
        createOrg: 'Create organization',
        levelTitle: 'Access level',
        levelHint: 'Pick a level first, then optionally narrow features',
        capabilitiesTitle: 'Feature access (optional narrowing)',
        capabilitiesHint:
          'Cannot exceed the level ceiling. Uncheck to restrict.',
        selectAll: 'Level defaults',
        clearAll: 'Clear',
        current: 'Current access',
        empty: 'No members yet',
        revoke: 'Revoke',
        selected: 'Selected user',
        clear: 'Clear',
        invalidQuery: 'Invalid search — use name or email only.',
        noResults:
          'No matching Clerk user. Enter the full email to invite, or try again.',
        superAdmin: 'Super admin',
        fullAccess: 'Full access',
        needCapability: 'Select at least one feature.',
        needOrg: 'Select an organization.',
        noOrg: 'No organization',
      };

  useEffect(() => {
    params.then((p) => setLocale(p.locale || 'tr'));
  }, [params]);

  useEffect(() => {
    setCapabilities(defaultCapabilitiesForLevel(moduleKey, accessLevel));
  }, [moduleKey, accessLevel]);

  const loadOrgs = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/panel-organizations?moduleKey=${encodeURIComponent(moduleKey)}`
      );
      const data = await res.json();
      if (res.ok) {
        setOrganizations(data.organizations || []);
        setIsSuperAdmin(Boolean(data.isSuperAdmin));
        setSelectedOrgId((prev) => {
          if (prev && (data.organizations || []).some((o: PanelOrg) => o.id === prev)) {
            return prev;
          }
          return data.organizations?.[0]?.id || '';
        });
      }
    } catch {
      /* ignore */
    }
  }, [moduleKey]);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch(apiBase);
      const data = await res.json();
      if (res.ok) setMembers(data.members || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingMembers(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadOrgs();
    loadMembers();
  }, [loadOrgs, loadMembers]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const runSearch = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        setResults([]);
        setSearchError(null);
        return;
      }
      if (!isValidAccessSearchQuery(trimmed)) {
        setResults([]);
        setSearchError(t.invalidQuery);
        return;
      }

      setSearching(true);
      setSearchError(null);

      try {
        const res = await fetch(
          `${apiBase}/search?q=${encodeURIComponent(trimmed)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search failed');
        setResults(data.users || []);
        setShowDropdown(true);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Error');
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [apiBase, t.invalidQuery]
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelected(null);
    setSubmitMessage(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 320);
  };

  const pickUser = (user: ClerkSearchUser) => {
    setSelected(user);
    setQuery(user.email || user.name);
    setShowDropdown(false);
    setResults([]);
  };

  const toggleCapability = (cap: string) => {
    if (!levelCeiling.has(cap)) return;
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
    );
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim() || !isSuperAdmin) return;
    setCreatingOrg(true);
    try {
      const res = await fetch('/api/panel-organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOrgName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setNewOrgName('');
      await loadOrgs();
      if (data.organization?.id) setSelectedOrgId(data.organization.id);
    } catch (err) {
      setSubmitMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error',
      });
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleGrant = async () => {
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      if (!selectedOrgId && !isSuperAdmin) {
        throw new Error(t.needOrg);
      }
      if (capabilityDefs.length > 0 && capabilities.length === 0) {
        throw new Error(t.needCapability);
      }

      const clamped = clampCapabilitiesToLevel(
        moduleKey,
        accessLevel,
        capabilities
      );

      const payload = selected
        ? {
            clerkUserId: selected.clerkUserId,
            email: selected.email,
            name: selected.name,
            locale,
            accessLevel,
            capabilities: clamped,
            panelOrganizationId: selectedOrgId || null,
            ...(showReviewerOption ? { addAsReviewer } : {}),
          }
        : {
            email: query.trim(),
            name: query.trim(),
            locale,
            accessLevel,
            capabilities: clamped,
            panelOrganizationId: selectedOrgId || null,
            ...(showReviewerOption ? { addAsReviewer } : {}),
          };

      if (!selected && !isValidAccessSearchQuery(query.trim())) {
        throw new Error(t.invalidQuery);
      }

      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      setSubmitMessage({
        type: 'success',
        text:
          data.message ||
          (tr
            ? 'Erişim verildi ve davet e-postası gönderildi.'
            : 'Access granted and invitation email sent.'),
      });
      setQuery('');
      setSelected(null);
      setCapabilities(defaultCapabilitiesForLevel(moduleKey, accessLevel));
      loadMembers();
    } catch (err) {
      setSubmitMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (
    clerkUserId: string,
    panelOrganizationId?: string | null
  ) => {
    if (
      !confirm(
        tr ? 'Erişimi kaldırmak istediğinize emin misiniz?' : 'Revoke access?'
      )
    )
      return;
    const qs = new URLSearchParams({ clerkUserId });
    if (panelOrganizationId) qs.set('panelOrganizationId', panelOrganizationId);
    await fetch(`${apiBase}?${qs.toString()}`, { method: 'DELETE' });
    loadMembers();
  };

  const capabilityBadge = (caps: string[] | null | undefined) => {
    if (!caps || caps.length === 0) return t.fullAccess;
    return caps
      .map((c) => labelForModuleCapability(moduleKey, c, locale))
      .join(' · ');
  };

  const levelLabel = (level: AccessLevel | null | undefined) => {
    if (!level) return t.fullAccess;
    return tr ? ACCESS_LEVEL_LABELS[level].tr : ACCESS_LEVEL_LABELS[level].en;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 px-4 sm:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-7 h-7 text-[#990000]" />
            {t.title}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">{t.subtitle}</p>
        </div>

        <section className="bg-white dark:bg-neutral-800 rounded-xl border p-6 mb-6 shadow-sm space-y-5">
          {/* Organization */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-[#990000]" />
              <p className="text-sm font-semibold">{t.orgLabel}</p>
            </div>
            <p className="text-xs text-neutral-500 mb-3">{t.orgHint}</p>
            {organizations.length > 0 ? (
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 px-3 py-2.5 text-sm"
              >
                {isSuperAdmin && (
                  <option value="">{tr ? '— Kurum yok (platform) —' : '— No org (platform) —'}</option>
                )}
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-neutral-500">{t.noOrg}</p>
            )}
            {isSuperAdmin && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder={tr ? 'Yeni kurum adı' : 'New organization name'}
                  className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleCreateOrg}
                  disabled={creatingOrg || !newOrgName.trim()}
                  className="px-3 py-2 rounded-lg bg-neutral-900 text-white text-sm disabled:opacity-50"
                >
                  {creatingOrg ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    t.createOrg
                  )}
                </button>
              </div>
            )}
          </div>

          {/* User search */}
          <div ref={containerRef} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => results.length > 0 && setShowDropdown(true)}
                placeholder={t.placeholder}
                className="w-full pl-10 pr-10 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-sm focus:ring-2 focus:ring-[#990000] focus:border-transparent"
                autoComplete="off"
              />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-neutral-400" />
              )}
              {query && !searching && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelected(null);
                    setResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-2">{t.hint}</p>
            {searchError && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {searchError}
              </p>
            )}
            {showDropdown && results.length > 0 && (
              <ul className="absolute z-20 w-full mt-2 bg-white dark:bg-neutral-800 border rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                {results.map((user) => (
                  <li key={user.clerkUserId}>
                    <button
                      type="button"
                      onClick={() => pickUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#990000]/5 text-left border-b border-neutral-100 dark:border-neutral-700 last:border-0"
                    >
                      {user.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.imageUrl} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{user.name}</p>
                        <p className="text-xs text-neutral-500 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 shrink-0" />
                          {user.email}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {showDropdown &&
              !searching &&
              query.length >= 2 &&
              results.length === 0 &&
              !searchError && (
                <p className="text-sm text-neutral-500 mt-2 px-1">{t.noResults}</p>
              )}
          </div>

          {selected && (
            <div className="p-3 rounded-lg bg-[#990000]/5 border border-[#990000]/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {selected.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.imageUrl} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#990000]/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#990000]" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500">{t.selected}</p>
                  <p className="font-medium truncate">{selected.name}</p>
                  <p className="text-sm text-neutral-500 truncate">{selected.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setQuery('');
                }}
                className="text-xs text-neutral-500 hover:text-neutral-800 shrink-0"
              >
                {t.clear}
              </button>
            </div>
          )}

          {/* Access level */}
          <div className="rounded-xl border-2 border-[#990000] bg-[#990000]/10 p-4">
            <p className="text-sm font-bold mb-1">{t.levelTitle}</p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">
              {t.levelHint}
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {ACCESS_LEVELS.map((level) => (
                <label
                  key={level}
                  className={`flex items-center gap-2 cursor-pointer rounded-lg border-2 px-3 py-2.5 text-sm ${
                    accessLevel === level
                      ? 'border-[#990000] bg-white dark:bg-neutral-900'
                      : 'border-neutral-300 dark:border-neutral-600 bg-white/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="accessLevel"
                    checked={accessLevel === level}
                    onChange={() => setAccessLevel(level)}
                    className="accent-[#990000]"
                  />
                  <span className="font-medium">
                    {tr
                      ? ACCESS_LEVEL_LABELS[level].tr
                      : ACCESS_LEVEL_LABELS[level].en}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {showReviewerOption && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={addAsReviewer}
                onChange={(e) => setAddAsReviewer(e.target.checked)}
                className="rounded accent-[#990000]"
              />
              {t.reviewer}
            </label>
          )}

          {/* Feature narrowing */}
          {capabilityDefs.length > 0 && (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-600 p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="text-sm font-semibold">{t.capabilitiesTitle}</p>
                <div className="flex gap-2 shrink-0 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setCapabilities(
                        defaultCapabilitiesForLevel(moduleKey, accessLevel)
                      )
                    }
                    className="text-[#990000] font-medium hover:underline"
                  >
                    {t.selectAll}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCapabilities([])}
                    className="text-neutral-500 hover:underline"
                  >
                    {t.clearAll}
                  </button>
                </div>
              </div>
              <p className="text-xs text-neutral-500 mb-3">{t.capabilitiesHint}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {capabilityDefs.map((cap) => {
                  const allowed = levelCeiling.has(cap.key);
                  const checked = capabilities.includes(cap.key);
                  return (
                    <label
                      key={cap.key}
                      className={`flex items-start gap-2.5 text-sm rounded-lg border-2 px-3 py-2.5 ${
                        !allowed
                          ? 'opacity-40 cursor-not-allowed border-neutral-200'
                          : checked
                            ? 'cursor-pointer border-[#990000] bg-white dark:bg-neutral-900'
                            : 'cursor-pointer border-neutral-300 dark:border-neutral-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!allowed}
                        onChange={() => toggleCapability(cap.key)}
                        className="mt-0.5 h-4 w-4 rounded accent-[#990000]"
                      />
                      <span className="leading-snug font-medium">
                        {tr ? cap.labelTr : cap.labelEn}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGrant}
            disabled={submitting || query.trim().length < 2}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#990000] text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {submitting ? t.inviting : t.invite}
          </button>

          {submitMessage && (
            <div
              className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                submitMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
              }`}
            >
              {submitMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              {submitMessage.text}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-neutral-800 rounded-xl border p-6">
          <h2 className="font-semibold mb-4">{t.current}</h2>
          {loadingMembers ? (
            <div className="animate-pulse h-20 bg-neutral-100 dark:bg-neutral-700 rounded" />
          ) : members.length === 0 ? (
            <p className="text-sm text-neutral-500">{t.empty}</p>
          ) : (
            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={`${m.id}-${m.panel_organization_id || 'x'}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {m.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.imageUrl} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{m.name}</p>
                      <p className="text-xs text-neutral-500 truncate">{m.email}</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                        {m.organization?.name || t.noOrg}
                        {' · '}
                        {levelLabel(m.access_level)}
                        {' · '}
                        {capabilityBadge(m.capabilities)}
                      </p>
                    </div>
                    {m.is_super_admin && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[#990000]/10 text-[#990000] shrink-0">
                        {t.superAdmin}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleRevoke(m.clerk_user_id, m.panel_organization_id)
                    }
                    className="text-xs text-red-600 hover:underline shrink-0"
                  >
                    {t.revoke}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
