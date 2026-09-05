import type {
  MENTORSHIP_APPLICATION_STATUSES,
  MENTORSHIP_MODES,
  MENTORSHIP_TYPES,
} from '@/app/lib/mentorship/config';

export type MentorshipType = (typeof MENTORSHIP_TYPES)[number];
export type MentorshipMode = (typeof MENTORSHIP_MODES)[number];
export type MentorshipApplicationStatus =
  (typeof MENTORSHIP_APPLICATION_STATUSES)[number];

export type LocalizedText = {
  tr?: string;
  en?: string;
  [key: string]: string | undefined;
};

export interface Mentorship {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText | null;
  summary: LocalizedText | null;
  mentor_name: string | null;
  mentor_title: string | null;
  mentor_bio: LocalizedText | null;
  mentor_image_url: string | null;
  mentor_linkedin: string | null;
  mentorship_type: MentorshipType;
  mode: MentorshipMode;
  location_name: string | null;
  application_deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  max_mentees: number | null;
  current_mentees: number;
  is_application_open: boolean;
  thumbnail_url: string | null;
  banner_url: string | null;
  tags: string[] | null;
  order_index: number;
  is_active: boolean;
  is_featured: boolean;
  panel_organization_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MentorshipInput = Partial<
  Omit<Mentorship, 'id' | 'current_mentees' | 'created_at' | 'updated_at'>
> & {
  slug: string;
  title: LocalizedText;
};

export interface MentorshipApplication {
  id: string;
  mentorship_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  school: string | null;
  department: string | null;
  grade: string | null;
  linkedin_url: string | null;
  motivation: string | null;
  goals: string | null;
  experience: string | null;
  cv_file_name: string | null;
  cv_storage_path: string | null;
  cv_mime_type: string | null;
  cv_file_size: number | null;
  answers: Record<string, unknown> | null;
  status: MentorshipApplicationStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  source: string | null;
  locale: string | null;
  created_at: string;
  updated_at: string;
  mentorships?: Pick<Mentorship, 'id' | 'slug' | 'title' | 'mentor_name'> | null;
}

export type MentorshipApplicationInput = {
  mentorship_id?: string;
  mentorship_slug?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  school?: string | null;
  department?: string | null;
  grade?: string | null;
  linkedin_url?: string | null;
  motivation?: string | null;
  goals?: string | null;
  experience?: string | null;
  answers?: Record<string, unknown> | null;
  locale?: string | null;
  source?: string | null;
};
