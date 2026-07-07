import type { SiteApplicationStatus } from '@/app/lib/siteApplications/config';

export interface SiteApplication {
  id: string;
  form_id: string | null;
  application_type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  event_name: string | null;
  event_date: string | null;
  participant_count: number | null;
  organization: string | null;
  role_interest: string | null;
  experience: string | null;
  portfolio_url: string | null;
  motivation: string | null;
  message: string | null;
  submission_data: Record<string, unknown>;
  status: SiteApplicationStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_by_email: string | null;
  reviewed_at: string | null;
  source: string;
  locale: string;
  user_agent: string | null;
  attachment_file_name: string | null;
  attachment_storage_path: string | null;
  attachment_mime_type: string | null;
  attachment_file_size: number | null;
  attachment_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SiteApplicationStatusHistory {
  id: string;
  application_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_by_email: string | null;
  reason: string | null;
  created_at: string;
}

export interface SiteApplicationSubmitPayload {
  formSlug: string;
  locale?: string;
  fields: Record<string, unknown>;
  honeypot?: string;
  hCaptchaToken?: string;
  attachmentStoragePath?: string;
  attachmentFileName?: string;
  attachmentMimeType?: string;
  attachmentFileSize?: number;
}
