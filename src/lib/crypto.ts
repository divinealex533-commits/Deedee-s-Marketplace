import crypto from 'node:crypto';

function key() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY is not set.');
  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes, base64-encoded (openssl rand -base64 32).');
  return buf;
}

/** AES-256-GCM. Output: iv.tag.ciphertext (all base64). */
export function encrypt(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

export function decrypt(payload: string) {
  const [iv, tag, enc] = payload.split('.').map((s) => Buffer.from(s, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

export type Secret = { password: string; notes?: string };

export const encryptSecret = (s: Secret) => encrypt(JSON.stringify(s));
export const decryptSecret = (payload: string): Secret => JSON.parse(decrypt(payload));

export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export const randomToken = (bytes = 16) => crypto.randomBytes(bytes).toString('hex');
