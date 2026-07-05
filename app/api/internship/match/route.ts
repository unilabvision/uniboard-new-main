import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import geminiService from '@/app/_services/geminiService';
import {
  internshipDb,
  getCareerTagLabel,
  getOpportunityTitle,
  getOpportunityDescription,
} from '@/app/lib/internship/config';
import { keywordsFromPosition } from '@/app/lib/internship/permissions';
import { runMatchAgent } from '@/app/lib/internship/matchAgent';
import type { CareerTag, JobMatchInput } from '@/app/types/internship';

async function fetchAllCareerTagLabels(
  supabase: SupabaseClient,
  locale: string
): Promise<string[]> {
  const { data } = await supabase
    .from(internshipDb.careerTags)
    .select('id, slug, name');
  return (data as CareerTag[] | null)?.map((t) => getCareerTagLabel(t, locale)) || [];
}

async function fetchOpportunityTagKeywords(
  supabase: SupabaseClient,
  opportunityId: string,
  locale: string
): Promise<string[]> {
  const { data: links } = await supabase
    .from(internshipDb.opportunityCareerTags)
    .select('tag_id')
    .eq('opportunity_id', opportunityId);

  if (!links?.length) return [];

  const tagIds = links.map((l) => l.tag_id);
  const { data: tags } = await supabase
    .from(internshipDb.careerTags)
    .select('id, slug, name')
    .in('id', tagIds);

  return (tags as CareerTag[] | null)?.map((tag) => getCareerTagLabel(tag, locale)) || [];
}

function textFromSubmissionData(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const parts: string[] = [];
  const walk = (value: unknown) => {
    if (typeof value === 'string' && value.trim().length > 20) parts.push(value.trim());
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(data);
  return parts.join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { applicationId, opportunityApplicationId, job, locale = 'tr' } = body as {
      applicationId?: string;
      opportunityApplicationId?: string;
      opportunityId?: string;
      job?: JobMatchInput;
      locale?: string;
    };

    if (!applicationId && !opportunityApplicationId) {
      return NextResponse.json(
        { error: 'applicationId or opportunityApplicationId is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL2;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY2;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const careerTags = await fetchAllCareerTagLabels(supabase, locale);

    let applicantName = 'Aday';
    let position = '';
    let motivation = '';
    let communication = '';
    let teamExperience = '';
    let cvFileName: string | undefined;
    let tagKeywords: string[] = [];
    let jobRequirements = '';

    if (applicationId) {
      const { data: application, error } = await supabase
        .from(internshipDb.applications)
        .select('*')
        .eq('id', applicationId)
        .single();

      if (error || !application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      applicantName = `${application.first_name} ${application.last_name}`;
      position = application.position || '';
      motivation = application.motivation || '';
      communication = application.communication || '';
      teamExperience = application.team_experience || '';
      cvFileName = application.cv_file_name || undefined;
      tagKeywords = careerTags.filter((tag) =>
        position.toLowerCase().includes(tag.toLowerCase().slice(0, 4))
      );
    } else if (opportunityApplicationId) {
      const { data: oppApp, error } = await supabase
        .from(internshipDb.opportunityApplications)
        .select('*')
        .eq('id', opportunityApplicationId)
        .single();

      if (error || !oppApp) {
        return NextResponse.json({ error: 'Opportunity application not found' }, { status: 404 });
      }

      applicantName = oppApp.applicant_email;
      motivation = textFromSubmissionData(oppApp.submission_data);
      cvFileName = oppApp.cv_file_name || undefined;
      tagKeywords = await fetchOpportunityTagKeywords(supabase, oppApp.opportunity_id, locale);

      const { data: opportunity } = await supabase
        .from(internshipDb.opportunities)
        .select('*')
        .eq('id', oppApp.opportunity_id)
        .maybeSingle();

      position = opportunity
        ? getOpportunityTitle(opportunity, locale)
        : oppApp.opportunity_id;

      if (opportunity) {
        const desc = getOpportunityDescription(opportunity, locale);
        const meta = [opportunity.company_name, opportunity.location, opportunity.work_mode]
          .filter(Boolean)
          .join(' · ');
        jobRequirements = [desc !== '—' ? desc : '', meta].filter(Boolean).join('\n\n');
      }
    }

    const jobSpec: JobMatchInput = job || {
      title: position || 'Pozisyon',
      requirements: jobRequirements || position,
      requiredKeywords: [
        ...new Set([...keywordsFromPosition(position || ''), ...tagKeywords]),
      ],
      preferredKeywords: [...new Set(tagKeywords)],
    };

    const { match, agentSteps, candidateProfile, jobProfile } = await runMatchAgent(
      {
        locale,
        applicantName,
        position,
        motivation,
        communication,
        teamExperience,
        cvFileName,
        jobTitle: jobSpec.title,
        jobRequirements: jobSpec.requirements || jobSpec.title,
        requiredKeywords: jobSpec.requiredKeywords,
        preferredKeywords: jobSpec.preferredKeywords,
        careerTags,
      },
      (prompt, maxTokens) => geminiService.generateText(prompt, maxTokens ?? 1200)
    );

    if (!match) {
      return NextResponse.json(
        { error: 'AI agent could not complete matching', agentSteps },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      match,
      agentSteps,
      candidateProfile,
      jobProfile,
      jobUsed: jobSpec,
    });
  } catch (err) {
    console.error('Internship match error:', err);
    return NextResponse.json({ error: 'Failed to compute match' }, { status: 500 });
  }
}
