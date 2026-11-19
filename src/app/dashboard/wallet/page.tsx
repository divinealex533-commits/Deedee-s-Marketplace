import { Landmark } from 'lucide-react';
import type { DepositStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatDate, naira, signedNaira } from '@/lib/format';
import { site, whatsappLink } from '@/lib/site';
import CopyButton from '@/components/CopyButton';
import DepositForm from './DepositForm';

export const metadata = { title: 'Wallet' };

const DEPOSIT_BADGE: Record<DepositStatus, [string, string]> = {
  PENDING: ['bg-[#3D2E0A] text-warn', 'Waiting for review'],
  APPROVED: ['bg-[#0F3B2C] text-success', 'Credited'],
  REJECTED: ['bg-[#3A1520] text-danger', 'Rejected'],
};

export default async function WalletPage() {
  const user = await requireUser();
  const [banks, deposits, tx] = await Promise.all([
    prisma.bankAccount.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } }),
    prisma.deposit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, amount: true, approvedAmount: true, status: true, reviewNote: true, createdAt: true, bankAccount: { select: { bankName: true } } },
    }),
    prisma.transaction.findMany({ where: { userId: user.id, status: 'SUCCESS' }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Wallet</h1>
          <p className="mt-1 text-muted">Transfer to any of our accounts, upload your receipt, and we’ll credit you.</p>
        </div>
        <div className="rounded-2xl bg-accent px-6 py-4 text-white">
          <div className="text-sm text-white/90">Available balance</div>
          <div className="font-display text-3xl font-bold">{naira(user.balance)}</div>
        </div>
      </div>

      {/* Step 1: where to pay */}
      <section aria-labelledby="pay-to" className="card p-6">
        <h2 id="pay-to" className="text-lg font-semibold text-white">1. Transfer to one of these accounts</h2>
        <p className="mt-1 text-sm text-muted">
          Put <strong className="text-white">{user.referralCode}</strong> in the transfer narration/description so we can match your payment faster.
        </p>
        {banks.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {banks.map((b) => (
              <div key={b.id} className="rounded-2xl border border-line2 bg-panel2 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-accent-text">
                  <Landmark className="h-4 w-4" aria-hidden="true" /> {b.bankName}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold tracking-wider text-white">{b.accountNumber}</span>
                  <CopyButton value={b.accountNumber} label={`${b.bankName} account number`} />
                </div>
                <div className="mt-1 text-[15px] text-soft">{b.accountName}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-muted">
            Bank details are being updated. Please{' '}
            <a href={whatsappLink('Hi, which account should I pay into to fund my wallet?')} className="font-semibold text-accent-text">
              message us on WhatsApp ({site.whatsappDisplay})
            </a>
            .
          </p>
        )}
      </section>

      {/* Step 2: upload proof */}
      {banks.length > 0 && (
        <section aria-labelledby="proof" className="card p-6">
          <h2 id="proof" className="mb-5 text-lg font-semibold text-white">2. Upload your payment receipt</h2>
          <DepositForm banks={banks.map((b) => ({ id: b.id, label: `${b.bankName} · ${b.accountNumber}` }))} defaultName={user.name} />
        </section>
      )}

      <div className="flex flex-wrap gap-5">
        <section aria-labelledby="my-deposits" className="card min-w-0 flex-[1_1_360px] p-6">
          <h2 id="my-deposits" className="mb-2 text-lg font-semibold text-white">My deposits</h2>
          {deposits.length ? (
            <ul>
              {deposits.map((d) => {
                const [cls, label] = DEPOSIT_BADGE[d.status];
                return (
                  <li key={d.id} className="border-t border-line py-3 first:border-t-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">
                          {naira(d.approvedAmount ?? d.amount)}
                          {d.approvedAmount != null && d.approvedAmount !== d.amount && (
                            <span className="ml-2 text-xs font-normal text-muted">(you entered {naira(d.amount)})</span>
                          )}
                        </div>
                        <div className="text-[13px] text-muted">
                          {d.bankAccount?.bankName ?? 'Bank transfer'} · {formatDate(d.createdAt)} ·{' '}
                          <a href={`/api/deposits/${d.id}/proof`} target="_blank" className="text-accent-text">receipt</a>
                        </div>
                      </div>
                      <span className={`badge shrink-0 ${cls}`}>{label}</span>
                    </div>
                    {d.status === 'REJECTED' && d.reviewNote && <p className="mt-2 text-sm text-danger">Reason: {d.reviewNote}</p>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-muted">No deposits yet.</p>
          )}
        </section>

        <section aria-labelledby="history" className="card min-w-0 flex-[1_1_360px] p-6">
          <h2 id="history" className="mb-2 text-lg font-semibold text-white">Transaction history</h2>
          {tx.length ? (
            <ul>
              {tx.map((t) => (
                <li key={t.id} className="flex justify-between gap-3 border-t border-line py-3 first:border-t-0">
                  <div className="min-w-0">
                    <div className="truncate text-white">{t.description}</div>
                    <div className="text-[13px] text-muted">{formatDate(t.createdAt)}</div>
                  </div>
                  <div className={`shrink-0 font-semibold ${t.amount < 0 ? 'text-text' : 'text-success'}`}>{signedNaira(t.amount)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-muted">No transactions yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
