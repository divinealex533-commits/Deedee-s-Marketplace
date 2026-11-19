import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authenticate, fail, ok, orderInclude, serializeOrder, toNaira } from '@/lib/api';
import { MAX_PER_ORDER, purchase } from '@/lib/purchase';

export const dynamic = 'force-dynamic';

const body = z
  .object({
    product_id: z.string().min(1, 'product_id is required.'),
    quantity: z.number().int().min(1).max(MAX_PER_ORDER).optional(),
    item_ids: z.array(z.string().min(1)).min(1).max(MAX_PER_ORDER).optional(),
    reference: z
      .string()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9_\-.:]+$/, 'reference may only contain letters, numbers and _ - . :')
      .optional(),
  })
  .refine((b) => !(b.quantity && b.item_ids), { message: 'Send either quantity or item_ids, not both.' });

/**
 * POST /api/v1/orders — buy. Body: { product_id, quantity? | item_ids?, reference? }
 * Charges your wallet and returns the logins straight away.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return fail(400, 'invalid_json', 'The request body must be JSON.');
  }
  const parsed = body.safeParse(json);
  if (!parsed.success) return fail(422, 'validation_error', parsed.error.issues[0]!.message);
  const b = parsed.data;

  const result = await purchase({
    userId: auth.user.id,
    listingId: b.product_id,
    ids: b.item_ids,
    quantity: b.quantity ?? 1,
    reference: b.reference,
    source: 'api',
  });

  if (!result.ok) {
    switch (result.error) {
      case 'funds':
        return fail(402, 'insufficient_balance', 'Your wallet balance is too low for this order. Fund your wallet and try again.');
      case 'stock':
        return fail(409, 'out_of_stock', 'Not enough stock, or one of the chosen items was just sold.');
      case 'gone':
        return fail(404, 'product_not_found', 'No active product with that id.');
      case 'duplicate':
        return fail(409, 'duplicate_reference', 'An order with this reference already exists. Nothing was charged.');
      default:
        return fail(422, 'validation_error', `quantity must be between 1 and ${MAX_PER_ORDER}.`);
    }
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: result.orderIds } },
    include: orderInclude,
    orderBy: { createdAt: 'asc' },
  });

  return ok(
    {
      quantity: result.quantity,
      total: toNaira(result.total),
      balance: toNaira(result.balance),
      currency: 'NGN',
      reference: b.reference ?? null,
      orders: orders.map(serializeOrder),
    },
    201,
  );
}

/** GET /api/v1/orders — your orders, newest first. ?limit=20 (max 100) &cursor=<last order id> */
export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;

  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 20));
  const cursor = req.nextUrl.searchParams.get('cursor');

  const rows = await prisma.order.findMany({
    where: { userId: auth.user.id },
    include: orderInclude,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const page = rows.slice(0, limit);

  return ok({
    orders: page.map(serializeOrder),
    next_cursor: rows.length > limit ? page[page.length - 1]!.id : null,
  });
}
