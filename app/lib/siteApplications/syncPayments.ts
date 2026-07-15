import type { SupabaseClient } from '@supabase/supabase-js';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';

type SubmissionData = Record<string, unknown>;

type OrderRow = {
  orderid: string;
  courseid: string | null;
  useremail: string | null;
  status: string | null;
  paymentmethod: string | null;
  custom_data: Record<string, unknown> | null;
  updated_at?: string | null;
  created_at?: string | null;
};

function readSubmission(raw: unknown): SubmissionData {
  if (raw && typeof raw === 'object') return raw as SubmissionData;
  return {};
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

/**
 * Bekleyen sertifika ödemelerini `orders` tablosu ile senkronize eder.
 * Tamamlanmış event_certificate siparişi varsa application.payment_status → paid.
 */
export async function syncCertificatePaymentsFromOrders(
  supabase: SupabaseClient
): Promise<{ checked: number; updated: number }> {
  const { data: apps, error: appsError } = await supabase
    .from(siteApplicationsDb.applications)
    .select('id, email, event_name, submission_data, source, event_id')
    .or('source.eq.event_website,event_id.not.is.null,event_name.not.is.null')
    .limit(500);

  if (appsError) {
    console.error('Payment sync: apps fetch failed:', appsError.message);
    return { checked: 0, updated: 0 };
  }

  const pendingApps = (apps || []).filter((app) => {
    const submission = readSubmission(app.submission_data);
    return (
      submission.registration_tier === 'certificate' &&
      submission.payment_status === 'pending'
    );
  });

  if (pendingApps.length === 0) {
    return { checked: 0, updated: 0 };
  }

  const appIds = pendingApps.map((a) => a.id);

  // courseid = applicationId (event_certificate siparişlerinde böyle kaydediliyor)
  const { data: ordersByCourse, error: ordersError } = await supabase
    .from('orders')
    .select('orderid, courseid, useremail, status, paymentmethod, custom_data, updated_at, created_at')
    .in('courseid', appIds)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error('Payment sync: orders fetch failed:', ordersError.message);
    return { checked: pendingApps.length, updated: 0 };
  }

  // Ayrıca custom_data.siteApplicationId ile eşleşen completed siparişler
  // (PostgREST filtre sınırlı; courseid listesi çoğu vakayı kapsar)
  const paidByAppId = new Map<string, OrderRow>();

  for (const order of (ordersByCourse || []) as OrderRow[]) {
    if (!isPaidOrderStatus(order.status)) continue;
    const appId = resolveApplicationIdFromOrder(order) || order.courseid;
    if (!appId || paidByAppId.has(appId)) continue;
    paidByAppId.set(appId, order);
  }

  // Pending app'lerde kayıtlı order_id varsa onu da kontrol et
  const pendingOrderIds = pendingApps
    .map((a) => {
      const oid = readSubmission(a.submission_data).order_id;
      return typeof oid === 'string' && oid.trim() ? oid.trim() : null;
    })
    .filter((id): id is string => Boolean(id));

  if (pendingOrderIds.length > 0) {
    const { data: byOrderId } = await supabase
      .from('orders')
      .select('orderid, courseid, useremail, status, paymentmethod, custom_data, updated_at, created_at')
      .in('orderid', pendingOrderIds);

    for (const order of (byOrderId || []) as OrderRow[]) {
      if (!isPaidOrderStatus(order.status)) continue;
      const appId = resolveApplicationIdFromOrder(order) || order.courseid;
      if (appId && !paidByAppId.has(appId)) paidByAppId.set(appId, order);
    }
  }

  // E-posta + event_certificate ile ek eşleme (courseid sapmaları için)
  const emails = [
    ...new Set(
      pendingApps
        .map((a) => (typeof a.email === 'string' ? a.email.trim().toLowerCase() : ''))
        .filter(Boolean)
    ),
  ];

  if (emails.length > 0) {
    const { data: ordersByEmail } = await supabase
      .from('orders')
      .select('orderid, courseid, useremail, status, paymentmethod, custom_data, updated_at, created_at')
      .in(
        'useremail',
        pendingApps.map((a) => a.email).filter(Boolean)
      )
      .order('created_at', { ascending: false })
      .limit(300);

    const pendingById = new Map(pendingApps.map((a) => [a.id, a]));
    const pendingByEmail = new Map<string, typeof pendingApps>();
    for (const app of pendingApps) {
      const key = String(app.email || '')
        .trim()
        .toLowerCase();
      if (!key) continue;
      const list = pendingByEmail.get(key) || [];
      list.push(app);
      pendingByEmail.set(key, list);
    }

    for (const order of (ordersByEmail || []) as OrderRow[]) {
      if (!isPaidOrderStatus(order.status)) continue;
      const itemType = order.custom_data?.itemType;
      const appIdFromOrder = resolveApplicationIdFromOrder(order);
      if (appIdFromOrder && pendingById.has(appIdFromOrder) && !paidByAppId.has(appIdFromOrder)) {
        paidByAppId.set(appIdFromOrder, order);
        continue;
      }
      if (itemType !== 'event_certificate') continue;
      const emailKey = String(order.useremail || '')
        .trim()
        .toLowerCase();
      const candidates = pendingByEmail.get(emailKey) || [];
      for (const app of candidates) {
        if (paidByAppId.has(app.id)) continue;
        // Aynı e-posta + sertifika siparişi: siparişin courseid'si app id ise veya siteApplicationId eşleşiyorsa
        if (
          order.courseid === app.id ||
          order.custom_data?.siteApplicationId === app.id
        ) {
          paidByAppId.set(app.id, order);
        }
      }
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
  }

  return { checked: pendingApps.length, updated };
}

/**
 * Tek başvuru için ödeme senkronu (detay sayfası).
 * Batch sync'i çalıştırır; hedef kayıt güncellendiyse true döner.
 */
export async function syncSingleApplicationPayment(
  supabase: SupabaseClient,
  applicationId: string
): Promise<{ updated: boolean }> {
  const { data: before } = await supabase
    .from(siteApplicationsDb.applications)
    .select('submission_data')
    .eq('id', applicationId)
    .maybeSingle();

  const beforeStatus = readSubmission(before?.submission_data).payment_status;
  if (beforeStatus !== 'pending') return { updated: false };

  await syncCertificatePaymentsFromOrders(supabase);

  const { data: after } = await supabase
    .from(siteApplicationsDb.applications)
    .select('submission_data')
    .eq('id', applicationId)
    .maybeSingle();

  const afterStatus = readSubmission(after?.submission_data).payment_status;
  return { updated: afterStatus === 'paid' };
}
