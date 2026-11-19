import Link from 'next/link';
import type { CheckoutStatus } from '@prisma/client';
import { ArrowRight, PackageOpen } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { expireCheckouts } from '@/lib/checkout';
import { formatDate, naira } from '@/lib/format';
import { PlatformTile } from '@/components/PlatformIcon';
import OrderCard from '../OrderCard';

export const metadata = { title: 'My orders' };

const CHECKOUT_BADGE: Record<CheckoutStatus, [string, string]> = {
  AWAITING_PAYMENT: ['bg-[#3D2E0A] text-warn', 'Waiting for payment'],
  UNDER_REVIEW: ['bg-[#10294A] text-[#7DB8FF]', 'Payment under review'],
  COMPLETED: ['bg-[#0F3B2C] text-success', 'Delivered'],
  REJECTED: ['bg-[#3A1520] text-danger', 'Payment not confirmed'],
  EXPIRED: ['bg-line text-soft', 'Expired'],
  CANCELLED: ['bg-line text-soft', 'Cancelled'],
};

export default async function OrdersPage() {
  const user = await requireUser();
  await expireCheckouts().catch(() => 0);

  const [checkouts, orders, myReviews] = await Promise.all([
    prisma.checkout.findMany({
      where: { userId: user.id, status: { not: 'COMPLETED' } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { listing: { select: { title: true, platform: true } } },
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { listing: { select: { id: true, title: true, platform: true } } },
    }),
    prisma.review.findMany({ where: { userId: user.id }, select: { listingId: true, rating: true, comment: true } }),
  ]);
  const reviewFor = new Map(myReviews.map((r) => [r.listingId, { rating: r.rating, comment: r.comment }]));
  const active = checkouts.filter((c) => c.status === 'AWAITING_PAYMENT' || c.status === 'UNDER_REVIEW');
  const ended = checkouts.filter((c) => !active.includes(c));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">My orders</h1>
          <p className="mt-1 text-muted">Checkouts in progress, and every login you’ve bought.</p>
        </div>
        <Link href="/dashboard/marketplace" className="btn btn-primary">Buy more <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>

      {active.length > 0 && (
        <section aria-labelledby="pending" className="space-y-3">
          <h2 id="pending" className="text-lg font-semibold text-white">In progress</h2>
          {active.map((c) => {
            const [cls, label] = CHECKOUT_BADGE[c.status];
            return (
              <Link key={c.id} href={`/dashboard/checkout/${c.id}`} className="card group flex flex-wrap items-center gap-4 p-5 transition hover:border-line2">
                <PlatformTile platform={c.listing.platform} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white">{c.quantity} × {c.listing.title}</div>
                  <div className="text-[13px] text-muted"><span className="font-mono">{c.reference}</span> · {naira(c.amount)} · {formatDate(c.createdAt)}</div>
                </div>
                <span className={`badge ${cls}`}>{label}</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-accent-text">
                  {c.status === 'AWAITING_PAYMENT' ? 'Pay now' : 'View'} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </section>
      )}

      <section aria-labelledby="delivered" className="card p-6">
        <h2 id="delivered" className="mb-4 text-lg font-semibold text-white">Delivered logins</h2>
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
            <PackageOpen className="mx-auto h-10 w-10 text-placeholder" aria-hidden="true" />
            <p className="mt-3 text-muted">Nothing delivered yet. Your logins appear here once payment is confirmed.</p>
          </div>
        )}
      </section>

      {ended.length > 0 && (
        <section aria-labelledby="past" className="card p-6">
          <h2 id="past" className="mb-3 text-lg font-semibold text-white">Past checkouts</h2>
          <ul>
            {ended.map((c) => {
              const [cls, label] = CHECKOUT_BADGE[c.status];
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3 first:border-t-0">
                  <Link href={`/dashboard/checkout/${c.id}`} className="min-w-0 hover:text-white">
                    <div className="text-white">{c.quantity} × {c.listing.title}</div>
                    <div className="text-[13px] text-muted"><span className="font-mono">{c.reference}</span> · {naira(c.amount)} · {formatDate(c.createdAt)}</div>
                  </Link>
                  <span className={`badge ${cls}`}>{label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
