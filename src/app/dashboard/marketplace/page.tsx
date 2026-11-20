import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { naira } from '@/lib/format';
import { displayBalance } from '@/lib/displayBalance';
import { itemPreview } from '@/lib/image';
import StockBrowser from '@/components/StockBrowser';
import { ratingsByListing } from '@/lib/reviews';

export const metadata = { title: 'Marketplace' };

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; q?: string }>;
}) {
  const user = await requireUser();
  const { platform, q } = await searchParams;

  const [listings] = await Promise.all([
    prisma.listing.findMany({
      where: {
        active: true,
      },
      include: {
            _count: { select: { credentials: { where: { status: 'AVAILABLE' } } } },
            credentials: { where: { status: 'AVAILABLE' }, orderBy: { createdAt: 'asc' }, take: 3, select: { id: true, previewUrl: true } },
          },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  const ratings = await ratingsByListing(listings.map((l) => l.id));
  // In-stock listings first
  listings.sort((a, b) => Number(b._count.credentials > 0) - Number(a._count.credentials > 0));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Marketplace</h1>
          <p className="mt-1 text-muted">Search or pick a category, then tap Buy now.</p>
        </div>
        <div className="rounded-xl border border-line bg-panel px-4 py-2.5 text-sm">
          <span className="text-muted">Wallet: </span>
          <span className="font-semibold text-white">{naira(displayBalance(user))}</span>
          <Link href="/dashboard/wallet" className="ml-3 font-semibold text-accent-text">Top up</Link>
        </div>
      </div>

      <StockBrowser
        hrefBase="/dashboard/marketplace"
        initialPlatform={platform ?? ''}
        initialQuery={q ?? ''}
        emptyText="No listings match that right now. Try another word or category, or message support."
        cards={listings.map((l) => ({ id: l.id, title: l.title, platform: l.platform, description: l.description, price: l.price, stock: l._count.credentials, imageAt: l.imageAt, rating: ratings[l.id], showLogin: l.showLogin, items: l.credentials.map((c, i) => ({ id: c.id, ...itemPreview(c.previewUrl, i + 1) })) }))}
      />
    </>
  );
}
