import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';

/**
 * GET /api/lms/courses/export
 * Export myuni_courses as Excel (.xlsx).
 */
export async function GET() {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { data, error } = await authResult.supabase
      .from('myuni_courses')
      .select(
        'id, title, slug, price, original_price, early_bird_price, early_bird_deadline, is_active, is_registration_open, instructor_name, created_at, updated_at'
      )
      .order('title', { ascending: true });

    if (error) {
      console.error('LMS courses export error:', error);
      return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
    }

    const rows = (data || []).map((c, index) => ({
      '#': index + 1,
      ID: c.id,
      Başlık: c.title || '',
      Slug: c.slug || '',
      Fiyat: c.price ?? '',
      'Orijinal fiyat': c.original_price ?? '',
      'Erken kayıt fiyatı': c.early_bird_price ?? '',
      'Erken kayıt bitiş': c.early_bird_deadline ?? '',
      Aktif: c.is_active ? 'Evet' : 'Hayır',
      'Kayıt açık': c.is_registration_open === false ? 'Hayır' : 'Evet',
      Eğitmen: c.instructor_name || '',
      'Oluşturma': c.created_at || '',
      'Güncelleme': c.updated_at || '',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      rows.length
        ? rows
        : [
            {
              '#': '',
              ID: '',
              Başlık: '',
              Slug: '',
              Fiyat: '',
              'Orijinal fiyat': '',
              'Erken kayıt fiyatı': '',
              'Erken kayıt bitiş': '',
              Aktif: '',
              'Kayıt açık': '',
              Eğitmen: '',
              Oluşturma: '',
              Güncelleme: '',
            },
          ]
    );
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kurslar');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

    const date = new Date().toISOString().slice(0, 10);
    const filename = `myuni-kurslar-${date}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('LMS courses export error:', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
