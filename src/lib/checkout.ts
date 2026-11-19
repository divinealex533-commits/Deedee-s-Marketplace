import crypto from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from './db';

type Tx = Prisma.TransactionClient;

export const PAY_WINDOW_MINUTES = 60;
export const MAX_PER_CHECKOUT = 50;
const MAX_OPEN_CHECKOUTS = 3;

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid typos
export function makeReference() {
  let s = 'DD';
  for (let i = 0; i < 6; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return s;
}

type StartResult = { ok: true; id: string } | { ok: false; error: 'stock' | 'gone' | 'invalid' | 'too_many' };

/** Creates a checkout and reserves the logins so nobody else can buy them while the customer pays. */
export async function startCheckout(opts: { userId: string; listingId: string; quantity: number; ids?: string[] }): Promise<StartResult> {
  await expireCheckouts();
  const ids = [...new Set((opts.ids ?? []).filter(Boolean))].slice(0, MAX_PER_CHECKOUT);
  const qty = ids.length || Math.floor(opts.quantity);
  if (!Number.isFinite(qty) || qty < 1 || qty > MAX_PER_CHECKOUT) return { ok: false, error: 'invalid' };

  const open = await prisma.checkout.count({ where: { userId: opts.userId, status: 'AWAITING_PAYMENT' } });
  if (open >= MAX_OPEN_CHECKOUTS) return { ok: false, error: 'too_many' };

  try {
    const id = await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id: opts.listingId } });
      if (!listing || !listing.active) throw new Error('GONE');

      const picked = ids.length
        ? await tx.credential.findMany({ where: { id: { in: ids }, listingId: listing.id, status: 'AVAILABLE' }, select: { id: true } })
        : await tx.credential.findMany({ where: { listingId: listing.id, status: 'AVAILABLE' }, orderBy: { createdAt: 'asc' }, take: qty, select: { id: true } });
      if (picked.length !== qty) throw new Error('STOCK');

      const checkout = await tx.checkout.create({
        data: {
          reference: makeReference(),
          userId: opts.userId,
          listingId: listing.id,
          quantity: qty,
          unitPrice: listing.price,
          amount: listing.price * qty,
          expiresAt: new Date(Date.now() + PAY_WINDOW_MINUTES * 60 * 1000),
        },
      });
      const claim = await tx.credential.updateMany({
        where: { id: { in: picked.map((c) => c.id) }, status: 'AVAILABLE' },
        data: { status: 'RESERVED', checkoutId: checkout.id },
      });
      if (claim.count !== qty) throw new Error('STOCK');
      return checkout.id;
    });
    return { ok: true, id };
  } catch (e) {
    if (e instanceof Error && e.message === 'STOCK') return { ok: false, error: 'stock' };
    if (e instanceof Error && e.message === 'GONE') return { ok: false, error: 'gone' };
    throw e;
  }
}

/** Puts reserved logins back on sale. */
async function release(tx: Tx, checkoutId: string) {
  await tx.credential.updateMany({ where: { checkoutId, status: 'RESERVED' }, data: { status: 'AVAILABLE', checkoutId: null } });
}

/** Checkouts left unpaid past their time limit are closed and their logins released. */
export async function expireCheckouts() {
  const stale = await prisma.checkout.findMany({
    where: { status: 'AWAITING_PAYMENT', expiresAt: { lt: new Date() } },
    select: { id: true },
    take: 100,
  });
  for (const c of stale) {
    await prisma.$transaction(async (tx) => {
      const r = await tx.checkout.updateMany({ where: { id: c.id, status: 'AWAITING_PAYMENT' }, data: { status: 'EXPIRED' } });
      if (r.count) await release(tx, c.id);
    });
  }
  return stale.length;
}

export async function cancelCheckout(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const r = await tx.checkout.updateMany({ where: { id, userId, status: 'AWAITING_PAYMENT' }, data: { status: 'CANCELLED' } });
    if (r.count) await release(tx, id);
    return r.count === 1;
  });
}

/**
 * Holds logins for a checkout that lost its reservation (it expired before the receipt came in).
 * Best effort: takes whatever is in stock, up to the quantity bought.
 */
async function topUpReservation(tx: Tx, checkoutId: string, listingId: string, quantity: number) {
  const held = await tx.credential.count({ where: { checkoutId, status: 'RESERVED' } });
  const missing = quantity - held;
  if (missing <= 0) return 0;
  const free = await tx.credential.findMany({ where: { listingId, status: 'AVAILABLE' }, orderBy: { createdAt: 'asc' }, take: missing, select: { id: true } });
  if (!free.length) return 0;
  const r = await tx.credential.updateMany({ where: { id: { in: free.map((c) => c.id) }, status: 'AVAILABLE' }, data: { status: 'RESERVED', checkoutId } });
  return r.count;
}

