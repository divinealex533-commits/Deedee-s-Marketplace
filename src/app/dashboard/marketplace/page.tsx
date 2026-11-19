import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { naira } from '@/lib/format';
import { buy } from '@/app/actions/shop';
import SubmitButton from '@/components/SubmitButton';

export const metadata = { title: 'Marketplace' };

const ERRORS: Record<string, string> = {
  funds: 'You don’t have enough in your wallet for that. Fund your wallet and try again.',
  stock: 'Sorry, that one just sold out. Please pick another.',
  gone: 'That listing is no longer available.',
  slow: 'You’re going a little fast. Wait a moment and try again.',
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; error?: string; q?: string }>;
}) {
  const user = await requireUser();
  const { platform, error, q } = await searchParams;

  const listings = await prisma.listing.findMany({
    where: {
      active: true,
      ...(platform ? { platform } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}),
    },
    include: { _count: { select: { credentials: { where: { status: 'AVAILABLE' } } } } },
    orderBy: { createdAt: 'desc' },
  });
  const platforms = (await prisma.listing.findMany({ where: { active: true }, select: { platform: true }, distinct: ['platform'] })).map((p) => p.platform);

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition ${active ? 'border-accent bg-accent text-white' : 'border-line2 text-soft hover:text-white'}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Marketplace</h1>
          <p className="mt-1 text-muted">Pay from your wallet and get your login instantly.</p>
        </div>
        <div className="rounded-xl border border-line bg-panel px-4 py-2.5 text-sm">
          <span className="text-muted">Wallet: </span>
          <span className="font-semibold text-white">{naira(user.balance)}</span>
          <Link href="/dashboard/wallet" className="ml-3 font-semibold text-accent-text">Top up</Link>
        </div>
      </div>

      {error && ERRORS[error] && <p role="alert" className="alert-error">{ERRORS[error]}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/dashboard/marketplace" className={pill(!platform)}>All</Link>
        {platforms.map((p) => (
          <Link key={p} href={`/dashboard/marketplace?platform=${encodeURIComponent(p)}`} className={pill(platform === p)}>
            {p}
          </Link>
        ))}
        <form className="ml-auto w-full sm:w-64" role="search">
          {platform && <input type="hidden" name="platform" value={platform} />}
          <label htmlFor="q" className="sr-only">Search listings</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search listings…" className="input py-2.5" />
        </form>
      </div>

      {listings.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((l) => {
            const stock = l._count.credentials;
            const short = user.balance < l.price;
            return (
              <div key={l.id} className="card flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <span className="badge bg-line text-soft">{l.platform}</span>
                  <span className={`text-[13px] ${stock ? 'text-success' : 'text-danger'}`}>
                    {stock ? `${stock} in stock` : 'Sold out'}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-white">{l.title}</h2>
                {l.description && <p className="text-sm text-muted">{l.description}</p>}
                <div className="flex items-center gap-1.5 text-[13px] text-muted">
                  <BadgeCheck className="h-4 w-4 text-accent-text" aria-hidden="true" /> Checked before listing
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <span className="font-display text-2xl font-bold text-white">{naira(l.price)}</span>
                  {stock ? (
                    short ? (
                      <Link href="/dashboard/wallet" className="btn btn-ghost btn-sm">Top up to buy</Link>
                    ) : (
                      <form action={buy}>
                        <input type="hidden" name="listingId" value={l.id} />
                        <SubmitButton className="btn btn-primary btn-sm px-4" pendingText="Buying…">Buy now</SubmitButton>
                      </form>
                    )
                  ) : (
                    <button type="button" disabled className="btn btn-ghost btn-sm">Sold out</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="card p-10 text-center text-muted">No listings here right now. Check back soon or message support.</p>
      )}
    </>
  );
}
