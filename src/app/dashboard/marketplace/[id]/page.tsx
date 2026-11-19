import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BadgeCheck, ShieldCheck, Zap } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { naira } from '@/lib/format';
import { previewLogin } from '@/lib/image';
import ListingImage from '@/components/ListingImage';
import { PlatformBadge } from '@/components/PlatformIcon';
import BuyPanel from './BuyPanel';
import { expireCheckouts } from '@/lib/checkout';
import Stars from '@/components/Stars';
import { reviewAuthor, reviewSourceLabel } from '@/lib/reviews';
import { formatDate } from '@/lib/format';

const ERRORS: Record<string, string> = {
  funds: 'You don’t have enough in your wallet for that. Fund your wallet and try again.',
  stock: 'Sorry, one or more of those just sold. Please pick again.',
  gone: 'That listing is no longer available.',
  slow: 'You’re going a little fast. Wait a moment and try again.',
  too_many: 'You already have 3 unpaid checkouts. Finish or cancel one in My orders first.',
};

const SHOW = 200; // most items listed for picking; quantity buying still works beyond this

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;
  await expireCheckouts().catch(() => 0);

  const listing = await prisma.listing.findFirst({
    where: { id, active: true },
    include: { _count: { select: { credentials: { where: { status: 'AVAILABLE' } } } } },
  });
  if (!listing) notFound();

  const items = await prisma.credential.findMany({
    where: { listingId: id, status: 'AVAILABLE' },
    orderBy: { createdAt: 'asc' },
    take: SHOW,
    select: { id: true, login: true, previewUrl: true },
  });
  const stock = listing._count.credentials;
  const [reviews, summary] = await Promise.all([
    prisma.review.findMany({
      where: { listingId: id, hidden: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { name: true } } },
    }),
    prisma.review.aggregate({ where: { listingId: id, hidden: false }, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  const avg = summary._avg.rating ?? 0;

  return (
    <>
      <Link href="/dashboard/marketplace" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-text hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to marketplace
      </Link>

      {error && ERRORS[error] && <p role="alert" className="alert-error">{ERRORS[error]}</p>}

      <div className="flex flex-wrap gap-6">
        {/* Product info */}
        <section className="card min-w-0 flex-[1_1_340px] overflow-hidden">
          <ListingImage id={listing.id} imageAt={listing.imageAt} platform={listing.platform} title={listing.title} className="aspect-[16/10]" />
          <div className="space-y-4 p-6">
            <PlatformBadge platform={listing.platform} className="!text-sm" />
            <h1 className="font-display text-2xl font-bold leading-tight text-white sm:text-3xl">{listing.title}</h1>
            {summary._count._all > 0 && (
              <a href="#reviews" className="flex items-center gap-2 text-sm text-muted hover:text-white">
                <Stars value={avg} /> <strong className="text-white">{avg.toFixed(1)}</strong> · {summary._count._all} review{summary._count._all === 1 ? '' : 's'}
              </a>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-xl bg-accent/15 px-3 py-1.5 font-display text-2xl font-bold text-white">{naira(listing.price)}</span>
              <span className="text-sm text-muted">each</span>
              <span className={`badge ml-auto ${stock ? 'bg-[#0F3B2C] text-success' : 'bg-[#3A1520] text-danger'}`}>
                {stock ? `${stock} available` : 'Sold out'}
              </span>
            </div>
            {listing.description && (
              <div>
                <h2 className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-muted">Details & instructions</h2>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-soft">{listing.description}</p>
              </div>
            )}
            <ul className="space-y-2 border-t border-line pt-4 text-sm text-soft">
              <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent-text" aria-hidden="true" /> Logins delivered to your dashboard</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent-text" aria-hidden="true" /> Report a problem for a refund to your wallet</li>
              <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-accent-text" aria-hidden="true" /> Checked before listing</li>
            </ul>
          </div>
        </section>

        {/* Pick & buy */}
        <section aria-labelledby="buy" className="card min-w-0 flex-[1_1_380px] p-6">
          <h2 id="buy" className="text-lg font-semibold text-white">Choose what you want</h2>
          <p className="mt-1 text-sm text-muted">
            {listing.showLogin
              ? 'Tick the exact ones you want, or just set a quantity.'
              : 'Previews are partly hidden until you buy. Tick specific ones, or just set a quantity.'}
          </p>
          <BuyPanel
            listingId={listing.id}
            price={listing.price}
            balance={user.balance}
            stock={stock}
            showLogin={listing.showLogin}
            items={items.map((c) => ({ id: c.id, preview: previewLogin(c.login, listing.showLogin), url: c.previewUrl }))}
          />
        </section>
      </div>

      <section id="reviews" aria-labelledby="reviews-title" className="card scroll-mt-24 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="reviews-title" className="text-lg font-semibold text-white">Buyer reviews</h2>
          {summary._count._all > 0 && (
            <span className="flex items-center gap-2 text-sm text-muted"><Stars value={avg} /> {avg.toFixed(1)} out of 5</span>
          )}
        </div>
        {reviews.length ? (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-panel2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Stars value={r.rating} size={14} />
                  <span className="text-[12px] text-muted">{formatDate(r.createdAt)}</span>
                </div>
                {r.comment && <p className="mt-2 text-[15px] text-soft">{r.comment}</p>}
                <p className="mt-2 text-[13px] font-semibold text-white">{reviewAuthor(r)} <span className="font-normal text-success">· {reviewSourceLabel(r.source)}</span></p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-muted">No reviews yet. Buyers can rate this from their dashboard after purchase.</p>
        )}
      </section>
    </>
  );
}
