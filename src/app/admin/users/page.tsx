import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatDate, naira } from '@/lib/format';
import { toggleBan } from '@/app/actions/admin';
import SubmitButton from '@/components/SubmitButton';
import CreditForm from './CreditForm';
import ResetPassword from './ResetPassword';

export const metadata = { title: 'Users' };
export const dynamic = 'force-dynamic';

const PAGE = 50;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim();
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { email: { contains: q, mode: 'insensitive' as const } },
          { phone: { contains: q.replace(/\D/g, '') || q } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { _count: { select: { orders: true } } },
    }),
    prisma.user.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (p: number) => `/admin/users?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Users</h1>
          <p className="mt-1 text-muted">{total.toLocaleString()} {q ? 'matching' : 'registered'}. Use “Add funds” for bank transfers you’ve received.</p>
        </div>
        <form role="search" className="w-full sm:w-72">
          <label htmlFor="q" className="sr-only">Search users</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search name, email or phone…" className="input py-2.5" />
        </form>
      </div>

      <section className="card p-6">
        {users.length ? (
          <div className="table-wrap">
            <table className="data-table min-w-[1080px]">
              <thead>
                <tr><th scope="col">User</th><th scope="col">Phone</th><th scope="col">Type</th><th scope="col">Balance</th><th scope="col">Orders</th><th scope="col">Joined</th><th scope="col">Add funds</th><th scope="col"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={u.banned ? 'opacity-60' : ''}>
                    <td>
                      <div className="text-white">{u.name} {u.role === 'ADMIN' && <span className="badge ml-1 bg-accent text-white">Admin</span>}</div>
                      <div className="text-[13px] text-muted">{u.email}</div>
                    </td>
                    <td className="whitespace-nowrap text-soft">
                      {u.phone.startsWith('234') ? '0' + u.phone.slice(3) : u.phone}
                    </td>
                    <td className="text-soft">{u.accountType === 'SELLER' ? 'Seller' : 'Buyer'}</td>
                    <td className="text-white">{naira(u.balance)}</td>
                    <td className="text-soft">{u._count.orders}</td>
                    <td className="whitespace-nowrap text-muted">{formatDate(u.createdAt)}</td>
                    <td><CreditForm userId={u.id} /></td>
                    <td>
                      {u.role !== 'ADMIN' && (
                        <div className="flex flex-col items-start gap-2">
                        <ResetPassword userId={u.id} phone={u.phone} />
                        <form action={toggleBan}>
                          <input type="hidden" name="userId" value={u.id} />
                          <SubmitButton className={u.banned ? 'btn btn-ghost btn-sm' : 'btn btn-danger btn-sm'} pendingText="…">
                            {u.banned ? 'Unban' : 'Ban'}
                          </SubmitButton>
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
          <p className="py-8 text-center text-muted">No users found.</p>
        )}
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
            {page > 1 ? <Link href={link(page - 1)} className="btn btn-ghost btn-sm">← Previous</Link> : <span />}
            <span className="text-muted">Page {page} of {pages}</span>
            {page < pages ? <Link href={link(page + 1)} className="btn btn-ghost btn-sm">Next →</Link> : <span />}
          </nav>
        )}
      </section>
    </>
  );
}
