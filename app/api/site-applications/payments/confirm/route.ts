import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { siteApplicationsDb } from '@/app/lib/siteApplications/config';

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
      .select('id, submission_data')
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

    const { data, error } = await supabase
      .from(siteApplicationsDb.applications)
      .update({ submission_data })
      .eq('id', applicationId)
      .select('id, submission_data')
      .single();

    if (error) {
      console.error('Payment confirm update error:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: data });
  } catch (err) {
    console.error('Payment confirm error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
