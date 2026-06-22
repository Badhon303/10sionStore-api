import * as crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || '';
  // Accept 32-char raw key or 64-char hex
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  return crypto.createHash('sha256').update(key).digest();
}

/** Encrypt a JSON-serialisable value to a compact string (iv:tag:ciphertext, base64). */
export function encryptJson(value: unknown): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join(':');
}

/** Decrypt a string produced by encryptJson back into its original value. */
export function decryptJson<T = any>(payload: string): T {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = payload.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8')) as T;
}
