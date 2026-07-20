import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { requireEventsRegistrantToolsUser } from '@/app/api/events/_helpers';
import { eventsDb } from '@/app/lib/events/config';
import { fetchEventRegistrants } from '@/app/lib/events/registrants';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/events/[id]/registrants/export
 * Etkinlik kayıtlarını Excel (.xlsx) olarak indir.
 */
export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireEventsRegistrantToolsUser();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id } = await context.params;
  const supabase = authResult.supabase;

  const { data: event, error: eventError } = await supabase
    .from(eventsDb.events)
    .select('id, slug, title')
    .eq('id', id)
    .maybeSingle();

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const registrants = await fetchEventRegistrants(supabase, id);

  const sheetRows = registrants.map((r, index) => ({
    '#': index + 1,
    Ad: r.first_name || '',
    Soyad: r.last_name || '',
    Email: r.email,
    Telefon: r.phone || '',
    'Başvuru durumu': r.status || '',
    Paket: r.registration_tier === 'certificate' ? 'Sertifika' : 'Ücretsiz',
    'Ödeme durumu': r.payment_status,
    Ücret: r.package_price ?? '',
    'Para birimi': r.package_currency || '',
    'Order ID': r.order_id || '',
    Locale: r.locale || '',
    'Kayıt tarihi': r.created_at
      ? new Date(r.created_at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
      : '',
    'Application ID': r.id,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(
    sheetRows.length
      ? sheetRows
      : [
          {
            '#': '',
            Ad: '',
            Soyad: '',
            Email: '',
            Telefon: '',
            'Başvuru durumu': '',
            Paket: '',
            'Ödeme durumu': '',
            Ücret: '',
            'Para birimi': '',
            'Order ID': '',
            Locale: '',
            'Kayıt tarihi': '',
            'Application ID': '',
          },
        ]
  );
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Kayıtlar');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  const safeSlug = String(event.slug || 'event')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .slice(0, 60);
  const filename = `${safeSlug}-kayitlar.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
