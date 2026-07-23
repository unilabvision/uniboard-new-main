import type {
  PublicRegistrationPackage,
  EventCertificatePackageSettings,
} from '@/app/lib/siteApplications/packages';

export type SiteApplicationFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'number'
  | 'date'
  | 'time'
  | 'url'
  | 'select'
  | 'checkbox'
  | 'dropdown'
  | 'linear_scale'
  | 'rating'
  | 'file';

export interface SiteApplicationFormFieldOption {
  value: string;
  label_tr: string;
  label_en: string;
}

export interface SiteApplicationFormField {
  id: string;
  form_id: string;
  field_key: string;
  field_type: SiteApplicationFieldType;
  label_tr: string;
  label_en: string;
  placeholder_tr: string | null;
  placeholder_en: string | null;
  required: boolean;
  order_index: number;
  options: SiteApplicationFormFieldOption[];
  is_contact: boolean;
  created_at: string;
}

export interface SiteApplicationForm {
  id: string;
  slug_tr: string;
  slug_en: string;
  title_tr: string;
  title_en: string;
  subtitle_tr: string | null;
  subtitle_en: string | null;
  success_message_tr: string | null;
  success_message_en: string | null;
  is_active: boolean;
  show_on_website: boolean;
  allows_attachment: boolean;
  event_id: string | null;
  form_type?: 'team' | 'event' | null;
  package_settings?: EventCertificatePackageSettings | Record<string, unknown> | null;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
  fields?: SiteApplicationFormField[];
}

export interface SiteApplicationFormInput {
  slug_tr: string;
  slug_en: string;
  title_tr: string;
  title_en: string;
  subtitle_tr?: string;
  subtitle_en?: string;
  success_message_tr?: string;
  success_message_en?: string;
  is_active?: boolean;
  show_on_website?: boolean;
  allows_attachment?: boolean;
  event_id?: string | null;
  form_type?: 'team' | 'event';
  package_settings?: EventCertificatePackageSettings | null;
}

export interface SiteApplicationFormFieldInput {
  field_key: string;
  field_type: SiteApplicationFieldType;
  label_tr: string;
  label_en: string;
  placeholder_tr?: string;
  placeholder_en?: string;
  required?: boolean;
  order_index?: number;
  options?: SiteApplicationFormFieldOption[];
  is_contact?: boolean;
}

export interface PublicSiteApplicationForm {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  success_message: string | null;
  allows_attachment: boolean;
  /** team | event — used for file size limits on the client */
  form_type?: 'team' | 'event' | null;
  /** Max upload size in bytes for this form */
  max_file_bytes?: number;
  packages?: PublicRegistrationPackage[];
  fields: Array<{
    field_key: string;
    field_type: SiteApplicationFieldType;
    label: string;
    placeholder: string | null;
    required: boolean;
    order_index: number;
    options: Array<{ value: string; label: string }>;
  }>;
}
