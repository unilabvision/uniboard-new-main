const MEBIBYTE = 1024 * 1024;

export const MAX_HTML_SOURCE_BYTES = 10 * MEBIBYTE;
export const MAX_NOTE_REQUEST_BYTES = 4 * MEBIBYTE;

export function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function formatFileSize(bytes: number): string {
  return `${(bytes / MEBIBYTE).toFixed(2)} MB`;
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
