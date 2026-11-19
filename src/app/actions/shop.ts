'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { decryptSecret } from '@/lib/crypto';
import { rateLimit } from '@/lib/ratelimit';

class StockError extends Error {}

export async function buy(fd: FormData) {
  const user = await requireUser();
  const listingId = String(fd.get('listingId') ?? '');
  if (!rateLimit(`buy:${user.id}`, 20, 60 * 1000)) redirect('/dashboard/marketplace?error=slow');

  let result: 'ok' | 'funds' | 'stock' | 'gone';
  try {
    result = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id: listingId } });
      if (!listing || !listing.active) return 'gone' as const;

      // Take the money only if the balance covers it (atomic check-and-update).
      const debit = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: listing.price } },
        data: { balance: { decrement: listing.price } },
      });
      if (debit.count !== 1) return 'funds' as const;

      // Claim the oldest available login. The status check stops two buyers getting the same one.
      const cred = await tx.credential.findFirst({
        where: { listingId, status: 'AVAILABLE' },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (!cred) throw new StockError();
      const claim = await tx.credential.updateMany({ where: { id: cred.id, status: 'AVAILABLE' }, data: { status: 'SOLD' } });
      if (claim.count !== 1) throw new StockError(); // rolls back the debit

      await tx.order.create({ data: { userId: user.id, listingId, credentialId: cred.id, amount: listing.price } });
      await tx.transaction.create({
        data: { userId: user.id, type: 'PURCHASE', amount: -listing.price, description: `Bought: ${listing.title}` },
      });
      return 'ok' as const;
    });
  } catch (e) {
    if (e instanceof StockError) result = 'stock';
    else throw e;
  }

  revalidatePath('/dashboard', 'layout');
  if (result === 'ok') redirect('/dashboard?bought=1');
  redirect(`/dashboard/marketplace?error=${result}`);
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
