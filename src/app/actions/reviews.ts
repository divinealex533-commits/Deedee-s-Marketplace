'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { requireAdmin, requireUser } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
import type { FormState } from './types';

/** Customers can review a listing only if they bought from it (and weren't refunded). One review each, editable. */
export async function submitReview(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const listingId = String(fd.get('listingId') ?? '');
  const rating = Math.round(Number(fd.get('rating')));
  const comment = String(fd.get('comment') ?? '').trim().slice(0, 500);

  if (!(rating >= 1 && rating <= 5)) return { error: 'Tap the stars to choose a rating.' };
  if (!rateLimit(`review:${user.id}`, 10, 60 * 60 * 1000)) return { error: 'Please wait a little before posting again.' };

  const bought = await prisma.order.findFirst({ where: { userId: user.id, listingId, status: { not: 'REFUNDED' } }, select: { id: true } });
  if (!bought) return { error: 'You can only review items you’ve bought.' };

  await prisma.review.upsert({
    where: { userId_listingId: { userId: user.id, listingId } },
    create: { userId: user.id, listingId, rating, comment },
    update: { rating, comment },
  });
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/reviews');
  return { ok: 'Thanks for your review!' };
}

export async function toggleReviewHidden(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get('id'));
  const r = await prisma.review.findUnique({ where: { id }, select: { hidden: true } });
  if (r) await prisma.review.update({ where: { id }, data: { hidden: !r.hidden } });
  revalidatePath('/admin/reviews');
  revalidatePath('/reviews');
}

export async function deleteReview(fd: FormData) {
  await requireAdmin();
  await prisma.review.deleteMany({ where: { id: String(fd.get('id')) } });
  revalidatePath('/admin/reviews');
  revalidatePath('/reviews');
}
