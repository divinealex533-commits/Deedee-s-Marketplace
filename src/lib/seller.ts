import { unstable_cache } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from './db';

type Tx = Prisma.TransactionClient;

/** Amounts in naira. Changed in Admin → Sellers. */
export type SellerConfig = { monthlyFee: number; commission: number; minWithdrawal: number };

const DEFAULT_SELLER: SellerConfig = { monthlyFee: 15000, commission: 5, minWithdrawal: 1000 };

export const PLAN_DAYS = 30;

export const getSellerConfig = unstable_cache(
  async (): Promise<SellerConfig> => {
    try {
      const row = await prisma.setting.findUnique({ where: { key: 'seller' } });
      return row ? { ...DEFAULT_SELLER, ...JSON.parse(row.value) } : DEFAULT_SELLER;
    } catch {
      return DEFAULT_SELLER;
    }
  },
  ['seller-config'],
  { tags: ['settings'], revalidate: 300 },
);

/** A seller's shop is open while their monthly plan is paid. */
export function sellerActive(u: { accountType: string; sellerUntil: Date | null }) {
  return u.accountType === 'SELLER' && !!u.sellerUntil && u.sellerUntil > new Date();
}

/**
 * Creates a PENDING earning for every new order on a seller's listing.
 * Called inside the same transaction that creates the orders, so a sale and its earning are saved together.
 */
export async function recordSellerEarnings(tx: Tx, where: Prisma.OrderWhereInput) {
  const orders = await tx.order.findMany({
    where: { ...where, earning: { is: null }, listing: { sellerId: { not: null } } },
    select: { id: true, amount: true, listingId: true, listing: { select: { sellerId: true } } },
  });
  if (!orders.length) return 0;
  const { commission } = await getSellerConfig();
  const pct = Math.min(Math.max(commission, 0), 100);
  await tx.sellerEarning.createMany({
    data: orders.map((o) => {
      const fee = Math.round((o.amount * pct) / 100);
      return { sellerId: o.listing.sellerId!, orderId: o.id, listingId: o.listingId, gross: o.amount, commission: fee, amount: o.amount - fee };
    }),
    skipDuplicates: true,
  });
  return orders.length;
}

/** When an order is refunded, the seller doesn't get paid for it. */
export async function reverseSellerEarning(tx: Tx, orderId: string) {
  const e = await tx.sellerEarning.findUnique({ where: { orderId } });
  if (!e || e.status === 'REVERSED') return;
  const r = await tx.sellerEarning.updateMany({ where: { id: e.id, status: e.status }, data: { status: 'REVERSED', reviewedAt: new Date() } });
  // Already approved: take it back out of the seller's withdrawable balance.
  if (r.count === 1 && e.status === 'APPROVED') {
    await tx.user.update({ where: { id: e.sellerId }, data: { sellerBalance: { decrement: e.amount } } });
  }
}

/** Hides listings of sellers whose plan ran out; they come back when the plan is renewed. Runs daily. */
export async function pauseExpiredSellers() {
  const r = await prisma.listing.updateMany({
    where: { active: true, sellerId: { not: null }, seller: { OR: [{ sellerUntil: null }, { sellerUntil: { lt: new Date() } }] } },
    data: { active: false, pausedExpired: true },
  });
  return r.count;
}
