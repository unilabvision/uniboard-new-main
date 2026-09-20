import sharp from 'sharp';

type OptimizeImageInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  maxWidth: number;
  maxHeight: number;
};

type OptimizedImage = {
  buffer: Buffer;
  fileName: string;
  contentType: string;
};

function webpFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  return `${base || 'image'}.webp`;
}

export async function optimizeImageForStorage({
  buffer,
  fileName,
  mimeType,
  maxWidth,
  maxHeight,
}: OptimizeImageInput): Promise<OptimizedImage> {
  if (mimeType.toLowerCase() === 'image/gif') {
    return { buffer, fileName, contentType: mimeType };
  }

  const optimized = await sharp(buffer, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  if (optimized.length >= buffer.length) {
    return { buffer, fileName, contentType: mimeType };
  }

  return {
    buffer: optimized,
    fileName: webpFileName(fileName),
    contentType: 'image/webp',
  };
}

