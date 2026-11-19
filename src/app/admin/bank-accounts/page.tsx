import { Landmark } from 'lucide-react';
import { prisma } from '@/lib/db';
import { deleteBankAccount, toggleBankAccount } from '@/app/actions/admin';
import SubmitButton from '@/components/SubmitButton';
import AddBankForm from './AddBankForm';

export const metadata = { title: 'Bank accounts' };
export const dynamic = 'force-dynamic';

export default async function BankAccountsPage() {
  const banks = await prisma.bankAccount.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { deposits: true } } },
  });

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Bank accounts</h1>
        <p className="mt-1 text-muted">The accounts customers see on their Wallet page when they want to fund their wallet.</p>
      </div>

      <div className="flex flex-wrap gap-5">
        <section aria-labelledby="add-bank" className="card min-w-0 flex-[1_1_320px] p-6">
          <h2 id="add-bank" className="mb-4 text-lg font-semibold text-white">Add an account</h2>
          <AddBankForm />
        </section>

        <section aria-labelledby="banks" className="card min-w-0 flex-[2_1_420px] p-6">
          <h2 id="banks" className="mb-4 text-lg font-semibold text-white">Your accounts</h2>
          {banks.length ? (
            <ul className="space-y-3">
              {banks.map((b) => (
                <li key={b.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border border-line2 bg-panel2 p-4 ${b.active ? '' : 'opacity-60'}`}>
                  <Landmark className="h-6 w-6 shrink-0 text-accent-text" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white">{b.bankName} · <span className="font-mono">{b.accountNumber}</span></div>
                    <div className="text-sm text-muted">{b.accountName} · {b._count.deposits} deposits</div>
                  </div>
                  <span className={`badge ${b.active ? 'bg-[#0F3B2C] text-success' : 'bg-line text-soft'}`}>{b.active ? 'Shown to customers' : 'Hidden'}</span>
                  <form action={toggleBankAccount}>
                    <input type="hidden" name="id" value={b.id} />
                    <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">{b.active ? 'Hide' : 'Show'}</SubmitButton>
                  </form>
                  {b._count.deposits === 0 && (
                    <form action={deleteBankAccount}>
                      <input type="hidden" name="id" value={b.id} />
                      <SubmitButton className="btn btn-danger btn-sm" pendingText="…">Delete</SubmitButton>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-muted">No accounts yet. Add your 9PSB and PocketApp accounts so customers can pay.</p>
          )}
        </section>
      </div>
    </>
  );
}
