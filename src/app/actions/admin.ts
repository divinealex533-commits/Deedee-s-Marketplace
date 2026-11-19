'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { decryptSecret, encryptSecret } from '@/lib/crypto';
import { naira } from '@/lib/format';
import type { FormState } from './types';

const kobo = (nairaValue: number) => Math.round(nairaValue * 100);

// ── Listings ─────────────────────────────────────────

const listingSchema = z.object({
  platform: z.string().trim().min(1, 'Choose a platform.'),
  title: z.string().trim().min(3, 'Give the listing a title.').max(120),
  description: z.string().trim().max(1000).optional().default(''),
  price: z.coerce.number().positive('Enter a price above ₦0.').max(100_000_000),
});

export async function createListing(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = listingSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const { platform, title, description, price } = parsed.data;
  await prisma.listing.create({ data: { platform, title, description, price: kobo(price) } });
  revalidatePath('/admin/credentials');
  return { ok: `Listing “${title}” created. Now add credentials to it.` };
}

export async function updateListing(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get('id'));
  const price = Number(fd.get('price'));
  const data: { price?: number; active?: boolean } = {};
  if (Number.isFinite(price) && price > 0) data.price = kobo(price);
  if (fd.has('active')) data.active = fd.get('active') === 'true';
  await prisma.listing.update({ where: { id }, data });
  revalidatePath('/admin/credentials');
}

// ── Credentials pool ─────────────────────────────────

export async function addCredential(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const listingId = String(fd.get('listingId') ?? '');
  const login = String(fd.get('login') ?? '').trim();
  const password = String(fd.get('password') ?? '');
  const notes = String(fd.get('notes') ?? '').trim();

  if (!listingId) return { error: 'Choose which listing this credential belongs to.' };
  if (!login || !password) return { error: 'Enter both the login and the password.' };

  const dup = await prisma.credential.findFirst({ where: { listingId, login } });
  if (dup) return { error: `“${login}” is already in this listing.` };

  await prisma.credential.create({ data: { listingId, login, secretEnc: encryptSecret({ password, notes }) } });
  revalidatePath('/admin', 'layout');
  return { ok: `Added “${login}” to the pool.` };
}

/**
 * Bulk format, one per line:  login:password  or  login:password:notes
 * Also accepts | or a tab as the separator (handy when pasting from a spreadsheet).
 */
export async function addBulk(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const listingId = String(fd.get('listingId') ?? '');
  const text = String(fd.get('text') ?? '');
  if (!listingId) return { error: 'Choose which listing these credentials belong to.' };

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { error: 'Paste at least one line.' };
  if (lines.length > 5000) return { error: 'Add at most 5,000 lines at a time.' };

  const existing = new Set(
    (await prisma.credential.findMany({ where: { listingId }, select: { login: true } })).map((c) => c.login),
  );

  const rows: { listingId: string; login: string; secretEnc: string }[] = [];
  let bad = 0;
  let dupes = 0;
  for (const line of lines) {
    const sep = line.includes('|') ? '|' : line.includes('\t') ? '\t' : ':';
    const [login, password, ...rest] = line.split(sep).map((p) => p.trim());
    if (!login || !password) {
      bad++;
      continue;
    }
    if (existing.has(login)) {
      dupes++;
      continue;
    }
    existing.add(login);
    rows.push({ listingId, login, secretEnc: encryptSecret({ password, notes: rest.join(sep).trim() }) });
  }

  if (rows.length) await prisma.credential.createMany({ data: rows });
  revalidatePath('/admin', 'layout');

  const parts = [`Added ${rows.length} credential${rows.length === 1 ? '' : 's'}.`];
  if (dupes) parts.push(`${dupes} already in the pool (skipped).`);
  if (bad) parts.push(`${bad} line${bad === 1 ? '' : 's'} not in login:password format (skipped).`);
  return rows.length ? { ok: parts.join(' ') } : { error: parts.slice(1).join(' ') || 'Nothing was added.' };
}

export async function revealCredential(id: string) {
  await requireAdmin();
  const c = await prisma.credential.findUnique({ where: { id } });
  if (!c) return null;
  const s = decryptSecret(c.secretEnc);
  return { password: s.password, notes: s.notes ?? '' };
}

export async function deleteCredential(fd: FormData) {
  await requireAdmin();
  // Sold credentials are kept so the buyer can still see what they bought.
  await prisma.credential.deleteMany({ where: { id: String(fd.get('id')), status: 'AVAILABLE' } });
  revalidatePath('/admin', 'layout');
}

// ── Orders ───────────────────────────────────────────

export async function refundOrder(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get('orderId'));
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { listing: true } });
    if (!order) return;
    const claimed = await tx.order.updateMany({
      where: { id, status: { in: ['ESCROW', 'DISPUTED'] } },
      data: { status: 'REFUNDED' },
    });
    if (claimed.count !== 1) return;
    await tx.user.update({ where: { id: order.userId }, data: { balance: { increment: order.amount } } });
    await tx.transaction.create({
      data: { userId: order.userId, type: 'REFUND', amount: order.amount, description: `Refund: ${order.listing.title}` },
    });
  });
  revalidatePath('/admin', 'layout');
}

export async function resolveOrder(fd: FormData) {
  await requireAdmin();
  await prisma.order.updateMany({
    where: { id: String(fd.get('orderId')), status: { in: ['ESCROW', 'DISPUTED'] } },
    data: { status: 'COMPLETED', confirmedAt: new Date() },
  });
  revalidatePath('/admin', 'layout');
}

// ── Users ────────────────────────────────────────────

export async function toggleBan(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get('userId'));
  if (id === admin.id) return;
  const u = await prisma.user.findUnique({ where: { id }, select: { banned: true, role: true } });
  if (!u || u.role === 'ADMIN') return;
  await prisma.user.update({ where: { id }, data: { banned: !u.banned } });
  revalidatePath('/admin/users');
}

/** For payments received outside Paystack (e.g. a bank transfer to you). */
export async function creditUser(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const userId = String(fd.get('userId') ?? '');
  const amount = Number(fd.get('amount'));
  const note = String(fd.get('note') ?? '').trim() || 'Manual top-up';
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter an amount above ₦0.' };

  const k = kobo(amount);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { balance: { increment: k } } }),
    prisma.transaction.create({ data: { userId, type: 'ADJUSTMENT', amount: k, description: note } }),
  ]);
  revalidatePath('/admin/users');
  return { ok: `${naira(k)} added.` };
}
