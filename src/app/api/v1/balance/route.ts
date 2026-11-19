import type { NextRequest } from 'next/server';
import { authenticate, ok, toNaira } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** GET /api/v1/balance — your wallet balance. */
export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;
  return ok({ balance: toNaira(auth.user.balance), currency: 'NGN' });
}
