'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import { isValidAccessSearchQuery } from '@/app/lib/internship/accessQuery';

type ClerkSearchUser = {
  clerkUserId: string;
  email: string;
  name: string;
  imageUrl: string;
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
  const [locale, setLocale] = useState('tr');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClerkSearchUser[]>([]);
  const [selected, setSelected] = useState<ClerkSearchUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [addAsReviewer, setAddAsReviewer] = useState(true);
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

  const t = tr
    ? {
        title: 'Yetkilendirme',
        subtitle: 'Kayıtlı kullanıcıları isim veya e-posta ile arayın',
        placeholder: 'İsim veya e-posta yazın…',
        hint: 'En az 2 karakter yazarak aramaya başlayın.',
        invite: 'Erişim Ver & Davet Gönder',
        inviting: 'Gönderiliyor…',
        reviewer: 'Değerlendirici olarak ekle (oy, durum, not)',
        current: 'Mevcut erişimler',
        empty: 'Henüz kayıt yok',
        revoke: 'Kaldır',
        selected: 'Seçili kullanıcı',
        clear: 'Temizle',
        invalidQuery: 'Geçersiz arama — yalnızca isim veya e-posta kullanın.',
        noResults: 'Sonuç bulunamadı',
        superAdmin: 'Süper yönetici',
      }
    : {
        title: 'Access Control',
        subtitle: 'Search registered users by name or email',
        placeholder: 'Type name or email…',
        hint: 'Start typing at least 2 characters to search.',
        invite: 'Grant Access & Send Invite',
        inviting: 'Sending…',
        reviewer: 'Add as reviewer (vote, status, notes)',
        current: 'Current access',
        empty: 'No members yet',
        revoke: 'Revoke',
        selected: 'Selected user',
        clear: 'Clear',
        invalidQuery: 'Invalid search — use name or email only.',
        noResults: 'No results found',
        superAdmin: 'Super admin',
      };

  useEffect(() => {
    params.then((p) => setLocale(p.locale || 'tr'));
  }, [params]);

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
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  const handleGrant = async () => {
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const payload = selected
        ? {
            clerkUserId: selected.clerkUserId,
            email: selected.email,
            name: selected.name,
            locale,
            ...(showReviewerOption ? { addAsReviewer } : {}),
          }
        : {
            email: query.trim(),
            name: query.trim(),
            locale,
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

  const handleRevoke = async (clerkUserId: string) => {
    if (!confirm(tr ? 'Erişimi kaldırmak istediğinize emin misiniz?' : 'Revoke access?'))
      return;
    await fetch(`${apiBase}?clerkUserId=${clerkUserId}`, { method: 'DELETE' });
    loadMembers();
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

        <section className="bg-white dark:bg-neutral-800 rounded-xl border p-6 mb-6 shadow-sm">
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
                        <img
                          src={user.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
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
            <div className="mt-4 p-3 rounded-lg bg-[#990000]/5 border border-[#990000]/20 flex items-center justify-between gap-3">
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

          {showReviewerOption && (
            <label className="flex items-center gap-2 mt-4 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={addAsReviewer}
                onChange={(e) => setAddAsReviewer(e.target.checked)}
                className="rounded accent-[#990000]"
              />
              {t.reviewer}
            </label>
          )}

          <button
            type="button"
            onClick={handleGrant}
            disabled={submitting || query.trim().length < 2}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#990000] text-white rounded-lg text-sm font-medium disabled:opacity-50"
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
              className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
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
                  key={m.id}
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
                    </div>
                    {m.is_super_admin && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[#990000]/10 text-[#990000] shrink-0">
                        {t.superAdmin}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(m.clerk_user_id)}
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
