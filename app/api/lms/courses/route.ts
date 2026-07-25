import { NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';

/**
 * GET – Active courses for discount code course picker.
 */
export async function GET() {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { data, error } = await authResult.supabase
      .from('myuni_courses')
      .select('id, title, slug')
      .eq('is_active', true)
      .order('title');

    if (error) {
      console.error('LMS courses list error:', error);
      return NextResponse.json({ error: error.message || 'Kurslar alınamadı' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (e) {
    console.error('LMS courses GET error:', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
