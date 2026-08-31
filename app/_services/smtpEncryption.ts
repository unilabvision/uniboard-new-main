import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const HEX_KEY_RE = /^[0-9a-fA-F]{64}$/;
/** Packed blob: orgv1.<wrappedProtectionKeyB64>.<ciphertextB64> */
const ORG_BLOB_PREFIX = 'orgv1.';
/**
 * App-level wrap pepper (not MyUNI EMAIL_* / SMTP_ENCRYPTION_KEY).
 * Only wraps the org's panel protection key so we don't need a server env var.
 */
const ORG_WRAP_PEPPER = 'uniboard-org-smtp-protection-v1';

function keyFromSecret(secret: string): Buffer {
  const raw = secret.trim();
  if (HEX_KEY_RE.test(raw)) return Buffer.from(raw, 'hex');
  return createHash('sha256').update(raw, 'utf8').digest();
}

function wrapMasterKey(orgId: string): Buffer {
  return createHash('sha256').update(`${ORG_WRAP_PEPPER}:${orgId}`, 'utf8').digest();
}

function aesEncrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function aesDecrypt(encoded: string, key: Buffer): string {
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

/** Legacy: server env SMTP_ENCRYPTION_KEY (MyUNI mail stack ile karışmasın diye artık panel anahtarı tercih edilir). */
function getEnvKey(): Buffer {
  const raw = (process.env.SMTP_ENCRYPTION_KEY || '').trim();
  if (!raw) {
    throw new Error(
      'Kurum koruma anahtarı gerekli. E-posta Ayarları formundaki “Veri koruma anahtarı” alanını doldurun.'
    );
  }
  return keyFromSecret(raw);
}

export function isOrgSmtpBlob(encoded: string | null | undefined): boolean {
  return typeof encoded === 'string' && encoded.startsWith(ORG_BLOB_PREFIX);
}

export function hasStoredOrgProtectionKey(encoded: string | null | undefined): boolean {
  return isOrgSmtpBlob(encoded);
}

/**
 * Encrypt SMTP password with an org protection key entered in the panel.
 * Stores a self-contained blob (no SMTP_ENCRYPTION_KEY env required).
 */
export function encryptSmtpPasswordWithOrgKey(
  plaintext: string,
  protectionKey: string,
  orgId: string
): string {
  const key = String(protectionKey || '').trim();
  if (key.length < 8) {
    throw new Error('Veri koruma anahtarı en az 8 karakter olmalı.');
  }
  if (!orgId) {
    throw new Error('Organizasyon kimliği eksik.');
  }
  const wrappedKey = aesEncrypt(key, wrapMasterKey(orgId));
  const ciphertext = aesEncrypt(plaintext, keyFromSecret(key));
  return `${ORG_BLOB_PREFIX}${wrappedKey}.${ciphertext}`;
}

/** Decrypt orgv1 blob → SMTP password plaintext. */
export function decryptSmtpPasswordWithOrgBlob(encoded: string, orgId: string): string {
  if (!isOrgSmtpBlob(encoded)) {
    throw new Error('Beklenen kurum şifreleme formatı değil.');
  }
  const rest = encoded.slice(ORG_BLOB_PREFIX.length);
  const dot = rest.indexOf('.');
  if (dot <= 0) {
    throw new Error('Kayıtlı SMTP şifresi bozuk. Lütfen tekrar kaydedin.');
  }
  const wrappedKey = rest.slice(0, dot);
  const ciphertext = rest.slice(dot + 1);
  const protectionKey = aesDecrypt(wrappedKey, wrapMasterKey(orgId));
  return aesDecrypt(ciphertext, keyFromSecret(protectionKey));
}

/** Read protection key back from orgv1 blob (for re-encrypt / keep-same-key flows). */
export function unwrapOrgProtectionKey(encoded: string, orgId: string): string {
  if (!isOrgSmtpBlob(encoded)) {
    throw new Error('Kayıtlı koruma anahtarı yok. Formdaki alanı doldurun.');
  }
  const rest = encoded.slice(ORG_BLOB_PREFIX.length);
  const dot = rest.indexOf('.');
  if (dot <= 0) throw new Error('Kayıtlı koruma anahtarı bozuk.');
  return aesDecrypt(rest.slice(0, dot), wrapMasterKey(orgId));
}

/**
 * Legacy env-based encrypt (kept for old rows only).
 * @deprecated Prefer encryptSmtpPasswordWithOrgKey
 */
export function encryptSmtpPassword(plaintext: string): string {
  return aesEncrypt(plaintext, getEnvKey());
}

/**
 * Decrypt stored SMTP password.
 * Supports org panel keys (orgv1…) and legacy SMTP_ENCRYPTION_KEY blobs.
 */
export function decryptSmtpPassword(encoded: string, orgId?: string | null): string {
  if (!encoded || typeof encoded !== 'string') {
    throw new Error('Kayıtlı SMTP şifresi okunamadı. Lütfen şifreyi yeniden kaydedin.');
  }
  if (isOrgSmtpBlob(encoded)) {
    if (!orgId) {
      throw new Error('Organizasyon kimliği olmadan SMTP şifresi çözülemez.');
    }
    return decryptSmtpPasswordWithOrgBlob(encoded, orgId);
  }
  return aesDecrypt(encoded, getEnvKey());
}

/** Gmail app passwords are often pasted with spaces — strip them for SMTP auth. */
export function normalizeSmtpPassword(password: string): string {
  const trimmed = String(password || '').trim();
  if (/^[a-zA-Z0-9]{4}(?:\s+[a-zA-Z0-9]{4}){3}$/.test(trimmed)) {
    return trimmed.replace(/\s+/g, '');
  }
  return trimmed;
}
