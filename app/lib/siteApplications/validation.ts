import type { SiteApplicationFormField } from '@/app/types/siteApplicationForms';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseCheckboxValue(raw: unknown): string[] | null {
  if (raw === null || raw === undefined) return null;
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim()).filter(Boolean);
  }
  const str = String(raw).trim();
  if (!str) return null;
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v).trim()).filter(Boolean);
    }
  } catch {
    // comma-separated fallback
  }
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function normalizeFieldValue(
  field: SiteApplicationFormField,
  raw: unknown
): string | number | string[] | null {
  if (field.field_type === 'checkbox') {
    const list = parseCheckboxValue(raw);
    return list && list.length > 0 ? list : null;
  }

  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str) return null;

  if (field.field_type === 'number' || field.field_type === 'linear_scale' || field.field_type === 'rating') {
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

    if (field.required && (value === null || value === '' || (Array.isArray(value) && value.length === 0))) {
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
        const candidate =
          value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
        new URL(candidate);
      } catch {
        errors[field.field_key] = 'invalid_url';
        continue;
      }
    }

    if (
      (field.field_type === 'select' ||
        field.field_type === 'dropdown' ||
        field.field_type === 'linear_scale' ||
        field.field_type === 'rating') &&
      (typeof value === 'string' || typeof value === 'number')
    ) {
      const allowed = (field.options || []).map((o) => o.value);
      const asStr = String(value);
      if (allowed.length > 0 && !allowed.includes(asStr)) {
        errors[field.field_key] = 'invalid_option';
        continue;
      }
    }

    if (field.field_type === 'checkbox' && Array.isArray(value)) {
      const allowed = new Set((field.options || []).map((o) => o.value));
      if (allowed.size > 0 && value.some((v) => !allowed.has(v))) {
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
