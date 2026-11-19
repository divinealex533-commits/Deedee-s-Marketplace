'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { randomToken } from '@/lib/crypto';
import { initializePayment, paystackEnabled } from '@/lib/paystack';
import { rateLimit } from '@/lib/ratelimit';
import { naira } from '@/lib/format';
import type { FormState } from './types';

const MIN = 100;
const MAX = 5_000_000;

export async function startFunding(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const amount = Math.floor(Number(fd.get('amount')));

  if (!Number.isFinite(amount) || amount < MIN) return { error: `The minimum top-up is ${naira(MIN * 100)}.` };
  if (amount > MAX) return { error: `The maximum single top-up is ${naira(MAX * 100)}.` };
  if (!paystackEnabled()) return { error: 'Card payments aren’t switched on yet. Message support to fund by bank transfer.' };
  if (!rateLimit(`fund:${user.id}`, 10, 10 * 60 * 1000)) return { error: 'Too many attempts. Try again in a few minutes.' };

  const reference = `DD-${Date.now()}-${randomToken(4)}`;
  const amountKobo = amount * 100;

  await prisma.transaction.create({
    data: { userId: user.id, type: 'FUNDING', status: 'PENDING', amount: amountKobo, reference, description: 'Wallet top-up (Paystack)' },
  });

  let url: string;
  try {
    const init = await initializePayment({
      email: user.email,
      amountKobo,
      reference,
      callbackUrl: `${process.env.APP_URL}/api/paystack/callback`,
    });
    url = init.authorization_url;
  } catch (e) {
    await prisma.transaction.update({ where: { reference }, data: { status: 'FAILED' } });
    return { error: e instanceof Error ? e.message : 'Could not start the payment. Try again.' };
  }
  redirect(url);
}
