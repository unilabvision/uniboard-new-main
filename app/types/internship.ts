export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'interview'
  | 'accepted'
  | 'rejected';

export type CompanyUserRole =
  | 'company_admin'
  | 'hr_manager'
  | 'hr_reviewer'
  | 'viewer';

export type VoteType = 'approve' | 'reject' | 'neutral' | 'shortlist';

export interface InternshipApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  school: string;
  grade: string;
  position: string;
  motivation: string;
  communication?: string;
  team_experience?: string;
  status: ApplicationStatus;
  cv_file_name?: string;
  cv_storage_path?: string;
  cv_mime_type?: string;
  cv_file_size?: number;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface InternshipVote {
  id: string;
  application_id: string;
  voter_id: string;
  voter_email: string;
  voter_name: string;
  vote_type: VoteType;
  score: number;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface InternshipStatusHistory {
  id: string;
  application_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_by_email: string;
  reason: string;
  created_at: string;
}

export interface InternshipReviewer {
  id: string;
  clerk_id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  can_vote: boolean;
  can_change_status: boolean;
  can_add_notes: boolean;
  created_at: string;
  updated_at: string;
}

export interface CareerTag {
  id: string;
  slug: string;
  name: Record<string, string> | string;
  created_at: string;
}

export interface OpportunityApplication {
  id: string;
  opportunity_id: string;
  user_id: string;
  applicant_email: string;
  submission_data: Record<string, unknown> | null;
  cv_storage_path: string | null;
  cv_file_name: string | null;
  status: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_by_email: string | null;
  reviewed_at: string | null;
}

export interface OpportunityCareerTagLink {
  opportunity_id: string;
  tag_id: string;
}

/** myuni_opportunities */
export interface Opportunity {
  id: string;
  slug: string;
  title: Record<string, string>;
  description: Record<string, string> | null;
  company_name: string | null;
  location: string | null;
  work_mode: string | null;
  application_deadline: string | null;
  form_config_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

/** AI eşleştirme — yalnızca API yanıtı, ayrı tablo yok */
export interface MatchAgentStep {
  id: string;
  label: string;
  status: 'done' | 'error' | 'running';
  detail?: string;
}

export interface CandidateProfile {
  skills: string[];
  education: string[];
  experience_summary: string;
  soft_skills: string[];
  years_signal: 'junior' | 'mid' | 'senior' | 'unknown';
  highlights: string[];
}

export interface JobProfile {
  role_summary: string;
  required_skills: string[];
  nice_to_have: string[];
  culture_signals: string[];
  deal_breakers: string[];
}

export interface ApplicationMatchResult {
  match_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  summary: string;
  strengths: string[];
  risks: string[];
  recommendation: 'strong_fit' | 'good_fit' | 'partial_fit' | 'weak_fit';
  confidence?: number;
  interview_questions?: string[];
  next_actions?: string[];
  agent_reasoning?: string;
  agent_steps?: MatchAgentStep[];
  candidate_profile?: CandidateProfile;
  job_profile?: JobProfile;
  pre_matched_keywords?: string[];
}

/** İlan bilgisi — position alanından türetilir veya formdan gelir */
export interface JobMatchInput {
  title: string;
  requirements?: string;
  requiredKeywords: string[];
  preferredKeywords: string[];
}

export const INTERNSHIP_PLATFORM_MODULE_KEYS = [
  'internship',
  'staj',
  'career',
  'kariyer',
  'careers',
] as const;
