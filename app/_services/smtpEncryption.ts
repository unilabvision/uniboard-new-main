import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const HEX_KEY_RE = /^[0-9a-fA-F]{64}$/;

/**
 * AES-256 key from env.
 * Prefers 64-char hex; otherwise SHA-256 derives a stable 32-byte key from any secret
 * (avoids cryptic "pattern" / invalid key length errors from malformed env values).
 */
function getKey(): Buffer {
  const raw = (process.env.SMTP_ENCRYPTION_KEY || '').trim();
  if (!raw) {
    throw new Error(
      'SMTP_ENCRYPTION_KEY sunucuda tanımlı değil. Lütfen yöneticiye bildirin (64 karakter hex veya herhangi bir gizli anahtar).'
    );
  }
  if (HEX_KEY_RE.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  return createHash('sha256').update(raw, 'utf8').digest();
}

export function encryptSmtpPassword(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSmtpPassword(encoded: string): string {
  if (!encoded || typeof encoded !== 'string') {
    throw new Error('Kayıtlı SMTP şifresi okunamadı. Lütfen şifreyi yeniden kaydedin.');
  }
  const key = getKey();
  const buf = Buffer.from(encoded, 'base64');
  if (buf.length <= IV_LENGTH + TAG_LENGTH) {
    throw new Error('Kayıtlı SMTP şifresi bozuk. Lütfen şifreyi yeniden kaydedin.');
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/** Gmail app passwords are often pasted with spaces — strip them for SMTP auth. */
export function normalizeSmtpPassword(password: string): string {
  const trimmed = String(password || '').trim();
  // 16-char app password with optional spaces: "abcd efgh ijkl mnop"
  if (/^[a-zA-Z0-9]{4}(?:\s+[a-zA-Z0-9]{4}){3}$/.test(trimmed)) {
    return trimmed.replace(/\s+/g, '');
  }
  return trimmed;
}
