import { NextRequest, NextResponse } from 'next/server';
import { requireLmsContentAdmin } from '@/app/api/lms/_helpers';
import { requireMentorshipCapability } from '@/app/api/mentorship/_helpers';
import type { CourseImageKind } from '@/app/lib/lms/courseMedia';
import type { MentorshipImageKind } from '@/app/lib/mentorship/storage';
import {
  DashboardMediaError,
  uploadCourseImage,
  uploadMentorshipImage,
} from '@/app/lib/storage/dashboardMedia';

export const runtime = 'nodejs';

function errorResponse(error: unknown) {
  if (error instanceof DashboardMediaError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error('[admin/media] Upload failed:', error);
  return NextResponse.json({ error: 'Görsel yüklenemedi' }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const scope = String(
      formData.get('scope') || request.nextUrl.searchParams.get('scope') || ''
    ).trim();
    const kind = String(formData.get('kind') || '').trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
    }

    if (scope === 'mentorship') {
      const access = await requireMentorshipCapability('edit');
      if (access.error || !access.supabase) {
        return NextResponse.json(
          { error: access.error || 'Unauthorized' },
          { status: access.status }
        );
      }
      const slug = String(formData.get('slug') || '').trim() || null;
      const media = await uploadMentorshipImage(
        access.supabase,
        file,
        kind as MentorshipImageKind,
        slug
      );
      return NextResponse.json({ ...media, kind });
    }

    if (scope === 'course') {
      const access = await requireLmsContentAdmin();
      if (access.error || !access.supabase) {
        return NextResponse.json(
          { error: access.error || 'Unauthorized' },
          { status: access.status }
        );
      }
      const courseId = String(
        formData.get('entityId') || request.nextUrl.searchParams.get('entityId') || ''
      ).trim();
      if (!courseId) {
        return NextResponse.json({ error: 'Kurs kimliği gerekli' }, { status: 400 });
      }
      const persist = String(formData.get('persist') || 'true') !== 'false';
      const media = await uploadCourseImage(
        access.supabase,
        file,
        kind as CourseImageKind,
        courseId,
        persist
      );
      return NextResponse.json(media);
    }

    return NextResponse.json({ error: 'Geçersiz medya kapsamı' }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
