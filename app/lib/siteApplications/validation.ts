import type { SiteApplicationFormField } from '@/app/types/siteApplicationForms';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeFieldValue(
  field: SiteApplicationFormField,
  raw: unknown
): string | number | null {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str) return null;

  if (field.field_type === 'number') {
    const num = Number(str);
    return Number.isFinite(num) ? num : null;
  }

  return str;
}

export function validateSubmissionFields(
  fields: SiteApplicationFormField[],
  values: Record<string, unknown>
): { valid: boolean; errors: Record<string, string>; normalized: Record<string, unknown> } {
  const errors: Record<string, string> = {};
  const normalized: Record<string, unknown> = {};

  for (const field of fields) {
    const value = normalizeFieldValue(field, values[field.field_key]);

    if (field.required && (value === null || value === '')) {
      errors[field.field_key] = 'required';
      continue;
    }

    if (value === null) continue;

    if (field.field_type === 'email' && typeof value === 'string' && !isValidEmail(value)) {
      errors[field.field_key] = 'invalid_email';
      continue;
    }

    if (field.field_type === 'url' && typeof value === 'string') {
      try {
        new URL(value);
      } catch {
        errors[field.field_key] = 'invalid_url';
        continue;
      }
    }

    if (field.field_type === 'select' && typeof value === 'string') {
      const allowed = (field.options || []).map((o) => o.value);
      if (allowed.length > 0 && !allowed.includes(value)) {
        errors[field.field_key] = 'invalid_option';
        continue;
      }
    }

    normalized[field.field_key] = value;
  }

  return { valid: Object.keys(errors).length === 0, errors, normalized };
}

export function extractContactFromSubmission(
  fields: SiteApplicationFormField[],
  values: Record<string, unknown>
): { firstName: string; lastName: string; email: string; phone: string | null } {
  const byKey = (key: string) => {
    const v = values[key];
    return typeof v === 'string' ? v.trim() : v != null ? String(v).trim() : '';
  };

  const firstName =
    byKey('first_name') || byKey('firstName') || byKey('ad') || '—';
  const lastName =
    byKey('last_name') || byKey('lastName') || byKey('soyad') || '—';

  const emailField =
    fields.find((f) => f.field_type === 'email')?.field_key || 'email';
  const email = byKey(emailField).toLowerCase() || 'unknown@myunilab.net';

  const phoneField =
    fields.find((f) => f.field_type === 'tel')?.field_key || 'phone';
  const phone = byKey(phoneField) || null;

  return { firstName, lastName, email, phone };
}
