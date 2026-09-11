/**
 * Parse public / unlisted Vimeo URLs into id + privacy hash.
 * Supports:
 * - https://vimeo.com/123456789
 * - https://vimeo.com/123456789/abcdef12
 * - https://player.vimeo.com/video/123456789?h=abcdef12
 * - https://vimeo.com/channels/.../123456789
 */

export type ParsedVimeoUrl = {
  vimeoId: string;
  vimeoHash: string | null;
};

/** Reject numeric / id-as-hash values stored by older buggy saves. */
export function normalizeVimeoHash(
  hash: string | null | undefined,
  vimeoId?: string | null
): string | null {
  const h = String(hash || '').trim();
  if (!h) return null;
  const id = String(vimeoId || '').trim();
  if (id && h === id) return null;
  if (/^\d+$/.test(h)) return null;
  return h;
}

export function extractVimeoHashFromEmbedUrl(
  embedUrl: string | null | undefined,
  vimeoId?: string | null
): string | null {
  if (!embedUrl) return null;
  try {
    return normalizeVimeoHash(
      new URL(embedUrl).searchParams.get('h'),
      vimeoId
    );
  } catch {
    return null;
  }
}

export function parseVimeoUrl(raw: string): ParsedVimeoUrl | null {
  const url = raw.trim();
  if (!url) return null;

  let parsed: URL | null = null;
  try {
    parsed = new URL(url.includes('://') ? url : `https://${url}`);
  } catch {
    // Fall through to regex on raw string
  }

  const host = parsed?.hostname?.replace(/^www\./, '') || '';
  const path = parsed?.pathname || url;
  const queryHash = parsed
    ? normalizeVimeoHash(parsed.searchParams.get('h'))
    : null;

  const patterns: RegExp[] = [
    /(?:player\.)?vimeo\.com\/video\/(\d+)(?:\/([a-zA-Z0-9]+))?/i,
    /vimeo\.com\/channels\/[^/]+\/(\d+)/i,
    /vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/i,
    /vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/i,
  ];

  const haystack = host ? `${host}${path}` : url;
  for (const pattern of patterns) {
    const match = haystack.match(pattern);
    if (!match?.[1]) continue;
    const vimeoId = match[1];
    const pathHash = normalizeVimeoHash(match[2], vimeoId);
    return {
      vimeoId,
      vimeoHash: queryHash || pathHash,
    };
  }

  return null;
}

/** Vimeo API path segment: `id` or `id:hash` for unlisted videos. */
export function toVimeoApiIdentifier(
  vimeoId: string,
  vimeoHash?: string | null
): string {
  const hash = normalizeVimeoHash(vimeoHash, vimeoId);
  return hash ? `${vimeoId}:${hash}` : vimeoId;
}
