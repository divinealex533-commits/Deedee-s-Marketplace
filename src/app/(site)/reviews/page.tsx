import Link from 'next/link';
import { BadgeCheck, MessageSquareQuote } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { reviewAuthor, reviewSourceLabel } from '@/lib/reviews';
import ReviewCarousel from '@/components/ReviewCarousel';
import { site } from '@/lib/site';
import Stars from '@/components/Stars';

export const metadata = {
  title: 'Customer reviews',
  description: `What real buyers say about ${site.name}. Reviews from verified purchases and feedback customers sent us on WhatsApp.`,
};
export const revalidate = 120;

const PAGE = 30;

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ page?: string; stars?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const stars = [1, 2, 3, 4, 5].includes(Number(sp.stars)) ? Number(sp.stars) : undefined;
  const where = { hidden: false, ...(stars ? { rating: stars } : {}) };

  const [reviews, total, summary, dist] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { user: { select: { name: true } }, listing: { select: { title: true, platform: true } } },
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({ where: { hidden: false }, _avg: { rating: true }, _count: { _all: true } }),
    prisma.review.groupBy({ by: ['rating'], where: { hidden: false }, _count: { _all: true } }),
  ]);
  const featured = page === 1 && !stars
    ? (await prisma.review.findMany({
        where: { hidden: false, comment: { not: '' }, rating: { gte: 4 } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true } }, listing: { select: { title: true } } },
      })).map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, name: reviewAuthor(r), item: r.listing?.title ?? null, source: r.source }))
    : [];
  const avg = summary._avg.rating ?? 0;
  const count = summary._count._all;
  const byStar = (n: number) => dist.find((d) => d.rating === n)?._count._all ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (o: { page?: number; stars?: number }) => {
    const p = new URLSearchParams();
    const s = 'stars' in o ? o.stars : stars;
    if (s) p.set('stars', String(s));
    if (o.page && o.page > 1) p.set('page', String(o.page));
    const q = p.toString();
    return `/reviews${q ? `?${q}` : ''}`;
  };

  return (
    <div className="relative">
      <div aria-hidden="true" className="auth-glow pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70" />
      <div className="container-x relative py-14 lg:py-20">
        <p className="eyebrow mb-3">Reviews</p>
        <h1 className="font-display text-[clamp(36px,5vw,56px)] font-bold leading-tight text-white">What our buyers say</h1>
        <p className="mt-3 flex items-center gap-2 text-muted">
          <BadgeCheck className="h-5 w-5 text-success" aria-hidden="true" /> Reviews come from verified purchases or feedback customers sent us on WhatsApp.
        </p>

        {featured.length > 1 && (
          <div className="mt-10">
            <ReviewCarousel reviews={featured} />
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-6">
          {/* Summary */}
          <aside className="card h-fit min-w-0 flex-[1_1_280px] p-6 lg:max-w-sm">
            <div className="font-display text-6xl font-bold text-white">{count ? avg.toFixed(1) : '—'}</div>
            <Stars value={avg} size={22} className="mt-2" />
            <p className="mt-2 text-sm text-muted">{count} review{count === 1 ? '' : 's'}</p>
            <ul className="mt-6 space-y-2">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = byStar(n);
                const pct = count ? (c / count) * 100 : 0;
                return (
                  <li key={n}>
                    <Link href={link({ stars: stars === n ? undefined : n })} className={`flex items-center gap-3 rounded-lg px-2 py-1 text-sm transition hover:bg-line ${stars === n ? 'bg-line' : ''}`}>
                      <span className="w-6 text-muted">{n}★</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                        <span className="block h-full rounded-full bg-warn" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-8 text-right text-muted">{c}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {stars && <Link href={link({ stars: undefined })} className="mt-4 inline-block text-sm font-medium text-accent-text">Show all ratings</Link>}
          </aside>

          {/* List */}
          <section aria-label="Reviews" className="min-w-0 flex-[2_1_480px]">
            {reviews.length ? (
              <ul className="grid gap-4 md:grid-cols-2">
                {reviews.map((r) => (
                  <li key={r.id} className="card flex flex-col p-5">
                    <div className="flex items-center justify-between gap-3">
                      <Stars value={r.rating} />
                      <span className="text-[12px] text-muted">{formatDate(r.createdAt)}</span>
                    </div>
                    {r.comment && <p className="mt-3 flex-1 text-[15px] leading-relaxed text-soft">{r.comment}</p>}
                    <div className="mt-4 border-t border-line pt-3 text-sm">
                      <span className="font-semibold text-white">{reviewAuthor(r)}</span>
                      <span className="text-success"> · {reviewSourceLabel(r.source)}</span>
                      {r.listing && <div className="text-[13px] text-muted">{r.listing.platform} · {r.listing.title}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="card p-10 text-center">
                <MessageSquareQuote className="mx-auto h-8 w-8 text-accent-text" aria-hidden="true" />
                <p className="mt-3 font-semibold text-white">{stars ? `No ${stars}-star reviews yet` : 'No reviews yet'}</p>
                <p className="mt-1 text-muted">Buyers can rate their purchase from their dashboard.</p>
              </div>
            )}

            {pages > 1 && (
              <nav aria-label="Pages" className="mt-6 flex items-center justify-between text-sm">
                {page > 1 ? <Link href={link({ page: page - 1 })} className="btn btn-ghost btn-sm">← Newer</Link> : <span />}
                <span className="text-muted">Page {page} of {pages}</span>
                {page < pages ? <Link href={link({ page: page + 1 })} className="btn btn-ghost btn-sm">Older →</Link> : <span />}
              </nav>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
