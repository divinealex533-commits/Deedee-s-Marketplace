import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { autoCompleteOrders } from '@/lib/orders';

export const dynamic = 'force-dynamic';

// Runs once a day (see vercel.json). Vercel sends "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const completed = await autoCompleteOrders();
  // Housekeeping: drop visitor rows older than 90 days
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const { count: visitsDeleted } = await prisma.visit.deleteMany({ where: { createdAt: { lt: cutoff } } });

  return NextResponse.json({ ok: true, completed, visitsDeleted });
}
