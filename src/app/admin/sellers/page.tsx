import { prisma } from '@/lib/db';
import { formatDate, naira, timeAgo } from '@/lib/format';
import { getSellerConfig, sellerActive } from '@/lib/seller';
import ActionForm from '@/components/ActionForm';
import CopyButton from '@/components/CopyButton';
import {
  approveEarnings, approveSellerPayment, markWithdrawalPaid, rejectEarning, rejectSellerPayment, rejectWithdrawal, saveSellerConfig,
} from '@/app/actions/seller-admin';

export const metadata = { title: 'Sellers' };
export const dynamic = 'force-dynamic';

const PAY_REASONS = ['Payment not received', 'Amount is less than the plan fee', 'Screenshot unclear, please resend'];

export default async function SellersPage() {
  const cfg = await getSellerConfig();
  const [payments, earnings, withdrawals, sellers] = await Promise.all([
    prisma.sellerSubscription.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, amount: true, senderName: true, createdAt: true, user: { select: { name: true, email: true, phone: true, referralCode: true } }, bankAccount: { select: { bankName: true, accountNumber: true } } },
    }),
    prisma.sellerEarning.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: {
        seller: { select: { id: true, name: true } },
        listing: { select: { title: true } },
        order: { select: { status: true, user: { select: { name: true } } } },
      },
    }),
    prisma.withdrawal.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'asc' }, include: { seller: { select: { name: true, phone: true } } } }),
    prisma.user.findMany({
      where: { accountType: 'SELLER' },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, name: true, email: true, phone: true, accountType: true, sellerUntil: true, sellerBalance: true, _count: { select: { sellerListings: true } } },
    }),
  ]);

  // Group pending earnings by seller so you can approve a seller's sales in one tap
  const bySeller = new Map<string, { name: string; total: number; rows: typeof earnings }>();
  for (const e of earnings) {
    const g = bySeller.get(e.seller.id) ?? { name: e.seller.name, total: 0, rows: [] };
    g.total += e.amount;
    g.rows.push(e);
    bySeller.set(e.seller.id, g);
  }

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Sellers</h1>
        <p className="mt-1 text-muted">Approve plan payments, approve sellers’ money from sales, and pay their withdrawals.</p>
      </div>

      {/* ── Plan payments ── */}
      <section aria-labelledby="plans">
        <h2 id="plans" className="mb-3 text-xl font-semibold text-white">Plan payments ({payments.length})</h2>
        {payments.length ? (
          <div className="space-y-4">
            {payments.map((p) => (
              <article key={p.id} className="card flex flex-wrap gap-6 p-5">
                <a href={`/api/seller-payments/${p.id}/proof`} target="_blank" rel="noopener noreferrer" className="block w-full shrink-0 overflow-hidden rounded-xl border border-line2 bg-ink sm:w-48" aria-label={`Open receipt from ${p.user.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/seller-payments/${p.id}/proof`} alt={`Receipt from ${p.user.name}`} loading="lazy" className="h-56 w-full object-contain" />
                  <span className="block border-t border-line py-1.5 text-center text-xs text-accent-text">Open full size</span>
                </a>
                <dl className="grid min-w-0 flex-[1_1_240px] grid-cols-[auto_1fr] content-start gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-muted">Plan fee</dt><dd className="font-display text-2xl font-bold text-white">{naira(p.amount)}</dd>
                  <dt className="text-muted">Seller</dt><dd className="text-white">{p.user.name} <span className="text-muted">· {p.user.phone}</span></dd>
                  <dt className="text-muted">Narration code</dt><dd className="font-mono text-white">{p.user.referralCode}</dd>
                  <dt className="text-muted">Paid from</dt><dd className="text-white">{p.senderName}</dd>
                  <dt className="text-muted">Paid into</dt><dd className="text-white">{p.bankAccount ? `${p.bankAccount.bankName} · ${p.bankAccount.accountNumber}` : 'Deleted account'}</dd>
                  <dt className="text-muted">Sent</dt><dd className="text-soft">{timeAgo(p.createdAt)}</dd>
                </dl>
                <div className="w-full space-y-3 sm:w-64">
                  <ActionForm action={approveSellerPayment} submit="Approve: open shop 30 days" pendingText="Approving…">
                    <input type="hidden" name="id" value={p.id} />
                  </ActionForm>
                  <ActionForm action={rejectSellerPayment} submit="Reject" pendingText="Rejecting…" buttonClass="btn btn-danger w-full" className="space-y-2">
                    <input type="hidden" name="id" value={p.id} />
                    <label htmlFor={`r-${p.id}`} className="sr-only">Reason</label>
                    <select id={`r-${p.id}`} name="reason" className="input">{PAY_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
                  </ActionForm>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="card p-6 text-muted">No plan payments waiting.</p>}
      </section>

      {/* ── Earnings ── */}
      <section aria-labelledby="earn">
        <h2 id="earn" className="mb-1 text-xl font-semibold text-white">Sales to approve ({earnings.length})</h2>
        <p className="mb-3 text-sm text-muted">The amount shown is what the seller gets after your {cfg.commission}% fee. Approving adds it to their withdrawable balance.</p>
        {bySeller.size ? (
          <div className="space-y-4">
            {[...bySeller].map(([sellerId, g]) => (
              <article key={sellerId} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">{g.name}</div>
                    <div className="text-sm text-muted">{g.rows.length} sale{g.rows.length === 1 ? '' : 's'} · {naira(g.total)} to the seller</div>
                  </div>
                  <ActionForm action={approveEarnings} submit={`Approve all ${naira(g.total)}`} pendingText="Approving…" buttonClass="btn btn-primary" className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="sellerId" value={sellerId} />
                  </ActionForm>
                </div>
                <div className="table-wrap mt-4">
                  <table className="data-table min-w-[720px]">
                    <thead><tr><th scope="col">Sale</th><th scope="col">Buyer</th><th scope="col">Price</th><th scope="col">Seller gets</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                    <tbody>
                      {g.rows.map((e) => (
                        <tr key={e.id}>
                          <td><div className="text-white">{e.listing.title}</div><div className="text-[13px] text-muted">{formatDate(e.createdAt)}{e.order.status === 'DISPUTED' ? ' · reported by buyer' : ''}</div></td>
                          <td className="text-soft">{e.order.user.name}</td>
                          <td>{naira(e.gross)}</td>
                          <td className="font-semibold text-white">{naira(e.amount)}</td>
                          <td>
                            <div className="flex gap-2">
                              <ActionForm action={approveEarnings} submit="Approve" pendingText="…" buttonClass="btn btn-ghost btn-sm" className="flex items-center gap-2">
                                <input type="hidden" name="id" value={e.id} />
                              </ActionForm>
                              <ActionForm action={rejectEarning} submit="Reject" pendingText="…" buttonClass="btn btn-danger btn-sm" className="flex items-center gap-2">
                                <input type="hidden" name="id" value={e.id} />
                              </ActionForm>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="card p-6 text-muted">No sales waiting for approval.</p>}
      </section>

      {/* ── Withdrawals ── */}
      <section aria-labelledby="wd">
        <h2 id="wd" className="mb-1 text-xl font-semibold text-white">Withdrawals to pay ({withdrawals.length})</h2>
        <p className="mb-3 text-sm text-muted">Send the money from your bank app first, then mark it paid. Rejecting returns the money to the seller’s balance.</p>
        {withdrawals.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {withdrawals.map((w) => (
              <article key={w.id} className="card space-y-3 p-5">
                <div className="font-display text-2xl font-bold text-white">{naira(w.amount)}</div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted">Seller</dt><dd className="text-white">{w.seller.name} · {w.seller.phone}</dd>
                  <dt className="text-muted">Bank</dt><dd className="text-white">{w.bankName}</dd>
                  <dt className="text-muted">Account</dt><dd className="flex items-center gap-2 font-mono text-white">{w.accountNumber} <CopyButton value={w.accountNumber} label="Account number" /></dd>
                  <dt className="text-muted">Name</dt><dd className="text-white">{w.accountName}</dd>
                  <dt className="text-muted">Requested</dt><dd className="text-soft">{timeAgo(w.createdAt)}</dd>
                </dl>
                <ActionForm action={markWithdrawalPaid} submit="I’ve sent it: mark paid" pendingText="Saving…">
                  <input type="hidden" name="id" value={w.id} />
                </ActionForm>
                <ActionForm action={rejectWithdrawal} submit="Reject" pendingText="Rejecting…" buttonClass="btn btn-danger w-full" className="space-y-2">
                  <input type="hidden" name="id" value={w.id} />
                  <label htmlFor={`wr-${w.id}`} className="sr-only">Reason</label>
                  <input id={`wr-${w.id}`} name="reason" placeholder="Reason (seller sees this)" className="input" />
                </ActionForm>
              </article>
            ))}
          </div>
        ) : <p className="card p-6 text-muted">No withdrawals waiting.</p>}
      </section>

      {/* ── All sellers ── */}
      <section aria-labelledby="all" className="card p-6">
        <h2 id="all" className="mb-4 text-lg font-semibold text-white">All sellers ({sellers.length})</h2>
        {sellers.length ? (
          <div className="table-wrap">
            <table className="data-table min-w-[720px]">
              <thead><tr><th scope="col">Seller</th><th scope="col">Plan</th><th scope="col">Listings</th><th scope="col">Withdrawable</th></tr></thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.id}>
                    <td><div className="text-white">{s.name}</div><div className="text-[13px] text-muted">{s.email} · {s.phone}</div></td>
                    <td>
                      {sellerActive(s)
                        ? <span className="badge bg-[#0F3B2C] text-success">Active until {s.sellerUntil!.toLocaleDateString('en-NG', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short' })}</span>
                        : <span className="badge bg-line text-soft">{s.sellerUntil ? 'Expired' : 'Not paid'}</span>}
                    </td>
                    <td>{s._count.sellerListings}</td>
                    <td>{naira(s.sellerBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-muted">No sellers yet.</p>}
      </section>

      {/* ── Settings ── */}
      <section aria-labelledby="cfg" className="card max-w-xl p-6">
        <h2 id="cfg" className="mb-4 text-lg font-semibold text-white">Seller settings</h2>
        <ActionForm action={saveSellerConfig} submit="Save settings" buttonClass="btn btn-ghost w-full">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="c-fee" className="label">Monthly plan (₦)</label>
              <input id="c-fee" name="monthlyFee" type="number" min={0} step={1} defaultValue={cfg.monthlyFee} className="input" />
            </div>
            <div>
              <label htmlFor="c-com" className="label">Your fee per sale (%)</label>
              <input id="c-com" name="commission" type="number" min={0} max={100} step="any" defaultValue={cfg.commission} className="input" />
            </div>
            <div>
              <label htmlFor="c-min" className="label">Min. withdrawal (₦)</label>
              <input id="c-min" name="minWithdrawal" type="number" min={0} step={1} defaultValue={cfg.minWithdrawal} className="input" />
            </div>
          </div>
        </ActionForm>
      </section>
    </>
  );
}
