'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart3,
  Users,
  ShoppingCart,
  BookOpen,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Download,
  AlertCircle,
  GraduationCap,
  CheckCircle,
  Tag,
  Percent,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AnalyticsParticipationPanel from '@/app/components/analytics/AnalyticsParticipationPanel';
import AnalyticsDiscountUsagePanel from '@/app/components/analytics/AnalyticsDiscountUsagePanel';
import AnalyticsOrderLedgerPanel from '@/app/components/analytics/AnalyticsOrderLedgerPanel';
import type {
  CashflowSummary,
  ClerkUserLite,
  CourseParticipation,
  DiscountCodeDetail,
  DiscountCodeRow,
  DiscountUsageDetail,
  OrderLedgerEntry,
  StudentParticipation,
  StudentPurchaseItem,
  TierRow,
} from '@/app/lib/analytics/types';
import {
  normalizeDiscountCode,
  calculateCommissionAmount,
} from '@/app/lib/influencer/codes';

const supabase = createClientComponentClient({
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL2 ||
    'https://emfvwpztyuykqtepnsfp.supabase.co',
  supabaseKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY2 ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtZnZ3cHp0eXV5a3F0ZXBuc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0OTM5MDksImV4cCI6MjA1NDA2OTkwOX0.EbGPYHtXMO2RYGavv-FQa3mgI3RECiFnwAVqpUgghxg',
});

type PeriodKey =
  | 'last7Days'
  | 'last30Days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'all';

type TrendMetric = 'revenue' | 'orders' | 'enrollments' | 'students';

interface SnapshotItem {
  id?: string;
  title?: string;
  type?: string;
  courseId?: string;
  tierId?: string;
  listPrice?: number;
  paidPrice?: number;
  price?: number;
}

interface OrderRow {
  id?: string;
  orderid?: string;
  courseid: string;
  coursename: string;
  amount: number;
  discountamount?: number | null;
  discountcode?: string | null;
  paymentmethod?: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  useremail: string;
  enrolled?: boolean | null;
  custom_data?: {
    itemType?: string;
    siteApplicationId?: string;
    eventSlug?: string;
    discountCodes?: string;
    totalDiscount?: number;
    userId?: string;
    clerkUserId?: string;
    tierId?: string | null;
    cartMode?: boolean;
    cartItems?: Array<{
      id?: string;
      title?: string;
      type?: string;
      courseId?: string;
      tierId?: string;
      price?: number;
      listPrice?: number;
      paidPrice?: number;
    }>;
    orderSnapshot?: {
      items?: SnapshotItem[];
      listTotal?: number;
      discountAmount?: number;
      paidTotal?: number;
      discountCodes?: string;
    } | null;
  } | null;
}

interface EnrollmentRow {
  course_id: string;
  user_id: string;
  enrolled_at: string | null;
  progress_percentage: number | null;
  tier_id?: string | null;
}

interface CourseRow {
  id: string;
  title: string;
  is_active: boolean | null;
  price?: number | null;
  original_price?: number | null;
}

interface DailyPoint {
  date: string;
  revenue: number;
  orders: number;
  enrollments: number;
  students: number;
}

interface CourseStat {
  course_id: string;
  course_name: string;
  enrollments: number;
  unique_students: number;
  revenue: number;
  list_revenue: number;
  orders: number;
  discount_amount: number;
  discounted_orders: number;
  discount_codes: string[];
  avg_progress: number;
  completed: number;
  /** Etkinlik sertifika satışı (LMS enrollment değil) */
  is_certificate?: boolean;
}

interface CourseSaleLine {
  key: string;
  name: string;
  isEventCertificate: boolean;
  paidAmount: number;
  /** Sipariş anındaki liste (snapshot / cart) */
  orderListAmount: number;
  /** Gösterim / raporlama için katalog tercihli liste */
  listAmount: number;
  catalogListAmount: number | null;
  discountShare: number;
  discountCodes: string[];
  orderRef: string;
  createdAt: string;
  buyerEmail: string;
  buyerUserId: string | null;
  tierId: string | null;
  moduleTitle: string | null;
  itemType: string;
  isCart: boolean;
}

function roundMoney(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function parseDiscountCodes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,|;]+/)
    .map((code) => code.trim())
    .filter(Boolean);
}

function orderRef(order: OrderRow): string {
  return String(order.orderid || order.id || `${order.courseid}-${order.created_at}-${order.useremail}`);
}

/** Sertifika / etkinlik paket siparişlerini kurs UUID yerine isimle grupla */
function getOrderAggregation(order: OrderRow): {
  key: string;
  name: string;
  isEventCertificate: boolean;
} {
  const name = (order.coursename || '').trim();
  const isEventCertificate =
    order.custom_data?.itemType === 'event_certificate' ||
    /^sertifika\s*[-–—]/i.test(name);

  if (isEventCertificate && name) {
    return {
      key: `cert:${name.toLocaleLowerCase('tr')}`,
      name,
      isEventCertificate: true,
    };
  }

  return {
    key: order.courseid,
    name: name || `Kurs ${String(order.courseid || '').slice(0, 8)}`,
    isEventCertificate: false,
  };
}

function isCertificateLike(type: string | undefined, title: string): boolean {
  if (type === 'event_certificate') return true;
  return /^sertifika\s*[-–—]/i.test(title.trim());
}

/** Güncel katalog liste fiyatı (tier.price → course.price); yoksa null */
function resolveCatalogListPrice(
  line: { key: string; tierId: string | null; isEventCertificate: boolean },
  coursePriceMap: Map<string, number>,
  tierPriceMap: Map<string, number>
): number | null {
  if (line.isEventCertificate) return null;
  if (line.tierId) {
    const tierPrice = tierPriceMap.get(line.tierId);
    if (tierPrice != null && tierPrice > 0) return tierPrice;
  }
  const coursePrice = coursePriceMap.get(line.key);
  if (coursePrice != null && coursePrice > 0) return coursePrice;
  return null;
}

function withCatalogListPrice(
  line: Omit<CourseSaleLine, 'listAmount' | 'catalogListAmount' | 'discountShare'> & {
    discountShare?: number;
  },
  coursePriceMap: Map<string, number>,
  tierPriceMap: Map<string, number>
): CourseSaleLine {
  const catalog = resolveCatalogListPrice(line, coursePriceMap, tierPriceMap);
  const listAmount =
    catalog != null && catalog > 0 ? catalog : line.orderListAmount;
  const discountShare =
    line.discountShare != null
      ? line.discountShare
      : roundMoney(Math.max(0, listAmount - line.paidAmount));
  return {
    ...line,
    catalogListAmount: catalog,
    listAmount,
    discountShare,
  };
}

function resolveLineTarget(
  item: {
    id?: string;
    title?: string;
    type?: string;
    courseId?: string;
  },
  fallback: { key: string; name: string; isEventCertificate: boolean },
  courseTitleMap: Map<string, string>
): { key: string; name: string; isEventCertificate: boolean } {
  const title = (item.title || fallback.name || '').trim();
  if (isCertificateLike(item.type, title)) {
    return {
      key: `cert:${title.toLocaleLowerCase('tr')}`,
      name: title || fallback.name,
      isEventCertificate: true,
    };
  }

  const courseId = item.courseId || (item.type === 'course' || item.type === 'tier' ? item.id : undefined);
  if (courseId && courseTitleMap.has(courseId)) {
    return {
      key: courseId,
      name: courseTitleMap.get(courseId)!,
      isEventCertificate: false,
    };
  }
  if (courseId) {
    return {
      key: courseId,
      name: title || `Kurs ${courseId.slice(0, 8)}`,
      isEventCertificate: false,
    };
  }

  if (item.type === 'product' || item.type === 'package') {
    const slugKey = `${item.type}:${(item.id || title).toLocaleLowerCase('tr')}`;
    return {
      key: slugKey,
      name: title || fallback.name,
      isEventCertificate: false,
    };
  }

  return fallback;
}

/**
 * Siparişi kurs/kalem satırlarına açar.
 * Öncelik: orderSnapshot → cartItems → tek satır fallback.
 * Gelir = ödenen tutar (paid); indirim ayrı tutulur (amount - discount YAPILMAZ).
 * Liste: mümkünse güncel katalog fiyatı (course/tier.price), yoksa sipariş listesi.
 */
