'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { encryptSecret } from '@/lib/crypto';
import { naira } from '@/lib/format';
import { imageType, readImage } from '@/lib/image';
import { rateLimit } from '@/lib/ratelimit';
import { getSellerConfig, sellerActive } from '@/lib/seller';
import { announceStock } from '@/lib/telegram';
import type { FormState } from './types';

const kobo = (n: number) => Math.round(n * 100);

async function requireSeller() {
  const user = await requireUser();
  if (user.accountType !== 'SELLER') throw new Error('Only seller accounts can do this.');
  return user;
}

/** Lets an existing buyer account start selling. */
export async function becomeSeller(_: FormState): Promise<FormState> {
  const user = await requireUser();
  if (user.role === 'ADMIN') return { error: 'Admin accounts can’t be sellers.' };
  await prisma.user.update({ where: { id: user.id }, data: { accountType: 'SELLER' } });
  revalidatePath('/dashboard', 'layout');
  return { ok: 'You’re now a seller. Pay your monthly plan below to open your shop.' };
}

// ── Monthly plan payment ─────────────────────────────

export async function submitSellerPayment(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireSeller();
  if (!rateLimit(`seller-pay:${user.id}`, 10, 60 * 60 * 1000)) return { error: 'You’ve sent several receipts. Wait a while, or message support.' };

  const bankAccountId = String(fd.get('bankAccountId') ?? '');
  const senderName = String(fd.get('senderName') ?? '').trim().slice(0, 100);
  const file = fd.get('proof');
  if (!senderName) return { error: 'Enter the name on the account you paid from.' };
  if (!(file instanceof File) || file.size === 0) return { error: 'Attach a screenshot of your transfer receipt.' };
  if (file.size > 4 * 1024 * 1024) return { error: 'That image is too large. Use a screenshot under 4 MB.' };

  const bank = await prisma.bankAccount.findFirst({ where: { id: bankAccountId, active: true } });
  if (!bank) return { error: 'Choose the account you paid into.' };

  const pending = await prisma.sellerSubscription.count({ where: { userId: user.id, status: 'PENDING' } });
  if (pending) return { error: 'Your last payment is still being checked. We’ll confirm it shortly.' };

  const buf = Buffer.from(await file.arrayBuffer());
  const type = imageType(buf);
  if (!type) return { error: 'The receipt must be a JPG, PNG or WebP image.' };

  const { monthlyFee } = await getSellerConfig();
  await prisma.sellerSubscription.create({
    data: { userId: user.id, bankAccountId: bank.id, amount: kobo(monthlyFee), senderName, proof: new Uint8Array(buf), proofType: type },
  });
  revalidatePath('/dashboard/seller');
  return { ok: 'Thanks! We’ve received your receipt. Your shop opens as soon as we confirm the payment.' };
}

// ── Listings ─────────────────────────────────────────

const listingSchema = z.object({
  platform: z.string().trim().min(1, 'Choose a category.').max(40, 'Keep the category under 40 characters.'),
  title: z.string().trim().min(3, 'Give the listing a title.').max(120),
  description: z.string().trim().max(1000).optional().default(''),
  price: z.coerce.number().min(100, 'The lowest price is ₦100.').max(10_000_000),
});

export async function createSellerListing(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireSeller();
  if (!sellerActive(user)) return { error: 'Your shop isn’t open yet. Pay your monthly plan first.' };
  const parsed = listingSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const count = await prisma.listing.count({ where: { sellerId: user.id } });
  if (count >= 100) return { error: 'You can have up to 100 listings. Delete old ones first.' };
  const img = await readImage(fd.get('image'), 3 * 1024 * 1024);
  if ('error' in img) return { error: img.error };

  const { platform, title, description, price } = parsed.data;
  await prisma.listing.create({
    data: {
      sellerId: user.id,
      platform,
      title,
      description,
      price: kobo(price),
      ...(img.image ? { imageAt: new Date(), image: { create: img.image } } : {}),
    },
  });
  revalidatePath('/dashboard/seller/listings');
  revalidatePath('/dashboard/marketplace');
  return { ok: `“${title}” is live. Now add the accounts you’re selling.` };
}

export async function editSellerListing(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireSeller();
  const id = String(fd.get('id') ?? '');
  const parsed = listingSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const own = await prisma.listing.findFirst({ where: { id, sellerId: user.id }, select: { id: true } });
  if (!own) return { error: 'That listing no longer exists.' };
  const wantsActive = fd.get('active') === 'on';
  if (wantsActive && !sellerActive(user)) return { error: 'Renew your monthly plan to show listings again.' };

  const { platform, title, description, price } = parsed.data;
  await prisma.listing.update({
    where: { id },
    data: { platform, title, description, price: kobo(price), active: wantsActive, pausedExpired: false },
  });
  revalidatePath('/dashboard', 'layout');
  return { ok: `Saved “${title}”.` };
}

