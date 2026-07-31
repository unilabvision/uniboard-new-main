import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { syncContentDurations } from '@/app/lib/lms/videoDurations';

type RouteContext = { params: Promise<{ id: string }> };

export const maxDuration = 60;

export async function POST(request: NextRequest, context: RouteContext) {
  const authResult = await requireLmsContentAdmin();
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { id: courseId } = await context.params;
  if (!courseId) {
    return NextResponse.json({ error: 'Kurs kimliği gerekli' }, { status: 400 });
  }

  // force=true tüm videoların süresini Vimeo'dan yeniden çeker,
  // aksi halde yalnızca süresi eksik olanlar sorgulanır.
  const force = new URL(request.url).searchParams.get('force') === 'true';

  try {
    const result = await syncContentDurations(courseId, {
      scope: 'course',
      force,
      client: authResult.supabase,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('LMS duration sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Süreler senkronize edilemedi' },
      { status: 500 }
    );
  }
}
