import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle, ArrowRight, Banknote, CheckCircle2, CreditCard, Eye, FolderTree, KeyRound, Megaphone, Package, Plus,
  Settings, ShoppingBag, Store, TrendingUp, Users,
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { initials, lagosDay, naira, startOfLagosDay, timeAgo } from '@/lib/format';
import { requireAdmin } from '@/lib/auth';
import { autoCompleteOrders } from '@/lib/orders';
import WelcomeToast from '@/components/WelcomeToast';
import OrderStatus from '@/components/OrderStatus';

export const metadata = { title: 'Overview' };
export const dynamic = 'force-dynamic';

const DAY = 24 * 60 * 60 * 1000;

/** Short money for chart labels: ₦12.5k, ₦1.2m */
function shortNaira(kobo: number) {
  const n = kobo / 100;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return `₦${Math.round(n)}`;
}

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const sp = await searchParams;
  const admin = await requireAdmin();
  await autoCompleteOrders().catch(() => 0);
  const firstName = admin.name.split(' ')[0];
  const hour = Number(new Date().toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Africa/Lagos' }));
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayLabel = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Lagos' });
  const today = startOfLagosDay();
  const yesterday = new Date(today.getTime() - DAY);
  const weekStart = new Date(today.getTime() - 6 * DAY);

  const [
    totalUsers, newToday, visitorsToday, onlineNow, ordersToday, salesToday, salesYesterday, salesAll, inStock, disputes,
    weekUsers, weekOrders, recentUsers, recentOrders, listings, pendingDeposits, pendingPayments,
    sellerPlans, sellerEarnings, withdrawals,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.user.count({ where: { role: 'USER', createdAt: { gte: today } } }),
    prisma.visit.count({ where: { day: lagosDay() } }),
    prisma.visit.count({ where: { lastSeen: { gte: new Date(Date.now() - 5 * 60 * 1000) } } }),
    prisma.order.count({ where: { createdAt: { gte: today }, status: { not: 'REFUNDED' } } }),
    prisma.order.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: today }, status: { not: 'REFUNDED' } } }),
    prisma.order.aggregate({ _sum: { amount: true }, where: { createdAt: { gte: yesterday, lt: today }, status: { not: 'REFUNDED' } } }),
    prisma.order.aggregate({ _sum: { amount: true }, _count: true, where: { status: { not: 'REFUNDED' } } }),
    prisma.credential.count({ where: { status: 'AVAILABLE', listing: { active: true } } }),
    prisma.order.count({ where: { status: 'DISPUTED' } }),
    prisma.user.findMany({ where: { role: 'USER', createdAt: { gte: weekStart } }, select: { createdAt: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: weekStart }, status: { not: 'REFUNDED' } }, select: { createdAt: true, amount: true } }),
    prisma.user.findMany({ where: { role: 'USER' }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, accountType: true, createdAt: true } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { user: { select: { name: true } }, listing: { select: { title: true } } } }),
    prisma.listing.findMany({ where: { active: true }, select: { id: true, title: true, _count: { select: { credentials: { where: { status: 'AVAILABLE' } } } } } }),
    prisma.deposit.aggregate({ where: { status: 'PENDING' }, _count: true, _sum: { amount: true } }),
    prisma.checkout.aggregate({ where: { status: 'UNDER_REVIEW' }, _count: true, _sum: { amount: true } }),
    prisma.sellerSubscription.count({ where: { status: 'PENDING' } }),
    prisma.sellerEarning.count({ where: { status: 'PENDING' } }),
    prisma.withdrawal.count({ where: { status: 'PENDING' } }),
  ]);

  // Last 7 days (Lagos time): sales and new users per day
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * DAY);
    return { key: lagosDay(d), label: d.toLocaleDateString('en-NG', { weekday: 'short', timeZone: 'Africa/Lagos' }), sales: 0, users: 0 };
  });
  for (const o of weekOrders) {
    const d = days.find((x) => x.key === lagosDay(o.createdAt));
    if (d) d.sales += o.amount;
  }
  for (const u of weekUsers) {
    const d = days.find((x) => x.key === lagosDay(u.createdAt));
    if (d) d.users++;
  }
  const maxSales = Math.max(1, ...days.map((d) => d.sales));
  const weekSales = days.reduce((a, d) => a + d.sales, 0);
  const weekUsersTotal = days.reduce((a, d) => a + d.users, 0);

  const todaySales = salesToday._sum.amount ?? 0;
  const yesterdaySales = salesYesterday._sum.amount ?? 0;
  const salesDiff = todaySales - yesterdaySales;

  const running = listings.filter((l) => l._count.credentials < 5).sort((a, b) => a._count.credentials - b._count.credentials);

  const sellerTasks = sellerPlans + sellerEarnings + withdrawals;
  const tasks: { href: string; icon: LucideIcon; count: number; label: string; sub: string; tone: string }[] = [
    { href: '/admin/payments', icon: CreditCard, count: pendingPayments._count, label: 'Order payments', sub: pendingPayments._count ? `${naira(pendingPayments._sum.amount ?? 0)} · customers waiting` : 'Nothing waiting', tone: 'text-[#7DB8FF] bg-[#10294A]' },
    { href: '/admin/deposits', icon: Banknote, count: pendingDeposits._count, label: 'Deposits', sub: pendingDeposits._count ? `${naira(pendingDeposits._sum.amount ?? 0)} to check` : 'Nothing waiting', tone: 'text-warn bg-[#3D2E0A]' },
    { href: '/admin/orders?status=DISPUTED', icon: AlertTriangle, count: disputes, label: 'Problem reports', sub: disputes ? 'Refund or resolve' : 'No reports', tone: 'text-danger bg-[#3A1520]' },
    { href: '/admin/sellers', icon: Store, count: sellerTasks, label: 'Seller requests', sub: sellerTasks ? [sellerPlans && `${sellerPlans} plan`, sellerEarnings && `${sellerEarnings} sale`, withdrawals && `${withdrawals} payout`].filter(Boolean).join(' · ') : 'Nothing waiting', tone: 'text-success bg-[#0F3B2C]' },
  ];
  const openTasks = tasks.reduce((a, t) => a + t.count, 0);

  const shortcuts: { href: string; icon: LucideIcon; label: string }[] = [
    { href: '/admin/credentials', icon: Plus, label: 'Add stock' },
    { href: '/admin/categories', icon: FolderTree, label: 'Categories' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/orders', icon: Package, label: 'Orders' },
    { href: '/admin/settings', icon: Megaphone, label: 'Announce' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {sp.welcome === 'back' && <WelcomeToast kind="back" name={firstName} admin />}

      {/* ── Today banner ── */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-accent via-[#5236D6] to-[#2A1A8F] p-6 text-white shadow-2xl shadow-accent/30 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-success/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[15px] font-medium text-white/80">{greeting}, {firstName} 👋 · {todayLabel}</p>
            <p className="mt-4 text-sm text-white/75">Sales today</p>
            <p className="font-display text-[clamp(36px,6vw,54px)] font-bold leading-none tracking-tight">{naira(todaySales)}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              {salesDiff >= 0 ? '+' : '−'}{naira(Math.abs(salesDiff))} vs yesterday
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">{ordersToday} order{ordersToday === 1 ? '' : 's'}</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">{newToday} new user{newToday === 1 ? '' : 's'}</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">{visitorsToday} visitor{visitorsToday === 1 ? '' : 's'}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1"><span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#6EE7B7]" />{onlineNow} online now</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/admin/credentials" className="btn bg-white px-5 font-semibold text-[#2A1A8F] hover:bg-white/90"><Plus className="h-4 w-4" aria-hidden="true" /> Add stock</Link>
            <Link href="/" className="btn border border-white/30 bg-white/10 px-5 font-semibold text-white backdrop-blur hover:bg-white/20"><Eye className="h-4 w-4" aria-hidden="true" /> View site</Link>
          </div>
        </div>
      </section>

      {/* ── Needs your attention ── */}
      <section aria-labelledby="todo">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="todo" className="text-lg font-semibold text-white">Needs your attention</h2>
          {openTasks === 0 && <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> All clear</span>}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tasks.map(({ href, icon: Icon, count, label, sub, tone }) => (
            <Link
              key={label}
              href={href}
              className={`group relative overflow-hidden rounded-2xl border p-4 transition hover:-translate-y-0.5 ${count ? 'border-line2 bg-panel shadow-lg shadow-black/20' : 'border-line bg-panel/60 opacity-80'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                {count > 0 && <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-accent px-2 text-sm font-bold text-white">{count}</span>}
              </div>
              <div className="mt-3 font-semibold text-white">{label}</div>
              <div className="truncate text-[13px] text-muted">{sub}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Shortcuts ── */}
      <nav aria-label="Shortcuts" className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {shortcuts.map(({ href, icon: Icon, label }) => (
          <Link key={label} href={href} className="group flex flex-col items-center gap-2 rounded-2xl border border-line bg-panel p-3 text-center transition hover:border-accent/60">
            <span className="theme-fixed flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B73FF] to-[#4A2FD6] shadow-lg shadow-accent/20 transition group-hover:scale-105">
              <Icon className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span className="text-[13px] font-semibold text-soft">{label}</span>
          </Link>
        ))}
      </nav>

      {/* ── Key numbers ── */}
      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Users, label: 'Total users', value: totalUsers.toLocaleString(), sub: `+${weekUsersTotal} this week`, tile: 'bg-accent/15 text-accent-text' },
          { icon: ShoppingBag, label: 'Sold all-time', value: naira(salesAll._sum.amount ?? 0), sub: `${salesAll._count.toLocaleString()} orders`, tile: 'bg-[#3A1530] text-[#F9A8D4]' },
          { icon: KeyRound, label: 'In stock', value: inStock.toLocaleString(), sub: running.length ? `${running.length} listing${running.length === 1 ? '' : 's'} running low` : 'Stock looks healthy', tile: 'bg-[#3D2E0A] text-warn' },
          { icon: TrendingUp, label: 'Sales this week', value: naira(weekSales), sub: 'Last 7 days', tile: 'bg-[#0F3B2C] text-success' },
        ].map(({ icon: Icon, label, value, sub, tile }) => (
          <div key={label} className="rounded-2xl border border-line bg-gradient-to-br from-panel to-panel2 p-4 sm:p-5">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tile}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
            <div className="mt-3 truncate font-display text-[clamp(20px,3vw,30px)] font-bold leading-tight text-white">{value}</div>
            <div className="text-sm text-muted">{label}</div>
            <div className="mt-1 truncate text-[12px] text-placeholder">{sub}</div>
          </div>
        ))}
      </section>

      {/* ── Charts ── */}
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <section aria-labelledby="sales-chart" className="card p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="sales-chart" className="text-lg font-semibold text-white">Sales, last 7 days</h2>
            <span className="text-sm text-muted">{naira(weekSales)} total</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-2 border-b border-line2 sm:gap-3" role="img" aria-label={days.map((d) => `${d.label}: ${naira(d.sales)}`).join(', ')}>
            {days.map((d, i) => (
              <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[11px] text-soft sm:text-[12px]">{d.sales ? shortNaira(d.sales) : ''}</span>
                <div
                  className={`w-full max-w-[46px] rounded-t-xl ${i === days.length - 1 ? 'bg-gradient-to-t from-accent to-[#8B72FF] shadow-lg shadow-accent/40' : 'bg-gradient-to-t from-[#2A3060] to-[#4A5290]'}`}
                  style={{ height: `${Math.max(4, (d.sales / maxSales) * 150)}px` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2 sm:gap-3">
            {days.map((d) => <span key={d.key} className="flex-1 text-center text-[12px] text-muted">{d.label}</span>)}
          </div>
        </section>

        <section aria-labelledby="joined" className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="joined" className="text-lg font-semibold text-white">Newest users</h2>
            <Link href="/admin/users" className="text-sm font-medium text-accent-text">All</Link>
          </div>
          {recentUsers.length ? (
            <ul className="space-y-3.5">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3">
                  <div className="theme-fixed flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#8B72FF] text-sm font-semibold text-white" aria-hidden="true">{initials(u.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white">{u.name}</div>
                    <div className="text-[13px] text-muted">{timeAgo(u.createdAt)}</div>
                  </div>
                  <span className={`badge ${u.accountType === 'SELLER' ? 'bg-[#0F3B2C] text-success' : 'bg-accent/15 text-accent-text'}`}>{u.accountType === 'SELLER' ? 'Seller' : 'Buyer'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-muted">No users yet.</p>
          )}
        </section>
      </div>

      {/* ── Running low ── */}
      {running.length > 0 && (
        <section aria-labelledby="low" className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="low" className="text-lg font-semibold text-white">Running low</h2>
            <Link href="/admin/credentials" className="btn btn-primary btn-sm"><Plus className="h-4 w-4" aria-hidden="true" /> Add stock</Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {running.slice(0, 8).map((l) => {
              const n = l._count.credentials;
              return (
                <li key={l.id}>
                  <Link href={`/admin/credentials?listing=${l.id}`} className="block rounded-xl border border-line bg-panel2 p-3 transition hover:border-line2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-white">{l.title}</span>
                      <span className={`shrink-0 font-semibold ${n ? 'text-warn' : 'text-danger'}`}>{n ? `${n} left` : 'Sold out'}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                      <div className={`h-full rounded-full ${n ? 'bg-warn' : 'bg-danger'}`} style={{ width: `${Math.max(4, (n / 5) * 100)}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── Recent orders ── */}
      <section aria-labelledby="orders" className="card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="orders" className="text-lg font-semibold text-white">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-medium text-accent-text">All orders</Link>
        </div>
        {recentOrders.length ? (
          <ul>
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-sm font-semibold text-accent-text" aria-hidden="true">{initials(o.user.name)}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-white">{o.listing.title}</div>
                  <div className="truncate text-[13px] text-muted">{o.user.name} · {timeAgo(o.createdAt)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-semibold text-white">{naira(o.amount)}</div>
                  <OrderStatus status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-muted">No orders yet.</p>
        )}
        <Link href="/admin/orders" className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line2 py-3 text-sm font-medium text-accent-text hover:border-accent">
          See all orders <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}
