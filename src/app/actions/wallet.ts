'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
import { naira } from '@/lib/format';
import { imageType } from '@/lib/image';
import type { FormState } from './types';

const MIN = 100;
const MAX = 10_000_000;
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_PENDING = 5;

export async function submitDeposit(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!rateLimit(`deposit:${user.id}`, 10, 60 * 60 * 1000)) {
    return { error: 'You’ve sent several payment proofs. Wait a while, or message support.' };
  }

  const amount = Math.floor(Number(fd.get('amount')));
  const bankAccountId = String(fd.get('bankAccountId') ?? '');
  const senderName = String(fd.get('senderName') ?? '').trim().slice(0, 100);
  const note = String(fd.get('note') ?? '').trim().slice(0, 300);
  const file = fd.get('proof');

  if (!Number.isFinite(amount) || amount < MIN) return { error: `Enter the amount you sent (at least ${naira(MIN * 100)}).` };
  if (amount > MAX) return { error: `For amounts above ${naira(MAX * 100)}, please contact support.` };
  if (!senderName) return { error: 'Enter the name on the account you paid from.' };
  if (!(file instanceof File) || file.size === 0) return { error: 'Attach a screenshot of your transfer receipt.' };
  if (file.size > MAX_BYTES) return { error: 'That image is too large. Use a screenshot under 4 MB.' };

  const bank = await prisma.bankAccount.findFirst({ where: { id: bankAccountId, active: true } });
  if (!bank) return { error: 'Choose the account you paid into.' };

  const pending = await prisma.deposit.count({ where: { userId: user.id, status: 'PENDING' } });
  if (pending >= MAX_PENDING) return { error: 'You already have several payments waiting for review. We’ll get to them shortly.' };

  const buf = Buffer.from(await file.arrayBuffer());
  const type = imageType(buf);
  if (!type) return { error: 'The receipt must be a JPG, PNG or WebP image.' };

  await prisma.deposit.create({
    data: {
      userId: user.id,
      bankAccountId: bank.id,
      amount: amount * 100,
      senderName,
      note,
      proof: new Uint8Array(buf),
      proofType: type,
    },
  });

  revalidatePath('/dashboard/wallet');
  return { ok: `Thanks! We’ve received your proof for ${naira(amount * 100)}. Your wallet will be credited once we confirm it, usually within minutes.` };
}
