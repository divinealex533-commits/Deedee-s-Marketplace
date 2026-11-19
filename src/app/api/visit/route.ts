import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { randomToken } from '@/lib/crypto';
import { lagosDay } from '@/lib/format';

const COOKIE = 'dd_vid';
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp/i;

/** Counts one visitor per browser per day for the admin dashboard. */
export async function POST(req: NextRequest) {
  if (BOT.test(req.headers.get('user-agent') ?? '')) return new NextResponse(null, { status: 204 });

  let path = '/';
  try {
    path = String((await req.json()).path ?? '/').slice(0, 200);
  } catch {}

  const existing = req.cookies.get(COOKIE)?.value;
  const visitorId = existing && /^[a-f0-9]{32}$/.test(existing) ? existing : randomToken(16);
  const day = lagosDay();

  await prisma.visit.upsert({
    where: { visitorId_day: { visitorId, day } },
    create: { visitorId, day, path },
    update: { hits: { increment: 1 }, lastSeen: new Date(), path },
  });

  const res = new NextResponse(null, { status: 204 });
  if (!existing) {
    res.cookies.set(COOKIE, visitorId, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365, path: '/' });
  }
  return res;
}
