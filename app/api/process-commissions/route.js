// app/api/process-commissions/route.js

import { createClient } from '@supabase/supabase-js';

// Supabase clients
const supabaseMain = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL2 || 'https://emfvwpztyuykqtepnsfp.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY2 // Service role key gerekli (admin yetkisi için)
);

// Commission hesaplama fonksiyonu
function calculateCommission(saleAmount, discountAmount = 0, commissionRate = 15) {
  const netAmount = saleAmount - discountAmount;
  return Math.round((netAmount * commissionRate / 100) * 100) / 100;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, forceReprocess = false } = body;

    console.log('🔄 Commission processing started for order:', orderId);

    // 1. İşlenecek siparişleri bul
    let ordersQuery = supabaseMain
      .from('orders')
      .select('*')
      .eq('enrolled', true)
      .not('discountcode', 'is', null)
      .not('discountcode', 'eq', '');

    if (orderId) {
      ordersQuery = ordersQuery.eq('orderid', orderId);
    } else {
      // Son 24 saatteki siparişleri işle
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      ordersQuery = ordersQuery.gte('created_at', yesterday.toISOString());
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) {
      throw new Error(`Orders fetch error: ${ordersError.message}`);
    }

    console.log(`📊 Found ${orders?.length || 0} orders to process`);

    const results = [];

    for (const order of orders || []) {
      try {
        console.log(`🔍 Processing order: ${order.orderid}`);

        // Zaten işlenmiş mi kontrol et
        if (!forceReprocess) {
          const { data: existingCommission } = await supabaseMain
            .from('myuni_commissions')
            .select('id')
            .eq('order_id', order.orderid)
            .single();

          if (existingCommission) {
            console.log(`⏭️ Order ${order.orderid} already processed, skipping`);
            results.push({
              orderId: order.orderid,
              status: 'skipped',
              reason: 'Already processed'
            });
            continue;
          }
        }

        // İndirim kodu bilgilerini al (büyük/küçük harf duyarsız)
        const { data: discountCode, error: dcError } = await supabaseMain
          .from('discount_codes')
          .select(`
            id,
            code,
            influencer_id,
            campaign_id,
            commission,
            discount_amount,
            discount_type,
            is_one_time
          `)
          .ilike('code', order.discountcode)
          .maybeSingle();

        if (dcError || !discountCode) {
          console.log(`❌ Discount code not found for order ${order.orderid}: ${order.discountcode}`);
          results.push({
            orderId: order.orderid,
            status: 'error',
            reason: 'Discount code not found'
          });
          continue;
        }

        console.log(`✅ Found discount code: ${discountCode.code} for influencer: ${discountCode.influencer_id}`);

        // Net tutar ve komisyon hesapla
        const netAmount = order.amount - (order.discountamount || 0);
        const commissionRate = discountCode.commission || 15;
        const commissionAmount = calculateCommission(order.amount, order.discountamount || 0, commissionRate);

        console.log(`💰 Calculated commission: ${commissionAmount} (Rate: ${commissionRate}%)`);

        // Öğrenci adını düzenle
        const studentName = order.useremail.split('@')[0];

        // Komisyon kaydını oluştur
        const commissionData = {
          order_id: order.orderid,
          influencer_id: discountCode.influencer_id,
          discount_code_id: discountCode.id,
          campaign_id: discountCode.campaign_id,
          course_id: order.courseid,
          course_name: order.coursename || 'Kurs Bilgisi Bulunamadı',
          student_email: order.useremail,
          student_name: studentName,
          sale_amount: parseFloat(order.amount),
          discount_amount: parseFloat(order.discountamount || 0),
          net_amount: netAmount,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          status: order.status === 'completed' ? 'completed' : 'pending',
          payment_status: order.status,
          sale_date: order.created_at,
          metadata: {
            payment_id: order.paymentid,
            payment_method: order.paymentmethod,
            ip_address: order.ip_address,
            user_agent: order.user_agent,
            enrollment_id: order.enrollmentid,
            custom_data: order.custom_data,
            processed_by: 'api',
            processed_at: new Date().toISOString()
          }
        };

        console.log(`📝 Creating commission record...`);

        const { data: commission, error: commissionError } = await supabaseMain
          .from('myuni_commissions')
          .insert(commissionData)
          .select()
          .single();

        if (commissionError) {
          console.error(`❌ Commission creation error for order ${order.orderid}:`, commissionError);
          results.push({
            orderId: order.orderid,
            status: 'error',
            reason: commissionError.message
          });
          continue;
        }

        // Tek kullanımlık kodları işaretle
        if (discountCode.is_one_time) {
          await supabaseMain
            .from('discount_codes')
            .update({
              is_used: true,
              used_by: order.useremail,
              used_at: new Date().toISOString()
            })
            .eq('id', discountCode.id);
          console.log(`🏷️ Marked discount code as used`);
        }

        console.log(`✅ Commission created successfully for order ${order.orderid}, amount: ${commissionAmount}`);
        results.push({
          orderId: order.orderid,
          status: 'success',
          commissionAmount: commissionAmount,
          commissionId: commission.id
        });

      } catch (orderError) {
        console.error(`❌ Error processing order ${order.orderid}:`, orderError);
        results.push({
          orderId: order.orderid,
          status: 'error',
          reason: orderError.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${results.length} orders`,
      results: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Commission processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET request - manuel tetikleme için
export async function GET(request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');
  const force = url.searchParams.get('force') === 'true';

  return POST(new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, forceReprocess: force })
  }));
}