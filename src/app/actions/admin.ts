'use server';

import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { decryptSecret, encryptSecret } from '@/lib/crypto';
import { naira } from '@/lib/format';
import { readImage } from '@/lib/image';
import { getReferralConfig } from '@/lib/settings';
import { reverseSellerEarning } from '@/lib/seller';
import type { FormState } from './types';

const kobo = (nairaValue: number) => Math.round(nairaValue * 100);

/** Accepts only real http(s) links; returns null otherwise. */
function cleanUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

const URL_IN_LINE = /https?:\/\/\S+/i;

/** Preview can be a web link (instagram.com/page) or plain text such as a number or ID. */
function cleanPreview(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const looksLikeLink = /^https?:\/\//i.test(v) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v);
  return looksLikeLink ? cleanUrl(v) ?? v.slice(0, 300) : v.slice(0, 300);
}

// ── Listings ─────────────────────────────────────────

const listingSchema = z.object({
  platform: z.string().trim().min(1, 'Choose a category.').max(40, 'Keep the category name under 40 characters.'),
  title: z.string().trim().min(3, 'Give the listing a title.').max(120),
  description: z.string().trim().max(1000).optional().default(''),
  price: z.coerce.number().positive('Enter a price above ₦0.').max(100_000_000),
});

export async function createListing(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = listingSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const { platform, title, description, price } = parsed.data;
  const img = await readImage(fd.get('image'), 3 * 1024 * 1024);
  if ('error' in img) return { error: img.error };

  await prisma.listing.create({
    data: {
      platform,
      title,
      description,
      price: kobo(price),
      showLogin: fd.get('showLogin') === 'on',
      ...(img.image ? { imageAt: new Date(), image: { create: img.image } } : {}),
    },
  });
  revalidatePath('/admin/credentials');
  return { ok: `Listing “${title}” created. Now add credentials to it.` };
}

export async function updateListing(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get('id'));
  const price = Number(fd.get('price'));
  const data: { price?: number; active?: boolean; showLogin?: boolean } = {};
  if (Number.isFinite(price) && price > 0) data.price = kobo(price);
  if (fd.has('active')) data.active = fd.get('active') === 'true';
  if (fd.has('showLogin')) data.showLogin = fd.get('showLogin') === 'true';
  await prisma.listing.update({ where: { id }, data });
  revalidatePath('/admin/credentials');
}

/** Full edit from the Edit pop-up: name, platform, price, description, photo and visibility. */
export async function editListing(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const parsed = listingSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const { platform, title, description, price } = parsed.data;
  const img = await readImage(fd.get('image'), 3 * 1024 * 1024);
  if ('error' in img) return { error: img.error };
  const removeImage = fd.get('removeImage') === 'on';

  const found = await prisma.listing.findUnique({ where: { id }, select: { id: true } });
  if (!found) return { error: 'That listing no longer exists.' };

  await prisma.$transaction(async (tx) => {
    await tx.listing.update({
      where: { id },
      data: {
        platform,
        title,
        description,
        price: kobo(price),
        active: fd.get('active') === 'on',
        ...(img.image ? { imageAt: new Date() } : removeImage ? { imageAt: null } : {}),
      },
    });
    if (img.image) {
      await tx.listingImage.upsert({ where: { listingId: id }, create: { listingId: id, ...img.image }, update: img.image });
    } else if (removeImage) {
      await tx.listingImage.deleteMany({ where: { listingId: id } });
    }
  });
  revalidatePath('/', 'layout');
  return { ok: `Saved “${title}”.` };
}

/** Deletes a listing that has never been bought; listings with sales are hidden instead so order history stays intact. */
export async function deleteListing(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('id') ?? '');
  const l = await prisma.listing.findUnique({ where: { id }, select: { title: true, _count: { select: { orders: true, checkouts: true } } } });
  if (!l) return { error: 'That listing no longer exists.' };
  if (l._count.orders || l._count.checkouts) {
    await prisma.$transaction([
      prisma.listing.update({ where: { id }, data: { active: false } }),
      prisma.credential.deleteMany({ where: { listingId: id, status: 'AVAILABLE' } }),
    ]);
    revalidatePath('/', 'layout');
    return { ok: `“${l.title}” has past orders, so it was hidden (not deleted) and its unsold stock removed. Customers’ order history is kept.` };
  }
  await prisma.listing.delete({ where: { id } });
  revalidatePath('/', 'layout');
  return { ok: `Deleted “${l.title}”.` };
}

