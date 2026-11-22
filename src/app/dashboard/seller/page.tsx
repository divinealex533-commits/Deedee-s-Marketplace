import Link from 'next/link';
import { ArrowRight, CalendarCheck, Clock, Landmark, Store, Wallet } from 'lucide-react';
import type { DepositStatus, EarningStatus, WithdrawalStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatDate, naira } from '@/lib/format';
import { getSellerConfig, sellerActive } from '@/lib/seller';
import { site, whatsappLink } from '@/lib/site';
import CopyButton from '@/components/CopyButton';
import ActionForm from '@/components/ActionForm';
import { becomeSeller, requestWithdrawal, savePayoutDetails, submitSellerPayment } from '@/app/actions/seller';

export const metadata = { title: 'Seller hub' };
export const dynamic = 'force-dynamic';

const PAY_BADGE: Record<DepositStatus, [string, string]> = {
  PENDING: ['bg-[#3D2E0A] text-warn', 'Being checked'],
  APPROVED: ['bg-[#0F3B2C] text-success', 'Approved'],
  REJECTED: ['bg-[#3A1520] text-danger', 'Rejected'],
};
const EARN_BADGE: Record<EarningStatus, [string, string]> = {
  PENDING: ['bg-[#3D2E0A] text-warn', 'Waiting for approval'],
  APPROVED: ['bg-[#0F3B2C] text-success', 'Approved'],
  REVERSED: ['bg-[#3A1520] text-danger', 'Not paid (refunded)'],
};
const WD_BADGE: Record<WithdrawalStatus, [string, string]> = {
  PENDING: ['bg-[#3D2E0A] text-warn', 'Processing'],
  PAID: ['bg-[#0F3B2C] text-success', 'Paid'],
  REJECTED: ['bg-[#3A1520] text-danger', 'Rejected'],
};

const day = (d: Date) => d.toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric' });