/** One per line: login:password  or  login:password:notes  (| or tab also work). A https:// link becomes the preview. */
export async function addSellerStock(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireSeller();
  if (!sellerActive(user)) return { error: 'Renew your monthly plan to add stock.' };
  const listingId = String(fd.get('listingId') ?? '');
  const own = await prisma.listing.findFirst({ where: { id: listingId, sellerId: user.id }, select: { id: true, title: true } });
  if (!own) return { error: 'Choose one of your listings.' };

  const lines = String(fd.get('text') ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { error: 'Paste at least one line.' };
  if (lines.length > 2000) return { error: 'Add at most 2,000 lines at a time.' };

  let bad = 0;
  const rows: { listingId: string; login: string; previewUrl: string | null; secretEnc: string }[] = [];
  for (const raw of lines) {
    const link = raw.match(/https?:\/\/\S+/i)?.[0] ?? '';
    const line = link ? raw.replace(link, '').replace(/[|:\t\s]+$/, '').trim() : raw;
    const sep = line.includes('|') ? '|' : line.includes('\t') ? '\t' : ':';
    const [login, password, ...rest] = line.split(sep).map((p) => p.trim());
    if (!login || !password) { bad++; continue; }
    rows.push({ listingId, login: login.slice(0, 300), previewUrl: link ? link.slice(0, 500) : null, secretEnc: encryptSecret({ password, notes: rest.join(sep).trim().slice(0, 2000) }) });
  }
  if (rows.length) await prisma.credential.createMany({ data: rows });
  revalidatePath('/dashboard', 'layout');
  await announceStock(listingId, rows.length);
  const msg = `Added ${rows.length} to “${own.title}”.` + (bad ? ` ${bad} line${bad === 1 ? '' : 's'} skipped (not login:password).` : '');
  return rows.length ? { ok: msg } : { error: 'Nothing was added. Use one login:password per line.' };
}

/** Removes unsold stock from one of the seller's listings. */
export async function clearSellerStock(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireSeller();
  const listingId = String(fd.get('listingId') ?? '');
  const own = await prisma.listing.findFirst({ where: { id: listingId, sellerId: user.id }, select: { title: true } });
  if (!own) return { error: 'That listing no longer exists.' };
  const r = await prisma.credential.deleteMany({ where: { listingId, status: 'AVAILABLE' } });
  revalidatePath('/dashboard', 'layout');
  return { ok: `Removed ${r.count} unsold item${r.count === 1 ? '' : 's'} from “${own.title}”.` };
}

// ── Payouts ──────────────────────────────────────────

export async function savePayoutDetails(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireSeller();
  const parsed = z
    .object({
      payoutBank: z.string().trim().min(2, 'Enter your bank name.').max(60),
      payoutAccountName: z.string().trim().min(2, 'Enter the account name.').max(100),
      payoutAccountNumber: z.string().trim().regex(/^\d{10}$/, 'Account number must be 10 digits.'),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  await prisma.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath('/dashboard/seller');
  return { ok: 'Bank details saved.' };
}

export async function requestWithdrawal(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireSeller();
  if (!user.payoutBank || !user.payoutAccountName || !user.payoutAccountNumber) return { error: 'Save your bank details first.' };
  const amount = Number(fd.get('amount'));
  const { minWithdrawal } = await getSellerConfig();
  if (!Number.isFinite(amount) || amount < minWithdrawal) return { error: `The minimum withdrawal is ${naira(kobo(minWithdrawal))}.` };
  const k = kobo(amount);

  const done = await prisma.$transaction(async (tx) => {
    const pending = await tx.withdrawal.count({ where: { sellerId: user.id, status: 'PENDING' } });
    if (pending) return 'pending' as const;
    // Take it from the balance now so it can't be requested twice.
    const debit = await tx.user.updateMany({ where: { id: user.id, sellerBalance: { gte: k } }, data: { sellerBalance: { decrement: k } } });
    if (debit.count !== 1) return 'funds' as const;
    await tx.withdrawal.create({
      data: { sellerId: user.id, amount: k, bankName: user.payoutBank!, accountName: user.payoutAccountName!, accountNumber: user.payoutAccountNumber! },
    });
    return 'ok' as const;
  });
  revalidatePath('/dashboard/seller');
  if (done === 'pending') return { error: 'You already have a withdrawal waiting. We’ll pay it shortly.' };
  if (done === 'funds') return { error: 'That’s more than your available earnings.' };
  return { ok: `Withdrawal of ${naira(k)} requested. We’ll send it to ${user.payoutBank} soon.` };
}
