import Link from 'next/link';
import type { DepositStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { formatDate, naira, timeAgo } from '@/lib/format';
import ReviewForms from './ReviewForms';

export const metadata = { title: 'Deposits' };
export const dynamic = 'force-dynamic';

const FILTERS: [DepositStatus, string][] = [
  ['PENDING', 'Waiting for review'],
  ['APPROVED', 'Approved'],
  ['REJECTED', 'Rejected'],
];

export default async function DepositsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = FILTERS.find(([s]) => s === sp.status)?.[0] ?? 'PENDING';

  const [deposits, counts] = await Promise.all([
    prisma.deposit.findMany({
      where: { status },
      orderBy: { createdAt: status === 'PENDING' ? 'asc' : 'desc' },
      take: 100,
      select: {
        id: true, amount: true, approvedAmount: true, senderName: true, note: true, status: true, reviewNote: true, createdAt: true, reviewedAt: true,
        user: { select: { name: true, email: true, phone: true, referralCode: true, balance: true } },
        bankAccount: { select: { bankName: true, accountNumber: true } },
      },
    }),
    prisma.deposit.groupBy({ by: ['status'], _count: true }),
  ]);
  const count = (s: DepositStatus) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Deposits</h1>
        <p className="mt-1 text-muted">
          Check each receipt against your 9PSB / PocketApp statement, then approve the amount you actually received.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([s, label]) => (
          <Link
            key={s}
            href={`/admin/deposits?status=${s}`}
            className={`rounded-full border px-3.5 py-2 text-sm font-medium ${status === s ? 'border-accent bg-accent text-white' : 'border-line2 text-soft hover:text-white'}`}
          >
            {label} ({count(s)})
          </Link>
        ))}
      </div>

      {deposits.length ? (
        <div className="space-y-4">
          {deposits.map((d) => (
            <article key={d.id} className="card flex flex-wrap gap-6 p-5">
              <a
                href={`/api/deposits/${d.id}/proof`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full shrink-0 overflow-hidden rounded-xl border border-line2 bg-ink sm:w-48"
                aria-label={`Open receipt from ${d.user.name} full size`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/deposits/${d.id}/proof`} alt={`Receipt from ${d.user.name}`} loading="lazy" className="h-64 w-full object-contain sm:h-56" />
                <span className="block border-t border-line py-1.5 text-center text-xs text-accent-text">Open full size</span>
              </a>

              <div className="min-w-0 flex-[1_1_260px] space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-display text-3xl font-bold text-white">{naira(d.amount)}</span>
                  <span className="text-sm text-muted">claimed · {timeAgo(d.createdAt)}</span>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted">Customer</dt>
                  <dd className="text-white">{d.user.name} <span className="text-muted">· {d.user.email}</span></dd>
                  <dt className="text-muted">Narration code</dt>
                  <dd className="font-mono text-white">{d.user.referralCode}</dd>
                  <dt className="text-muted">Paid from</dt>
                  <dd className="text-white">{d.senderName}</dd>
                  <dt className="text-muted">Paid into</dt>
                  <dd className="text-white">{d.bankAccount ? `${d.bankAccount.bankName} · ${d.bankAccount.accountNumber}` : 'Deleted account'}</dd>
                  {d.note && (<><dt className="text-muted">Note</dt><dd className="text-soft">{d.note}</dd></>)}
                  <dt className="text-muted">Sent</dt>
                  <dd className="text-soft">{formatDate(d.createdAt)}</dd>
                  <dt className="text-muted">Current balance</dt>
                  <dd className="text-soft">{naira(d.user.balance)}</dd>
                </dl>
                <a href={`https://wa.me/${d.user.phone}`} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-medium text-accent-text">
                  WhatsApp this customer
                </a>
              </div>

              <div className="min-w-0 flex-[1_1_260px]">
                {d.status === 'PENDING' ? (
                  <ReviewForms depositId={d.id} amount={d.amount / 100} />
                ) : d.status === 'APPROVED' ? (
                  <div className="alert-ok">
                    Approved {naira(d.approvedAmount ?? d.amount)}
                    {d.reviewedAt && <span className="block text-xs opacity-80">{formatDate(d.reviewedAt)}</span>}
                  </div>
                ) : (
                  <div className="alert-error">
                    Rejected: {d.reviewNote}
                    {d.reviewedAt && <span className="block text-xs opacity-80">{formatDate(d.reviewedAt)}</span>}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="card p-10 text-center text-muted">
          {status === 'PENDING' ? 'No deposits waiting. You’re all caught up.' : 'Nothing here yet.'}
        </p>
      )}
    </>
  );
}
