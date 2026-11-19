import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, ok, toNaira } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** GET /api/v1/products — every active product with price and stock. Optional ?platform=Instagram&in_stock=true */
export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;

  const platform = req.nextUrl.searchParams.get('platform') ?? undefined;
  const inStockOnly = req.nextUrl.searchParams.get('in_stock') === 'true';
  const base = process.env.APP_URL ?? req.nextUrl.origin;

  const listings = await prisma.listing.findMany({
    where: { active: true, ...(platform ? { platform } : {}) },
    include: { _count: { select: { credentials: { where: { status: 'AVAILABLE' } } } } },
    orderBy: { createdAt: 'desc' },
  });

  const products = listings
    .map((l) => ({
      id: l.id,
      title: l.title,
      platform: l.platform,
      description: l.description,
      price: toNaira(l.price),
      currency: 'NGN',
      stock: l._count.credentials,
      image_url: l.imageAt ? `${base}/api/listings/${l.id}/image?v=${l.imageAt.getTime()}` : null,
      created_at: l.createdAt.toISOString(),
    }))
    .filter((p) => !inStockOnly || p.stock > 0);

  return ok(products);
}
