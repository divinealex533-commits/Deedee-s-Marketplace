import crypto from 'node:crypto';
import { prisma } from './db';

const API = 'https://api.paystack.co';

function secretKey() {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error('PAYSTACK_SECRET_KEY is not set.');
  return k;
}

export const paystackEnabled = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

export async function initializePayment(opts: { email: string; amountKobo: number; reference: string; callbackUrl: string }) {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secretKey()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: opts.email,
      amount: opts.amountKobo,
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      currency: 'NGN',
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message || 'Could not start payment.');
  return json.data as { authorization_url: string; reference: string };
}

export async function verifyPayment(reference: string) {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
    cache: 'no-store',
  });
  const json = await res.json();
  if (!res.ok || !json.status) return null;
  return json.data as { status: string; amount: number; reference: string };
}

export function validWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = crypto.createHmac('sha512', secretKey()).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Credits the wallet for a successful payment. Safe to call many times for the
 * same reference (callback + webhook): money is only added once.
 */
export async function creditFunding(reference: string, paidKobo: number) {
  return prisma.$transaction(async (tx) => {
    const t = await tx.transaction.findUnique({ where: { reference } });
    if (!t || t.type !== 'FUNDING') return false;
    if (t.status === 'SUCCESS') return true;
    if (t.status !== 'PENDING') return false;

    if (paidKobo !== t.amount) {
      await tx.transaction.update({ where: { id: t.id }, data: { status: 'FAILED', description: `${t.description} (amount mismatch)` } });
      return false;
    }
    const claimed = await tx.transaction.updateMany({ where: { id: t.id, status: 'PENDING' }, data: { status: 'SUCCESS' } });
    if (claimed.count === 1) {
      await tx.user.update({ where: { id: t.userId }, data: { balance: { increment: t.amount } } });
    }
    return true;
  });
}

/** Asks Paystack about a payment and credits it if it succeeded. */
export async function verifyAndCredit(reference: string) {
  const data = await verifyPayment(reference);
  if (!data) return false;
  if (data.status === 'success') return creditFunding(reference, data.amount);
  if (data.status === 'failed' || data.status === 'abandoned') {
    await prisma.transaction.updateMany({ where: { reference, status: 'PENDING' }, data: { status: 'FAILED' } });
  }
  return false;
}
