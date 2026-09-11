'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  RefreshCw,
  Eye,
  Calendar,
  Mail,
  ChevronLeft,
  ChevronRight,
  FileText,
  Award,
  CalendarDays,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { inferFormType } from '@/app/lib/siteApplications/formTypes';
import {
  type SiteApplicationStatus,
  isEventSiteApplication,
} from '@/app/lib/siteApplications/config';
import { formatPackagePrice } from '@/app/lib/siteApplications/packages';
import type { SiteApplication } from '@/app/types/siteApplications';
import type { SiteApplicationForm } from '@/app/types/siteApplicationForms';

const STATUS_FILTERS: SiteApplicationStatus[] = [
  'pending',
  'under_review',
  'accepted',
  'rejected',
];

const texts = {
  tr: {
    title: 'Tüm Başvurular',
    titlePending: 'Bekleyen Başvurular',
    titleUnderReview: 'İncelemedeki Başvurular',
    titleAccepted: 'Kabul Edilen Başvurular',
    titleRejected: 'Reddedilen Başvurular',
    subtitle: 'Site formlarından gelen başvuruları görüntüleyin',
    subtitleFiltered: 'Seçili duruma göre filtrelenmiş liste',
    subtitleEvent: 'Bu etkinliğe gelen kayıtlar',
    tabTeam: 'Ekip Başvuruları',
    tabEvent: 'Etkinlik Başvuruları',
    tabAll: 'Tümü',
    eventLabel: 'Etkinlik',
    package: 'Paket',
    payment: 'Ödeme',
    packageFree: 'Ücretsiz',
    packageCertificate: 'Sertifika',
    paymentPaid: 'Ödendi',
    paymentPending: 'Bekliyor',
    paymentFailed: 'Başarısız',
    paymentSuperseded: 'Mükerrer',
    paymentNone: '—',
    filterPackage: 'Paket filtresi',
    filterPayment: 'Ödeme filtresi',
    backToEvents: 'Etkinlik özetine dön',
    all: 'Tümü',
    allForms: 'Tüm formlar',
    clearFilter: 'Filtreyi temizle',
    filterActive: 'Aktif filtre',
    search: 'İsim, e-posta veya telefon ara...',
    applicant: 'Başvuran',
    form: 'Form',
    status: 'Durum',
    date: 'Tarih',
    actions: 'İşlemler',
    view: 'Detay',
    remind: 'Hatırlat',
    reminding: '…',
    remindOk: 'Hatırlatma gönderildi',
    remindFail: 'Hatırlatma gönderilemedi',
    loading: 'Yükleniyor...',
    error: 'Veriler yüklenemedi',
    noResults: 'Başvuru bulunamadı',
    refresh: 'Yenile',
    statusLabels: {
      pending: 'Bekliyor',
      under_review: 'İncelemede',
      accepted: 'Kabul',
      rejected: 'Red',
    },
    page: 'Sayfa',
    of: '/',
    selectAll: 'Tümünü seç',
    deselectAll: 'Seçimi kaldır',
    selectedCount: 'seçili',
    deleteSelected: 'Seçilenleri sil',
    deleting: 'Siliniyor...',
    deleteConfirmTitle: 'Başvuruları sil',
    deleteConfirmMessage:
      '{count} başvuruyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
    deleteConfirmButton: 'Sil',
    cancelButton: 'İptal',
    deleteSuccess: 'Başvurular silindi',
    deleteFail: 'Silme işlemi başarısız',
    dateFrom: 'Başlangıç',
    dateTo: 'Bitiş',
    organizationFilter: 'Kurum',
    organizationPlaceholder: 'Kurum ara...',
    hasAttachment: 'Ek dosya',
    attachmentAll: 'Tümü',
    attachmentYes: 'Var',
    attachmentNo: 'Yok',
    localeFilter: 'Dil',
    localeAll: 'Tümü',
    sourceFilter: 'Kaynak',
    sourceAll: 'Tümü',
    sourceWebsite: 'Website',
    sourceEventWebsite: 'Etkinlik sitesi',
    moreFilters: 'Ek filtreler',
    paymentStaleHint:
      'Ödeme durumu anlık olmayabilir; siparişlerle eşitlemek için senkronize edin.',
    syncPayments: 'Ödemeleri senkronize et',
    syncingPayments: 'Senkronize ediliyor…',
    syncPaymentsOk: 'Ödeme durumları güncellendi',
    syncPaymentsFail: 'Ödeme senkronu başarısız',
  },
  en: {
    title: 'All Applications',
    titlePending: 'Pending Applications',
    titleUnderReview: 'Applications Under Review',
    titleAccepted: 'Accepted Applications',
    titleRejected: 'Rejected Applications',
    subtitle: 'View applications from site forms',
    subtitleFiltered: 'List filtered by selected status',
    subtitleEvent: 'Registrations for this event',
    tabTeam: 'Team Applications',
    tabEvent: 'Event Applications',
    tabAll: 'All',
    eventLabel: 'Event',
    package: 'Package',
    payment: 'Payment',
    packageFree: 'Free',
    packageCertificate: 'Certificate',
    paymentPaid: 'Paid',
    paymentPending: 'Pending',
    paymentFailed: 'Failed',
    paymentSuperseded: 'Duplicate',
    paymentNone: '—',
    filterPackage: 'Package filter',
    filterPayment: 'Payment filter',
    backToEvents: 'Back to events overview',
    all: 'All',
    allForms: 'All forms',
    clearFilter: 'Clear filter',
    filterActive: 'Active filter',
    search: 'Search name, email or phone...',
    applicant: 'Applicant',
    form: 'Form',
    status: 'Status',
    date: 'Date',
    actions: 'Actions',
    view: 'View',
    remind: 'Remind',
    reminding: '…',
    remindOk: 'Reminder sent',
    remindFail: 'Failed to send reminder',
    loading: 'Loading...',
    error: 'Failed to load data',
    noResults: 'No applications found',
    refresh: 'Refresh',
    statusLabels: {
      pending: 'Pending',
      under_review: 'Under Review',
      accepted: 'Accepted',
      rejected: 'Rejected',
    },
    page: 'Page',
    of: 'of',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    selectedCount: 'selected',
    deleteSelected: 'Delete selected',
    deleting: 'Deleting...',
    deleteConfirmTitle: 'Delete applications',
    deleteConfirmMessage:
      'Are you sure you want to delete {count} application(s)? This cannot be undone.',
    deleteConfirmButton: 'Delete',
    cancelButton: 'Cancel',
    deleteSuccess: 'Applications deleted',
    deleteFail: 'Failed to delete applications',
    dateFrom: 'From',
    dateTo: 'To',
    organizationFilter: 'Organization',
    organizationPlaceholder: 'Search organization...',
    hasAttachment: 'Attachment',
    attachmentAll: 'All',
    attachmentYes: 'Yes',
    attachmentNo: 'No',
    localeFilter: 'Language',
    localeAll: 'All',
    sourceFilter: 'Source',
    sourceAll: 'All',
    sourceWebsite: 'Website',
    sourceEventWebsite: 'Event website',
    moreFilters: 'More filters',
    paymentStaleHint:
      'Payment status may not be up to the second; sync to match orders.',
    syncPayments: 'Sync payments',
    syncingPayments: 'Syncing…',
    syncPaymentsOk: 'Payment statuses updated',
    syncPaymentsFail: 'Payment sync failed',
  },
};

