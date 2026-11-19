import crypto from 'node:crypto';
import type { OtpPurpose } from '@prisma/client';
import { prisma } from './db';
import { sha256 } from './crypto';
import { site } from './site';

const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const hash = (phone: string, code: string) => sha256(`${phone}:${code}:${process.env.AUTH_SECRET}`);

/** Creates a 6-digit code and sends it by SMS (or logs it when Termii isn't configured). */
export async function sendOtp(phone: string, purpose: OtpPurpose) {
  const code = crypto.randomInt(100000, 1000000).toString();

  await prisma.otp.deleteMany({ where: { phone, purpose } });
  await prisma.otp.create({
    data: { phone, purpose, codeHash: hash(phone, code), expiresAt: new Date(Date.now() + TTL_MS) },
  });

  const text =
    purpose === 'SIGNUP'
      ? `Your ${site.shortName} verification code is ${code}. It expires in 10 minutes.`
      : `Your ${site.shortName} password reset code is ${code}. If you didn't ask for this, ignore it.`;

  const apiKey = process.env.TERMII_API_KEY;
  if (!apiKey) {
    console.log(`[DEV] SMS to ${phone}: ${text}`);
    return;
  }

  const base = process.env.TERMII_BASE_URL || 'https://v3.api.termii.com';
  const res = await fetch(`${base}/api/sms/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      to: phone,
      from: process.env.TERMII_SENDER_ID || 'DeeDees',
      sms: text,
      type: 'plain',
      // 'dnd' reaches numbers on Do-Not-Disturb (needs Termii to activate the DND route for you)
      channel: process.env.TERMII_CHANNEL || 'generic',
    }),
  });
  if (!res.ok) console.error('Termii SMS failed', res.status, await res.text().catch(() => ''));
}

/** True if the code is right. Each code works once and allows 5 wrong tries. */
export async function checkOtp(phone: string, purpose: OtpPurpose, code: string) {
  const otp = await prisma.otp.findFirst({ where: { phone, purpose }, orderBy: { createdAt: 'desc' } });
  if (!otp || otp.expiresAt < new Date() || otp.attempts >= MAX_ATTEMPTS) return false;

  const a = Buffer.from(otp.codeHash);
  const b = Buffer.from(hash(phone, code.trim()));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await prisma.otp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  await prisma.otp.deleteMany({ where: { phone, purpose } });
  return true;
}
