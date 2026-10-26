import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLocalizedJson, mentorshipDb } from '@/app/lib/mentorship/config';
import {
  normalizeMentorshipQuestions,
  splitLegacyAnswerFields,
  validateRequiredAnswers,
} from '@/app/lib/mentorship/questions';
import type { MentorshipApplicationInput } from '@/app/types/mentorship';
import { sendMentorshipApplicationEmails } from '@/app/_services/mentorshipApplicationEmail';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) throw new Error('Supabase configuration missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function buildAnswers(body: MentorshipApplicationInput): Record<string, unknown> {
  const answers: Record<string, unknown> =
    body.answers && typeof body.answers === 'object' ? { ...body.answers } : {};

  if (body.motivation?.trim() && answers.motivation == null) {
    answers.motivation = body.motivation.trim();
  }
  if (body.goals?.trim() && answers.goals == null) {
    answers.goals = body.goals.trim();
  }
  if (body.experience?.trim() && answers.experience == null) {
    answers.experience = body.experience.trim();
  }

  return answers;
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

    const selectCols =
      'id, slug, title, mentor_name, is_active, is_application_open, max_mentees, current_mentees, application_questions';
    const lookupColumn = body.mentorship_id ? 'id' : 'slug';
    const lookupValue = body.mentorship_id || body.mentorship_slug!;
    const { data: mentorship, error: mentorshipError } = await supabase
      .from(mentorshipDb.mentorships)
      .select(selectCols)
      .eq(lookupColumn, lookupValue)
      .maybeSingle();

    if (mentorshipError) {
      return NextResponse.json({ error: mentorshipError.message }, { status: 500 });
    }
    if (!mentorship || !mentorship.is_active) {
      return NextResponse.json({ error: 'Mentörlük bulunamadı' }, { status: 404 });
    }
    if (!mentorship.is_application_open) {
      return NextResponse.json({ error: 'Başvurular kapalı' }, { status: 400 });
    }
    if (
      mentorship.max_mentees != null &&
      mentorship.current_mentees >= mentorship.max_mentees
    ) {
      return NextResponse.json({ error: 'Kontenjan dolu' }, { status: 400 });
    }

    const mentorshipId = mentorship.id;
    const applicationQuestions = mentorship.application_questions;

    const questions = normalizeMentorshipQuestions(applicationQuestions);
    const answers = buildAnswers(body);
    const validationError = validateRequiredAnswers(questions, answers);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const legacy = splitLegacyAnswerFields(answers);

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
        motivation: legacy.motivation || body.motivation?.trim() || null,
        goals: legacy.goals || body.goals?.trim() || null,
        experience: legacy.experience || body.experience?.trim() || null,
        answers,
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

    const locale = body.locale === 'en' ? 'en' : 'tr';
    const emailResult = await sendMentorshipApplicationEmails({
      applicationId: data.id,
      applicantEmail: email,
      firstName,
      lastName,
      phone: body.phone?.trim() || null,
      school: body.school?.trim() || null,
      department: body.department?.trim() || null,
      locale,
      mentorshipTitle: getLocalizedJson(mentorship.title, locale, 'MyUNI Mentorship'),
      mentorName: mentorship.mentor_name,
    });

    if (!emailResult.applicantSent || !emailResult.notificationSent) {
      console.error('[mentorship] application email delivery failed', {
        applicationId: data.id,
        applicantSent: emailResult.applicantSent,
        notificationSent: emailResult.notificationSent,
        error: emailResult.error,
      });
    }

    return NextResponse.json({ application: data }, { status: 201 });
  } catch (err) {
    console.error('Public mentorship apply error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
