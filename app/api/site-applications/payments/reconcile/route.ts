import { NextRequest, NextResponse } from 'next/server';
import { requireSiteApplicationsModuleUser } from '@/app/api/site-applications/access/_helpers';
import {
  reconcileEventCertificatePayments,
  syncCertificatePaymentsFromOrders,
} from '@/app/lib/siteApplications/syncPayments';

/**
 * GET /api/site-applications/payments/reconcile?eventId=...
 * Önce orders ↔ applications sync, sonra pending sınıflandırma + çift ödeme listesi.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireSiteApplicationsModuleUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const eventId = request.nextUrl.searchParams.get('eventId');
  const syncResult = await syncCertificatePaymentsFromOrders(authResult.supabase, {
    eventId,
  });
  const report = await reconcileEventCertificatePayments(authResult.supabase, {
    eventId,
  });

  return NextResponse.json({
    sync: syncResult,
    ...report,
  });
}

/**
 * POST — yalnızca sync (mükerrer pending → superseded + completed order → paid).
 */
export async function POST(request: NextRequest) {
  const authResult = await requireSiteApplicationsModuleUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  let eventId: string | null = null;
  try {
    const body = await request.json();
    if (typeof body?.eventId === 'string') eventId = body.eventId;
  } catch {
    /* empty body ok */
  }

  const syncResult = await syncCertificatePaymentsFromOrders(authResult.supabase, {
    eventId,
  });

  return NextResponse.json({ success: true, sync: syncResult });
}
