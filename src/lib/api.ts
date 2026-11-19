import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from './db';
import { randomToken, sha256 } from './crypto';
import { rateLimit } from './ratelimit';
import { decryptSecret } from './crypto';

export const API_KEY_PREFIX = 'dd_live_';
const RATE_LIMIT = 60; // requests per minute per key

export function newApiKey() {
  const key = API_KEY_PREFIX + randomToken(20); // 40 hex chars after the prefix
  return { key, hash: sha256(key), prefix: key.slice(0, API_KEY_PREFIX.length + 6) };
}

export const toNaira = (kobo: number) => Math.round(kobo) / 100;

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function fail(status: number, code: string, message: string, extra?: Record<string, string>) {
  return NextResponse.json({ success: false, error: { code, message } }, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
}

/**
 * Checks the `Authorization: Bearer dd_live_…` header.
 * Returns the user, or a ready-made error response.
 */
export async function authenticate(req: NextRequest) {
  const header = req.headers.get('authorization') ?? '';
  const key = header.startsWith('Bearer ') ? header.slice(7).trim() : (req.headers.get('x-api-key') ?? '').trim();
  if (!key) return { error: fail(401, 'missing_api_key', 'Send your API key as: Authorization: Bearer dd_live_…') };
  if (!key.startsWith(API_KEY_PREFIX)) return { error: fail(401, 'invalid_api_key', 'That API key is not valid.') };

  if (!rateLimit(`api:${sha256(key)}`, RATE_LIMIT, 60 * 1000)) {
    return { error: fail(429, 'rate_limited', `Too many requests. The limit is ${RATE_LIMIT} per minute.`, { 'Retry-After': '60' }) };
  }

  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: sha256(key) }, include: { user: true } });
  if (!apiKey || apiKey.revokedAt) return { error: fail(401, 'invalid_api_key', 'That API key is not valid or has been revoked.') };
  if (apiKey.user.banned) return { error: fail(403, 'account_suspended', 'This account has been suspended. Contact support.') };

  // Don't write on every request: update "last used" at most once a minute.
  if (!apiKey.lastUsedAt || Date.now() - apiKey.lastUsedAt.getTime() > 60_000) {
    await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
  }
  return { user: apiKey.user };
}

type OrderWithRelations = {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
  listing: { id: string; title: string; platform: string };
  credential: { login: string; secretEnc: string };
};

/** Shapes an order for API output, including the decrypted login (except for refunded orders). */
export function serializeOrder(o: OrderWithRelations) {
  const refunded = o.status === 'REFUNDED';
  const secret = refunded ? null : decryptSecret(o.credential.secretEnc);
  return {
    id: o.id,
    product: { id: o.listing.id, title: o.listing.title, platform: o.listing.platform },
    price: toNaira(o.amount),
    status: o.status.toLowerCase(),
    created_at: o.createdAt.toISOString(),
    credential: secret ? { login: o.credential.login, password: secret.password, notes: secret.notes ?? '' } : null,
  };
}

export const orderInclude = {
  listing: { select: { id: true, title: true, platform: true } },
  credential: { select: { login: true, secretEnc: true } },
} as const;
