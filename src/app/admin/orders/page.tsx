import Link from 'next/link';
import type { OrderStatus as Status } from '@prisma/client';
import { prisma } from '@/lib/db';
import { formatDate, naira } from '@/lib/format';
import { refundOrder, resolveOrder } from '@/app/actions/admin';
import OrderStatus from '@/components/OrderStatus';
import SubmitButton from '@/components/SubmitButton';

export const metadata = { title: 'Orders' };
export const dynamic = 'force-dynamic';

const FILTERS: [Status | undefined, string][] = [
  [undefined, 'All'],
  ['DISPUTED', 'Problems'],
  ['ESCROW', 'Awaiting confirmation'],
  ['COMPLETED', 'Completed'],
  ['REFUNDED', 'Refunded'],
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const status = FILTERS.find(([s]) => s === sp.status)?.[0];

  const orders = await prisma.order.findMany({
    where: status ? { status } : {},
    include: {
      user: { select: { name: true, email: true, phone: true } },
      listing: { select: { title: true, platform: true } },
      credential: { select: { login: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Orders</h1>
        <p className="mt-1 text-muted">Refund an order to return the money to the customer’s wallet.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([s, label]) => (
          <Link
            key={label}
            href={s ? `/admin/orders?status=${s}` : '/admin/orders'}
            className={`rounded-full border px-3.5 py-2 text-sm font-medium ${status === s ? 'border-accent bg-accent text-white' : 'border-line2 text-soft hover:text-white'}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <section className="card p-6">
        {orders.length ? (
          <div className="table-wrap">
            <table className="data-table min-w-[900px]">
              <thead>
                <tr><th scope="col">Customer</th><th scope="col">Item</th><th scope="col">Login sold</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Date</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <div className="text-white">{o.user.name}</div>
                      <a href={`https://wa.me/${o.user.phone}`} target="_blank" rel="noopener noreferrer" className="text-[13px] text-accent-text">
                        WhatsApp customer
                      </a>
                    </td>
                    <td><div className="text-soft">{o.listing.title}</div><div className="text-[13px] text-muted">{o.listing.platform}</div></td>
                    <td className="break-all font-mono text-soft">{o.credential.login}</td>
                    <td className="text-white">{naira(o.amount)}</td>
                    <td><OrderStatus status={o.status} /></td>
                    <td className="whitespace-nowrap text-muted">
                      {formatDate(o.createdAt)}
                      <a href={`/receipt/${o.id}`} className="ml-2 text-xs font-medium text-accent-text">Receipt</a>
                    </td>
                    <td>
                      {(o.status === 'DISPUTED' || o.status === 'ESCROW') && (
                        <div className="flex gap-2">
                          <form action={resolveOrder}>
                            <input type="hidden" name="orderId" value={o.id} />
                            <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">Mark complete</SubmitButton>
                          </form>
                          <form action={refundOrder}>
                            <input type="hidden" name="orderId" value={o.id} />
                            <SubmitButton className="btn btn-danger btn-sm" pendingText="…">Refund</SubmitButton>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-muted">No orders here.</p>
        )}
      </section>
    </>
  );
}
