'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { decryptSecret } from '@/lib/crypto';
import { rateLimit } from '@/lib/ratelimit';
import { purchase } from '@/lib/purchase';

/**
 * Buys one or more logins from a listing (website "Buy now").
 * Pick specific ones with `ids` (checkboxes on the product page), or just a quantity with `qty`.
 */
export async function buy(fd: FormData) {
  const user = await requireUser();
  const listingId = String(fd.get('listingId') ?? '');
  const back = `/dashboard/marketplace/${listingId}`;
  if (!rateLimit(`buy:${user.id}`, 20, 60 * 1000)) redirect(`${back}?error=slow`);

  const result = await purchase({
    userId: user.id,
    listingId,
    ids: fd.getAll('ids').map(String),
    quantity: Number(fd.get('qty')) || 1,
    source: 'web',
  });

  revalidatePath('/dashboard', 'layout');
  if (result.ok) redirect(`/dashboard?bought=${result.quantity}`);
  redirect(`${back}?error=${result.error === 'invalid' || result.error === 'duplicate' ? 'stock' : result.error}`);
}

/** Returns the login details for one of the user's own orders. */
export async function revealOrder(orderId: string) {
  const user = await requireUser();
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id, status: { not: 'REFUNDED' } },
    include: { credential: true },
  });
  if (!order) return null;
  const secret = decryptSecret(order.credential.secretEnc);
  return { login: order.credential.login, password: secret.password, notes: secret.notes ?? '' };
}

export async function confirmOrder(fd: FormData) {
  const user = await requireUser();
  await prisma.order.updateMany({
    where: { id: String(fd.get('orderId')), userId: user.id, status: 'ESCROW' },
    data: { status: 'COMPLETED', confirmedAt: new Date() },
  });
  revalidatePath('/dashboard');
}

export async function disputeOrder(fd: FormData) {
  const user = await requireUser();
  await prisma.order.updateMany({
    where: { id: String(fd.get('orderId')), userId: user.id, status: 'ESCROW' },
    data: { status: 'DISPUTED' },
  });
  revalidatePath('/dashboard');
  redirect('/dashboard?disputed=1');
}