export default async function SellerHubPage() {
  const user = await requireUser();
  const cfg = await getSellerConfig();

  if (user.accountType !== 'SELLER') {
    return (
      <>
        <h1 className="font-display text-3xl font-bold text-white">Sell on {site.shortName}</h1>
        <section className="card max-w-xl p-6">
          <Store className="h-8 w-8 text-accent-text" aria-hidden="true" />
          <p className="mt-3 text-soft">
            List your own products, and get paid when customers buy them. The seller plan is {naira(cfg.monthlyFee * 100)} a month, and we keep {cfg.commission}% of each sale.
          </p>
          <div className="mt-5">
            <ActionForm action={becomeSeller} submit="Become a seller" pendingText="Switching…" buttonClass="btn btn-primary" />
          </div>
        </section>
      </>
    );
  }

  const active = sellerActive(user);
  const [banks, payments, earnings, pendingSum, withdrawals, listingCount] = await Promise.all([
    prisma.bankAccount.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } }),
    prisma.sellerSubscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, amount: true, status: true, reviewNote: true, createdAt: true },
    }),
    prisma.sellerEarning.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { listing: { select: { title: true } } },
    }),
    prisma.sellerEarning.aggregate({ where: { sellerId: user.id, status: 'PENDING' }, _sum: { amount: true } }),
    prisma.withdrawal.findMany({ where: { sellerId: user.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
    prisma.listing.count({ where: { sellerId: user.id } }),
  ]);
  const waiting = payments.find((p) => p.status === 'PENDING');
  const lastRejected = payments[0]?.status === 'REJECTED' ? payments[0] : null;
  const daysLeft = user.sellerUntil ? Math.ceil((user.sellerUntil.getTime() - Date.now()) / 86_400_000) : 0;
  const showPay = !waiting && (!active || daysLeft <= 7);

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Seller hub</h1>
        <p className="mt-1 text-muted">Your shop plan, earnings and withdrawals.</p>
      </div>

      {/* ── Plan status ── */}
      <section aria-labelledby="plan" className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? 'bg-[#0F3B2C] text-success' : 'bg-[#3D2E0A] text-warn'}`}>
              {active ? <CalendarCheck className="h-5 w-5" aria-hidden="true" /> : <Clock className="h-5 w-5" aria-hidden="true" />}
            </span>
            <div>
              <h2 id="plan" className="text-lg font-semibold text-white">{active ? 'Your shop is open' : waiting ? 'Payment being checked' : 'Your shop is not open yet'}</h2>
              <p className="text-sm text-muted">
                {active
                  ? `Plan active until ${day(user.sellerUntil!)} (${daysLeft} day${daysLeft === 1 ? '' : 's'} left).`
                  : waiting
                    ? 'We’re confirming your payment. Your shop opens as soon as it’s approved.'
                    : `Pay ${naira(cfg.monthlyFee * 100)} for 30 days to start listing products.`}
              </p>
            </div>
          </div>
          {active && (
            <Link href="/dashboard/seller/listings" className="btn btn-primary">
              My listings ({listingCount}) <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
        {lastRejected && !waiting && (
          <p role="alert" className="alert-error mt-4">Your last payment was rejected: {lastRejected.reviewNote}</p>
        )}
      </section>

      {/* ── Pay monthly plan ── */}
      {showPay && (
        <section aria-labelledby="pay" className="card p-6">
          <h2 id="pay" className="text-lg font-semibold text-white">{active ? 'Renew your plan' : 'Pay your monthly plan'}: {naira(cfg.monthlyFee * 100)}</h2>
          <p className="mt-1 text-sm text-muted">
            Transfer exactly {naira(cfg.monthlyFee * 100)} to one of these accounts. Put <strong className="text-white">{user.referralCode}</strong> in the narration, then upload your receipt.
          </p>
          {banks.length ? (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {banks.map((b) => (
                  <div key={b.id} className="rounded-2xl border border-line2 bg-panel2 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-accent-text"><Landmark className="h-4 w-4" aria-hidden="true" /> {b.bankName}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="font-mono text-2xl font-bold tracking-wider text-white">{b.accountNumber}</span>
                      <CopyButton value={b.accountNumber} label={`${b.bankName} account number`} />
                    </div>
                    <div className="mt-1 text-[15px] text-soft">{b.accountName}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 max-w-lg">
                <ActionForm action={submitSellerPayment} compress="proof" resetOnOk submit="Submit payment" pendingText="Uploading…">
                  <div>
                    <label htmlFor="sp-bank" className="label">Account you paid into</label>
                    <select id="sp-bank" name="bankAccountId" className="input" defaultValue={banks[0]?.id}>
                      {banks.map((b) => <option key={b.id} value={b.id}>{b.bankName} · {b.accountNumber}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sp-name" className="label">Name on the account you paid from</label>
                    <input id="sp-name" name="senderName" required defaultValue={user.name} className="input" />
                  </div>
                  <div>
                    <label htmlFor="sp-proof" className="label">Receipt screenshot</label>
                    <input id="sp-proof" name="proof" type="file" accept="image/*" required className="input py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-line file:px-3 file:py-1.5 file:text-soft" />
                  </div>
                </ActionForm>
              </div>
            </>
          ) : (
            <p className="mt-4 text-muted">
              Bank details are being updated. Please{' '}
              <a href={whatsappLink('Hi, I want to pay for the seller plan. Which account should I pay into?')} className="font-semibold text-accent-text">message us on WhatsApp</a>.
            </p>
          )}
        </section>
      )}

      {/* ── Earnings ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <Wallet className="h-6 w-6 text-accent-text" aria-hidden="true" />
          <div className="mt-3 font-display text-3xl font-bold text-white">{naira(user.sellerBalance)}</div>
          <div className="text-sm text-muted">Available to withdraw</div>
        </div>
        <div className="card p-6">
          <Clock className="h-6 w-6 text-accent-text" aria-hidden="true" />
          <div className="mt-3 font-display text-3xl font-bold text-white">{naira(pendingSum._sum.amount ?? 0)}</div>
          <div className="text-sm text-muted">Waiting for approval</div>
        </div>
        <div className="card p-6">
          <Store className="h-6 w-6 text-accent-text" aria-hidden="true" />
          <div className="mt-3 font-display text-3xl font-bold text-white">{cfg.commission}%</div>
          <div className="text-sm text-muted">Our fee per sale</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <section aria-labelledby="withdraw" className="card min-w-0 flex-[1_1_300px] p-6">
          <h2 id="withdraw" className="mb-1 text-lg font-semibold text-white">Withdraw</h2>
          <p className="mb-4 text-sm text-muted">Minimum {naira(cfg.minWithdrawal * 100)}. Paid to your bank account.</p>
          <ActionForm action={requestWithdrawal} resetOnOk submit="Request withdrawal" pendingText="Requesting…">
            <div>
              <label htmlFor="wd-amount" className="label">Amount (₦)</label>
              <input id="wd-amount" name="amount" type="number" min={cfg.minWithdrawal} step={1} required className="input" placeholder={String(Math.floor(user.sellerBalance / 100))} />
            </div>
          </ActionForm>
        </section>
        <section aria-labelledby="bank" className="card min-w-0 flex-[1_1_300px] p-6">
          <h2 id="bank" className="mb-4 text-lg font-semibold text-white">Your bank details</h2>
          <ActionForm action={savePayoutDetails} submit="Save bank details" buttonClass="btn btn-ghost w-full">
            <div>
              <label htmlFor="pb" className="label">Bank</label>
              <input id="pb" name="payoutBank" required defaultValue={user.payoutBank ?? ''} placeholder="e.g. Opay" className="input" />
            </div>
            <div>
              <label htmlFor="pan" className="label">Account name</label>
              <input id="pan" name="payoutAccountName" required defaultValue={user.payoutAccountName ?? ''} className="input" />
            </div>
            <div>
              <label htmlFor="pnum" className="label">Account number</label>
              <input id="pnum" name="payoutAccountNumber" required inputMode="numeric" pattern="\d{10}" maxLength={10} defaultValue={user.payoutAccountNumber ?? ''} className="input font-mono" />
            </div>
          </ActionForm>
        </section>
      </div>

      <section aria-labelledby="sales" className="card p-6">
        <h2 id="sales" className="mb-1 text-lg font-semibold text-white">Your sales</h2>
        <p className="mb-4 text-sm text-muted">When a customer buys your product, we check it and approve your money. Approved money can be withdrawn.</p>
        {earnings.length ? (
          <div className="table-wrap">
            <table className="data-table min-w-[640px]">
              <thead><tr><th scope="col">Sale</th><th scope="col">Price</th><th scope="col">Our fee</th><th scope="col">You get</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {earnings.map((e) => (
                  <tr key={e.id}>
                    <td><div className="font-medium text-white">{e.listing.title}</div><div className="text-[13px] text-muted">{formatDate(e.createdAt)}</div></td>
                    <td>{naira(e.gross)}</td>
                    <td className="text-muted">{naira(e.commission)}</td>
                    <td className="font-semibold text-white">{naira(e.amount)}</td>
                    <td><span className={`badge ${EARN_BADGE[e.status][0]}`}>{EARN_BADGE[e.status][1]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted">No sales yet.</p>
        )}
      </section>

      {(withdrawals.length > 0 || payments.length > 0) && (
        <div className="flex flex-wrap gap-5">
          {withdrawals.length > 0 && (
            <section aria-labelledby="wds" className="card min-w-0 flex-[1_1_300px] p-6">
              <h2 id="wds" className="mb-4 text-lg font-semibold text-white">Withdrawals</h2>
              <ul className="space-y-3">
                {withdrawals.map((w) => (
                  <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3">
                    <div><div className="font-semibold text-white">{naira(w.amount)}</div><div className="text-[13px] text-muted">{formatDate(w.createdAt)}{w.reviewNote ? ` · ${w.reviewNote}` : ''}</div></div>
                    <span className={`badge ${WD_BADGE[w.status][0]}`}>{WD_BADGE[w.status][1]}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {payments.length > 0 && (
            <section aria-labelledby="plans" className="card min-w-0 flex-[1_1_300px] p-6">
              <h2 id="plans" className="mb-4 text-lg font-semibold text-white">Plan payments</h2>
              <ul className="space-y-3">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3">
                    <div><div className="font-semibold text-white">{naira(p.amount)}</div><div className="text-[13px] text-muted">{formatDate(p.createdAt)}</div></div>
                    <span className={`badge ${PAY_BADGE[p.status][0]}`}>{PAY_BADGE[p.status][1]}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <p className="text-sm text-muted">
        Questions? <a href={whatsappLink('Hi, I have a question about selling on DeeDee’s Marketplace')} className="font-semibold text-accent-text">WhatsApp {site.whatsappDisplay}</a>
      </p>
    </>
  );
}