function expandOrderToCourseLines(
  order: OrderRow,
  courseTitleMap: Map<string, string>,
  titleToCourseId: Map<string, string>,
  coursePriceMap: Map<string, number> = new Map(),
  tierPriceMap: Map<string, number> = new Map()
): CourseSaleLine[] {
  const codes = parseDiscountCodes(
    order.discountcode ||
      order.custom_data?.orderSnapshot?.discountCodes ||
      order.custom_data?.discountCodes
  );
  const buyerUserId =
    order.custom_data?.userId || order.custom_data?.clerkUserId || null;
  const agg = getOrderAggregation(order);
  let fallback = agg;
  if (!agg.isEventCertificate && !courseTitleMap.has(order.courseid)) {
    const byTitle = titleToCourseId.get(agg.name.toLocaleLowerCase('tr'));
    if (byTitle) {
      fallback = {
        key: byTitle,
        name: courseTitleMap.get(byTitle) || agg.name,
        isEventCertificate: false,
      };
    }
  }

  const ref = orderRef(order);
  const isCartOrder =
    order.custom_data?.cartMode === true ||
    String(order.courseid || '').toUpperCase() === 'CART' ||
    order.custom_data?.itemType === 'cart';

  const snapshot = order.custom_data?.orderSnapshot;
  if (snapshot && Array.isArray(snapshot.items) && snapshot.items.length > 0) {
    const multi = snapshot.items.filter(Boolean).length > 1 || isCartOrder;
    return snapshot.items.filter(Boolean).map((item) => {
      const target = resolveLineTarget(item, fallback, courseTitleMap);
      const orderListAmount = roundMoney(Number(item.listPrice ?? item.price) || 0);
      const paidAmount = roundMoney(
        item.paidPrice != null ? Number(item.paidPrice) : orderListAmount
      );
      const isModule =
        item.type === 'tier' || item.type === 'package' || Boolean(item.tierId);
      return withCatalogListPrice(
        {
          key: target.key,
          name: target.name,
          isEventCertificate: target.isEventCertificate,
          paidAmount,
          orderListAmount,
          discountCodes: codes,
          orderRef: ref,
          createdAt: order.created_at,
          buyerEmail: order.useremail || '',
          buyerUserId,
          tierId: item.tierId || null,
          moduleTitle: isModule ? item.title || null : item.title || null,
          itemType: String(
            item.type ||
              (target.isEventCertificate
                ? 'event_certificate'
                : item.tierId
                  ? 'tier'
                  : 'course')
          ),
          isCart: multi,
          discountShare: roundMoney(Math.max(0, orderListAmount - paidAmount)),
        },
        coursePriceMap,
        tierPriceMap
      );
    });
  }

  const cartItems = order.custom_data?.cartItems;
  if (
    (order.custom_data?.cartMode ||
      String(order.courseid || '').toUpperCase() === 'CART') &&
    Array.isArray(cartItems) &&
    cartItems.length > 0
  ) {
    const listTotal = cartItems.reduce(
      (sum, item) => sum + (Number(item.listPrice ?? item.price) || 0),
      0
    );
    const paidTotal = roundMoney(
      Number(order.custom_data?.orderSnapshot?.paidTotal ?? order.amount) || 0
    );
    const discountTotal = roundMoney(
      Number(order.discountamount ?? order.custom_data?.totalDiscount) ||
        Math.max(0, listTotal - paidTotal)
    );

    let allocatedPaid = 0;
    let allocatedDiscount = 0;

    return cartItems.map((item, index) => {
      const target = resolveLineTarget(item, fallback, courseTitleMap);
      const orderListAmount = roundMoney(Number(item.listPrice ?? item.price) || 0);
      let paidAmount = 0;
      let discountShare = 0;

      if (index === cartItems.length - 1) {
        paidAmount = roundMoney(paidTotal - allocatedPaid);
        discountShare = roundMoney(discountTotal - allocatedDiscount);
      } else if (listTotal > 0) {
        paidAmount = roundMoney((orderListAmount / listTotal) * paidTotal);
        discountShare = roundMoney((orderListAmount / listTotal) * discountTotal);
        allocatedPaid = roundMoney(allocatedPaid + paidAmount);
        allocatedDiscount = roundMoney(allocatedDiscount + discountShare);
      } else if (index === 0) {
        paidAmount = paidTotal;
        discountShare = discountTotal;
      }

      return withCatalogListPrice(
        {
          key: target.key,
          name: target.name,
          isEventCertificate: target.isEventCertificate,
          paidAmount,
          orderListAmount,
          discountShare,
          discountCodes: codes,
          orderRef: ref,
          createdAt: order.created_at,
          buyerEmail: order.useremail || '',
          buyerUserId,
          tierId: item.tierId || null,
          moduleTitle: item.title || null,
          itemType: String(item.type || (item.tierId ? 'tier' : 'course')),
          isCart: true,
        },
        coursePriceMap,
        tierPriceMap
      );
    });
  }

  const paidAmount = roundMoney(Number(order.amount) || 0);
  const discountShare = roundMoney(Number(order.discountamount) || 0);
  return [
    withCatalogListPrice(
      {
        key: fallback.key,
        name: fallback.name,
        isEventCertificate: fallback.isEventCertificate,
        paidAmount,
        orderListAmount: roundMoney(paidAmount + discountShare),
        discountShare,
        discountCodes: codes,
        orderRef: ref,
        createdAt: order.created_at,
        buyerEmail: order.useremail || '',
        buyerUserId,
        tierId: order.custom_data?.tierId || null,
        moduleTitle: null,
        itemType: String(
          order.custom_data?.itemType ||
            (fallback.isEventCertificate ? 'event_certificate' : 'course')
        ),
        isCart: false,
      },
      coursePriceMap,
      tierPriceMap
    ),
  ];
}

function dedupeOrders(orders: OrderRow[]): OrderRow[] {
  const seen = new Set<string>();
  const out: OrderRow[] = [];
  for (const order of orders) {
    const id = orderRef(order);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(order);
  }
  return out;
}

interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  uniqueStudents: number;
  totalEnrollments: number;
  activeCourses: number;
  completedEnrollments: number;
  averageOrderValue: number;
  averageProgress: number;
  totalDiscount: number;
  discountedOrders: number;
  uniqueDiscountCodes: number;
}

