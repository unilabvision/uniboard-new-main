const MEBIBYTE = 1024 * 1024;
const KIBIBYTE = 1024;
const GZIP_CONTENT_TYPE = 'application/vnd.myuni.note+gzip';

export const MAX_HTML_SOURCE_BYTES = 10 * MEBIBYTE;
export const MAX_NOTE_CONTENT_BYTES = 10 * MEBIBYTE;
export const MAX_NOTE_REQUEST_BYTES = 4 * MEBIBYTE;
const MAX_COMPRESSIBLE_JSON_BYTES = MAX_NOTE_CONTENT_BYTES * 2 + 64 * KIBIBYTE;

interface PreparedJsonRequest {
  body: string | Blob;
  contentType: string;
  isCompressed: boolean;
  size: number;
}

export function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function formatFileSize(bytes: number): string {
  return `${(bytes / MEBIBYTE).toFixed(2)} MB`;
}

function createGzipStream(): CompressionStream {
  const CompressionStreamApi = globalThis.CompressionStream;
  if (typeof CompressionStreamApi !== 'function') {
    throw new Error('Tarayıcınız büyük HTML içeriklerini sıkıştırmayı desteklemiyor.');
  }

  try {
    return new CompressionStreamApi('gzip');
  } catch {
    throw new Error('Tarayıcınız güvenli GZIP sıkıştırmasını başlatamadı.');
  }
}

async function gzipText(value: string): Promise<Blob> {
  const sourceSize = getUtf8ByteLength(value);
  if (sourceSize > MAX_COMPRESSIBLE_JSON_BYTES) {
    throw new Error('Sıkıştırılacak istek güvenli boyut sınırını aşıyor.');
  }

  try {
    const source = new Blob([value], { type: 'application/json;charset=utf-8' });
    const stream = source.stream().pipeThrough(createGzipStream());
    const compressed = await new Response(stream).arrayBuffer();
    const header = new Uint8Array(compressed, 0, Math.min(2, compressed.byteLength));

    if (header.length !== 2 || header[0] !== 0x1f || header[1] !== 0x8b) {
      throw new Error('Invalid GZIP output');
    }

    return new Blob([compressed], { type: GZIP_CONTENT_TYPE });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Tarayıcınız')) {
      throw error;
    }
    throw new Error('İçerik güvenli biçimde sıkıştırılamadı. Lütfen tekrar deneyin.');
  }
}

export async function prepareJsonRequest(payload: unknown): Promise<PreparedJsonRequest> {
  const json = JSON.stringify(payload);
  const jsonSize = getUtf8ByteLength(json);
  if (jsonSize <= MAX_NOTE_REQUEST_BYTES) {
    return { body: json, contentType: 'application/json', isCompressed: false, size: jsonSize };
  }

  const body = await gzipText(json);
  if (body.size > MAX_NOTE_REQUEST_BYTES) {
    throw new Error(
      `Kayıpsız sıkıştırılmış istek ${formatFileSize(body.size)}. ` +
        'Vercel sınırı için 4 MB altında olmalıdır.'
    );
  }

  return { body, contentType: GZIP_CONTENT_TYPE, isCompressed: true, size: body.size };
}

export async function minifyHtmlForUpload(html: string): Promise<string> {
  const { minify } = await import('html-minifier-terser/dist/htmlminifier.esm.bundle');

  return minify(html, {
    caseSensitive: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    keepClosingSlash: true,
    preserveLineBreaks: true,
    removeComments: true,
    removeRedundantAttributes: true,
  });
}
