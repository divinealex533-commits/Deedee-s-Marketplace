import Link from 'next/link';
import { Clock, ShoppingBag } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { autoCompleteOrders } from '@/lib/orders';
import { formatDate, naira, signedNaira } from '@/lib/format';
import StatCard from '@/components/StatCard';
import OrderCard from './OrderCard';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ bought?: string; welcome?: string; disputed?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  await autoCompleteOrders().catch(() => 0);

  const [orders, tx] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      include: { listing: { select: { id: true, title: true, platform: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const myReviews = await prisma.review.findMany({ where: { userId: user.id }, select: { listingId: true, rating: true, comment: true } });
  const reviewFor = new Map(myReviews.map((r) => [r.listingId, { rating: r.rating, comment: r.comment }]));
  const spent = orders.filter((o) => o.status !== 'REFUNDED').reduce((a, o) => a + o.amount, 0);
  const awaiting = orders.filter((o) => o.status === 'ESCROW').length;
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">
          {sp.welcome ? `Welcome, ${firstName}!` : `Welcome back, ${firstName}`}
        </h1>
        <p className="mt-1 text-muted">Your purchases, wallet and activity at a glance.</p>
      </div>

      {sp.bought && (
        <p role="status" className="alert-ok">
          Purchase complete. Your login details are below. Check the account, then tap “It works” or report a problem.
        </p>
      )}
      {sp.disputed && (
        <p role="status" className="alert-ok">Thanks for letting us know. Our team will review it and contact you shortly.</p>
      )}

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-[#4A30C9] p-5 text-white shadow-xl shadow-accent/25">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          <div className="text-sm text-white/90">Wallet balance</div>
          <div className="mt-2 font-display text-[32px] font-bold leading-tight">{naira(user.balance)}</div>
          <Link href="/dashboard/wallet" className="btn btn-sm mt-3 bg-white text-[#1A1440] hover:bg-white/90">Fund wallet</Link>
        </div>
        <StatCard label="Accounts bought" value={orders.length} icon={ShoppingBag} tone="green" sub={`${naira(spent)} spent`} />
        <StatCard label="Awaiting your confirmation" value={awaiting} icon={Clock} tone="amber" sub="Check them and confirm" />
      </section>

      <section aria-labelledby="mine" className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="mine" className="text-lg font-semibold text-white">My accounts</h2>
          <Link href="/dashboard/orders" className="btn btn-ghost btn-sm">All orders</Link>
        </div>
        {orders.length ? (
          <div className="space-y-3">
            {orders.map((o) => (
              <OrderCard
                key={o.id}
                id={o.id}
                listingId={o.listing.id}
                review={reviewFor.get(o.listing.id) ?? null}
                title={o.listing.title}
                platform={o.listing.platform}
                amount={naira(o.amount)}
                date={formatDate(o.createdAt)}
                status={o.status}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-muted">You haven’t bought anything yet.</p>
            <Link href="/dashboard/marketplace" className="btn btn-primary mt-4">Browse the marketplace</Link>
          </div>
        )}
      </section>

      <section aria-labelledby="activity" className="card p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="activity" className="text-lg font-semibold text-white">Recent activity</h2>
          <Link href="/dashboard/wallet" className="text-sm font-medium text-accent-text">See all</Link>
        </div>
        {tx.length ? (
          <ul>
            {tx.map((t) => (
              <li key={t.id} className="flex justify-between gap-3 border-t border-line py-3 first:border-t-0">
                <div>
                  <div className="text-white">{t.description}</div>
                  <div className="text-[13px] text-muted">{formatDate(t.createdAt)}</div>
                </div>
                <div className={`font-semibold ${t.amount < 0 ? 'text-text' : 'text-success'}`}>{signedNaira(t.amount)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-muted">No activity yet.</p>
        )}
      </section>
    </>
  );
}
