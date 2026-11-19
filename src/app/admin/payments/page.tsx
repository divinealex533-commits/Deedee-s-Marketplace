import Link from 'next/link';
import type { CheckoutStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { expireCheckouts } from '@/lib/checkout';
import { formatDate, naira, timeAgo } from '@/lib/format';
import { PlatformTile } from '@/components/PlatformIcon';
import PaymentReview from './PaymentReview';

export const metadata = { title: 'Payments' };
export const dynamic = 'force-dynamic';

const FILTERS: [CheckoutStatus, string][] = [
  ['UNDER_REVIEW', 'Receipts to check'],
  ['AWAITING_PAYMENT', 'Waiting for payment'],
  ['COMPLETED', 'Approved'],
  ['REJECTED', 'Rejected'],
  ['EXPIRED', 'Expired'],
];

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await expireCheckouts().catch(() => 0);
  const sp = await searchParams;
  const status = FILTERS.find(([s]) => s === sp.status)?.[0] ?? 'UNDER_REVIEW';

  const [rows, counts] = await Promise.all([
    prisma.checkout.findMany({
      where: { status },
      orderBy: { createdAt: status === 'UNDER_REVIEW' ? 'asc' : 'desc' },
      take: 100,
      select: {
        id: true, reference: true, quantity: true, unitPrice: true, amount: true, status: true, senderName: true, proofType: true,
        rejectReason: true, expiresAt: true, paidAt: true, reviewedAt: true, createdAt: true,
        user: { select: { name: true, email: true, phone: true } },
        listing: { select: { title: true, platform: true } },
        bankAccount: { select: { bankName: true, accountNumber: true } },
      },
    }),
    prisma.checkout.groupBy({ by: ['status'], _count: true }),
  ]);
  const count = (s: CheckoutStatus) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Payments</h1>
        <p className="mt-1 text-muted">
          Customers who checked out and paid by transfer. Check your bank app for the amount and the reference in the narration, then approve to deliver their logins.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([s, label]) => (
          <Link key={s} href={`/admin/payments?status=${s}`} className={`rounded-full border px-3.5 py-2 text-sm font-medium ${status === s ? 'border-accent bg-accent text-white' : 'border-line2 text-soft hover:text-white'}`}>
            {label} ({count(s)})
          </Link>
        ))}
      </div>

      {rows.length ? (
        <div className="space-y-4">
          {rows.map((c) => (
            <article key={c.id} className="card flex flex-wrap gap-6 p-5">
              {c.proofType ? (
                <a href={`/api/checkouts/${c.id}/proof`} target="_blank" rel="noopener noreferrer" className="block w-full shrink-0 overflow-hidden rounded-xl border border-line2 bg-ink sm:w-48" aria-label={`Open receipt from ${c.user.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/checkouts/${c.id}/proof`} alt={`Receipt from ${c.user.name}`} loading="lazy" className="h-64 w-full object-contain sm:h-56" />
                  <span className="block border-t border-line py-1.5 text-center text-xs text-accent-text">Open full size</span>
                </a>
              ) : (
                <div className="flex w-full shrink-0 items-center justify-center rounded-xl border border-dashed border-line2 p-6 text-center text-sm text-muted sm:w-48">No receipt uploaded yet</div>
              )}

              <div className="min-w-0 flex-[1_1_260px] space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-display text-3xl font-bold text-white">{naira(c.amount)}</span>
                  <span className="font-mono text-sm text-accent-text">{c.reference}</span>
                  <span className="text-sm text-muted">{timeAgo(c.paidAt ?? c.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <PlatformTile platform={c.listing.platform} size={36} />
                  <div className="text-sm"><div className="font-semibold text-white">{c.quantity} × {c.listing.title}</div><div className="text-muted">{naira(c.unitPrice)} each</div></div>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted">Customer</dt>
                  <dd className="text-white">{c.user.name} <span className="text-muted">· {c.user.email}</span></dd>
                  {c.senderName && (<><dt className="text-muted">Paid from</dt><dd className="text-white">{c.senderName}</dd></>)}
                  {c.bankAccount && (<><dt className="text-muted">Paid into</dt><dd className="text-white">{c.bankAccount.bankName} · {c.bankAccount.accountNumber}</dd></>)}
                  <dt className="text-muted">Started</dt>
                  <dd className="text-soft">{formatDate(c.createdAt)}</dd>
                  {c.status === 'AWAITING_PAYMENT' && (<><dt className="text-muted">Expires</dt><dd className="text-warn">{formatDate(c.expiresAt)}</dd></>)}
                </dl>
                <a href={`https://wa.me/${c.user.phone}`} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-medium text-accent-text">WhatsApp this customer</a>
              </div>

              <div className="min-w-0 flex-[1_1_240px]">
                {c.status === 'UNDER_REVIEW' || c.status === 'AWAITING_PAYMENT' || c.status === 'EXPIRED' ? (
                  <>
                    {c.status === 'EXPIRED' && <p className="mb-2 text-sm text-warn">Expired without a receipt. Approve only if the money arrived: it delivers from current stock.</p>}
                    <PaymentReview checkoutId={c.id} amount={naira(c.amount)} quantity={c.quantity} />
                  </>
                ) : c.status === 'CANCELLED' ? (
                  <div className="alert-error">Cancelled by the customer</div>
                ) : c.status === 'COMPLETED' ? (
                  <div className="alert-ok">Approved · {c.quantity} delivered{c.reviewedAt && <span className="block text-xs opacity-80">{formatDate(c.reviewedAt)}</span>}</div>
                ) : (
                  <div className="alert-error">Rejected: {c.rejectReason}{c.reviewedAt && <span className="block text-xs opacity-80">{formatDate(c.reviewedAt)}</span>}</div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="card p-10 text-center text-muted">{status === 'UNDER_REVIEW' ? 'No receipts waiting. You’re all caught up.' : 'Nothing here yet.'}</p>
      )}
    </>
  );
}
