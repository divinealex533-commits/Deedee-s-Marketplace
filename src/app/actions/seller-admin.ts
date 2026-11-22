'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { naira } from '@/lib/format';
import { PLAN_DAYS } from '@/lib/seller';
import type { FormState } from './types';

const DAY = 24 * 60 * 60 * 1000;

// ── Monthly plan payments ────────────────────────────

/** Confirms a seller's monthly payment: opens (or extends) their shop for 30 days and shows their paused listings again. */
export async function approveSellerPayment(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const until = await prisma.$transaction(async (tx) => {
    const claim = await tx.sellerSubscription.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'APPROVED', reviewedAt: new Date() } });
    if (claim.count !== 1) return null;
    const sub = await tx.sellerSubscription.findUniqueOrThrow({ where: { id }, select: { userId: true } });
    const u = await tx.user.findUniqueOrThrow({ where: { id: sub.userId }, select: { sellerUntil: true } });
    const from = u.sellerUntil && u.sellerUntil > new Date() ? u.sellerUntil.getTime() : Date.now();
    const next = new Date(from + PLAN_DAYS * DAY);
    await tx.user.update({ where: { id: sub.userId }, data: { sellerUntil: next, accountType: 'SELLER' } });
    await tx.listing.updateMany({ where: { sellerId: sub.userId, pausedExpired: true }, data: { active: true, pausedExpired: false } });
    return next;
  });
  revalidatePath('/admin', 'layout');
  revalidatePath('/dashboard', 'layout');
  return until
    ? { ok: `Approved. Their shop is open until ${until.toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric' })}.` }
    : { error: 'This payment was already reviewed.' };
}

export async function rejectSellerPayment(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const reason = String(fd.get('reason') ?? '').trim().slice(0, 300) || 'We couldn’t find this payment.';
  const r = await prisma.sellerSubscription.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'REJECTED', reviewNote: reason, reviewedAt: new Date() } });
  revalidatePath('/admin', 'layout');
  return r.count ? { ok: 'Rejected. The seller will see your reason.' } : { error: 'This payment was already reviewed.' };
}

// ── Earnings from sales ──────────────────────────────

/** Approves earnings so the seller can withdraw them. Takes one id, or every pending one for a seller. */
export async function approveEarnings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const sellerId = String(fd.get('sellerId') ?? '');
  const total = await prisma.$transaction(async (tx) => {
    const pending = await tx.sellerEarning.findMany({
      where: { status: 'PENDING', order: { status: { not: 'REFUNDED' } }, ...(id ? { id } : { sellerId }) },
      select: { id: true, sellerId: true, amount: true },
    });
    let sum = 0;
    for (const e of pending) {
      const claim = await tx.sellerEarning.updateMany({ where: { id: e.id, status: 'PENDING' }, data: { status: 'APPROVED', reviewedAt: new Date() } });
      if (claim.count !== 1) continue;
      await tx.user.update({ where: { id: e.sellerId }, data: { sellerBalance: { increment: e.amount } } });
      sum += e.amount;
    }
    return sum;
  });
  revalidatePath('/admin/sellers');
  return total ? { ok: `Approved ${naira(total)}. The seller can now withdraw it.` } : { error: 'Nothing left to approve here.' };
}

export async function rejectEarning(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const r = await prisma.sellerEarning.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'REVERSED', reviewedAt: new Date() } });
  revalidatePath('/admin/sellers');
  return r.count ? { ok: 'Rejected. The seller won’t be paid for this sale.' } : { error: 'This earning was already reviewed.' };
}

// ── Withdrawals ──────────────────────────────────────

export async function markWithdrawalPaid(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const r = await prisma.withdrawal.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'PAID', reviewedAt: new Date() } });
  revalidatePath('/admin/sellers');
  return r.count ? { ok: 'Marked as paid.' } : { error: 'This withdrawal was already handled.' };
}

/** Rejecting puts the money back in the seller's available earnings. */
export async function rejectWithdrawal(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const reason = String(fd.get('reason') ?? '').trim().slice(0, 300) || 'Please check your bank details.';
  const done = await prisma.$transaction(async (tx) => {
    const w = await tx.withdrawal.findUnique({ where: { id } });
    if (!w) return false;
    const r = await tx.withdrawal.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'REJECTED', reviewNote: reason, reviewedAt: new Date() } });
    if (r.count !== 1) return false;
    await tx.user.update({ where: { id: w.sellerId }, data: { sellerBalance: { increment: w.amount } } });
    return true;
  });
  revalidatePath('/admin/sellers');
  return done ? { ok: 'Rejected. The money is back in the seller’s earnings.' } : { error: 'This withdrawal was already handled.' };
}

// ── Settings ─────────────────────────────────────────

export async function saveSellerConfig(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const monthlyFee = Number(fd.get('monthlyFee'));
  const commission = Number(fd.get('commission'));
  const minWithdrawal = Number(fd.get('minWithdrawal'));
  if (!Number.isFinite(monthlyFee) || monthlyFee < 0) return { error: 'Enter the monthly fee.' };
  if (!Number.isFinite(commission) || commission < 0 || commission > 100) return { error: 'Commission must be between 0 and 100%.' };
  if (!Number.isFinite(minWithdrawal) || minWithdrawal < 0) return { error: 'Enter the minimum withdrawal.' };
  const value = JSON.stringify({ monthlyFee, commission, minWithdrawal });
  await prisma.setting.upsert({ where: { key: 'seller' }, create: { key: 'seller', value }, update: { value } });
  revalidateTag('settings');
  revalidatePath('/admin/sellers');
  return { ok: 'Seller settings saved.' };
}
