import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, fail, ok, orderInclude, serializeOrder } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** GET /api/v1/orders/{id} — one of your orders, with its login. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const order = await prisma.order.findFirst({ where: { id, userId: auth.user.id }, include: orderInclude });
  if (!order) return fail(404, 'order_not_found', 'No order with that id on your account.');
  return ok(serializeOrder(order));
}
