import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { formatDate, naira, signedNaira } from '@/lib/format';
import { paystackEnabled } from '@/lib/paystack';
import { site, whatsappLink } from '@/lib/site';
import FundForm from './FundForm';

export const metadata = { title: 'Wallet' };

const STATUS: Record<string, string> = {
  SUCCESS: 'text-success',
  PENDING: 'text-warn',
  FAILED: 'text-danger',
};

export default async function WalletPage({ searchParams }: { searchParams: Promise<{ funded?: string; failed?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const tx = await prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 });

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Wallet</h1>
        <p className="mt-1 text-muted">Top up once and buy instantly.</p>
      </div>

      {sp.funded && <p role="status" className="alert-ok">Payment received. Your wallet has been topped up.</p>}
      {sp.failed && (
        <p role="alert" className="alert-error">
          We couldn’t confirm that payment. If you were charged, it will show up here within a few minutes, or contact support.
        </p>
      )}

      <div className="flex flex-wrap gap-5">
        <section aria-labelledby="fund" className="card min-w-0 flex-[1_1_320px] p-6">
          <div className="text-sm text-muted">Available balance</div>
          <div className="font-display text-4xl font-bold text-white">{naira(user.balance)}</div>
          <h2 id="fund" className="mb-3 mt-6 text-lg font-semibold text-white">Add money</h2>
          {paystackEnabled() ? (
            <FundForm />
          ) : (
            <p className="text-sm text-muted">Online payments are being set up.</p>
          )}
          <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
            Prefer bank transfer?{' '}
            <a href={whatsappLink(`Hi, I want to fund my wallet. My email is ${user.email}`)} className="font-semibold text-accent-text">
              Message us on WhatsApp ({site.whatsappDisplay})
            </a>{' '}
            and we’ll credit you manually.
          </p>
        </section>

        <section aria-labelledby="history" className="card min-w-0 flex-[1_1_420px] p-6">
          <h2 id="history" className="mb-2 text-lg font-semibold text-white">Transaction history</h2>
          {tx.length ? (
            <ul>
              {tx.map((t) => (
                <li key={t.id} className="flex justify-between gap-3 border-t border-line py-3 first:border-t-0">
                  <div className="min-w-0">
                    <div className="truncate text-white">{t.description}</div>
                    <div className="text-[13px] text-muted">
                      {formatDate(t.createdAt)}
                      {t.status !== 'SUCCESS' && <span className={`ml-2 ${STATUS[t.status]}`}>· {t.status.toLowerCase()}</span>}
                    </div>
                  </div>
                  <div className={`shrink-0 font-semibold ${t.status !== 'SUCCESS' ? 'text-muted line-through' : t.amount < 0 ? 'text-text' : 'text-success'}`}>
                    {signedNaira(t.amount)}
                  </div>
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
