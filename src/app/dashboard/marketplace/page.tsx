import Link from 'next/link';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { naira } from '@/lib/format';
import ProductCard from '@/components/ProductCard';
import { ratingsByListing } from '@/lib/reviews';

export const metadata = { title: 'Marketplace' };

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; q?: string }>;
}) {
  const user = await requireUser();
  const { platform, q } = await searchParams;

  const [listings, platforms] = await Promise.all([
    prisma.listing.findMany({
      where: {
        active: true,
        ...(platform ? { platform } : {}),
        ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
      },
      include: { _count: { select: { credentials: { where: { status: 'AVAILABLE' } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.listing.findMany({ where: { active: true }, select: { platform: true }, distinct: ['platform'] }),
  ]);
  const ratings = await ratingsByListing(listings.map((l) => l.id));
  // In-stock listings first
  listings.sort((a, b) => Number(b._count.credentials > 0) - Number(a._count.credentials > 0));

  const pill = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${active ? 'border-accent bg-accent text-white' : 'border-line2 text-soft hover:text-white'}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Marketplace</h1>
          <p className="mt-1 text-muted">Tap a listing to preview what’s in stock.</p>
        </div>
        <div className="rounded-xl border border-line bg-panel px-4 py-2.5 text-sm">
          <span className="text-muted">Wallet: </span>
          <span className="font-semibold text-white">{naira(user.balance)}</span>
          <Link href="/dashboard/wallet" className="ml-3 font-semibold text-accent-text">Top up</Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <Link href="/dashboard/marketplace" className={pill(!platform)}>All</Link>
          {platforms.map(({ platform: p }) => (
            <Link key={p} href={`/dashboard/marketplace?platform=${encodeURIComponent(p)}`} className={pill(platform === p)}>
              {p}
            </Link>
          ))}
        </div>
        <form className="w-full sm:ml-auto sm:w-64" role="search">
          {platform && <input type="hidden" name="platform" value={platform} />}
          <label htmlFor="q" className="sr-only">Search listings</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search listings…" className="input py-2.5" />
        </form>
      </div>

      {listings.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((l) => (
            <ProductCard
              key={l.id}
              href={`/dashboard/marketplace/${l.id}`}
              p={{ id: l.id, title: l.title, platform: l.platform, description: l.description, price: l.price, stock: l._count.credentials, imageAt: l.imageAt, rating: ratings[l.id] }}
            />
          ))}
        </div>
      ) : (
        <p className="card p-10 text-center text-muted">No listings here right now. Check back soon or message support.</p>
      )}
    </>
  );
}