export async function setListingImage(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const listingId = String(fd.get('id') ?? '');
  if (fd.get('remove') === '1') {
    await prisma.listingImage.deleteMany({ where: { listingId } });
    await prisma.listing.update({ where: { id: listingId }, data: { imageAt: null } });
    revalidatePath('/admin/credentials');
    return { ok: 'Image removed.' };
  }
  const img = await readImage(fd.get('image'), 3 * 1024 * 1024);
  if ('error' in img) return { error: img.error };
  if (!img.image) return { error: 'Choose an image.' };
  await prisma.listingImage.upsert({ where: { listingId }, create: { listingId, ...img.image }, update: img.image });
  await prisma.listing.update({ where: { id: listingId }, data: { imageAt: new Date() } });
  revalidatePath('/admin/credentials');
  return { ok: 'Image updated.' };
}

// ── Credentials pool ─────────────────────────────────

/** The single form can hold several credentials ("Add another credential"); each field repeats. */
export async function addCredential(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const listingId = String(fd.get('listingId') ?? '');
  if (!listingId) return { error: 'Choose which listing these credentials belong to.' };

  const all = (k: string) => fd.getAll(k).map((v) => String(v));
  const logins = all('login'), passwords = all('password'), notesAll = all('notes'), previews = all('previewUrl');
  const rows: { login: string; password: string; notes: string; previewUrl: string | null }[] = [];
  for (let i = 0; i < logins.length; i++) {
    const login = (logins[i] ?? '').trim();
    const password = passwords[i] ?? '';
    if (!login && !password) continue; // an empty extra box is fine
    if (!login || !password) return { error: `Credential ${i + 1}: enter both the login and the password.` };
    rows.push({ login, password, notes: (notesAll[i] ?? '').trim().slice(0, 2000), previewUrl: cleanPreview(previews[i] ?? '') });
  }
  if (!rows.length) return { error: 'Enter the login and password.' };

  // No duplicate check: the same login can be added as many times as the admin wants.

  await prisma.credential.createMany({
    data: rows.map((r) => ({ listingId, login: r.login, previewUrl: r.previewUrl, secretEnc: encryptSecret({ password: r.password, notes: r.notes }) })),
  });
  revalidatePath('/admin', 'layout');
  return { ok: rows.length === 1 ? `Added “${rows[0]!.login}” to the pool.` : `Added ${rows.length} credentials to the pool.` };
}

/**
 * Bulk format, one per line:  login:password  or  login:password:notes
 * Also accepts | or a tab as the separator (handy when pasting from a spreadsheet).
 * A web link (https://…) anywhere on the line becomes that item's preview link.
 */