const texts = {
  tr: {
    title: 'Analitik Raporları',
    subtitle: 'Sistem genelinde eğitim satışları, kayıtlar ve katılım metrikleri',
    periods: {
      last7Days: 'Son 7 Gün',
      last30Days: 'Son 30 Gün',
      thisMonth: 'Bu Ay',
      lastMonth: 'Geçen Ay',
      thisYear: 'Bu Yıl',
      all: 'Tümü',
    },
    metrics: {
      totalRevenue: 'Toplam Satış',
      totalOrders: 'Toplam Sipariş',
      uniqueStudents: 'Benzersiz Öğrenci',
      totalEnrollments: 'Toplam Kayıt',
      activeCourses: 'Aktif Kurs',
      completedEnrollments: 'Tamamlanan Kayıt',
      averageOrderValue: 'Ort. Sipariş Tutarı',
      averageProgress: 'Ort. İlerleme',
      totalDiscount: 'Toplam İndirim',
      discountedOrders: 'Kodlu Sipariş',
      uniqueDiscountCodes: 'Kullanılan Kod',
    },
    charts: {
      trend: 'Zaman İçinde Trend',
      topCoursesEnrollments: 'En Çok Kayıt Alan Kurslar',
      topCoursesRevenue: 'En Çok Gelir Getiren Kurslar',
      topDiscountCodes: 'En Çok Kullanılan İndirim Kodları',
    },
    trendMetrics: {
      revenue: 'Gelir',
      orders: 'Sipariş',
      enrollments: 'Kayıt',
      students: 'Yeni Öğrenci',
    },
    table: {
      course: 'Kurs',
      enrollments: 'Kayıt',
      students: 'Öğrenci',
      revenue: 'Gelir',
      orders: 'Sipariş',
      avgProgress: 'Ort. İlerleme',
      completed: 'Tamamlayan',
      discount: 'İndirim',
      discountedOrders: 'Kodlu Sipariş',
      codes: 'Kodlar',
      code: 'Kod',
      usage: 'Kullanım',
      paid: 'Ödenen',
    },
    actions: { refresh: 'Yenile', export: 'Raporu İndir' },
    empty: 'Seçilen dönem için veri bulunamadı.',
    loading: 'Veriler yükleniyor...',
    error: 'Veriler yüklenirken hata oluştu.',
    salesSection: 'Satış Özeti',
    salesSectionHint:
      'Gelir ödenen tutardır (orderSnapshot.paidPrice). İndirim kodları sipariş ve kurs bazında ayrı gösterilir; sepet siparişleri kalem kalem dağıtılır.',
    discountSection: 'İndirim Kodu Kullanımı',
    discountSectionHint:
      'Kod, influencer ve kullanan öğrenci e-postaları veritabanı + Clerk ile senkron. Satırı açarak sipariş/e-posta/modül detayını görün.',
    enrollmentsSection: 'Eğitim Katılımı',
    enrollmentsSectionHint:
      'Kurs satırını açarak öğrencilerin e-postasını, aldığı modülü/paketi, liste/ödenen tutarı, sipariş no ve indirim kodunu görün.',
    participationSearch: 'Öğrenci, e-posta veya modül ara...',
    discountSearch: 'Kod, influencer veya e-posta ara...',
    ledgerSection: 'Sipariş Defteri / Nakit Akışı',
    ledgerSectionHint:
      'Tüm tamamlanan siparişler (tekil + sepet): kim aldı, ne aldı, ne zaman, ne ödedi. Para girişi = ödenen toplam; indirim verilen tutar ayrıca gösterilir.',
    ledgerSearch: 'Sipariş no, e-posta, ürün veya kod ara...',
    moneyIn: 'Para girişi',
    discountGiven: 'Verilen indirim',
    listVolume: 'Liste hacmi',
    cartOrders: 'Sepet siparişi',
    freeOrders: 'Ücretsiz sipariş',
    uniqueBuyers: 'Benzersiz alıcı',
    buyer: 'Alıcı',
    cart: 'Sepet',
    payment: 'Ödeme',
    status: 'Durum',
    items: 'Kalemler',
    email: 'E-posta',
    name: 'Ad',
    modules: 'Modül / Paket',
    paid: 'Ödenen',
    list: 'Liste',
    enrolledAt: 'Kayıt tarihi',
    orderNo: 'Sipariş No',
    fullCourse: 'Tam Eğitim',
    influencer: 'Influencer',
    module: 'Modül',
    date: 'Tarih',
    type: 'Tür',
    noInfluencer: 'Atanmamış',
    commission: 'Komisyon',
    estimatedCommission: 'Tahmini komisyon',
    dbUsage: 'DB kullanım',
    validUntil: 'Geçerlilik',
    buyersPreview: 'Alıcılar',
    moduleBreakdown: 'Modül dağılımı',
    studentCount: 'öğrenci detayı',
    cartItems: 'Sepetteki ürünler',
    orderList: 'Sipariş listesi',
    catalogList: 'Katalog listesi',
    expand: 'Genişlet',
    collapse: 'Daralt',
    trendsSection: 'Trend Analizi',
  },
  en: {
    title: 'Analytics Reports',
    subtitle: 'System-wide training sales, enrollments and participation metrics',
    periods: {
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      thisYear: 'This Year',
      all: 'All Time',
    },
    metrics: {
      totalRevenue: 'Total Revenue',
      totalOrders: 'Total Orders',
      uniqueStudents: 'Unique Students',
      totalEnrollments: 'Total Enrollments',
      activeCourses: 'Active Courses',
      completedEnrollments: 'Completed Enrollments',
      averageOrderValue: 'Avg. Order Value',
      averageProgress: 'Avg. Progress',
      totalDiscount: 'Total Discount',
      discountedOrders: 'Orders with Codes',
      uniqueDiscountCodes: 'Codes Used',
    },
    charts: {
      trend: 'Trend Over Time',
      topCoursesEnrollments: 'Top Courses by Enrollments',
      topCoursesRevenue: 'Top Courses by Revenue',
      topDiscountCodes: 'Most Used Discount Codes',
    },
    trendMetrics: {
      revenue: 'Revenue',
      orders: 'Orders',
      enrollments: 'Enrollments',
      students: 'New Students',
    },
    table: {
      course: 'Course',
      enrollments: 'Enrollments',
      students: 'Students',
      revenue: 'Revenue',
      orders: 'Orders',
      avgProgress: 'Avg. Progress',
      completed: 'Completed',
      discount: 'Discount',
      discountedOrders: 'Coded Orders',
      codes: 'Codes',
      code: 'Code',
      usage: 'Usage',
      paid: 'Paid',
    },
    actions: { refresh: 'Refresh', export: 'Export Report' },
    empty: 'No data found for the selected period.',
    loading: 'Loading data...',
    error: 'An error occurred while loading data.',
    salesSection: 'Sales Summary',
    salesSectionHint:
      'Revenue is the amount paid (orderSnapshot.paidPrice). Discount codes are shown per order and course; cart orders are split by line item.',
    discountSection: 'Discount Code Usage',
    discountSectionHint:
      'Codes, influencers and student emails stay synced via database + Clerk. Expand a row for order/email/module details.',
    enrollmentsSection: 'Training Participation',
    enrollmentsSectionHint:
      'Expand a course row to see student emails, modules/packages, list/paid amounts, order IDs and discount codes.',
    participationSearch: 'Search student, email or module...',
    discountSearch: 'Search code, influencer or email...',
    ledgerSection: 'Order Ledger / Cashflow',
    ledgerSectionHint:
      'All completed orders (single + cart): who bought what, when, and how much. Money in = paid total; discounts given are shown separately.',
    ledgerSearch: 'Search order no, email, item or code...',
    moneyIn: 'Money in',
    discountGiven: 'Discount given',
    listVolume: 'List volume',
    cartOrders: 'Cart orders',
    freeOrders: 'Free orders',
    uniqueBuyers: 'Unique buyers',
    buyer: 'Buyer',
    cart: 'Cart',
    payment: 'Payment',
    status: 'Status',
    items: 'Items',
    email: 'Email',
    name: 'Name',
    modules: 'Module / Package',
    paid: 'Paid',
    list: 'List',
    enrolledAt: 'Enrolled at',
    orderNo: 'Order No',
    fullCourse: 'Full Course',
    influencer: 'Influencer',
    module: 'Module',
    date: 'Date',
    type: 'Type',
    noInfluencer: 'Unassigned',
    commission: 'Commission',
    estimatedCommission: 'Est. commission',
    dbUsage: 'DB usage',
    validUntil: 'Valid until',
    buyersPreview: 'Buyers',
    moduleBreakdown: 'Module breakdown',
    studentCount: 'student details',
    cartItems: 'Cart items',
    orderList: 'Order list',
    catalogList: 'Catalog list',
    expand: 'Expand',
    collapse: 'Collapse',
    trendsSection: 'Trend Analysis',
  },
};

function formatCurrency(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getPeriodStart(period: PeriodKey): Date | null {
  const now = new Date();
  if (period === 'all') return null;
  if (period === 'last7Days') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  }
  if (period === 'last30Days') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  }
  if (period === 'thisMonth') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (period === 'lastMonth') {
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
  return new Date(now.getFullYear(), 0, 1);
}

function getPeriodEnd(period: PeriodKey): Date | null {
  const now = new Date();
  if (period === 'lastMonth') {
    return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  }
  return null;
}

function isInPeriod(
  dateString: string | null | undefined,
  period: PeriodKey
): boolean {
  if (!dateString) return period === 'all';
  const date = new Date(dateString);
  const start = getPeriodStart(period);
  const end = getPeriodEnd(period);
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

function dateKey(dateString: string) {
  return dateString.slice(0, 10);
}

function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
}) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{title}</p>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-[#990000]/10">
          <Icon className="w-5 h-5 text-[#990000]" />
        </div>
      </div>
    </div>
  );
}

function TrendChart({
  data,
  activeMetric,
  onMetricChange,
  locale,
  labels,
}: {
  data: DailyPoint[];
  activeMetric: TrendMetric;
  onMetricChange: (metric: TrendMetric) => void;
  locale: string;
  labels: Record<TrendMetric, string>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const values = data.map((d) => d[activeMetric]);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    const points = values.map((value, index) => ({
      x: padding + (chartWidth / Math.max(values.length - 1, 1)) * index,
      y: padding + chartHeight - ((value - min) / range) * chartHeight,
    }));

    const color = '#990000';

    if (points.length > 1) {
      ctx.fillStyle = `${color}20`;
      ctx.beginPath();
      ctx.moveTo(points[0].x, height - padding);
      points.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.lineTo(points[points.length - 1].x, height - padding);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    }

    ctx.fillStyle = color;
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
  }, [data, activeMetric]);

  const metrics: TrendMetric[] = ['revenue', 'orders', 'enrollments', 'students'];

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {metrics.map((metric) => (
          <button
            key={metric}
            type="button"
            onClick={() => onMetricChange(metric)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              activeMetric === metric
                ? 'bg-[#990000] text-white'
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {labels[metric]}
          </button>
        ))}
      </div>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-neutral-500">
          {locale === 'tr' ? 'Grafik verisi yok' : 'No chart data'}
        </div>
      ) : (
        <canvas ref={canvasRef} className="w-full h-64" />
      )}
    </div>
  );
}

