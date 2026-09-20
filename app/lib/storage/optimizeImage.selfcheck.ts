import assert from 'node:assert/strict';
import sharp from 'sharp';
import { hasValidImageSignature } from './imageValidation';
import { optimizeImageForStorage } from './optimizeImage';

async function run() {
  const source = await sharp({
    create: {
      width: 2_000,
      height: 1_000,
      channels: 4,
      background: { r: 120, g: 30, b: 80, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  assert.equal(hasValidImageSignature(source, 'image/png'), true);
  assert.equal(hasValidImageSignature(source, 'image/jpeg'), false);

  const result = await optimizeImageForStorage({
    buffer: source,
    fileName: 'banner.png',
    mimeType: 'image/png',
    maxWidth: 800,
    maxHeight: 450,
  });
  const metadata = await sharp(result.buffer).metadata();

  assert.equal(result.contentType, 'image/webp');
  assert.equal(result.fileName, 'banner.webp');
  assert.ok(result.buffer.length < source.length);
  assert.ok((metadata.width || 0) <= 800);
  assert.ok((metadata.height || 0) <= 450);
}

run()
  .then(() => console.log('optimizeImage selfcheck OK'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