/** Delivers the reserved logins: creates the orders and marks the logins sold. */
async function fulfil(tx: Tx, c: { id: string; userId: string; listingId: string; unitPrice: number; quantity: number }) {
  await topUpReservation(tx, c.id, c.listingId, c.quantity);
  const creds = await tx.credential.findMany({ where: { checkoutId: c.id, status: 'RESERVED' }, select: { id: true }, take: c.quantity });
  if (creds.length < c.quantity) {
    const short = c.quantity - creds.length;
    throw new Error(`Not enough stock to deliver this order: add ${short} more login${short === 1 ? '' : 's'} to this product, then approve again.`);
  }
  await tx.credential.updateMany({ where: { id: { in: creds.map((x) => x.id) } }, data: { status: 'SOLD' } });
  await tx.order.createMany({
    data: creds.map((x) => ({ userId: c.userId, listingId: c.listingId, credentialId: x.id, amount: c.unitPrice, checkoutId: c.id })),
  });
  return creds.length;
}

/** A customer who paid after the timer ran out can still send their receipt for this long. */
export const LATE_RECEIPT_HOURS = 48;

/** Expired checkouts, and rejected ones (e.g. "screenshot unclear"), can take a new receipt for a while. */
export function canResendReceipt(c: { status: string; expiresAt: Date; reviewedAt: Date | null }) {
  const limit = LATE_RECEIPT_HOURS * 3600 * 1000;
  if (c.status === 'EXPIRED') return Date.now() - c.expiresAt.getTime() < limit;
  if (c.status === 'REJECTED') return Date.now() - (c.reviewedAt ?? c.expiresAt).getTime() < limit;
  return false;
}

/** Moves a checkout to "under review" with the customer's receipt, re-holding stock if it had expired. */
export async function attachReceipt(userId: string, id: string, data: { bankAccountId: string | null; senderName: string; proof: Uint8Array<ArrayBuffer>; proofType: string }) {
  return prisma.$transaction(async (tx) => {
    const c = await tx.checkout.findFirst({ where: { id, userId } });
    if (!c) return { ok: false as const, error: 'Checkout not found.' };
    const lateOk = canResendReceipt(c);
    const onTime = c.status === 'AWAITING_PAYMENT';
    if (!onTime && !lateOk) return { ok: false as const, error: 'This checkout is no longer waiting for payment. If you already paid, message us on WhatsApp with your reference.' };
    const r = await tx.checkout.updateMany({
      where: { id, status: c.status },
      data: { status: 'UNDER_REVIEW', bankAccountId: data.bankAccountId, senderName: data.senderName, proof: data.proof, proofType: data.proofType, paidAt: new Date() },
    });
    if (r.count !== 1) return { ok: false as const, error: 'This checkout just changed. Refresh the page and try again.' };
    if (lateOk) await topUpReservation(tx, c.id, c.listingId, c.quantity);
    return { ok: true as const };
  });
}

/** Admin confirms the money arrived. Works for checkouts with or without an uploaded receipt. */
export async function approveCheckout(id: string) {
  return prisma.$transaction(async (tx) => {
    const c = await tx.checkout.findUnique({ where: { id } });
    if (!c) return { ok: false as const, error: 'Not found.' };
    const claim = await tx.checkout.updateMany({
      where: { id, status: { in: ['UNDER_REVIEW', 'AWAITING_PAYMENT', 'EXPIRED'] } },
      data: { status: 'COMPLETED', reviewedAt: new Date(), paidAt: c.paidAt ?? new Date() },
    });
    if (claim.count !== 1) return { ok: false as const, error: 'This payment was already handled.' };
    const delivered = await fulfil(tx, c);
    return { ok: true as const, delivered };
  });
}

export async function rejectCheckout(id: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const r = await tx.checkout.updateMany({
      where: { id, status: { in: ['UNDER_REVIEW', 'AWAITING_PAYMENT', 'EXPIRED'] } },
      data: { status: 'REJECTED', rejectReason: reason, reviewedAt: new Date() },
    });
    if (r.count) await release(tx, id);
    return r.count === 1;
  });
}

/** Pay a checkout from the wallet balance instead of a transfer: instant delivery. */
export async function payCheckoutWithWallet(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const c = await tx.checkout.findFirst({ where: { id, userId, status: 'AWAITING_PAYMENT' } });
    if (!c || c.expiresAt < new Date()) return { ok: false as const, error: 'This checkout has ended. Please start again.' };
    const debit = await tx.user.updateMany({ where: { id: userId, balance: { gte: c.amount } }, data: { balance: { decrement: c.amount } } });
    if (debit.count !== 1) return { ok: false as const, error: 'Your wallet balance is too low for this order.' };
    const claim = await tx.checkout.updateMany({ where: { id, status: 'AWAITING_PAYMENT' }, data: { status: 'COMPLETED', paidAt: new Date(), reviewedAt: new Date() } });
    if (claim.count !== 1) throw new Error('This checkout was already paid.');
    const listing = await tx.listing.findUniqueOrThrow({ where: { id: c.listingId }, select: { title: true } });
    await tx.transaction.create({
      data: { userId, type: 'PURCHASE', amount: -c.amount, description: `Bought ${c.quantity} × ${listing.title}` },
    });
    await fulfil(tx, c);
    return { ok: true as const };
  });
}