function HorizontalBars({
  items,
  valueKey,
  formatValue,
}: {
  items: CourseStat[];
  valueKey: 'enrollments' | 'revenue';
  formatValue: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => item[valueKey]), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.course_id}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-800 dark:text-neutral-200 truncate pr-4">
              {item.course_name}
            </span>
            <span className="text-neutral-600 dark:text-neutral-400 shrink-0">
              {formatValue(item[valueKey])}
            </span>
          </div>
          <div className="h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#990000] rounded-full transition-all duration-500"
              style={{ width: `${(item[valueKey] / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState('tr');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('last30Days');
  const [activeTrendMetric, setActiveTrendMetric] = useState<TrendMetric>('enrollments');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    uniqueStudents: 0,
    totalEnrollments: 0,
    activeCourses: 0,
    completedEnrollments: 0,
    averageOrderValue: 0,
    averageProgress: 0,
    totalDiscount: 0,
    discountedOrders: 0,
    uniqueDiscountCodes: 0,
  });
  const [dailyData, setDailyData] = useState<DailyPoint[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStat[]>([]);
  const [participationCourses, setParticipationCourses] = useState<
    CourseParticipation[]
  >([]);
  const [discountCodeDetails, setDiscountCodeDetails] = useState<
    DiscountCodeDetail[]
  >([]);
  const [orderLedger, setOrderLedger] = useState<OrderLedgerEntry[]>([]);
  const [cashflow, setCashflow] = useState<CashflowSummary>({
    money_in: 0,
    discount_given: 0,
    list_volume: 0,
    order_count: 0,
    cart_order_count: 0,
    free_order_count: 0,
    unique_buyers: 0,
  });

  const { isLoaded } = useUser();
  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    params.then((resolved) => setLocale(resolved.locale || 'tr'));
  }, [params]);

  const processData = useCallback(
    (
      orders: OrderRow[],
      enrollments: EnrollmentRow[],
      courses: CourseRow[],
      period: PeriodKey,
      tiers: TierRow[],
      discountCodeRows: DiscountCodeRow[],
      clerkUsers: Map<string, ClerkUserLite>
    ) => {
      const courseTitleMap = new Map(
        courses.map((course) => [course.id, course.title])
      );
      const titleToCourseId = new Map(
        courses.map((course) => [
          course.title.trim().toLocaleLowerCase('tr'),
          course.id,
        ])
      );
      const coursePriceMap = new Map<string, number>();
      courses.forEach((course) => {
        const price = Number(course.price);
        if (Number.isFinite(price) && price > 0) {
          coursePriceMap.set(course.id, roundMoney(price));
        }
      });
      const tierPriceMap = new Map<string, number>();
      tiers.forEach((tier) => {
        const price = Number(tier.price);
        if (Number.isFinite(price) && price > 0) {
          tierPriceMap.set(tier.id, roundMoney(price));
        }
      });

      const uniqueOrders = dedupeOrders(orders).filter((order) => {
        const status = String(order.status || '').toLowerCase();
        const paidLike =
          status === 'completed' ||
          status === 'success' ||
          status === 'paid' ||
          order.enrolled === true;
        return paidLike;
      });

      const filteredOrders = uniqueOrders.filter((order) =>
        isInPeriod(order.created_at, period)
      );
      const filteredEnrollments = enrollments.filter((enrollment) =>
        isInPeriod(enrollment.enrolled_at, period)
      );

      const saleLines = filteredOrders.flatMap((order) =>
        expandOrderToCourseLines(
          order,
          courseTitleMap,
          titleToCourseId,
          coursePriceMap,
          tierPriceMap
        )
      );

      // Sipariş defteri: her sipariş (sepet dahil) kim / ne / ne zaman / ne kadar
      const ledger: OrderLedgerEntry[] = filteredOrders
        .map((order) => {
          const lines = expandOrderToCourseLines(
            order,
            courseTitleMap,
            titleToCourseId,
            coursePriceMap,
            tierPriceMap
          );
          const buyerUserId =
            order.custom_data?.userId || order.custom_data?.clerkUserId || null;
          const codes = parseDiscountCodes(
            order.discountcode ||
              order.custom_data?.orderSnapshot?.discountCodes ||
              order.custom_data?.discountCodes
          );
          const listTotal = roundMoney(
            order.custom_data?.orderSnapshot?.listTotal != null
              ? Number(order.custom_data.orderSnapshot.listTotal)
              : lines.reduce((sum, line) => sum + line.orderListAmount, 0)
          );
          const paidTotal = roundMoney(
            order.custom_data?.orderSnapshot?.paidTotal != null
              ? Number(order.custom_data.orderSnapshot.paidTotal)
              : Number(order.amount) ||
                  lines.reduce((sum, line) => sum + line.paidAmount, 0)
          );
          const discountAmount = roundMoney(
            order.custom_data?.orderSnapshot?.discountAmount != null
              ? Number(order.custom_data.orderSnapshot.discountAmount)
              : Number(order.discountamount) ||
                  Math.max(0, listTotal - paidTotal)
          );
          const isCart =
            order.custom_data?.cartMode === true ||
            String(order.courseid || '').toUpperCase() === 'CART' ||
            order.custom_data?.itemType === 'cart' ||
            lines.length > 1;

          return {
            order_id: orderRef(order),
            created_at: order.created_at || order.updated_at || null,
            buyer_email: (order.useremail || '').toLowerCase(),
            buyer_name: buyerUserId
              ? clerkUsers.get(buyerUserId)?.fullName || null
              : null,
            buyer_user_id: buyerUserId,
            status: String(order.status || 'completed'),
            payment_method: String(
              order.paymentmethod ||
                (paidTotal <= 0.009 ? 'free_discount' : 'iyzico')
            ),
            is_cart: isCart,
            item_type: String(order.custom_data?.itemType || (isCart ? 'cart' : 'course')),
            course_label: order.coursename || lines.map((l) => l.name).join(', '),
            list_total: listTotal,
            paid_total: paidTotal,
            discount_amount: discountAmount,
            discount_codes: codes.map((c) => c.toLocaleUpperCase('tr-TR')),
            items: lines.map((line, idx) => ({
              id: `${line.key}-${idx}`,
              title: line.moduleTitle || line.name,
              type: line.itemType || (line.isEventCertificate ? 'event_certificate' : 'course'),
              list_price: line.orderListAmount,
              paid_price: line.paidAmount,
              course_id: line.key.startsWith('cert:') || line.key.startsWith('product:') || line.key.startsWith('package:')
                ? null
                : line.key,
              tier_id: line.tierId,
            })),
          };
        })
        .sort((a, b) => {
          const at = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bt - at;
        });

      setOrderLedger(ledger);
      setCashflow({
        money_in: roundMoney(ledger.reduce((sum, o) => sum + o.paid_total, 0)),
        discount_given: roundMoney(
          ledger.reduce((sum, o) => sum + o.discount_amount, 0)
        ),
        list_volume: roundMoney(ledger.reduce((sum, o) => sum + o.list_total, 0)),
        order_count: ledger.length,
        cart_order_count: ledger.filter((o) => o.is_cart).length,
        free_order_count: ledger.filter(
          (o) =>
            o.paid_total <= 0.009 ||
            o.payment_method === 'free_discount'
        ).length,
        unique_buyers: new Set(
          ledger.map((o) => o.buyer_email).filter(Boolean)
        ).size,
      });

      const uniqueStudentIds = new Set(
        filteredEnrollments.map((enrollment) => enrollment.user_id)
      );
      const totalRevenue = roundMoney(
        saleLines.reduce((sum, line) => sum + line.paidAmount, 0)
      );
      const totalDiscount = roundMoney(
        saleLines.reduce((sum, line) => sum + line.discountShare, 0)
      );
      const discountedOrderRefs = new Set(
        saleLines
          .filter((line) => line.discountCodes.length > 0 || line.discountShare > 0.009)
          .map((line) => line.orderRef)
      );
      const allCodes = new Set(
        saleLines.flatMap((line) =>
          line.discountCodes.map((code) => code.toUpperCase())
        )
      );

      const completedEnrollments = filteredEnrollments.filter(
        (enrollment) => (enrollment.progress_percentage || 0) >= 100
      ).length;
      const averageProgress =
        filteredEnrollments.length > 0
          ? filteredEnrollments.reduce(
              (sum, enrollment) => sum + (enrollment.progress_percentage || 0),
              0
            ) / filteredEnrollments.length
          : 0;

      setMetrics({
        totalRevenue,
        totalOrders: filteredOrders.length,
        uniqueStudents: uniqueStudentIds.size,
        totalEnrollments: filteredEnrollments.length,
        activeCourses: courses.filter((course) => course.is_active !== false).length,
        completedEnrollments,
        averageOrderValue:
          filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
        averageProgress,
        totalDiscount,
        discountedOrders: discountedOrderRefs.size,
        uniqueDiscountCodes: allCodes.size,
      });

      const dailyMap = new Map<string, DailyPoint>();
      const ensureDay = (key: string) => {
        if (!dailyMap.has(key)) {
          dailyMap.set(key, {
            date: key,
            revenue: 0,
            orders: 0,
            enrollments: 0,
            students: 0,
          });
        }
        return dailyMap.get(key)!;
      };

      const studentsByDay = new Map<string, Set<string>>();
      const ordersByDay = new Map<string, Set<string>>();

      saleLines.forEach((line) => {
        if (!line.createdAt) return;
        const key = dateKey(line.createdAt);
        const day = ensureDay(key);
        day.revenue += line.paidAmount;
        if (!ordersByDay.has(key)) ordersByDay.set(key, new Set());
        ordersByDay.get(key)!.add(line.orderRef);
      });

      ordersByDay.forEach((orderSet, key) => {
        ensureDay(key).orders = orderSet.size;
      });

      filteredEnrollments.forEach((enrollment) => {
        if (!enrollment.enrolled_at) return;
        const key = dateKey(enrollment.enrolled_at);
        const day = ensureDay(key);
        day.enrollments += 1;
        if (!studentsByDay.has(key)) studentsByDay.set(key, new Set());
        studentsByDay.get(key)!.add(enrollment.user_id);
      });

      studentsByDay.forEach((students, key) => {
        const day = ensureDay(key);
        day.students = students.size;
      });

      setDailyData(
        Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
      );

      const statsMap = new Map<string, CourseStat>();
      const emptyStat = (
        courseId: string,
        courseName: string,
        isCertificate = false
      ): CourseStat => ({
        course_id: courseId,
        course_name: courseName,
        enrollments: 0,
        unique_students: 0,
        revenue: 0,
        list_revenue: 0,
        orders: 0,
        discount_amount: 0,
        discounted_orders: 0,
        discount_codes: [],
        avg_progress: 0,
        completed: 0,
        is_certificate: isCertificate,
      });

      filteredEnrollments.forEach((enrollment) => {
        const existing =
          statsMap.get(enrollment.course_id) ||
          emptyStat(
            enrollment.course_id,
            courseTitleMap.get(enrollment.course_id) ||
              `Kurs ${enrollment.course_id.slice(0, 8)}`
          );
        existing.enrollments += 1;
        statsMap.set(enrollment.course_id, existing);
      });

      const studentsPerCourse = new Map<string, Set<string>>();
      const progressPerCourse = new Map<string, number[]>();
      const orderRefsPerCourse = new Map<string, Set<string>>();
      const discountedOrderRefsPerCourse = new Map<string, Set<string>>();
      const codesPerCourse = new Map<string, Set<string>>();

      filteredEnrollments.forEach((enrollment) => {
        if (!studentsPerCourse.has(enrollment.course_id)) {
          studentsPerCourse.set(enrollment.course_id, new Set());
        }
        studentsPerCourse.get(enrollment.course_id)!.add(enrollment.user_id);

        if (!progressPerCourse.has(enrollment.course_id)) {
          progressPerCourse.set(enrollment.course_id, []);
        }
        progressPerCourse
          .get(enrollment.course_id)!
          .push(enrollment.progress_percentage || 0);

        const stat = statsMap.get(enrollment.course_id);
        if (stat && (enrollment.progress_percentage || 0) >= 100) {
          stat.completed += 1;
        }
      });

      saleLines.forEach((line) => {
        const stat =
          statsMap.get(line.key) ||
          emptyStat(line.key, line.name, line.isEventCertificate);

        if (line.isEventCertificate) {
          stat.is_certificate = true;
          if (!studentsPerCourse.has(line.key)) {
            studentsPerCourse.set(line.key, new Set());
          }
          if (line.buyerEmail) {
            studentsPerCourse.get(line.key)!.add(line.buyerEmail.toLowerCase());
          } else {
            studentsPerCourse
              .get(line.key)!
              .add(`order:${line.orderRef}:${stat.orders}`);
          }
        }

        stat.revenue = roundMoney(stat.revenue + line.paidAmount);
        stat.list_revenue = roundMoney(stat.list_revenue + line.listAmount);
        stat.discount_amount = roundMoney(stat.discount_amount + line.discountShare);
        if (!stat.course_name) stat.course_name = line.name;

        if (!orderRefsPerCourse.has(line.key)) {
          orderRefsPerCourse.set(line.key, new Set());
        }
        orderRefsPerCourse.get(line.key)!.add(line.orderRef);

        if (line.discountCodes.length > 0 || line.discountShare > 0.009) {
          if (!discountedOrderRefsPerCourse.has(line.key)) {
            discountedOrderRefsPerCourse.set(line.key, new Set());
          }
          discountedOrderRefsPerCourse.get(line.key)!.add(line.orderRef);
        }

        if (line.discountCodes.length > 0) {
          if (!codesPerCourse.has(line.key)) {
            codesPerCourse.set(line.key, new Set());
          }
          line.discountCodes.forEach((code) =>
            codesPerCourse.get(line.key)!.add(code.toUpperCase())
          );
        }

        statsMap.set(line.key, stat);
      });

      statsMap.forEach((stat, courseId) => {
        const people = studentsPerCourse.get(courseId)?.size || 0;
        stat.unique_students = people;
        stat.orders = orderRefsPerCourse.get(courseId)?.size || 0;
        stat.discounted_orders =
          discountedOrderRefsPerCourse.get(courseId)?.size || 0;
        stat.discount_codes = Array.from(codesPerCourse.get(courseId) || []).sort();

        if (stat.is_certificate) {
          stat.enrollments = people;
          stat.avg_progress = 0;
          stat.completed = 0;
          return;
        }
        const progresses = progressPerCourse.get(courseId) || [];
        stat.avg_progress =
          progresses.length > 0
            ? progresses.reduce((sum, value) => sum + value, 0) / progresses.length
            : 0;
      });

      setCourseStats(
        Array.from(statsMap.values()).sort((a, b) => b.revenue - a.revenue)
      );

      const codeAgg = new Map<
        string,
        {
          usageOrders: Set<string>;
          discountByOrder: Map<string, number>;
          paidByOrder: Map<string, number>;
          courses: Set<string>;
        }
      >();

      saleLines.forEach((line) => {
        if (line.discountCodes.length === 0) return;
        line.discountCodes.forEach((rawCode) => {
          const code = rawCode.toLocaleUpperCase('tr-TR');
          if (!codeAgg.has(code)) {
            codeAgg.set(code, {
              usageOrders: new Set(),
              discountByOrder: new Map(),
              paidByOrder: new Map(),
              courses: new Set(),
            });
          }
          const agg = codeAgg.get(code)!;
          agg.usageOrders.add(line.orderRef);
          const share = 1 / line.discountCodes.length;
          agg.discountByOrder.set(
            line.orderRef,
            roundMoney(
              (agg.discountByOrder.get(line.orderRef) || 0) +
                line.discountShare * share
            )
          );
          agg.paidByOrder.set(
            line.orderRef,
            roundMoney(
              (agg.paidByOrder.get(line.orderRef) || 0) + line.paidAmount * share
            )
          );
          agg.courses.add(line.name);
        });
      });

      const tierMap = new Map(tiers.map((tier) => [tier.id, tier]));
      const codeMetaByCode = new Map<string, DiscountCodeRow>();
      discountCodeRows.forEach((row) => {
        const raw = String(row.code || '').trim();
        if (!raw) return;
        const upper = (row.code_upper || raw.toLocaleUpperCase('tr-TR')).trim();
        const normalized =
          row.code_normalized || normalizeDiscountCode(raw);
        codeMetaByCode.set(upper, row);
        codeMetaByCode.set(normalized, row);
        codeMetaByCode.set(raw.toUpperCase(), row);
      });

      const lookupCodeMeta = (rawCode: string) => {
        const upper = rawCode.trim().toLocaleUpperCase('tr-TR');
        return (
          codeMetaByCode.get(upper) ||
          codeMetaByCode.get(normalizeDiscountCode(rawCode)) ||
          codeMetaByCode.get(rawCode.trim().toUpperCase()) ||
          null
        );
      };

      // userId -> email/name from orders + clerk
      const emailByUserId = new Map<string, string>();
      const nameByUserId = new Map<string, string>();
      filteredOrders.forEach((order) => {
        const uid = order.custom_data?.userId || order.custom_data?.clerkUserId;
        const email = (order.useremail || '').trim().toLowerCase();
        if (uid && email) emailByUserId.set(uid, email);
      });
      clerkUsers.forEach((user, userId) => {
        if (user.email) emailByUserId.set(userId, user.email.toLowerCase());
        if (user.fullName) nameByUserId.set(userId, user.fullName);
      });

      // Build participation students grouped by course
      const studentMap = new Map<string, StudentParticipation>();
      const ensureStudent = (courseId: string, userId: string) => {
        const key = `${courseId}::${userId}`;
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            user_id: userId,
            email: emailByUserId.get(userId) || '',
            name: nameByUserId.get(userId) || null,
            modules: [],
            progress: 0,
            paid_amount: 0,
            list_amount: 0,
            order_list_amount: 0,
            discount_amount: 0,
            discount_codes: [],
            enrolled_at: null,
            order_refs: [],
            order_count: 0,
            purchase_items: [],
          });
        }
        return studentMap.get(key)!;
      };

      filteredEnrollments.forEach((enrollment) => {
        const student = ensureStudent(enrollment.course_id, enrollment.user_id);
        student.progress = Math.max(
          student.progress,
          enrollment.progress_percentage || 0
        );
        if (
          !student.enrolled_at ||
          (enrollment.enrolled_at && enrollment.enrolled_at < student.enrolled_at)
        ) {
          student.enrolled_at = enrollment.enrolled_at;
        }
        if (!student.email) {
          student.email = emailByUserId.get(enrollment.user_id) || '';
        }
        if (!student.name) {
          student.name = nameByUserId.get(enrollment.user_id) || null;
        }

        if (enrollment.tier_id) {
          const tier = tierMap.get(enrollment.tier_id);
          const title =
            tier?.title ||
            (tier?.is_full_course
              ? 'Tam Eğitim'
              : `Paket ${enrollment.tier_id.slice(0, 8)}`);
          if (!student.modules.includes(title)) student.modules.push(title);
        } else if (student.modules.length === 0) {
          student.modules.push('Tam Eğitim');
        }
      });

      // Match sale lines to students by userId or email
      const linesByOrder = new Map<string, CourseSaleLine[]>();
      saleLines.forEach((line) => {
        const list = linesByOrder.get(line.orderRef) || [];
        list.push(line);
        linesByOrder.set(line.orderRef, list);
      });

      const pushPurchaseItems = (
        student: StudentParticipation,
        lines: CourseSaleLine[]
      ) => {
        lines.forEach((line) => {
          const purchaseItem: StudentPurchaseItem = {
            title: line.moduleTitle || line.name,
            type: line.itemType,
            list_price: line.orderListAmount,
            catalog_list_price: line.catalogListAmount,
            paid_price: line.paidAmount,
            order_id: line.orderRef,
            created_at: line.createdAt || null,
            is_cart: line.isCart || lines.length > 1,
          };
          const alreadyListed = student.purchase_items.some(
            (item) =>
              item.order_id === purchaseItem.order_id &&
              item.title === purchaseItem.title &&
              item.paid_price === purchaseItem.paid_price &&
              item.type === purchaseItem.type
          );
          if (!alreadyListed) {
            student.purchase_items.push(purchaseItem);
          }
        });
      };

      saleLines.forEach((line) => {
        const email = (line.buyerEmail || '').trim().toLowerCase();
        let matched: StudentParticipation | null = null;

        if (line.buyerUserId) {
          matched = studentMap.get(`${line.key}::${line.buyerUserId}`) || null;
        }
        if (!matched && email) {
          for (const [key, student] of studentMap.entries()) {
            if (!key.startsWith(`${line.key}::`)) continue;
            if (student.email && student.email === email) {
              matched = student;
              break;
            }
          }
        }

        if (!matched) {
          const synthId = line.buyerUserId || `email:${email || line.orderRef}`;
          matched = ensureStudent(line.key, synthId);
          if (!matched.email && email) matched.email = email;
          if (!matched.name && line.buyerUserId) {
            matched.name = nameByUserId.get(line.buyerUserId) || null;
          }
          if (line.moduleTitle && !matched.modules.includes(line.moduleTitle)) {
            matched.modules.push(line.moduleTitle);
          }
          if (matched.modules.length === 0 && line.name) {
            matched.modules.push(line.name);
          }
        }

        matched.paid_amount = roundMoney(matched.paid_amount + line.paidAmount);
        matched.list_amount = roundMoney(matched.list_amount + line.listAmount);
        matched.order_list_amount = roundMoney(
          matched.order_list_amount + line.orderListAmount
        );
        matched.discount_amount = roundMoney(
          matched.discount_amount + line.discountShare
        );
        line.discountCodes.forEach((code) => {
          const upper = code.toLocaleUpperCase('tr-TR');
          if (!matched!.discount_codes.includes(upper)) {
            matched!.discount_codes.push(upper);
          }
        });
        if (!matched.order_refs.includes(line.orderRef)) {
          matched.order_refs.push(line.orderRef);
          matched.order_count += 1;
        }
        if (line.moduleTitle && !matched.modules.includes(line.moduleTitle)) {
          matched.modules.push(line.moduleTitle);
        }
        if (!matched.enrolled_at && line.createdAt) {
          matched.enrolled_at = line.createdAt;
        }

        const orderLines = linesByOrder.get(line.orderRef) || [line];
        pushPurchaseItems(matched, orderLines);
      });

      const participation: CourseParticipation[] = Array.from(statsMap.values())
        .map((stat) => {
          const students = Array.from(studentMap.entries())
            .filter(([key]) => key.startsWith(`${stat.course_id}::`))
            .map(([, student]) => ({
              ...student,
              modules: student.modules.length ? student.modules : ['Tam Eğitim'],
              discount_codes: [...student.discount_codes].sort(),
            }))
            .sort(
              (a, b) =>
                b.paid_amount - a.paid_amount || a.email.localeCompare(b.email)
            );

          const moduleCounts = new Map<string, number>();
          students.forEach((student) => {
            student.modules.forEach((mod) => {
              moduleCounts.set(mod, (moduleCounts.get(mod) || 0) + 1);
            });
          });

          return {
            course_id: stat.course_id,
            course_name: stat.course_name,
            is_certificate: stat.is_certificate,
            enrollments: stat.enrollments,
            unique_students: stat.unique_students,
            revenue: stat.revenue,
            list_revenue: stat.list_revenue,
            orders: stat.orders,
            discount_amount: stat.discount_amount,
            discounted_orders: stat.discounted_orders,
            avg_progress: stat.avg_progress,
            completed: stat.completed,
            module_breakdown: Array.from(moduleCounts.entries())
              .map(([title, count]) => ({ title, count }))
              .sort((a, b) => b.count - a.count),
            students,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);

      setParticipationCourses(participation);

      // Detailed discount usages with influencer sync
      const usagesByCode = new Map<string, DiscountUsageDetail[]>();
      saleLines.forEach((line) => {
        if (line.discountCodes.length === 0) return;
        line.discountCodes.forEach((rawCode) => {
          const code = rawCode.toLocaleUpperCase('tr-TR');
          const share = 1 / line.discountCodes.length;
          const buyerId = line.buyerUserId;
          const list = usagesByCode.get(code) || [];
          list.push({
            order_ref: line.orderRef,
            buyer_email: (line.buyerEmail || '').toLowerCase(),
            buyer_name: buyerId ? nameByUserId.get(buyerId) || null : null,
            course_name: line.name,
            module_title: line.moduleTitle,
            list_amount: roundMoney(line.listAmount * share),
            paid_amount: roundMoney(line.paidAmount * share),
            discount_amount: roundMoney(line.discountShare * share),
            created_at: line.createdAt || null,
          });
          usagesByCode.set(code, list);
        });
      });

      const detailedCodes: DiscountCodeDetail[] = Array.from(codeAgg.entries())
        .map(([code, agg]) => {
          const meta = lookupCodeMeta(code);
          const influencerId = meta?.influencer_id || null;
          const influencer = influencerId ? clerkUsers.get(influencerId) : null;
          const usages = (usagesByCode.get(code) || []).sort((a, b) => {
            const at = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bt - at;
          });
          const uniqueBuyers = new Set(
            usages.map((u) => u.buyer_email).filter(Boolean)
          ).size;
          const totalPaid = roundMoney(
            Array.from(agg.paidByOrder.values()).reduce((s, v) => s + v, 0)
          );
          const totalDiscount = roundMoney(
            Array.from(agg.discountByOrder.values()).reduce((s, v) => s + v, 0)
          );
          const totalList = roundMoney(
            usages.reduce((sum, u) => sum + u.list_amount, 0)
          );
          const commissionRate = meta?.commission != null ? Number(meta.commission) : 15;
          const estimatedCommission = calculateCommissionAmount(
            totalPaid,
            0,
            commissionRate
          );

          return {
            code,
            usage_count: agg.usageOrders.size,
            unique_buyers: uniqueBuyers,
            total_discount: totalDiscount,
            total_paid: totalPaid,
            total_list: totalList,
            courses: Array.from(agg.courses).sort(),
            influencer_id: influencerId,
            influencer_name: influencer?.fullName || null,
            influencer_email: influencer?.email || null,
            discount_type: meta?.discount_type || null,
            discount_value:
              meta?.discount_amount != null ? Number(meta.discount_amount) : null,
            commission: meta?.commission != null ? Number(meta.commission) : null,
            estimated_commission: estimatedCommission,
            db_usage_count: meta?.usage_count ?? null,
            max_usage: meta?.max_usage ?? null,
            valid_until: meta?.valid_until ?? null,
            usages,
          };
        })
        .sort(
          (a, b) =>
            b.usage_count - a.usage_count || b.total_discount - a.total_discount
        );

      setDiscountCodeDetails(detailedCodes);
    },
    []
  );

  const fetchClerkUsers = async (userIds: string[]) => {
    const map = new Map<string, ClerkUserLite>();
    const unique = [...new Set(userIds.filter(Boolean))];
    for (let i = 0; i < unique.length; i += 100) {
      const chunk = unique.slice(i, i + 100);
      try {
        const res = await fetch('/api/auth/user-details-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: chunk }),
        });
        if (!res.ok) continue;
        const data = await res.json();
        Object.entries(data.users || {}).forEach(([userId, raw]) => {
          const user = raw as {
            firstName?: string | null;
            lastName?: string | null;
            username?: string | null;
            emailAddresses?: Array<{ emailAddress: string }>;
          };
          const email =
            user.emailAddresses?.[0]?.emailAddress ||
            '';
          const fullName =
            [user.firstName, user.lastName].filter(Boolean).join(' ') ||
            user.username ||
            email ||
            userId.slice(0, 10);
          map.set(userId, { fullName, email });
        });
      } catch (err) {
        console.warn('Clerk batch lookup failed:', err);
      }
    }
    return map;
  };

  const fetchAllOrders = async (): Promise<OrderRow[]> => {
    const pageSize = 1000;
    let from = 0;
    const all: OrderRow[] = [];

    for (;;) {
      const { data, error } = await supabase
        .from('orders')
        .select(
          'id, orderid, courseid, coursename, amount, discountamount, discountcode, paymentmethod, status, created_at, updated_at, useremail, enrolled, custom_data'
        )
        .or('enrolled.eq.true,status.eq.completed,paymentmethod.eq.free_discount')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (error) throw error;
      const chunk = (data || []) as OrderRow[];
      all.push(...chunk);
      if (chunk.length < pageSize) break;
      from += pageSize;
      // safety: avoid runaway loops
      if (from > 50000) break;
    }

    return all;
  };

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [orders, enrollmentsResult, coursesResult, tiersResult, metaRes] =
        await Promise.all([
          fetchAllOrders(),
          supabase
            .from('myuni_enrollments')
            .select(
              'course_id, user_id, enrolled_at, progress_percentage, tier_id'
            )
            .eq('is_active', true),
          supabase.from('myuni_courses').select('id, title, is_active, price, original_price'),
          supabase
            .from('myuni_course_tiers')
            .select('id, course_id, title, is_full_course, price, original_price'),
          fetch('/api/analytics/meta')
            .then(async (res) => {
              const json = await res.json().catch(() => ({}));
              return { ok: res.ok, json };
            })
            .catch((err) => {
              console.warn('analytics/meta fetch failed:', err);
              return { ok: false, json: {} };
            }),
        ]);

      if (enrollmentsResult.error) throw enrollmentsResult.error;
      if (coursesResult.error) throw coursesResult.error;

      const enrollments = (enrollmentsResult.data || []) as EnrollmentRow[];
      const courses = (coursesResult.data || []) as CourseRow[];
      const tiers = (tiersResult.data || []) as TierRow[];

      if (tiersResult.error) {
        console.warn('Tiers fetch skipped:', tiersResult.error.message);
      }

      const discountCodeRows = (
        metaRes.ok && Array.isArray(metaRes.json?.discountCodes)
          ? metaRes.json.discountCodes
          : []
      ) as DiscountCodeRow[];

      const enrollmentUserIds = enrollments.map((e) => e.user_id);
      const orderUserIds = orders
        .map((o) => o.custom_data?.userId || o.custom_data?.clerkUserId)
        .filter(Boolean) as string[];
      const influencerIds = discountCodeRows
        .map((c) => c.influencer_id)
        .filter(Boolean) as string[];

      const clerkUsers = await fetchClerkUsers([
        ...enrollmentUserIds,
        ...orderUserIds,
        ...influencerIds,
      ]);

      if (metaRes.ok && metaRes.json?.influencers) {
        Object.entries(
          metaRes.json.influencers as Record<
            string,
            { fullName?: string; email?: string }
          >
        ).forEach(([id, info]) => {
          clerkUsers.set(id, {
            fullName: info.fullName || clerkUsers.get(id)?.fullName || id.slice(0, 10),
            email: info.email || clerkUsers.get(id)?.email || '',
          });
        });
      }

      processData(
        orders,
        enrollments,
        courses,
        selectedPeriod,
        tiers,
        discountCodeRows,
        clerkUsers
      );
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  }, [processData, selectedPeriod, t.error]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchAnalytics();
  }, [isLoaded, fetchAnalytics]);

  const handleExport = () => {
    const lines = [
      `${t.title} - ${t.periods[selectedPeriod]}`,
      '',
      'METRIK,DEGER',
      `${t.metrics.totalRevenue},${metrics.totalRevenue}`,
      `${t.metrics.totalOrders},${metrics.totalOrders}`,
      `${t.metrics.totalDiscount},${metrics.totalDiscount}`,
      `${t.metrics.discountedOrders},${metrics.discountedOrders}`,
      `${t.metrics.uniqueDiscountCodes},${metrics.uniqueDiscountCodes}`,
      `${t.metrics.uniqueStudents},${metrics.uniqueStudents}`,
      `${t.metrics.totalEnrollments},${metrics.totalEnrollments}`,
      '',
      `${t.table.course},${t.table.revenue},${t.table.orders},${t.table.discount},${t.table.discountedOrders},${t.table.codes},${t.table.enrollments},${t.table.students}`,
      ...courseStats.map(
        (course) =>
          `"${course.course_name}",${course.revenue},${course.orders},${course.discount_amount},${course.discounted_orders},"${course.discount_codes.join('|')}",${course.enrollments},${course.unique_students}`
      ),
      '',
      `${t.table.code},${t.table.usage},${t.table.discount},${t.table.paid},${t.influencer},${t.table.course}`,
      ...discountCodeDetails.map(
        (row) =>
          `"${row.code}",${row.usage_count},${row.total_discount},${row.total_paid},"${row.influencer_name || ''}|${row.influencer_email || ''}","${row.courses.join('|')}"`
      ),
      '',
      'SIPARIS_DEFTERI',
      `${t.orderNo},${t.date},${t.email},${t.buyer},${t.payment},${t.status},${t.list},${t.paid},${t.table.discount},${t.table.codes},${t.items}`,
      ...orderLedger.map((order) =>
        `"${order.order_id}","${order.created_at || ''}","${order.buyer_email}","${order.buyer_name || ''}","${order.payment_method}","${order.status}",${order.list_total},${order.paid_total},${order.discount_amount},"${order.discount_codes.join('|')}","${order.items.map((i) => `${i.title}(${i.type}:${i.paid_price})`).join(' | ')}"`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analitik-rapor-${Date.now()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const topByEnrollments = [...courseStats]
    .sort((a, b) => b.enrollments - a.enrollments)
    .slice(0, 6);
  const topByRevenue = [...courseStats]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);
  const coursesWithSales = courseStats.filter(
    (course) => course.orders > 0 || course.revenue > 0 || course.discount_amount > 0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#990000] mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-6 sm:py-8 lg:py-10 w-full min-w-0">
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-8 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 pr-2">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {t.title}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1 text-sm sm:text-base max-w-2xl">
              {t.subtitle}
            </p>
            <div className="w-12 h-1 bg-[#990000] mt-3 rounded-full" />
          </div>

          <div className="flex flex-wrap items-center gap-2 xl:justify-end xl:max-w-[52%]">
            {(Object.keys(t.periods) as PeriodKey[]).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedPeriod === period
                    ? 'bg-[#990000] text-white'
                    : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {t.periods[period]}
              </button>
            ))}
            <button
              type="button"
              onClick={fetchAnalytics}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              {t.actions.refresh}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#990000] text-white text-sm"
            >
              <Download className="w-4 h-4" />
              {t.actions.export}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title={t.metrics.totalRevenue}
            value={formatCurrency(metrics.totalRevenue, locale)}
            icon={DollarSign}
          />
          <MetricCard
            title={t.metrics.totalOrders}
            value={metrics.totalOrders.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
            icon={ShoppingCart}
          />
          <MetricCard
            title={t.metrics.uniqueStudents}
            value={metrics.uniqueStudents.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
            icon={Users}
          />
          <MetricCard
            title={t.metrics.totalEnrollments}
            value={metrics.totalEnrollments.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
            icon={GraduationCap}
          />
          <MetricCard
            title={t.metrics.activeCourses}
            value={metrics.activeCourses.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')}
            icon={BookOpen}
          />
          <MetricCard
            title={t.metrics.completedEnrollments}
            value={metrics.completedEnrollments.toLocaleString(
              locale === 'tr' ? 'tr-TR' : 'en-US'
            )}
            icon={CheckCircle}
          />
          <MetricCard
            title={t.metrics.averageOrderValue}
            value={formatCurrency(metrics.averageOrderValue, locale)}
            icon={TrendingUp}
          />
          <MetricCard
            title={t.metrics.averageProgress}
            value={`${metrics.averageProgress.toFixed(1)}%`}
            icon={BarChart3}
          />
          <MetricCard
            title={t.metrics.totalDiscount}
            value={formatCurrency(metrics.totalDiscount, locale)}
            icon={Percent}
          />
          <MetricCard
            title={t.metrics.discountedOrders}
            value={metrics.discountedOrders.toLocaleString(
              locale === 'tr' ? 'tr-TR' : 'en-US'
            )}
            icon={Tag}
            subtitle={`${metrics.uniqueDiscountCodes} ${t.metrics.uniqueDiscountCodes.toLowerCase()}`}
          />
        </div>

        <section id="trends" className="mb-8">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {t.trendsSection}
          </h2>
          <TrendChart
            data={dailyData}
            activeMetric={activeTrendMetric}
            onMetricChange={setActiveTrendMetric}
            locale={locale}
            labels={t.trendMetrics}
          />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <section className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t.charts.topCoursesEnrollments}
            </h2>
            {topByEnrollments.length === 0 ? (
              <p className="text-neutral-500">{t.empty}</p>
            ) : (
              <HorizontalBars
                items={topByEnrollments}
                valueKey="enrollments"
                formatValue={(value) => value.toString()}
              />
            )}
          </section>

          <section className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {t.charts.topCoursesRevenue}
            </h2>
            {topByRevenue.length === 0 ? (
              <p className="text-neutral-500">{t.empty}</p>
            ) : (
              <HorizontalBars
                items={topByRevenue}
                valueKey="revenue"
                formatValue={(value) => formatCurrency(value, locale)}
              />
            )}
          </section>
        </div>

        <section
          id="sales"
          className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-8"
        >
          <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {t.salesSection}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">{t.salesSectionHint}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                <tr>
                  <th className="text-left px-6 py-3 font-medium">{t.table.course}</th>
                  <th className="text-right px-4 py-3 font-medium">{t.table.revenue}</th>
                  <th className="text-right px-4 py-3 font-medium">{t.table.orders}</th>
                  <th className="text-right px-4 py-3 font-medium">{t.table.discount}</th>
                  <th className="text-right px-4 py-3 font-medium">
                    {t.table.discountedOrders}
                  </th>
                  <th className="text-left px-6 py-3 font-medium">{t.table.codes}</th>
                </tr>
              </thead>
              <tbody>
                {coursesWithSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                      {t.empty}
                    </td>
                  </tr>
                ) : (
                  coursesWithSales.map((course) => (
                    <tr
                      key={`sales-${course.course_id}`}
                      className="border-t border-neutral-100 dark:border-neutral-700"
                    >
                      <td className="px-6 py-3 text-neutral-900 dark:text-neutral-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{course.course_name}</span>
                          {course.is_certificate && (
                            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              {locale === 'tr' ? 'Sertifika satışı' : 'Certificate sale'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(course.revenue, locale)}
                      </td>
                      <td className="px-4 py-3 text-right">{course.orders}</td>
                      <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">
                        {formatCurrency(course.discount_amount, locale)}
                      </td>
                      <td className="px-4 py-3 text-right">{course.discounted_orders}</td>
                      <td className="px-6 py-3">
                        {course.discount_codes.length === 0 ? (
                          <span className="text-neutral-400">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {course.discount_codes.map((code) => (
                              <span
                                key={`${course.course_id}-${code}`}
                                className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200"
                              >
                                {code}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <AnalyticsOrderLedgerPanel
          locale={locale}
          orders={orderLedger}
          cashflow={cashflow}
          labels={{
            title: t.ledgerSection,
            hint: t.ledgerSectionHint,
            empty: t.empty,
            searchPlaceholder: t.ledgerSearch,
            moneyIn: t.moneyIn,
            discountGiven: t.discountGiven,
            listVolume: t.listVolume,
            orders: t.table.orders,
            cartOrders: t.cartOrders,
            freeOrders: t.freeOrders,
            uniqueBuyers: t.uniqueBuyers,
            orderNo: t.orderNo,
            date: t.date,
            buyer: t.buyer,
            email: t.email,
            payment: t.payment,
            status: t.status,
            items: t.items,
            list: t.list,
            paid: t.paid,
            discount: t.table.discount,
            codes: t.table.codes,
            cart: t.cart,
            expand: t.expand,
            collapse: t.collapse,
            type: t.type,
          }}
        />

        <AnalyticsDiscountUsagePanel
          locale={locale}
          codes={discountCodeDetails}
          labels={{
            title: t.discountSection,
            hint: t.discountSectionHint,
            empty: t.empty,
            code: t.table.code,
            usage: t.table.usage,
            discount: t.table.discount,
            paid: t.table.paid,
            list: t.list,
            course: t.table.course,
            influencer: t.influencer,
            email: t.email,
            module: t.module,
            date: t.date,
            orderNo: t.orderNo,
            searchPlaceholder: t.discountSearch,
            expand: t.expand,
            collapse: t.collapse,
            noInfluencer: t.noInfluencer,
            type: t.type,
            uniqueBuyers: t.uniqueBuyers,
            commission: t.commission,
            estimatedCommission: t.estimatedCommission,
            dbUsage: t.dbUsage,
            validUntil: t.validUntil,
            buyersPreview: t.buyersPreview,
          }}
        />

        <AnalyticsParticipationPanel
          locale={locale}
          courses={participationCourses}
          labels={{
            title: t.enrollmentsSection,
            hint: t.enrollmentsSectionHint,
            empty: t.empty,
            course: t.table.course,
            enrollments: t.table.enrollments,
            students: t.table.students,
            revenue: t.table.revenue,
            orders: t.table.orders,
            discount: t.table.discount,
            avgProgress: t.table.avgProgress,
            completed: t.table.completed,
            email: t.email,
            name: t.name,
            modules: t.modules,
            paid: t.paid,
            list: t.list,
            codes: t.table.codes,
            enrolledAt: t.enrolledAt,
            orderNo: t.orderNo,
            searchPlaceholder: t.participationSearch,
            fullCourse: t.fullCourse,
            certificate: locale === 'tr' ? 'Sertifika satışı' : 'Certificate sale',
            expand: t.expand,
            collapse: t.collapse,
            moduleBreakdown: t.moduleBreakdown,
            studentCount: t.studentCount,
            cartItems: t.cartItems,
            orderList: t.orderList,
            catalogList: t.catalogList,
          }}
        />
      </div>
    </div>
  );
}
