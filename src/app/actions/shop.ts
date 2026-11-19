'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { decryptSecret } from '@/lib/crypto';
import { rateLimit } from '@/lib/ratelimit';

class StockError extends Error {}

const MAX_PER_ORDER = 50;

/**
 * Buys one or more logins from a listing.
 * - Pick specific ones with `ids` (checkboxes on the product page), or
 * - just a quantity with `qty` (oldest first).
 * Everything happens in one transaction: the wallet is only charged if every login is secured.
 */
export async function buy(fd: FormData) {
  const user = await requireUser();
  const listingId = String(fd.get('listingId') ?? '');
  const back = `/dashboard/marketplace/${listingId}`;
  if (!rateLimit(`buy:${user.id}`, 20, 60 * 1000)) redirect(`${back}?error=slow`);

  const ids = [...new Set(fd.getAll('ids').map(String).filter(Boolean))].slice(0, MAX_PER_ORDER);
  const qty = ids.length || Math.min(MAX_PER_ORDER, Math.max(1, Math.floor(Number(fd.get('qty')) || 1)));

  let result: 'ok' | 'funds' | 'stock' | 'gone';
  try {
    result = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id: listingId } });
      if (!listing || !listing.active) return 'gone' as const;
      const total = listing.price * qty;

      // Take the money only if the balance covers it (atomic check-and-update).
      const debit = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: total } },
        data: { balance: { decrement: total } },
      });
      if (debit.count !== 1) return 'funds' as const;

      const picked = ids.length
        ? await tx.credential.findMany({ where: { id: { in: ids }, listingId, status: 'AVAILABLE' }, select: { id: true } })
        : await tx.credential.findMany({ where: { listingId, status: 'AVAILABLE' }, orderBy: { createdAt: 'asc' }, take: qty, select: { id: true } });
      if (picked.length !== qty) throw new StockError();
      const credIds = picked.map((c) => c.id);

      // The status check stops two buyers getting the same login; a mismatch rolls everything back.
      const claim = await tx.credential.updateMany({ where: { id: { in: credIds }, status: 'AVAILABLE' }, data: { status: 'SOLD' } });
      if (claim.count !== qty) throw new StockError();

      await tx.order.createMany({
        data: credIds.map((credentialId) => ({ userId: user.id, listingId, credentialId, amount: listing.price })),
      });
      await tx.transaction.create({
        data: { userId: user.id, type: 'PURCHASE', amount: -total, description: `Bought ${qty} × ${listing.title}` },
      });
      return 'ok' as const;
    });
  } catch (e) {
    if (e instanceof StockError) result = 'stock';
    else throw e;
  }

  revalidatePath('/dashboard', 'layout');
  if (result === 'ok') redirect(`/dashboard?bought=${qty}`);
  redirect(`${back}?error=${result}`);
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
