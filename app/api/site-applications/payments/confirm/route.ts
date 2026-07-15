import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { siteApplicationsDb, isEventSiteApplication } from '@/app/lib/siteApplications/config';
import { sendSiteApplicationApprovalEmail } from '@/app/_services/siteApplicationApprovalEmail';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Called by myunilab.net after Iyzico/Shopier payment succeeds.
 * Secured with SITE_APPLICATION_PAYMENT_SECRET header.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.SITE_APPLICATION_PAYMENT_SECRET;
    const provided = request.headers.get('x-payment-secret');
    if (!secret || provided !== secret) {
      return unauthorized();
    }

    const body = await request.json();
    const applicationId = String(body.applicationId || '').trim();
    const orderId = String(body.orderId || '').trim();
    const paymentMethod = String(body.paymentMethod || 'iyzico').trim();

    if (!applicationId || !orderId) {
      return NextResponse.json({ error: 'applicationId and orderId required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: application, error: loadError } = await supabase
      .from(siteApplicationsDb.applications)
      .select(
        'id, status, source, event_id, event_name, email, first_name, last_name, locale, submission_data'
      )
      .eq('id', applicationId)
      .single();

    if (loadError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const existingData =
      application.submission_data && typeof application.submission_data === 'object'
        ? (application.submission_data as Record<string, unknown>)
        : {};

    const submission_data = {
      ...existingData,
      payment_status: 'paid',
      payment_method: paymentMethod,
      order_id: orderId,
      paid_at: new Date().toISOString(),
    };

    // Payment confirm: only update payment fields; status already accepted on submit.
    // Legacy rows may still be pending — auto-accept those once and send confirmation email.
    const isEvent = isEventSiteApplication(application);
    const shouldAutoAccept = isEvent && application.status !== 'accepted';

    const updates: Record<string, unknown> = { submission_data };
    if (shouldAutoAccept) {
      updates.status = 'accepted';
    }

    const { data, error } = await supabase
      .from(siteApplicationsDb.applications)
      .update(updates)
      .eq('id', applicationId)
      .select('id, status, submission_data')
      .single();

    if (error) {
      console.error('Payment confirm update error:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    if (shouldAutoAccept) {
      await supabase.from(siteApplicationsDb.statusHistory).insert({
        application_id: applicationId,
        old_status: application.status,
        new_status: 'accepted',
        changed_by: null,
        changed_by_email: 'system:event-payment-accept',
      });

      const emailResult = await sendSiteApplicationApprovalEmail({
        to: application.email,
        firstName: application.first_name,
        lastName: application.last_name,
        locale: application.locale === 'en' ? 'en' : 'tr',
        eventName: application.event_name,
        isEvent: true,
      });
      if (!emailResult.success) {
        console.error('Event registration email failed on payment confirm:', emailResult.error);
      }
    }

    return NextResponse.json({ success: true, application: data });
  } catch (err) {
    console.error('Payment confirm error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
