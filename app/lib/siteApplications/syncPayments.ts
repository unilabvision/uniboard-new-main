import type { SupabaseClient } from '@supabase/supabase-js';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';

export type CertificatePaymentStatus =
  | 'none'
  | 'pending'
  | 'paid'
  | 'superseded';

type SubmissionData = Record<string, unknown>;

type AppRow = {
  id: string;
  email: string | null;
  event_id: string | null;
  event_name: string | null;
  submission_data: unknown;
  source?: string | null;
};

type OrderRow = {
  orderid: string;
  courseid: string | null;
  useremail: string | null;
  status: string | null;
  paymentmethod: string | null;
  amount?: number | null;
  custom_data: Record<string, unknown> | null;
  updated_at?: string | null;
  created_at?: string | null;
};

export type PendingPaymentReason =
  | 'awaiting_checkout'
  | 'checkout_started_not_completed'
  | 'order_completed_not_synced'
  | 'duplicate_of_paid'
  | 'unknown';

export type PaymentMismatch = {
  applicationId: string;
  email: string;
  eventId: string | null;
  eventName: string | null;
  paymentStatus: string;
  reason: PendingPaymentReason;
  orders: Array<{
    orderId: string;
    status: string | null;
    amount: number | null;
    siteApplicationId: string | null;
    createdAt: string | null;
  }>;
  paidSiblingApplicationId?: string | null;
};

export type DoublePaymentFlag = {
  applicationId: string;
  email: string;
  eventId: string | null;
  eventName: string | null;
  paymentStatus: string;
  completedOrders: Array<{
    orderId: string;
    amount: number | null;
    createdAt: string | null;
  }>;
};

function readSubmission(raw: unknown): SubmissionData {
  if (raw && typeof raw === 'object') return raw as SubmissionData;
  return {};
}

