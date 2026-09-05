import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mentorshipDb } from '@/app/lib/mentorship/config';
import type { MentorshipApplicationInput } from '@/app/types/mentorship';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Supabase configuration missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** myunilab.net — mentörlük başvurusu */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MentorshipApplicationInput;
    const firstName = body.first_name?.trim();
    const lastName = body.last_name?.trim();
    const email = body.email?.trim().toLowerCase();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'first_name, last_name ve email zorunludur' },
        { status: 400 }
      );
    }

    if (!body.mentorship_id && !body.mentorship_slug) {
      return NextResponse.json(
        { error: 'mentorship_id veya mentorship_slug zorunludur' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    let mentorshipId = body.mentorship_id;
    if (!mentorshipId && body.mentorship_slug) {
      const { data: m, error: mErr } = await supabase
        .from(mentorshipDb.mentorships)
        .select('id, is_active, is_application_open, max_mentees, current_mentees')
        .eq('slug', body.mentorship_slug)
        .maybeSingle();

      if (mErr) {
        return NextResponse.json({ error: mErr.message }, { status: 500 });
      }
      if (!m || !m.is_active) {
        return NextResponse.json({ error: 'Mentörlük bulunamadı' }, { status: 404 });
      }
      if (!m.is_application_open) {
        return NextResponse.json({ error: 'Başvurular kapalı' }, { status: 400 });
      }
      if (m.max_mentees != null && m.current_mentees >= m.max_mentees) {
        return NextResponse.json({ error: 'Kontenjan dolu' }, { status: 400 });
      }
      mentorshipId = m.id;
    } else if (mentorshipId) {
      const { data: m, error: mErr } = await supabase
        .from(mentorshipDb.mentorships)
        .select('id, is_active, is_application_open, max_mentees, current_mentees')
        .eq('id', mentorshipId)
        .maybeSingle();

      if (mErr) {
        return NextResponse.json({ error: mErr.message }, { status: 500 });
      }
      if (!m || !m.is_active) {
        return NextResponse.json({ error: 'Mentörlük bulunamadı' }, { status: 404 });
      }
      if (!m.is_application_open) {
        return NextResponse.json({ error: 'Başvurular kapalı' }, { status: 400 });
      }
      if (m.max_mentees != null && m.current_mentees >= m.max_mentees) {
        return NextResponse.json({ error: 'Kontenjan dolu' }, { status: 400 });
      }
    }

    const { data: duplicate } = await supabase
      .from(mentorshipDb.applications)
      .select('id')
      .eq('mentorship_id', mentorshipId!)
      .eq('email', email)
      .not('status', 'eq', 'withdrawn')
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: 'Bu e-posta ile zaten başvuru yapılmış' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from(mentorshipDb.applications)
      .insert({
        mentorship_id: mentorshipId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: body.phone?.trim() || null,
        school: body.school?.trim() || null,
        department: body.department?.trim() || null,
        grade: body.grade?.trim() || null,
        linkedin_url: body.linkedin_url?.trim() || null,
        motivation: body.motivation?.trim() || null,
        goals: body.goals?.trim() || null,
        experience: body.experience?.trim() || null,
        answers: body.answers || {},
        locale: body.locale === 'en' ? 'en' : 'tr',
        source: body.source || 'website',
        status: 'pending',
      })
      .select('id, status, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from(mentorshipDb.statusHistory).insert({
      application_id: data.id,
      from_status: null,
      to_status: 'pending',
      changed_by: null,
      note: 'Public application submitted',
    });

    return NextResponse.json({ application: data }, { status: 201 });
  } catch (err) {
    console.error('Public mentorship apply error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
