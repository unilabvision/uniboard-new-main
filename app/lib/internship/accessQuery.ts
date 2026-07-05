/** Clerk spotlight — yalnızca isim veya e-posta (string) */
const SEARCH_QUERY_RE = /^[\p{L}\p{M}\s@.\-_']{2,120}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidAccessSearchQuery(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length < 2) return false;
  if (/^user_[a-zA-Z0-9]+$/.test(trimmed)) return false;
  if (/^[0-9a-f-]{36}$/i.test(trimmed)) return false;
  return SEARCH_QUERY_RE.test(trimmed);
}

export function isEmailQuery(query: string): boolean {
  return EMAIL_RE.test(query.trim());
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function displayClerkName(user: {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
}): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (user.username) return user.username;
  return user.emailAddresses[0]?.emailAddress || '—';
}
