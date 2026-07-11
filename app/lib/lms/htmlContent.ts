export function sanitizeHtml(htmlString: string): string {
  if (!htmlString) return '';

  let sanitized = htmlString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*'[^']*'/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  return sanitized;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function normalizeDescriptionForStorage(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return sanitizeHtml(trimmed);
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return paragraphs
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function plainTextFromHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
