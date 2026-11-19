'use server';

import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createSession, destroySession, requireUser } from '@/lib/auth';
import { normalizePhone } from '@/lib/phone';
import { rateLimit } from '@/lib/ratelimit';
import type { FormState } from './types';

async function clientIp() {
  const h = await headers();
  return (h.get('x-forwarded-for') ?? '').split(',')[0]!.trim() || 'local';
}

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Za-z]/, 'Password needs at least one letter.')
  .regex(/\d/, 'Password needs at least one number.');

const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name.').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
    phone: z.string(),
    password,
    confirm: z.string(),
    accountType: z.enum(['BUYER', 'SELLER']),
    referral: z.string().trim().optional(),
    agree: z.literal('on', { errorMap: () => ({ message: 'Please accept the terms to continue.' }) }),
  })
  .refine((d) => d.password === d.confirm, { message: 'The two passwords don’t match.' });

const referralCode = () => 'DD' + crypto.randomBytes(3).toString('hex').toUpperCase();

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  if (!rateLimit(`signup:${await clientIp()}`, 10, 60 * 60 * 1000)) {
    return { error: 'Too many sign-ups from this network. Try again in an hour.' };
  }
  const parsed = signupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  const d = parsed.data;

  const phone = normalizePhone(d.phone);
  if (!phone) return { error: 'Enter a valid phone number.' };

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: d.email }, { phone }] },
    select: { email: true },
  });
  if (existing) {
    return {
      error:
        existing.email === d.email
          ? 'An account with this email already exists. Try logging in.'
          : 'An account with this phone number already exists. Try logging in.',
    };
  }

  let referredById: string | undefined;
  if (d.referral) {
    const ref = await prisma.user.findUnique({ where: { referralCode: d.referral.toUpperCase() }, select: { id: true } });
    if (!ref) return { error: 'That referral code isn’t valid.' };
    referredById = ref.id;
  }

  const user = await prisma.user.create({
    data: {
      name: d.name,
      email: d.email,
      phone,
      passwordHash: await bcrypt.hash(d.password, 12),
      accountType: d.accountType,
      phoneVerified: true,
      referralCode: referralCode(),
      referredById,
    },
  });

  await createSession(user, true);
  redirect('/dashboard?welcome=1');
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const identifier = String(fd.get('identifier') ?? '').trim().toLowerCase();
  const pw = String(fd.get('password') ?? '');
  const remember = fd.get('remember') === 'on';
  const next = String(fd.get('next') ?? '');

  if (!identifier || !pw) return { error: 'Enter your email or phone number and your password.' };

  const ip = await clientIp();
  if (!rateLimit(`login-ip:${ip}`, 30, 15 * 60 * 1000) || !rateLimit(`login-id:${identifier}`, 8, 15 * 60 * 1000)) {
    return { error: 'Too many attempts. Wait 15 minutes, or reset your password.' };
  }

  const where = identifier.includes('@') ? { email: identifier } : { phone: normalizePhone(identifier) ?? '__none__' };
  const user = await prisma.user.findUnique({ where });
  // With no user we still hash, so a wrong email takes as long as a wrong password.
  const valid = user ? await bcrypt.compare(pw, user.passwordHash) : (await bcrypt.hash(pw, 12), false);

  if (!user || !valid) return { error: 'Those details don’t match an account.' };
  if (user.banned) return { error: 'This account has been suspended. Contact support for help.' };

  await createSession(user, remember);

  if (user.role === 'ADMIN') redirect(next.startsWith('/admin') ? next : '/admin');
  redirect(next.startsWith('/dashboard') ? next : '/dashboard');
}

export async function logout() {
  await destroySession();
  redirect('/');
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(fd.get('current') ?? '');
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((d) => d.password === d.confirm, { message: 'The two new passwords don’t match.' })
    .safeParse(Object.fromEntries(fd));

  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: 'Your current password is wrong.' };
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) } });
  return { ok: 'Password changed.' };
}
