import Link from 'next/link';
import { Eye, KeyRound, ShoppingBag, UserPlus, Users } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatDate, initials, lagosDay, naira, startOfLagosDay, timeAgo } from '@/lib/format';
import StatCard from '@/components/StatCard';
import OrderStatus from '@/components/OrderStatus';

export const metadata = { title: 'Overview' };
export const dynamic = 'force-dynamic';

const DAY = 24 * 60 * 60 * 1000;

export default async function AdminOverview() {
  const today = startOfLagosDay();
  const yesterday = new Date(today.getTime() - DAY);
  const weekStart = new Date(today.getTime() - 6 * DAY);

  const [
    totalUsers, newToday, newYesterday, visitorsToday, onlineNow,
    ordersToday, salesToday, salesAll, inStock, disputes, weekUsers, recentUsers, recentOrders, lowStock,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.user.count({ where: { role: 'USER', createdAt: { gte: today } } }),
    prisma.user.count({ where: { role: 'USER', createdAt: { gte: yesterday, lt: today } } }),
    prisma.visit.count({ where: { day: lagosDay() } }),
    prisma.visit.count({ where: { lastSeen: { gte: new Date(Date.now() - 5 * 60 * 1000) } } }),
    prisma.order.count({ where: { createdAt: { gte: today }, status: { not: 'REFUNDED' } } }),
    prisma.order.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: today }, status: { not: 'REFUNDED' } } }),
    prisma.order.aggregate({ _sum: { amount: true }, where: { status: { not: 'REFUNDED' } } }),
    prisma.credential.count({ where: { status: 'AVAILABLE' } }),
    prisma.order.count({ where: { status: 'DISPUTED' } }),
    prisma.user.findMany({ where: { role: 'USER', createdAt: { gte: weekStart } }, select: { createdAt: true } }),
    prisma.user.findMany({ where: { role: 'USER' }, orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, name: true, accountType: true, createdAt: true } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { user: { select: { name: true } }, listing: { select: { title: true } } } }),
    prisma.listing.findMany({
      where: { active: true },
      include: { _count: { select: { credentials: { where: { status: 'AVAILABLE' } } } } },
    }),
  ]);

  // New users per day for the last 7 days (Lagos time)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * DAY);
    return { key: lagosDay(d), label: d.toLocaleDateString('en-NG', { weekday: 'short', timeZone: 'Africa/Lagos' }), count: 0 };
  });
  for (const u of weekUsers) {
    const day = days.find((d) => d.key === lagosDay(u.createdAt));
    if (day) day.count++;
  }
  const max = Math.max(1, ...days.map((d) => d.count));
  const weekTotal = days.reduce((a, d) => a + d.count, 0);
  const diff = newToday - newYesterday;
  const running = lowStock.filter((l) => l._count.credentials < 5);

  return (
    <>
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Overview</h1>
        <p className="mt-1 text-muted">What’s happening on your marketplace today.</p>
      </div>

      {disputes > 0 && (
        <Link href="/admin/orders?status=DISPUTED" className="alert-error block hover:opacity-90">
          {disputes} order{disputes === 1 ? ' has' : 's have'} a reported problem. Review now →
        </Link>
      )}

      <section aria-label="Today at a glance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total users" value={totalUsers.toLocaleString()} icon={<Users className="h-5 w-5 text-accent-text" aria-hidden="true" />} sub={`${weekTotal} joined this week`} />
        <StatCard
          label="New users today"
          value={newToday}
          icon={<UserPlus className="h-5 w-5 text-accent-text" aria-hidden="true" />}
          sub={<span className={diff >= 0 ? 'text-success' : 'text-danger'}>{diff >= 0 ? '+' : ''}{diff} vs yesterday</span>}
        />
        <StatCard label="Visitors today" value={visitorsToday} icon={<Eye className="h-5 w-5 text-accent-text" aria-hidden="true" />} sub={`${onlineNow} online now`} />
        <StatCard label="Orders today" value={ordersToday} icon={<ShoppingBag className="h-5 w-5 text-accent-text" aria-hidden="true" />} sub={`${naira(salesToday._sum.amount ?? 0)} in sales`} />
        <StatCard label="Credentials in stock" value={inStock.toLocaleString()} icon={<KeyRound className="h-5 w-5 text-accent-text" aria-hidden="true" />} sub={`${naira(salesAll._sum.amount ?? 0)} sold all-time`} />
      </section>

      <div className="flex flex-wrap gap-5">
        <section aria-labelledby="chart" className="card min-w-0 flex-[2_1_420px] p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="chart" className="text-lg font-semibold text-white">New users, last 7 days</h2>
            <span className="text-sm text-muted">{weekTotal} total</span>
          </div>
          <div className="mt-6 flex h-52 items-end gap-3 border-b border-line2" role="img" aria-label={days.map((d) => `${d.label}: ${d.count}`).join(', ')}>
            {days.map((d, i) => (
              <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[13px] text-soft">{d.count}</span>
                <div
                  className={`w-full max-w-[44px] rounded-t-lg ${i === days.length - 1 ? 'bg-accent' : 'bg-[#3A4270]'}`}
                  style={{ height: `${Math.max(4, (d.count / max) * 160)}px` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3">
            {days.map((d) => (
              <span key={d.key} className="flex-1 text-center text-[13px] text-muted">{d.label}</span>
            ))}
          </div>
        </section>

        <section aria-labelledby="joined" className="card min-w-0 flex-[1_1_300px] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="joined" className="text-lg font-semibold text-white">Newest users</h2>
            <Link href="/admin/users" className="text-sm font-medium text-accent-text">All users</Link>
          </div>
          {recentUsers.length ? (
            <ul className="space-y-3.5">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-line2 text-sm font-semibold text-white" aria-hidden="true">{initials(u.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white">{u.name}</div>
                    <div className="text-[13px] text-muted">{u.accountType === 'SELLER' ? 'Seller' : 'Buyer'} · {timeAgo(u.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-muted">No users yet.</p>
          )}
        </section>
      </div>

      {running.length > 0 && (
        <section aria-labelledby="low" className="card p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="low" className="text-lg font-semibold text-white">Running low</h2>
            <Link href="/admin/credentials" className="text-sm font-medium text-accent-text">Add stock</Link>
          </div>
          <ul className="flex flex-wrap gap-2">
            {running.map((l) => (
              <li key={l.id} className={`badge ${l._count.credentials ? 'bg-[#3D2E0A] text-warn' : 'bg-[#3A1520] text-danger'}`}>
                {l.title}: {l._count.credentials} left
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="orders" className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="orders" className="text-lg font-semibold text-white">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-accent-text">All orders</Link>
        </div>
        {recentOrders.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th scope="col">Buyer</th><th scope="col">Item</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">When</th></tr></thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="text-white">{o.user.name}</td>
                    <td className="text-soft">{o.listing.title}</td>
                    <td className="text-white">{naira(o.amount)}</td>
                    <td><OrderStatus status={o.status} /></td>
                    <td className="text-muted">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-6 text-center text-muted">No orders yet.</p>
        )}
      </section>
    </>
  );
}