function normalizeEmail(email: string | null | undefined): string {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function resolveApplicationIdFromOrder(order: OrderRow): string | null {
  const fromCustom = order.custom_data?.siteApplicationId;
  if (typeof fromCustom === 'string' && fromCustom.trim()) return fromCustom.trim();
  if (order.custom_data?.itemType === 'event_certificate' && order.courseid) {
    return String(order.courseid);
  }
  return null;
}

function isPaidOrderStatus(status: string | null | undefined): boolean {
  const s = String(status || '').toLowerCase();
  return s === 'completed' || s === 'success' || s === 'paid';
}

function isEventCertificateOrder(order: OrderRow): boolean {
  return order.custom_data?.itemType === 'event_certificate' || Boolean(order.courseid);
}

async function fetchEventCertificateApps(
  supabase: SupabaseClient,
  options?: { eventId?: string | null }
): Promise<AppRow[]> {
  const pageSize = 1000;
  const rows: AppRow[] = [];
  let from = 0;

  for (;;) {
    let query = supabase
      .from(siteApplicationsDb.applications)
      .select('id, email, event_name, event_id, submission_data, source')
      .or('source.eq.event_website,event_id.not.is.null,event_name.not.is.null')
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (options?.eventId) {
      query = query.eq('event_id', options.eventId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Payment sync: apps fetch failed:', error.message);
      break;
    }
    const batch = (data || []) as AppRow[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
    if (from > 20000) break;
  }

  return rows.filter((app) => {
    const submission = readSubmission(app.submission_data);
    return submission.registration_tier === 'certificate';
  });
}

async function fetchOrdersForAppIds(
  supabase: SupabaseClient,
  appIds: string[]
): Promise<OrderRow[]> {
  if (appIds.length === 0) return [];
  const all: OrderRow[] = [];
  for (let i = 0; i < appIds.length; i += 100) {
    const chunk = appIds.slice(i, i + 100);
    const { data, error } = await supabase
      .from('orders')
      .select(
        'orderid, courseid, useremail, status, paymentmethod, amount, custom_data, updated_at, created_at'
      )
      .in('courseid', chunk)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Payment sync: orders fetch failed:', error.message);
      continue;
    }
    all.push(...((data || []) as OrderRow[]));
  }
  return all;
}

async function fetchOrdersByOrderIds(
  supabase: SupabaseClient,
  orderIds: string[]
): Promise<OrderRow[]> {
  if (orderIds.length === 0) return [];
  const { data } = await supabase
    .from('orders')
    .select(
      'orderid, courseid, useremail, status, paymentmethod, amount, custom_data, updated_at, created_at'
    )
    .in('orderid', orderIds);
  return (data || []) as OrderRow[];
}

async function fetchEventCertificateOrdersByEmails(
  supabase: SupabaseClient,
  emails: string[]
): Promise<OrderRow[]> {
  if (emails.length === 0) return [];
  const all: OrderRow[] = [];
  for (let i = 0; i < emails.length; i += 50) {
    const chunk = emails.slice(i, i + 50);
    const { data } = await supabase
      .from('orders')
      .select(
        'orderid, courseid, useremail, status, paymentmethod, amount, custom_data, updated_at, created_at'
      )
      .in('useremail', chunk)
      .order('created_at', { ascending: false })
      .limit(400);
    all.push(
      ...((data || []) as OrderRow[]).filter(
        (o) => o.custom_data?.itemType === 'event_certificate'
      )
    );
  }
  return all;
}

/**
 * Bekleyen sertifika ödemelerini `orders` ile senkronize eder.
 * Ayrıca aynı e-posta + etkinlikte ödenmiş başka başvuru varsa mükerrer pending'i `superseded` yapar.
 */
export async function syncCertificatePaymentsFromOrders(
  supabase: SupabaseClient,
  options?: { eventId?: string | null }
): Promise<{ checked: number; updated: number; superseded: number }> {
  const certApps = await fetchEventCertificateApps(supabase, options);
  const pendingApps = certApps.filter((app) => {
    const submission = readSubmission(app.submission_data);
    return submission.payment_status === 'pending';
  });

  if (pendingApps.length === 0) {
    return { checked: 0, updated: 0, superseded: 0 };
  }

  const appIds = pendingApps.map((a) => a.id);
  const ordersByCourse = await fetchOrdersForAppIds(supabase, appIds);

  const paidByAppId = new Map<string, OrderRow>();
  for (const order of ordersByCourse) {
    if (!isPaidOrderStatus(order.status)) continue;
    const appId = resolveApplicationIdFromOrder(order) || order.courseid;
    if (!appId || paidByAppId.has(appId)) continue;
    paidByAppId.set(appId, order);
  }

  const pendingOrderIds = pendingApps
    .map((a) => {
      const oid = readSubmission(a.submission_data).order_id;
      return typeof oid === 'string' && oid.trim() ? oid.trim() : null;
    })
    .filter((id): id is string => Boolean(id));

  for (const order of await fetchOrdersByOrderIds(supabase, pendingOrderIds)) {
    if (!isPaidOrderStatus(order.status)) continue;
    const appId = resolveApplicationIdFromOrder(order) || order.courseid;
    if (appId && !paidByAppId.has(appId)) paidByAppId.set(appId, order);
  }

  const emails = [
    ...new Set(pendingApps.map((a) => normalizeEmail(a.email)).filter(Boolean)),
  ];
  const ordersByEmail = await fetchEventCertificateOrdersByEmails(supabase, emails);
  const pendingById = new Map(pendingApps.map((a) => [a.id, a]));

  for (const order of ordersByEmail) {
    if (!isPaidOrderStatus(order.status)) continue;
    const appIdFromOrder = resolveApplicationIdFromOrder(order);
    if (appIdFromOrder && pendingById.has(appIdFromOrder) && !paidByAppId.has(appIdFromOrder)) {
      paidByAppId.set(appIdFromOrder, order);
    }
  }

  let updated = 0;
  for (const app of pendingApps) {
    const order = paidByAppId.get(app.id);
    if (!order) continue;

    const submission = readSubmission(app.submission_data);
    const nextSubmission: SubmissionData = {
      ...submission,
      payment_status: 'paid',
      order_id: order.orderid,
      payment_method: order.paymentmethod || 'iyzico',
      paid_at: order.updated_at || order.created_at || new Date().toISOString(),
      payment_synced_from: 'orders',
    };

    const { error: updateError } = await supabase
      .from(siteApplicationsDb.applications)
      .update({
        submission_data: nextSubmission,
        updated_at: new Date().toISOString(),
      })
      .eq('id', app.id);

    if (updateError) {
      console.error(`Payment sync update failed for ${app.id}:`, updateError.message);
      continue;
    }
    updated += 1;
    // local state for duplicate pass
    app.submission_data = nextSubmission;
  }

  const superseded = await supersedeDuplicatePendingCertificates(supabase, certApps);

  return { checked: pendingApps.length, updated, superseded };
}

/**
 * Aynı e-posta + aynı etkinlikte zaten paid sertifika varsa,
 * kalan pending başvuruları superseded yap (ödeme bekliyor sayacından düşer).
 */
export async function supersedeDuplicatePendingCertificates(
  supabase: SupabaseClient,
  certApps?: AppRow[]
): Promise<number> {
  const apps = certApps || (await fetchEventCertificateApps(supabase));

  const paidKeys = new Map<string, string>(); // eventKey|email -> paid app id
  for (const app of apps) {
    const submission = readSubmission(app.submission_data);
    if (submission.payment_status !== 'paid') continue;
    const email = normalizeEmail(app.email);
    if (!email) continue;
    const eventKey = app.event_id || `name:${String(app.event_name || '').toLowerCase()}`;
    paidKeys.set(`${eventKey}|${email}`, app.id);
  }

  let superseded = 0;
  for (const app of apps) {
    const submission = readSubmission(app.submission_data);
    if (submission.payment_status !== 'pending') continue;
    const email = normalizeEmail(app.email);
    if (!email) continue;
    const eventKey = app.event_id || `name:${String(app.event_name || '').toLowerCase()}`;
    const paidSiblingId = paidKeys.get(`${eventKey}|${email}`);
    if (!paidSiblingId || paidSiblingId === app.id) continue;

    const nextSubmission: SubmissionData = {
      ...submission,
      payment_status: 'superseded',
      payment_superseded_by: paidSiblingId,
      payment_superseded_at: new Date().toISOString(),
      payment_synced_from: 'duplicate_reconcile',
    };

    const { error } = await supabase
      .from(siteApplicationsDb.applications)
      .update({
        submission_data: nextSubmission,
        updated_at: new Date().toISOString(),
      })
      .eq('id', app.id);

    if (error) {
      console.error(`Supersede failed for ${app.id}:`, error.message);
      continue;
    }
    superseded += 1;
  }

  return superseded;
}

export async function syncSingleApplicationPayment(
  supabase: SupabaseClient,
  applicationId: string
): Promise<{ updated: boolean }> {
  const { data: before } = await supabase
    .from(siteApplicationsDb.applications)
    .select('submission_data, event_id')
    .eq('id', applicationId)
    .maybeSingle();

  const beforeStatus = readSubmission(before?.submission_data).payment_status;
  if (beforeStatus !== 'pending') return { updated: false };

  await syncCertificatePaymentsFromOrders(supabase, {
    eventId: (before?.event_id as string | null) || null,
  });

  const { data: after } = await supabase
    .from(siteApplicationsDb.applications)
    .select('submission_data')
    .eq('id', applicationId)
    .maybeSingle();

  const afterStatus = readSubmission(after?.submission_data).payment_status;
  return { updated: afterStatus === 'paid' || afterStatus === 'superseded' };
}

/**
 * Etkinlik ödeme uyuşmazlıkları + çift ödeme tespiti (okuma + sınıflandırma).
 * Sync çalıştırdıktan sonra çağırın.
 */
export async function reconcileEventCertificatePayments(
  supabase: SupabaseClient,
  options?: { eventId?: string | null }
): Promise<{
  pending: PaymentMismatch[];
  doublePayments: DoublePaymentFlag[];
  summary: {
    pendingCount: number;
    awaitingCheckout: number;
    checkoutStarted: number;
    notSynced: number;
    duplicates: number;
    doublePaymentApps: number;
  };
}> {
  const certApps = await fetchEventCertificateApps(supabase, options);
  const pendingApps = certApps.filter(
    (a) => readSubmission(a.submission_data).payment_status === 'pending'
  );
  const paidApps = certApps.filter(
    (a) => readSubmission(a.submission_data).payment_status === 'paid'
  );

  const allIds = certApps.map((a) => a.id);
  const orders = await fetchOrdersForAppIds(supabase, allIds);
  const ordersByApp = new Map<string, OrderRow[]>();
  for (const order of orders) {
    const appId = resolveApplicationIdFromOrder(order) || order.courseid;
    if (!appId) continue;
    const list = ordersByApp.get(appId) || [];
    list.push(order);
    ordersByApp.set(appId, list);
  }

  const paidSibling = new Map<string, string>();
  for (const app of paidApps) {
    const email = normalizeEmail(app.email);
    if (!email) continue;
    const eventKey = app.event_id || `name:${String(app.event_name || '').toLowerCase()}`;
    paidSibling.set(`${eventKey}|${email}`, app.id);
  }

  const pending: PaymentMismatch[] = [];
  for (const app of pendingApps) {
    const email = normalizeEmail(app.email);
    const eventKey = app.event_id || `name:${String(app.event_name || '').toLowerCase()}`;
    const siblingId = paidSibling.get(`${eventKey}|${email}`) || null;
    const appOrders = ordersByApp.get(app.id) || [];
    const completed = appOrders.filter((o) => isPaidOrderStatus(o.status));
    const open = appOrders.filter(
      (o) => String(o.status || '').toLowerCase() === 'pending'
    );

    let reason: PendingPaymentReason = 'awaiting_checkout';
    if (siblingId) reason = 'duplicate_of_paid';
    else if (completed.length > 0) reason = 'order_completed_not_synced';
    else if (open.length > 0) reason = 'checkout_started_not_completed';

    pending.push({
      applicationId: app.id,
      email: app.email || '',
      eventId: app.event_id,
      eventName: app.event_name,
      paymentStatus: 'pending',
      reason,
      paidSiblingApplicationId: siblingId,
      orders: appOrders.map((o) => ({
        orderId: o.orderid,
        status: o.status,
        amount: typeof o.amount === 'number' ? o.amount : null,
        siteApplicationId: resolveApplicationIdFromOrder(o),
        createdAt: o.created_at || null,
      })),
    });
  }

  const doublePayments: DoublePaymentFlag[] = [];
  for (const app of certApps) {
    const appOrders = (ordersByApp.get(app.id) || []).filter(
      (o) => isEventCertificateOrder(o) && isPaidOrderStatus(o.status)
    );
    if (appOrders.length < 2) continue;
    const submission = readSubmission(app.submission_data);
    doublePayments.push({
      applicationId: app.id,
      email: app.email || '',
      eventId: app.event_id,
      eventName: app.event_name,
      paymentStatus: String(submission.payment_status || 'none'),
      completedOrders: appOrders.map((o) => ({
        orderId: o.orderid,
        amount: typeof o.amount === 'number' ? o.amount : null,
        createdAt: o.created_at || null,
      })),
    });
  }

  return {
    pending,
    doublePayments,
    summary: {
      pendingCount: pending.length,
      awaitingCheckout: pending.filter((p) => p.reason === 'awaiting_checkout').length,
      checkoutStarted: pending.filter((p) => p.reason === 'checkout_started_not_completed')
        .length,
      notSynced: pending.filter((p) => p.reason === 'order_completed_not_synced').length,
      duplicates: pending.filter((p) => p.reason === 'duplicate_of_paid').length,
      doublePaymentApps: doublePayments.length,
    },
  };
}
