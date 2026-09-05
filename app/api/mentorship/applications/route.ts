import { NextRequest, NextResponse } from 'next/server';
import {
  mentorshipDb,
  MENTORSHIP_APPLICATION_STATUSES,
} from '@/app/lib/mentorship/config';
import { requireMentorshipCapability } from '@/app/api/mentorship/_helpers';

export async function GET(request: NextRequest) {
  const authResult = await requireMentorshipCapability('applications');
  if (authResult.error || !authResult.supabase) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const status = request.nextUrl.searchParams.get('status');
  const mentorshipId = request.nextUrl.searchParams.get('mentorship_id');

  let query = authResult.supabase
    .from(mentorshipDb.applications)
    .select(
      '*, mentorships:mentorship_id ( id, slug, title, mentor_name )'
    )
    .order('created_at', { ascending: false });

  if (
    status &&
    (MENTORSHIP_APPLICATION_STATUSES as readonly string[]).includes(status)
  ) {
    query = query.eq('status', status);
  }
  if (mentorshipId) {
    query = query.eq('mentorship_id', mentorshipId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: data ?? [] });
}
