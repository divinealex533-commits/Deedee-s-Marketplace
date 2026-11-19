import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticate, fail, ok, toNaira } from '@/lib/api';
import { previewLogin } from '@/lib/image';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/products/{id} — one product.
 * Add ?items=true to include up to 200 available items (id + preview) you can buy by id.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(req);
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const l = await prisma.listing.findFirst({
    where: { id, active: true },
    include: { _count: { select: { credentials: { where: { status: 'AVAILABLE' } } } } },
  });
  if (!l) return fail(404, 'product_not_found', 'No active product with that id.');

  const base = process.env.APP_URL ?? req.nextUrl.origin;
  const withItems = req.nextUrl.searchParams.get('items') === 'true';
  const items = withItems
    ? (
        await prisma.credential.findMany({
          where: { listingId: id, status: 'AVAILABLE' },
          orderBy: { createdAt: 'asc' },
          take: 200,
          select: { id: true, login: true, previewUrl: true },
        })
      ).map((c) => ({ id: c.id, preview: previewLogin(c.login, l.showLogin), preview_url: c.previewUrl }))
    : undefined;

  return ok({
    id: l.id,
    title: l.title,
    platform: l.platform,
    description: l.description,
    price: toNaira(l.price),
    currency: 'NGN',
    stock: l._count.credentials,
    image_url: l.imageAt ? `${base}/api/listings/${l.id}/image?v=${l.imageAt.getTime()}` : null,
    created_at: l.createdAt.toISOString(),
    ...(items ? { items } : {}),
  });
}
