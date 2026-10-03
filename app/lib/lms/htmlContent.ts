export function sanitizeHtml(htmlString: string): string {
  if (!htmlString) return '';

  let sanitized = htmlString.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
  sanitized = sanitized.replace(/<script\b[^>]*\/?\s*>/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*"[^"]*"/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*'[^']*'/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]+/gi, '');
  sanitized = sanitized.replace(/\s*srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
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

function renderMarkdownInline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>');
}

export function markdownToSafeHtml(markdown: string): string {
  if (!markdown) return '';

  return markdown
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${renderMarkdownInline(heading[2])}</h${level}>`;
      }

      const lines = trimmed.split('\n');
      if (lines.every((line) => /^[-*+]\s+/.test(line))) {
        const items = lines
          .map((line) => `<li>${renderMarkdownInline(line.replace(/^[-*+]\s+/, ''))}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }

      return `<p>${lines.map(renderMarkdownInline).join('<br>')}</p>`;
    })
    .join('');
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
