import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const CERTIFICATE_ISSUANCE_TABLE = 'certificate_issuance_queue' as const;

export type CertificateIssuanceKind = 'event_participation' | 'course_achievement';
export type CertificateIssuanceStatus =
  | 'pending'
  | 'ready'
  | 'issued'
  | 'skipped'
  | 'failed';
export type CertificateIssuanceSourceType = 'site_application' | 'enrollment';

export type CertificateIssuanceRow = {
  id: string;
  created_at: string;
  updated_at: string;
  kind: CertificateIssuanceKind;
  status: CertificateIssuanceStatus;
  eligible_at: string;
  recipient_name: string;
  recipient_email: string;
  source_type: CertificateIssuanceSourceType;
  source_id: string;
  event_id: string | null;
  event_name: string | null;
  course_id: string | null;
  course_name: string | null;
  order_id: string | null;
  certificate_title: string;
  locale: string;
  issued_certificate_id: number | null;
  issued_certificatenumber: string | null;
  issued_at: string | null;
  email_sent_at: string | null;
  error: string | null;
};

export function getCertificatesServiceSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL2;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY2;
  if (!url || !key) {
    throw new Error('Supabase configuration missing (URL2 / SERVICE_ROLE_KEY2)');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type OrganizationForNumber = {
  abbreviation?: string | null;
  slug?: string | null;
  name?: string | null;
};

/** Create page ile aynı formatta sertifika numarası */
export function generateCertificateNumber(organization?: OrganizationForNumber): string {
  const orgPrefix =
    organization?.abbreviation || organization?.slug?.toUpperCase() || 'MA';
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const sequential = (timestamp % 100000).toString().padStart(5, '0');
  const day = new Date().getDate();
  const month = new Date().getMonth() + 1;
  const dateNumber = (day * 100 + month).toString().padStart(4, '0');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let alphaCode = '';
  for (let i = 0; i < 3; i++) {
    alphaCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  let finalCode = '';
  for (let i = 0; i < 5; i++) {
    finalCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${orgPrefix}${year}-${sequential}-${dateNumber}-${alphaCode}-${finalCode}`;
}

export function buildCertificatePublicUrl(orgSlug: string, certificateNumber: string): string {
  const slug = orgSlug.trim();
  if (slug) {
    return `https://certificates.myunilab.net/${slug}/${certificateNumber}`;
  }
  return `https://certificates.myunilab.net/${certificateNumber}`;
}

export function addDaysIso(dateInput: string | Date, days: number): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET || process.env.SITE_APPLICATIONS_CLEANUP_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}
