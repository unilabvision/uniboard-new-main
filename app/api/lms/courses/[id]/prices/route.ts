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

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;

  let body: { price?: unknown; original_price?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const price = parsePrice(body.price);
  const originalPrice = parsePrice(body.original_price);

  if (price === 'invalid' || originalPrice === 'invalid') {
    return NextResponse.json({ error: 'Geçersiz fiyat değeri' }, { status: 400 });
  }

  const { data, error } = await authResult.supabase
    .from('myuni_courses')
    .update({
      price: price ?? 0,
      original_price: originalPrice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, price, original_price')
    .single();

  if (error) {
    console.error('LMS course price update error:', error);
    return NextResponse.json({ error: error.message || 'Fiyat güncellenemedi' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Kurs bulunamadı' }, { status: 404 });
  }

  return NextResponse.json({ success: true, course: data });
}