const SOURCE_OPTIONS = ['website', 'event_website'] as const;


function statusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'under_review':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'accepted':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
}

function paymentColor(status: string) {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'superseded':
      return 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300';
    default:
      return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
  }
}

function readSubmission(app: SiteApplication) {
  return app.submission_data && typeof app.submission_data === 'object'
    ? app.submission_data
    : {};
}

function BulkDeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  count,
  isDeleting,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  isDeleting: boolean;
  t: (typeof texts)['tr'];
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mr-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t.deleteConfirmTitle}
            </h3>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {t.deleteConfirmMessage.replace('{count}', String(count))}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {t.cancelButton}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isDeleting ? t.deleting : t.deleteConfirmButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SiteApplicationsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [apps, setApps] = useState<SiteApplication[]>([]);
  const [forms, setForms] = useState<SiteApplicationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [remindFlash, setRemindFlash] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteFlash, setDeleteFlash] = useState<string | null>(null);
  const [syncingPayments, setSyncingPayments] = useState(false);
  const [paymentSyncFlash, setPaymentSyncFlash] = useState<string | null>(null);
  const perPage = 20;
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname() || '';
  const isEventsHub = pathname.includes('/events/registrations');
  const statusParam = searchParams.get('status');
  const eventIdParam = searchParams.get('eventId')?.trim() || '';
  const eventNameParam = searchParams.get('eventName')?.trim() || '';
  const formFilter = searchParams.get('form')?.trim() || 'all';
  const search = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(search);
  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const listQueryString = searchParams.toString();
  const registrationTierParam =
    searchParams.get('registrationTier') === 'certificate' ||
    searchParams.get('registrationTier') === 'free'
      ? searchParams.get('registrationTier')!
      : '';
  const paymentStatusParam =
    searchParams.get('paymentStatus') === 'paid' ||
    searchParams.get('paymentStatus') === 'pending' ||
    searchParams.get('paymentStatus') === 'failed' ||
    searchParams.get('paymentStatus') === 'none' ||
    searchParams.get('paymentStatus') === 'superseded'
      ? searchParams.get('paymentStatus')!
      : '';
  const dateFromParam = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.get('dateFrom') || '')
    ? searchParams.get('dateFrom')!
    : '';
  const dateToParam = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.get('dateTo') || '')
    ? searchParams.get('dateTo')!
    : '';
  const organizationParam = searchParams.get('organization')?.trim() || '';
  const [organizationInput, setOrganizationInput] = useState(organizationParam);
  const hasAttachmentParam =
    searchParams.get('hasAttachment') === 'yes' || searchParams.get('hasAttachment') === 'no'
      ? searchParams.get('hasAttachment')!
      : '';
  const localeFilterParam =
    searchParams.get('localeFilter') === 'tr' || searchParams.get('localeFilter') === 'en'
      ? searchParams.get('localeFilter')!
      : '';
  const sourceParam = searchParams.get('source')?.trim() || '';

  const categoryFilter = isEventsHub
    ? 'event'
    : 'team';
  const statusFilter =
    statusParam && STATUS_FILTERS.includes(statusParam as SiteApplicationStatus)
      ? (statusParam as SiteApplicationStatus)
      : null;

  const showEventColumns = categoryFilter === 'event' || Boolean(eventIdParam || eventNameParam);
  const hasEventScope = Boolean(eventIdParam || eventNameParam);

  const t = texts[locale as keyof typeof texts] || texts.tr;
  const baseListPath = isEventsHub
    ? `/${locale}/events/registrations`
    : `/${locale}/site-applications/applications`;
  const eventsOverviewPath = `/${locale}/events/overview`;
  const detailBasePath = isEventsHub
    ? `/${locale}/events/registrations`
    : `/${locale}/site-applications/applications`;

  const pageTitle = useMemo(() => {
    if (hasEventScope && eventNameParam) return eventNameParam;
    if (hasEventScope) return t.subtitleEvent;
    if (!statusFilter) return t.title;
    const titles: Record<SiteApplicationStatus, string> = {
      pending: t.titlePending,
      under_review: t.titleUnderReview,
      accepted: t.titleAccepted,
      rejected: t.titleRejected,
    };
    return titles[statusFilter];
  }, [statusFilter, t, hasEventScope, eventNameParam]);

  const visibleStatusFilters = useMemo(
    () =>
      categoryFilter === 'event'
        ? STATUS_FILTERS.filter((status) => status !== 'under_review')
        : STATUS_FILTERS,
    [categoryFilter]
  );

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    fetch('/api/site-applications/forms')
      .then((r) => r.json())
      .then((d) => setForms(d.forms || []))
      .catch(() => setForms([]));
  }, []);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setOrganizationInput(organizationParam);
  }, [organizationParam]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [
    statusFilter,
    formFilter,
    search,
    categoryFilter,
    eventIdParam,
    eventNameParam,
    registrationTierParam,
    paymentStatusParam,
    dateFromParam,
    dateToParam,
    organizationParam,
    hasAttachmentParam,
    localeFilterParam,
    sourceParam,
    page,
  ]);

  const formTitleBySlug = useCallback(
    (slug: string, app?: SiteApplication) => {
      const form = forms.find((f) => f.slug_tr === slug || f.slug_en === slug);
      if (form) return locale === 'en' ? form.title_en : form.title_tr;
      if (app?.event_name) return app.event_name;
      return slug;
    },
    [forms, locale]
  );

  const buildListHref = (overrides: {
    status?: string | null;
    category?: string;
    eventId?: string | null;
    eventName?: string | null;
    registrationTier?: string | null;
    paymentStatus?: string | null;
    form?: string | null;
    page?: number | null;
    search?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    organization?: string | null;
    hasAttachment?: string | null;
    localeFilter?: string | null;
    source?: string | null;
  }) => {
    const qs = new URLSearchParams();
    const status = overrides.status !== undefined ? overrides.status : statusFilter;
    const category = overrides.category !== undefined ? overrides.category : categoryFilter;
    const eventId = overrides.eventId !== undefined ? overrides.eventId : eventIdParam;
    const eventName = overrides.eventName !== undefined ? overrides.eventName : eventNameParam;
    const registrationTier =
      overrides.registrationTier !== undefined
        ? overrides.registrationTier
        : registrationTierParam;
    const paymentStatus =
      overrides.paymentStatus !== undefined ? overrides.paymentStatus : paymentStatusParam;
    const form =
      overrides.form !== undefined ? overrides.form : formFilter !== 'all' ? formFilter : null;
    const dateFrom =
      overrides.dateFrom !== undefined ? overrides.dateFrom : dateFromParam || null;
    const dateTo = overrides.dateTo !== undefined ? overrides.dateTo : dateToParam || null;
    const organization =
      overrides.organization !== undefined
        ? overrides.organization
        : organizationParam || null;
    const hasAttachment =
      overrides.hasAttachment !== undefined
        ? overrides.hasAttachment
        : hasAttachmentParam || null;
    const localeFilter =
      overrides.localeFilter !== undefined
        ? overrides.localeFilter
        : localeFilterParam || null;
    const source = overrides.source !== undefined ? overrides.source : sourceParam || null;
    const pageVal =
      overrides.page !== undefined
        ? overrides.page
        : overrides.status !== undefined ||
            overrides.form !== undefined ||
            overrides.search !== undefined ||
            overrides.registrationTier !== undefined ||
            overrides.paymentStatus !== undefined ||
            overrides.eventId !== undefined ||
            overrides.eventName !== undefined ||
            overrides.category !== undefined ||
            overrides.dateFrom !== undefined ||
            overrides.dateTo !== undefined ||
            overrides.organization !== undefined ||
            overrides.hasAttachment !== undefined ||
            overrides.localeFilter !== undefined ||
            overrides.source !== undefined
          ? 1
          : page;
    const searchVal = overrides.search !== undefined ? overrides.search : search;

    if (status) qs.set('status', status);
    qs.set('category', category === 'all' ? categoryFilter : category);
    if (eventId) qs.set('eventId', eventId);
    if (eventName) qs.set('eventName', eventName);
    if (registrationTier) qs.set('registrationTier', registrationTier);
    if (paymentStatus) qs.set('paymentStatus', paymentStatus);
    if (form && form !== 'all') qs.set('form', form);
    if (searchVal?.trim()) qs.set('search', searchVal.trim());
    if (dateFrom) qs.set('dateFrom', dateFrom);
    if (dateTo) qs.set('dateTo', dateTo);
    if (organization?.trim()) qs.set('organization', organization.trim());
    if (hasAttachment === 'yes' || hasAttachment === 'no') {
      qs.set('hasAttachment', hasAttachment);
    }
    if (localeFilter === 'tr' || localeFilter === 'en') {
      qs.set('localeFilter', localeFilter);
    }
    if (source?.trim()) qs.set('source', source.trim());
    if (pageVal && pageVal > 1) qs.set('page', String(pageVal));
    const query = qs.toString();
    return query ? `${baseListPath}?${query}` : baseListPath;
  };

  const replaceListQuery = (updates: {
    form?: string | null;
    page?: number | null;
    search?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    organization?: string | null;
    hasAttachment?: string | null;
    localeFilter?: string | null;
    source?: string | null;
  }) => {
    router.replace(
      buildListHref({
        form: updates.form !== undefined ? updates.form : undefined,
        page: updates.page !== undefined ? updates.page : undefined,
        search: updates.search !== undefined ? updates.search : undefined,
        dateFrom: updates.dateFrom !== undefined ? updates.dateFrom : undefined,
        dateTo: updates.dateTo !== undefined ? updates.dateTo : undefined,
        organization: updates.organization !== undefined ? updates.organization : undefined,
        hasAttachment:
          updates.hasAttachment !== undefined ? updates.hasAttachment : undefined,
        localeFilter: updates.localeFilter !== undefined ? updates.localeFilter : undefined,
        source: updates.source !== undefined ? updates.source : undefined,
      }),
      { scroll: false }
    );
  };

  // Keep latest list query for debounced search so a late timer cannot
  // rewrite URL with stale form/status/page filters from an older render.
  const listQueryRef = useRef({ searchParams, baseListPath });
  listQueryRef.current = { searchParams, baseListPath };

  useEffect(() => {
    if (searchInput === search) return;
    const handle = window.setTimeout(() => {
      const { searchParams: latestParams, baseListPath: latestBase } =
        listQueryRef.current;
      const qs = new URLSearchParams(latestParams.toString());
      const nextSearch = searchInput.trim();
      if (nextSearch) qs.set('search', nextSearch);
      else qs.delete('search');
      qs.delete('page');
      const query = qs.toString();
      router.replace(query ? `${latestBase}?${query}` : latestBase, {
        scroll: false,
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput, search, router]);

  useEffect(() => {
    if (organizationInput === organizationParam) return;
    const handle = window.setTimeout(() => {
      const { searchParams: latestParams, baseListPath: latestBase } =
        listQueryRef.current;
      const qs = new URLSearchParams(latestParams.toString());
      const nextOrg = organizationInput.trim();
      if (nextOrg) qs.set('organization', nextOrg);
      else qs.delete('organization');
      qs.delete('page');
      const query = qs.toString();
      router.replace(query ? `${latestBase}?${query}` : latestBase, {
        scroll: false,
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [organizationInput, organizationParam, router]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (formFilter !== 'all') params.set('form', formFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('category', categoryFilter);
      if (search.trim()) params.set('search', search.trim());
      if (eventIdParam) params.set('eventId', eventIdParam);
      if (eventNameParam) params.set('eventName', eventNameParam);
      if (registrationTierParam) params.set('registrationTier', registrationTierParam);
      if (paymentStatusParam) params.set('paymentStatus', paymentStatusParam);
      if (dateFromParam) params.set('dateFrom', dateFromParam);
      if (dateToParam) params.set('dateTo', dateToParam);
      if (organizationParam) params.set('organization', organizationParam);
      if (hasAttachmentParam) params.set('hasAttachment', hasAttachmentParam);
      if (localeFilterParam) params.set('localeFilter', localeFilterParam);
      if (sourceParam) params.set('source', sourceParam);

      const res = await fetch(`/api/site-applications/applications?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      let rows = (data.applications as SiteApplication[]) || [];
      // Ek güvenlik: ekip sekmesine etkinlik veya kurs kaydı sızmasın
      if (categoryFilter === 'team') {
        rows = rows.filter(
          (app) =>
            !isEventSiteApplication(app) &&
            !app.course_id // kurs başvurularını dışarıda bırak
        );
      } else if (categoryFilter === 'event') {
        rows = rows.filter((app) => isEventSiteApplication(app));
      }

      setApps(rows);
      setTotal(data.total || 0);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [
    formFilter,
    search,
    page,
    statusFilter,
    categoryFilter,
    eventIdParam,
    eventNameParam,
    registrationTierParam,
    paymentStatusParam,
    dateFromParam,
    dateToParam,
    organizationParam,
    hasAttachmentParam,
    localeFilterParam,
    sourceParam,
    t.error,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  const syncPaymentsNow = async () => {
    setSyncingPayments(true);
    setPaymentSyncFlash(null);
    try {
      const res = await fetch('/api/site-applications/payments/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventIdParam || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'sync failed');
      setPaymentSyncFlash(t.syncPaymentsOk);
      await load();
    } catch {
      setPaymentSyncFlash(t.syncPaymentsFail);
    } finally {
      setSyncingPayments(false);
    }
  };

  const sendRemind = async (applicationId: string) => {
    setRemindingId(applicationId);
    setRemindFlash(null);
    try {
      const res = await fetch('/api/site-applications/payments/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, locale }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      const row = data.results?.[0];
      if (row?.status === 'sent') setRemindFlash(t.remindOk);
      else if (row?.status === 'skipped' && row.reason === 'already_paid') {
        setRemindFlash(
          locale === 'tr'
            ? 'Ödeme zaten alınmış — mail gönderilmedi'
            : 'Already paid — reminder skipped'
        );
        load();
      } else setRemindFlash(t.remindFail);
    } catch {
      setRemindFlash(t.remindFail);
    } finally {
      setRemindingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allPageSelected = apps.length > 0 && apps.every((app) => selectedIds.has(app.id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const app of apps) next.delete(app.id);
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const app of apps) next.add(app.id);
        return next;
      });
    }
  };

  const confirmBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setDeleting(true);
    setDeleteFlash(null);
    try {
      const res = await fetch('/api/site-applications/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      setSelectedIds(new Set());
      setDeleteModalOpen(false);
      setDeleteFlash(
        data.deletedCount
          ? `${t.deleteSuccess} (${data.deletedCount})`
          : t.deleteFail
      );
      await load();
    } catch {
      setDeleteFlash(t.deleteFail);
    } finally {
      setDeleting(false);
    }
  };

  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      const type = form.form_type ?? inferFormType(form);
      return categoryFilter === type;
    });
  }, [forms, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const colCount = (showEventColumns ? 7 : 5) + 1;

  const activeEventLabel =
    eventNameParam ||
    apps.find((a) => a.event_name)?.event_name ||
    (eventIdParam ? eventIdParam.slice(0, 8) : null);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        {hasEventScope && (
          <Link
            href={eventsOverviewPath}
            className="inline-flex items-center gap-1.5 text-sm text-[#990000] hover:underline mb-3"
          >
            <CalendarDays className="w-4 h-4" />
            {t.backToEvents}
          </Link>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          {pageTitle}
        </h1>
        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
          {hasEventScope
            ? t.subtitleEvent
            : statusFilter
              ? t.subtitleFiltered
              : t.subtitle}
        </p>
        {remindFlash && (
          <p className="mt-2 text-sm text-[#990000]">{remindFlash}</p>
        )}
        {deleteFlash && (
          <p className="mt-2 text-sm text-[#990000]">{deleteFlash}</p>
        )}
        {(statusFilter ||
          hasEventScope ||
          registrationTierParam ||
          paymentStatusParam ||
          dateFromParam ||
          dateToParam ||
          organizationParam ||
          hasAttachmentParam ||
          localeFilterParam ||
          sourceParam ||
          (formFilter !== 'all')) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-500">{t.filterActive}:</span>
            {hasEventScope && activeEventLabel && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-[#990000] dark:bg-red-900/20 dark:text-red-300">
                {t.eventLabel}: {activeEventLabel}
              </span>
            )}
            {statusFilter && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(statusFilter)}`}>
                {t.statusLabels[statusFilter]}
              </span>
            )}
            {formFilter !== 'all' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                {formTitleBySlug(formFilter)}
              </span>
            )}
            {(dateFromParam || dateToParam) && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                {dateFromParam || '…'} → {dateToParam || '…'}
              </span>
            )}
            {organizationParam && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                {t.organizationFilter}: {organizationParam}
              </span>
            )}
            {hasAttachmentParam && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                {t.hasAttachment}:{' '}
                {hasAttachmentParam === 'yes' ? t.attachmentYes : t.attachmentNo}
              </span>
            )}
            {localeFilterParam && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                {t.localeFilter}: {localeFilterParam.toUpperCase()}
              </span>
            )}
            {sourceParam && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                {t.sourceFilter}:{' '}
                {sourceParam === 'event_website'
                  ? t.sourceEventWebsite
                  : sourceParam === 'website'
                    ? t.sourceWebsite
                    : sourceParam}
              </span>
            )}
            {registrationTierParam && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800">
                {t.filterPackage}:{' '}
                {registrationTierParam === 'certificate' ? t.packageCertificate : t.packageFree}
              </span>
            )}
            {paymentStatusParam && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${paymentColor(paymentStatusParam)}`}>
                {t.filterPayment}:{' '}
                {paymentStatusParam === 'paid'
                  ? t.paymentPaid
                  : paymentStatusParam === 'pending'
                    ? t.paymentPending
                    : paymentStatusParam === 'failed'
                      ? t.paymentFailed
                      : paymentStatusParam === 'superseded'
                        ? t.paymentSuperseded
                        : t.paymentNone}
              </span>
            )}
            <Link
              href={
                hasEventScope
                  ? buildListHref({
                      status: null,
                      registrationTier: null,
                      paymentStatus: null,
                      eventId: eventIdParam || null,
                      eventName: eventNameParam || null,
                      category: 'event',
                      dateFrom: null,
                      dateTo: null,
                      organization: null,
                      hasAttachment: null,
                      localeFilter: null,
                      source: null,
                      form: null,
                      search: null,
                    })
                  : baseListPath
              }
              className="text-xs text-[#990000] hover:underline"
            >
              {t.clearFilter}
            </Link>
            {hasEventScope && (
              <Link href={baseListPath} className="text-xs text-neutral-500 hover:underline">
                {locale === 'tr' ? 'Tüm başvurular' : 'All applications'}
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Link
          href={buildListHref({ status: null, category: categoryFilter })}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            !statusFilter
              ? 'bg-[#990000] text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          {t.all}
        </Link>
        {visibleStatusFilters.map((status) => (
          <Link
            key={status}
            href={buildListHref({ status, category: categoryFilter })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              statusFilter === status
                ? 'bg-[#990000] text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {t.statusLabels[status]}
          </Link>
        ))}
        <button
          type="button"
          className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition inline-flex items-center gap-1.5"
          onClick={() => {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            if (categoryFilter) params.set('category', categoryFilter);
            if (eventIdParam) params.set('eventId', eventIdParam);
            if (eventNameParam) params.set('eventName', eventNameParam);
            if (formFilter !== 'all') params.set('form', formFilter);
            if (search) params.set('search', search);
            if (dateFromParam) params.set('dateFrom', dateFromParam);
            if (dateToParam) params.set('dateTo', dateToParam);
            if (organizationParam) params.set('organization', organizationParam);
            if (hasAttachmentParam) params.set('hasAttachment', hasAttachmentParam);
            if (localeFilterParam) params.set('localeFilter', localeFilterParam);
            if (sourceParam) params.set('source', sourceParam);
            if (registrationTierParam) params.set('registrationTier', registrationTierParam);
            if (paymentStatusParam) params.set('paymentStatus', paymentStatusParam);
            params.set('locale', locale);
            const qs = params.toString();
            window.open(`/api/site-applications/applications/export${qs ? `?${qs}` : ''}`, '_blank');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
          {locale === 'tr' ? "Excel'e Aktar" : 'Export to Excel'}
        </button>
      </div>

      {showEventColumns && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 px-3 py-2.5">
          <p className="text-xs text-amber-900 dark:text-amber-200 flex-1">
            {t.paymentStaleHint}
          </p>
          <button
            type="button"
            onClick={() => void syncPaymentsNow()}
            disabled={syncingPayments}
            className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-800 text-white hover:bg-amber-900 disabled:opacity-50"
          >
            {syncingPayments ? t.syncingPayments : t.syncPayments}
          </button>
        </div>
      )}
      {paymentSyncFlash && (
        <p className="mb-4 text-sm text-[#990000]">{paymentSyncFlash}</p>
      )}

      {showEventColumns && (
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs text-neutral-500 self-center mr-1">{t.package}:</span>
          {(
            [
              ['', t.all],
              ['free', t.packageFree],
              ['certificate', t.packageCertificate],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key || 'all-pkg'}
              href={buildListHref({
                registrationTier: key || null,
                category: 'event',
              })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                registrationTierParam === key
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {label}
            </Link>
          ))}
          <span className="text-xs text-neutral-500 self-center ml-2 mr-1">{t.payment}:</span>
          {(
            [
              ['', t.all],
              ['paid', t.paymentPaid],
              ['pending', t.paymentPending],
              ['failed', t.paymentFailed],
              ['superseded', t.paymentSuperseded],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key || 'all-pay'}
              href={buildListHref({
                paymentStatus: key || null,
                category: 'event',
                registrationTier: key
                  ? registrationTierParam || 'certificate'
                  : registrationTierParam || null,
              })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                paymentStatusParam === key
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t.search}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800"
          />
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={formFilter}
            onChange={(e) => {
              replaceListQuery({
                form: e.target.value === 'all' ? null : e.target.value,
                page: null,
              });
            }}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
          >
            <option value="all">{t.allForms}</option>
            {filteredForms.map((form) => (
              <option key={form.id} value={locale === 'en' ? form.slug_en : form.slug_tr}>
                {locale === 'en' ? form.title_en : form.title_tr}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700"
            title={t.refresh}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <p className="text-xs font-medium text-neutral-500">{t.moreFilters}</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[11px] text-neutral-500 mb-1">{t.dateFrom}</label>
            <input
              type="date"
              value={dateFromParam}
              onChange={(e) =>
                replaceListQuery({
                  dateFrom: e.target.value || null,
                  page: null,
                })
              }
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] text-neutral-500 mb-1">{t.dateTo}</label>
            <input
              type="date"
              value={dateToParam}
              onChange={(e) =>
                replaceListQuery({
                  dateTo: e.target.value || null,
                  page: null,
                })
              }
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <label className="block text-[11px] text-neutral-500 mb-1">
              {t.organizationFilter}
            </label>
            <input
              value={organizationInput}
              onChange={(e) => setOrganizationInput(e.target.value)}
              placeholder={t.organizationPlaceholder}
              className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
            />
          </div>
          <div>
            <label className="block text-[11px] text-neutral-500 mb-1">{t.hasAttachment}</label>
            <select
              value={hasAttachmentParam}
              onChange={(e) =>
                replaceListQuery({
                  hasAttachment: e.target.value || null,
                  page: null,
                })
              }
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
            >
              <option value="">{t.attachmentAll}</option>
              <option value="yes">{t.attachmentYes}</option>
              <option value="no">{t.attachmentNo}</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-neutral-500 mb-1">{t.localeFilter}</label>
            <select
              value={localeFilterParam}
              onChange={(e) =>
                replaceListQuery({
                  localeFilter: e.target.value || null,
                  page: null,
                })
              }
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
            >
              <option value="">{t.localeAll}</option>
              <option value="tr">TR</option>
              <option value="en">EN</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-neutral-500 mb-1">{t.sourceFilter}</label>
            <select
              value={sourceParam}
              onChange={(e) =>
                replaceListQuery({
                  source: e.target.value || null,
                  page: null,
                })
              }
              className="px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
            >
              <option value="">{t.sourceAll}</option>
              <option value="website">{t.sourceWebsite}</option>
              <option value="event_website">{t.sourceEventWebsite}</option>
              {sourceParam &&
                !(SOURCE_OPTIONS as readonly string[]).includes(sourceParam) && (
                  <option value={sourceParam}>{sourceParam}</option>
                )}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-4 py-3">
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {selectedIds.size} {t.selectedCount}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-white dark:hover:bg-neutral-800"
            >
              {t.deselectAll}
            </button>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4" />
              {t.deleteSelected} ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-3 py-3 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={apps.length === 0 || loading}
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-40"
                    title={allPageSelected ? t.deselectAll : t.selectAll}
                    aria-label={allPageSelected ? t.deselectAll : t.selectAll}
                  >
                    {allPageSelected ? (
                      <CheckSquare className="w-5 h-5 text-[#990000]" />
                    ) : (
                      <Square className="w-5 h-5 text-neutral-400" />
                    )}
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium">{t.applicant}</th>
                <th className="text-left px-4 py-3 font-medium">{t.form}</th>
                {showEventColumns && (
                  <>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">{t.package}</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{t.payment}</th>
                  </>
                )}
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">{t.status}</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">{t.date}</th>
                <th className="text-right px-4 py-3 font-medium">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-neutral-500">
                    {t.loading}
                  </td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-12 text-center text-neutral-500">
                    {t.noResults}
                  </td>
                </tr>
              ) : (
                apps.map((app) => {
                  const submission = readSubmission(app);
                  const tier = String(submission.registration_tier || 'free');
                  const pay = String(submission.payment_status || 'none');
                  const price = Number(submission.package_price);
                  const currency = String(submission.package_currency || 'TRY');
                  const isSelected = selectedIds.has(app.id);

                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-neutral-50 dark:hover:bg-neutral-700/30 ${
                        isSelected ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                      }`}
                    >
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => toggleSelect(app.id)}
                          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                          aria-label={isSelected ? t.deselectAll : t.selectAll}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-[#990000]" />
                          ) : (
                            <Square className="w-5 h-5 text-neutral-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          {app.first_name} {app.last_name}
                        </div>
                        <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {app.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                          <FileText className="w-3.5 h-3.5" />
                          {formTitleBySlug(app.application_type, app)}
                        </span>
                        {app.event_name && (
                          <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {t.eventLabel}: {app.event_name}
                          </div>
                        )}
                      </td>
                      {showEventColumns && (
                        <>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="font-medium text-neutral-800 dark:text-neutral-200">
                              {tier === 'certificate' ? t.packageCertificate : t.packageFree}
                            </div>
                            {tier === 'certificate' && Number.isFinite(price) && price > 0 && (
                              <div className="text-xs text-neutral-500 mt-0.5">
                                {formatPackagePrice(price, currency, locale)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {tier === 'certificate' ? (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${paymentColor(pay)}`}
                              >
                                {pay === 'paid'
                                  ? t.paymentPaid
                                  : pay === 'pending'
                                    ? t.paymentPending
                                    : pay === 'failed'
                                      ? t.paymentFailed
                                      : pay === 'superseded'
                                        ? t.paymentSuperseded
                                        : t.paymentNone}
                              </span>
                            ) : (
                              <span className="text-xs text-neutral-400">{t.paymentNone}</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(app.status)}`}
                        >
                          {t.statusLabels[app.status as keyof typeof t.statusLabels] || app.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-neutral-500">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(app.created_at).toLocaleDateString(
                            locale === 'tr' ? 'tr-TR' : 'en-US'
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {(pay === 'pending' || pay === 'failed' || pay === 'superseded') && (
                            <button
                              type="button"
                              onClick={() => sendRemind(app.id)}
                              disabled={remindingId === app.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg disabled:opacity-50"
                              title={t.remind}
                            >
                              <Mail className="w-4 h-4" />
                              {remindingId === app.id ? t.reminding : t.remind}
                            </button>
                          )}
                          <Link
                            href={
                              listQueryString
                                ? `${detailBasePath}/${app.id}?${listQueryString}`
                                : `${detailBasePath}/${app.id}`
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#990000] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                            {t.view}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-sm text-neutral-500">
              {t.page} {page} {t.of} {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() =>
                  replaceListQuery({ page: page <= 2 ? null : page - 1 })
                }
                className="p-2 rounded-lg border disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => replaceListQuery({ page: page + 1 })}
                className="p-2 rounded-lg border disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <BulkDeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        onConfirm={confirmBulkDelete}
        count={selectedIds.size}
        isDeleting={deleting}
        t={t}
      />
    </div>
  );
}