export async function addBulk(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const listingId = String(fd.get('listingId') ?? '');
  const text = String(fd.get('text') ?? '');
  if (!listingId) return { error: 'Choose which listing these credentials belong to.' };

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { error: 'Paste at least one line.' };
  if (lines.length > 5000) return { error: 'Add at most 5,000 lines at a time.' };

  const rows: { listingId: string; login: string; previewUrl: string | null; secretEnc: string }[] = [];
  let bad = 0;

  // The form sends the already-split rows, including any preview typed by hand for each item.
  let split: { login?: unknown; password?: unknown; notes?: unknown; preview?: unknown }[] | null = null;
  try {
    const raw = String(fd.get('rows') ?? '');
    if (raw) split = JSON.parse(raw);
  } catch {
    split = null;
  }
  if (Array.isArray(split) && split.length) {
    if (split.length > 5000) return { error: 'Add at most 5,000 at a time.' };
    for (const r of split) {
      const login = String(r.login ?? '').trim();
      const password = String(r.password ?? '');
      if (!login || !password) { bad++; continue; }
      rows.push({
        listingId,
        login,
        previewUrl: cleanPreview(String(r.preview ?? '')),
        secretEnc: encryptSecret({ password, notes: String(r.notes ?? '').trim().slice(0, 2000) }),
      });
    }
  } else for (const rawLine of lines) {
    // Pull out a preview link first (links contain ":" which would confuse the split)
    const found = rawLine.match(URL_IN_LINE)?.[0] ?? '';
    const previewUrl = found ? cleanUrl(found) : null;
    const line = found ? rawLine.replace(found, '').replace(/[|:\t\s]+$/, '').trim() : rawLine;
    const sep = line.includes('|') ? '|' : line.includes('\t') ? '\t' : ':';
    const [login, password, ...rest] = line.split(sep).map((p) => p.trim());
    if (!login || !password) {
      bad++;
      continue;
    }
    rows.push({ listingId, login, previewUrl, secretEnc: encryptSecret({ password, notes: rest.join(sep).trim() }) });
  }

  if (rows.length) await prisma.credential.createMany({ data: rows });
  revalidatePath('/admin', 'layout');

  const parts = [`Added ${rows.length} credential${rows.length === 1 ? '' : 's'}.`];
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
    await reverseSellerEarning(tx, order.id);
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

// ── Deposits (bank transfer + screenshot) ────────────

export async function approveDeposit(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('depositId') ?? '');
  const amount = Number(fd.get('amount'));
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter the amount you actually received.' };
  const k = kobo(amount);
  const ref = await getReferralConfig();

  const done = await prisma.$transaction(async (tx) => {
    // Only a PENDING deposit can be approved, so double-clicks can't credit twice.
    const claimed = await tx.deposit.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'APPROVED', approvedAmount: k, reviewedAt: new Date() },
    });
    if (claimed.count !== 1) return false;
    const d = await tx.deposit.findUniqueOrThrow({ where: { id }, include: { bankAccount: true } });
    await tx.user.update({ where: { id: d.userId }, data: { balance: { increment: k } } });
    await tx.transaction.create({
      data: {
        userId: d.userId,
        type: 'FUNDING',
        amount: k,
        reference: `DEP-${d.id}`,
        description: `Bank transfer${d.bankAccount ? ` to ${d.bankAccount.bankName}` : ''}`,
      },
    });

    // Referral reward: pay the referrer once, on this customer's first qualifying deposit.
    if (ref.enabled && ref.percent > 0 && k >= ref.minDeposit * 100) {
      const u = await tx.user.findUnique({ where: { id: d.userId }, select: { name: true, referredById: true, referralBonusPaid: true } });
      if (u?.referredById && !u.referralBonusPaid) {
        const bonus = Math.min(Math.round((k * ref.percent) / 100), ref.maxBonus * 100);
        const claim = await tx.user.updateMany({ where: { id: d.userId, referralBonusPaid: false }, data: { referralBonusPaid: true } });
        if (claim.count === 1 && bonus > 0) {
          await tx.user.update({ where: { id: u.referredById }, data: { balance: { increment: bonus } } });
          await tx.transaction.create({
            data: { userId: u.referredById, type: 'REFERRAL', amount: bonus, description: `Referral bonus: ${u.name.split(' ')[0]} funded their wallet` },
          });
        }
      }
    }
    return true;
  });

  revalidatePath('/admin', 'layout');
  return done ? { ok: `Approved. ${naira(k)} added to the customer’s wallet.` } : { error: 'This deposit was already reviewed.' };
}

export async function rejectDeposit(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get('depositId') ?? '');
  const reason = String(fd.get('reason') ?? '').trim().slice(0, 300) || 'We couldn’t find this payment.';
  const r = await prisma.deposit.updateMany({
    where: { id, status: 'PENDING' },
    data: { status: 'REJECTED', reviewNote: reason, reviewedAt: new Date() },
  });
  revalidatePath('/admin', 'layout');
  return r.count ? { ok: 'Deposit rejected. The customer will see your reason.' } : { error: 'This deposit was already reviewed.' };
}

// ── Bank accounts customers pay into ─────────────────

