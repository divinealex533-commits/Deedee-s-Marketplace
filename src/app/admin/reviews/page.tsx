import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { deleteReview, toggleReviewHidden } from '@/app/actions/reviews';
import SubmitButton from '@/components/SubmitButton';
import Stars from '@/components/Stars';

export const metadata = { title: 'Reviews' };
export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const filter = show === 'hidden' ? { hidden: true } : show === 'low' ? { rating: { lte: 2 } } : {};

  const [reviews, summary] = await Promise.all([
    prisma.review.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { user: { select: { name: true, email: true } }, listing: { select: { title: true } } },
    }),
    prisma.review.aggregate({ where: { hidden: false }, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  const pill = (on: boolean) =>
    `rounded-full border px-3.5 py-2 text-sm font-medium ${on ? 'border-accent bg-accent text-white' : 'border-line2 text-soft hover:text-white'}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Reviews</h1>
          <p className="mt-1 text-muted">Only buyers can review. Hide anything inappropriate; hidden reviews don’t count towards ratings.</p>
        </div>
        <div className="card flex items-center gap-3 px-5 py-3">
          <Stars value={summary._avg.rating ?? 0} />
          <span className="font-display text-2xl font-bold text-white">{(summary._avg.rating ?? 0).toFixed(1)}</span>
          <span className="text-sm text-muted">{summary._count._all} visible</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/reviews" className={pill(!show)}>All</Link>
        <Link href="/admin/reviews?show=low" className={pill(show === 'low')}>1–2 stars</Link>
        <Link href="/admin/reviews?show=hidden" className={pill(show === 'hidden')}>Hidden</Link>
        <Link href="/reviews" className="px-2 py-2 text-sm font-medium text-accent-text">View public page →</Link>
      </div>

      {reviews.length ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {reviews.map((r) => (
            <li key={r.id} className={`card flex flex-col p-5 ${r.hidden ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <Stars value={r.rating} />
                {r.hidden && <span className="badge bg-line text-soft">Hidden</span>}
              </div>
              <p className="mt-3 flex-1 text-[15px] text-soft">{r.comment || <span className="italic text-muted">No comment</span>}</p>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
                <div className="text-[13px]">
                  <div className="font-semibold text-white">{r.user.name} <span className="font-normal text-muted">· {r.user.email}</span></div>
                  <div className="text-muted">{r.listing.title} · {formatDate(r.createdAt)}</div>
                </div>
                <div className="flex gap-2">
                  <form action={toggleReviewHidden}>
                    <input type="hidden" name="id" value={r.id} />
                    <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">{r.hidden ? 'Show' : 'Hide'}</SubmitButton>
                  </form>
                  <form action={deleteReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <SubmitButton className="btn btn-danger btn-sm" pendingText="…">Delete</SubmitButton>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card p-10 text-center text-muted">No reviews here yet.</p>
      )}
    </>
  );
}
