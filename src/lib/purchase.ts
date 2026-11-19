import { Prisma } from '@prisma/client';
import { prisma } from './db';

export const MAX_PER_ORDER = 50;

export type PurchaseResult =
  | { ok: true; orderIds: string[]; quantity: number; total: number; balance: number }
  | { ok: false; error: 'funds' | 'stock' | 'gone' | 'duplicate' | 'invalid' };

class StockError extends Error {}
class DuplicateError extends Error {}

/**
 * Buys logins from a listing for a user. Used by the website and the API.
 * - ids: specific credential ids to buy, or
 * - quantity: how many (oldest first).
 * - reference: optional unique id from an API client; the same reference can't be charged twice.
 * Everything runs in one transaction: the wallet is only charged if every login is secured.
 */
export async function purchase(opts: {
  userId: string;
  listingId: string;
  ids?: string[];
  quantity?: number;
  reference?: string;
  source?: 'web' | 'api';
}): Promise<PurchaseResult> {
  const ids = [...new Set((opts.ids ?? []).filter(Boolean))].slice(0, MAX_PER_ORDER);
  const qty = ids.length || Math.floor(opts.quantity ?? 1);
  if (!opts.listingId || !Number.isFinite(qty) || qty < 1 || qty > MAX_PER_ORDER) return { ok: false, error: 'invalid' };

  try {
    return await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id: opts.listingId } });
      if (!listing || !listing.active) return { ok: false as const, error: 'gone' as const };
      const total = listing.price * qty;

      // Charge only if the balance covers it (atomic check-and-update).
      const debit = await tx.user.updateMany({
        where: { id: opts.userId, balance: { gte: total } },
        data: { balance: { decrement: total } },
      });
      if (debit.count !== 1) return { ok: false as const, error: 'funds' as const };

      const picked = ids.length
        ? await tx.credential.findMany({ where: { id: { in: ids }, listingId: listing.id, status: 'AVAILABLE' }, select: { id: true } })
        : await tx.credential.findMany({
            where: { listingId: listing.id, status: 'AVAILABLE' },
            orderBy: { createdAt: 'asc' },
            take: qty,
            select: { id: true },
          });
      if (picked.length !== qty) throw new StockError();
      const credIds = picked.map((c) => c.id);

      // The status check stops two buyers getting the same login; a mismatch rolls everything back.
      const claim = await tx.credential.updateMany({ where: { id: { in: credIds }, status: 'AVAILABLE' }, data: { status: 'SOLD' } });
      if (claim.count !== qty) throw new StockError();

      const orders = await Promise.all(
        credIds.map((credentialId) =>
          tx.order.create({ data: { userId: opts.userId, listingId: listing.id, credentialId, amount: listing.price }, select: { id: true } }),
        ),
      );

      try {
        await tx.transaction.create({
          data: {
            userId: opts.userId,
            type: 'PURCHASE',
            amount: -total,
            description: `Bought ${qty} × ${listing.title}${opts.source === 'api' ? ' (API)' : ''}`,
            reference: opts.reference ? `API-${opts.userId}-${opts.reference}` : undefined,
          },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new DuplicateError();
        throw e;
      }

      const user = await tx.user.findUniqueOrThrow({ where: { id: opts.userId }, select: { balance: true } });
      return { ok: true as const, orderIds: orders.map((o) => o.id), quantity: qty, total, balance: user.balance };
    });
  } catch (e) {
    if (e instanceof StockError) return { ok: false, error: 'stock' };
    if (e instanceof DuplicateError) return { ok: false, error: 'duplicate' };
    throw e;
  }
}