export async function addBankAccount(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({
      bankName: z.string().trim().min(2, 'Enter the bank name.').max(60),
      accountName: z.string().trim().min(2, 'Enter the account name.').max(100),
      accountNumber: z.string().trim().regex(/^\d{10}$/, 'Account number must be 10 digits.'),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  await prisma.bankAccount.create({ data: parsed.data });
  revalidatePath('/admin/bank-accounts');
  revalidatePath('/dashboard/wallet');
  return { ok: `${parsed.data.bankName} account added. Customers can see it on their Wallet page now.` };
}

export async function toggleBankAccount(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get('id'));
  const b = await prisma.bankAccount.findUnique({ where: { id } });
  if (b) await prisma.bankAccount.update({ where: { id }, data: { active: !b.active } });
  revalidatePath('/admin/bank-accounts');
  revalidatePath('/dashboard/wallet');
}

export async function deleteBankAccount(fd: FormData) {
  await requireAdmin();
  await prisma.bankAccount.delete({ where: { id: String(fd.get('id')) } });
  revalidatePath('/admin/bank-accounts');
  revalidatePath('/dashboard/wallet');
}

// ── Site settings ────────────────────────────────────

export async function saveAnnouncement(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const text = String(fd.get('text') ?? '').trim().slice(0, 160);
  const rawLink = String(fd.get('link') ?? '').trim();
  const link = rawLink.startsWith('/') ? rawLink.slice(0, 300) : rawLink ? cleanUrl(rawLink) : '';
  if (rawLink && !link) return { error: 'The link must be a web address or a page path like /signup.' };
  const toneRaw = String(fd.get('tone') ?? 'accent');
  const tone = toneRaw === 'green' || toneRaw === 'amber' ? toneRaw : 'accent';
  const enabled = fd.get('enabled') === 'on';
  if (enabled && !text) return { error: 'Write the announcement text first.' };

  const value = JSON.stringify({ enabled, text, link, tone });
  await prisma.setting.upsert({ where: { key: 'announcement' }, create: { key: 'announcement', value }, update: { value } });
  revalidateTag('settings');
  return { ok: enabled ? 'Announcement is live on the site.' : 'Saved. The announcement is turned off.' };
}

/** Accepts "@name", "name" or a t.me link and keeps just the username. */
function tgUsername(raw: string) {
  const v = raw.trim().replace(/^https?:\/\/(www\.)?(t|telegram)\.me\//i, '').replace(/^@/, '').split(/[/?#]/)[0] ?? '';
  return v;
}

export async function saveTelegramConfig(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const channel = tgUsername(String(fd.get('channel') ?? ''));
  const bot = tgUsername(String(fd.get('bot') ?? ''));
  const ok = (u: string) => !u || /^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(u);
  if (!ok(channel)) return { error: 'Channel username looks wrong. Use letters, numbers and _ only, e.g. deedeesmarketplace.' };
  if (!ok(bot)) return { error: 'Bot username looks wrong. It usually ends in "bot", e.g. deedeesmarketbot.' };
  const value = JSON.stringify({ channel, bot });
  await prisma.setting.upsert({ where: { key: 'telegram' }, create: { key: 'telegram', value }, update: { value } });
  revalidateTag('settings');
  revalidatePath('/', 'layout');
  return { ok: 'Telegram links saved. They now show in the Help button and on the login, sign-up and log-out screens.' };
}

export async function saveReferralConfig(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const percent = Number(fd.get('percent'));
  const maxBonus = Number(fd.get('maxBonus'));
  const minDeposit = Number(fd.get('minDeposit'));
  if (!(percent >= 0 && percent <= 50)) return { error: 'Reward % must be between 0 and 50.' };
  if (!(maxBonus >= 0 && maxBonus <= 1_000_000)) return { error: 'Enter a sensible maximum bonus.' };
  if (!(minDeposit >= 0)) return { error: 'Enter a minimum deposit of ₦0 or more.' };
  const value = JSON.stringify({ enabled: fd.get('enabled') === 'on', percent, maxBonus, minDeposit });
  await prisma.setting.upsert({ where: { key: 'referral' }, create: { key: 'referral', value }, update: { value } });
  revalidateTag('settings');
  return { ok: 'Referral rewards saved.' };
}

export async function updateAdminName(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const name = String(fd.get('name') ?? '').trim().slice(0, 60);
  if (name.length < 2) return { error: 'Enter your name.' };
  await prisma.user.update({ where: { id: admin.id }, data: { name } });
  revalidatePath('/admin', 'layout');
  return { ok: 'Name updated.' };
}

// ── Users ────────────────────────────────────────────

/** Sets a new random password for a customer who forgot theirs. Shown to the admin once. */
export async function resetUserPassword(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const userId = String(fd.get('userId') ?? '');
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!u || u.role === 'ADMIN') return { error: 'Can’t reset this account here.' };

  // Easy to read out on WhatsApp: e.g. "Kite-4827-Moon"
  const words = ['Sun', 'Moon', 'Star', 'Kite', 'Lion', 'River', 'Cloud', 'Palm', 'Gold', 'Wave', 'Rock', 'Bird'];
  const pick = () => words[crypto.randomInt(words.length)]!;
  const temp = `${pick()}-${crypto.randomInt(1000, 10000)}-${pick()}`;

  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(temp, 12), sessionVersion: { increment: 1 }, failedLogins: 0, lockedUntil: null } });
  return { ok: temp };
}

export async function toggleBan(fd: FormData) {
  const admin = await requireAdmin();
  const id = String(fd.get('userId'));
  if (id === admin.id) return;
  const u = await prisma.user.findUnique({ where: { id }, select: { banned: true, role: true } });
  if (!u || u.role === 'ADMIN') return;
  await prisma.user.update({ where: { id }, data: { banned: !u.banned, sessionVersion: { increment: 1 } } });
  revalidatePath('/admin/users');
}

/** Manually add money to a wallet (e.g. a payment received without a screenshot). */
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
