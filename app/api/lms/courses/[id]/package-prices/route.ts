import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';

type RouteContext = { params: Promise<{ id: string }> };

function parsePrice(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 'invalid';
  }
  const normalized = String(value).trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized) return null;
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 'invalid';
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id: courseId } = await context.params;

  const { data, error } = await authResult.supabase
    .from('myuni_course_tiers')
    .select(
      'id, course_id, title, slug, price, original_price, is_full_course, order_index, is_active'
    )
    .eq('course_id', courseId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('LMS package prices GET error:', error);
    return NextResponse.json({ error: error.message || 'Paket fiyatları alınamadı' }, { status: 500 });
  }

  const packages = (data || []).map((row) => ({
    id: String(row.id),
    course_id: String(row.course_id),
    title: String(row.title || 'Paket'),
    slug: row.slug != null ? String(row.slug) : null,
    price: Number(row.price) || 0,
    original_price:
      row.original_price != null && row.original_price !== ''
        ? Number(row.original_price)
        : null,
    is_full_course: row.is_full_course === true,
    order_index: Number(row.order_index) || 0,
    is_active: row.is_active !== false,
  }));

  return NextResponse.json({ success: true, packages });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id: courseId } = await context.params;

  let body: { updates?: Array<{ id?: string; price?: unknown; original_price?: unknown }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates = Array.isArray(body.updates) ? body.updates : [];
  if (updates.length === 0) {
    return NextResponse.json({ error: 'Güncellenecek paket yok' }, { status: 400 });
  }

  const results: Array<{ id: string; price: number; original_price: number | null }> = [];

  for (const row of updates) {
    const tierId = String(row.id || '').trim();
    if (!tierId) {
      return NextResponse.json({ error: 'Paket kimliği gerekli' }, { status: 400 });
    }

    const price = parsePrice(row.price);
    const originalPrice = parsePrice(row.original_price);
    if (price === 'invalid' || originalPrice === 'invalid') {
      return NextResponse.json({ error: 'Geçersiz fiyat değeri' }, { status: 400 });
    }

    const { data: tier, error: tierError } = await authResult.supabase
      .from('myuni_course_tiers')
      .select('id, course_id')
      .eq('id', tierId)
      .maybeSingle();

    if (tierError) {
      return NextResponse.json({ error: tierError.message }, { status: 500 });
    }
    if (!tier || String(tier.course_id) !== courseId) {
      return NextResponse.json({ error: 'Paket bu kursa ait değil' }, { status: 404 });
    }

    const { error: updateError } = await authResult.supabase
      .from('myuni_course_tiers')
      .update({
        price: price ?? 0,
        original_price: originalPrice,
      })
      .eq('id', tierId);

    if (updateError) {
      console.error('LMS tier price update error:', updateError);
      return NextResponse.json({ error: updateError.message || 'Paket fiyatı güncellenemedi' }, { status: 500 });
    }

    results.push({
      id: tierId,
      price: price ?? 0,
      original_price: originalPrice,
    });
  }

  return NextResponse.json({ success: true, packages: results });
}
