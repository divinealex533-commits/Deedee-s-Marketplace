import Link from 'next/link';
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Check, Gift, Headphones, Hourglass, Package, ShoppingBag, Sparkles, Wallet,
} from 'lucide-react';
import { SiTelegram } from 'react-icons/si';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { autoCompleteOrders } from '@/lib/orders';
import { formatDate, naira, signedNaira } from '@/lib/format';
import { displayBalance } from '@/lib/displayBalance';
import { tgLink } from '@/lib/site';
import WelcomeToast from '@/components/WelcomeToast';
import CategoryTile from '@/components/CategoryTile';
import { getTelegramConfig } from '@/lib/settings';
import OrderCard from './OrderCard';

export const metadata = { title: 'Dashboard' };

/** "Good morning" etc. in Lagos time */
function greeting() {
  const h = Number(new Date().toLocaleString('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', hour12: false }));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ bought?: string; welcome?: string; disputed?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const telegram = await getTelegramConfig();
  await autoCompleteOrders().catch(() => 0);

  const [orders, tx, funded, stockRows] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      include: { listing: { select: { id: true, title: true, platform: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.transaction.findMany({ where: { userId: user.id, status: 'SUCCESS' }, orderBy: { createdAt: 'desc' }, take: 6 }),
    prisma.transaction.count({ where: { userId: user.id, type: 'FUNDING', status: 'SUCCESS' } }),
    prisma.listing.findMany({
      where: { active: true, credentials: { some: { status: 'AVAILABLE' } } },
      select: { platform: true, category: { select: { name: true, emoji: true, order: true } }, _count: { select: { credentials: { where: { status: 'AVAILABLE' } } } } },
    }),
  ]);

  const myReviews = await prisma.review.findMany({ where: { userId: user.id }, select: { listingId: true, rating: true, comment: true } });
  const reviewFor = new Map(myReviews.map((r) => [r.listingId, { rating: r.rating, comment: r.comment }]));
  const spent = orders.filter((o) => o.status !== 'REFUNDED').reduce((a, o) => a + o.amount, 0);
  const awaiting = orders.filter((o) => o.status === 'ESCROW').length;
  const firstName = user.name.split(' ')[0];
  const balance = displayBalance(user);

  // Categories with stock, for the "Shop by category" row
  const cats = new Map<string, { name: string; emoji: string; order: number; stock: number }>();
  for (const l of stockRows) {
    const name = l.category?.name ?? l.platform;
    const c = cats.get(name) ?? { name, emoji: l.category?.emoji ?? '', order: l.category?.order ?? 1000, stock: 0 };
    c.stock += l._count.credentials;
    cats.set(name, c);
  }
  const categories = [...cats.values()].sort((a, b) => a.order - b.order || b.stock - a.stock).slice(0, 8);

  // First-time checklist
  const checklist = [
    { done: funded > 0 || balance > 0, label: 'Fund your wallet', hint: 'Bank transfer + receipt', href: '/dashboard/wallet' },
    { done: orders.length > 0, label: 'Buy your first account', hint: 'Preview before you pay', href: '/dashboard/marketplace' },
    ...(telegram.channel ? [{ done: false, label: 'Join our Telegram channel', hint: 'New stock and deals first', href: tgLink(telegram.channel), external: true }] : []),
  ];
  const showChecklist = orders.length === 0;
  const doneCount = checklist.filter((c) => c.done).length;

  const actions = [
    { href: '/dashboard/marketplace', label: 'Shop now', icon: ShoppingBag, tone: 'from-[#8B73FF] to-[#4A2FD6]' },
    { href: '/dashboard/wallet', label: 'Fund wallet', icon: Wallet, tone: 'from-[#34D399] to-[#0E7C4A]' },
    { href: '/dashboard/orders', label: 'My orders', icon: Package, tone: 'from-[#60A5FA] to-[#1D4ED8]' },
    { href: '/dashboard/referrals', label: 'Refer & earn', icon: Gift, tone: 'from-[#F472B6] to-[#BE185D]' },
  ];

  return (
    <>
      {(sp.welcome === 'new' || sp.welcome === 'back') && <WelcomeToast kind={sp.welcome} name={firstName} channel={telegram.channel} />}

      {sp.bought && (
        <p role="status" className="alert-ok">
          Purchase complete. Your login details are below. Check the account, then tap “It works” or report a problem.
        </p>
      )}
      {sp.disputed && <p role="status" className="alert-ok">Thanks for letting us know. Our team will review it and contact you shortly.</p>}

      {/* ── Welcome + wallet ── */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-accent via-[#5236D6] to-[#2A1A8F] p-6 text-white shadow-2xl shadow-accent/30 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-success/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[15px] font-medium text-white/80">{greeting()}, {firstName} 👋</p>
            <p className="mt-4 text-sm text-white/75">Wallet balance</p>
            <p className="font-display text-[clamp(36px,6vw,52px)] font-bold leading-none tracking-tight">{naira(balance)}</p>
            <p className="mt-2 text-sm text-white/75">{balance > 0 ? 'Ready to spend. Wallet orders deliver instantly.' : 'Fund your wallet to buy in one tap.'}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/dashboard/wallet" className="btn bg-white px-5 font-semibold text-[#2A1A8F] hover:bg-white/90">
              <Wallet className="h-4 w-4" aria-hidden="true" /> Fund wallet
            </Link>
            <Link href="/dashboard/marketplace" className="btn border border-white/30 bg-white/10 px-5 font-semibold text-white backdrop-blur hover:bg-white/20">
              Shop now <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Quick actions ── */}
      <nav aria-label="Quick actions" className="grid grid-cols-4 gap-3">
        {actions.map(({ href, label, icon: Icon, tone }) => (
          <Link key={href} href={href} className="group flex flex-col items-center gap-2 rounded-2xl border border-line bg-panel p-3 text-center transition hover:-translate-y-0.5 hover:border-line2 sm:p-4">
            <span className={`theme-fixed flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tone} shadow-lg shadow-black/30 transition group-hover:scale-105`}>
              <Icon className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
            <span className="text-[12px] font-semibold leading-tight text-soft sm:text-sm">{label}</span>
          </Link>
        ))}
      </nav>

      {/* ── Getting started (until the first purchase) ── */}
      {showChecklist && (
        <section aria-labelledby="start" className="glow-card card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id="start" className="flex items-center gap-2 text-lg font-semibold text-white"><Sparkles className="h-5 w-5 text-accent-text" aria-hidden="true" /> Get started</h2>
            <span className="text-sm text-muted">{doneCount}/{checklist.length} done</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
          </div>
          <ol className="mt-4 space-y-2.5">
            {checklist.map((c, i) => {
              const inner = (
                <>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${c.done ? 'bg-success text-[#052E1F]' : 'bg-accent/15 text-accent-text'}`}>
                    {c.done ? <Check className="h-5 w-5" aria-label="Done" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block font-semibold ${c.done ? 'text-muted line-through' : 'text-white'}`}>{c.label}</span>
                    <span className="block text-[13px] text-muted">{c.hint}</span>
                  </span>
                  {!c.done && <ArrowRight className="h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />}
                </>
              );
              const cls = 'flex items-center gap-3 rounded-2xl border border-line bg-panel2 p-3 transition hover:border-accent/60';
              return (
                <li key={c.label}>
                  {'external' in c && c.external ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                  ) : (
                    <Link href={c.href} className={cls}>{inner}</Link>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ── Stats ── */}
      <section aria-label="Summary" className="grid grid-cols-3 gap-3">
        {[
          { label: 'Bought', value: orders.length.toLocaleString(), icon: ShoppingBag, tile: 'bg-[#0F3B2C] text-success' },
          { label: 'Spent', value: naira(spent), icon: ArrowUpRight, tile: 'bg-accent/15 text-accent-text' },
          { label: 'To confirm', value: awaiting.toLocaleString(), icon: Hourglass, tile: 'bg-[#3D2E0A] text-warn' },
        ].map(({ label, value, icon: Icon, tile }) => (
          <div key={label} className="rounded-2xl border border-line bg-gradient-to-br from-panel to-panel2 p-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tile}`}><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
            <div className="mt-3 truncate font-display text-[clamp(20px,3vw,28px)] font-bold leading-tight text-white">{value}</div>
            <div className="text-[13px] text-muted">{label}</div>
          </div>
        ))}
      </section>
      {awaiting > 0 && (
        <p className="alert-ok">
          You have {awaiting} order{awaiting === 1 ? '' : 's'} to check. Open {awaiting === 1 ? 'it' : 'them'} below and tap “It works”, or report a problem.
        </p>
      )}

      {/* ── Shop by category ── */}
      {categories.length > 0 && (
        <section aria-labelledby="cats">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="cats" className="text-lg font-semibold text-white">Shop by category</h2>
            <Link href="/dashboard/marketplace" className="text-sm font-medium text-accent-text">See all</Link>
          </div>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/dashboard/marketplace?category=${encodeURIComponent(c.name)}`}
                className="flex w-36 shrink-0 flex-col gap-3 rounded-2xl border border-line bg-panel p-4 transition hover:-translate-y-0.5 hover:border-accent"
              >
                <CategoryTile name={c.name} emoji={c.emoji} size={44} />
                <span>
                  <span className="block truncate font-semibold text-white">{c.name}</span>
                  <span className="block text-[13px] text-success">{c.stock.toLocaleString()} in stock</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── My accounts ── */}
      <section aria-labelledby="mine" className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="mine" className="text-lg font-semibold text-white">My accounts</h2>
          {orders.length > 0 && <Link href="/dashboard/orders" className="btn btn-ghost btn-sm">All orders</Link>}
        </div>
        {orders.length ? (
          <div className="space-y-3">
            {orders.slice(0, 5).map((o) => (
              <OrderCard
                key={o.id}
                id={o.id}
                listingId={o.listing.id}
                review={reviewFor.get(o.listing.id) ?? null}
                title={o.listing.title}
                platform={o.listing.platform}
                amount={naira(o.amount)}
                date={formatDate(o.createdAt)}
                status={o.status}
              />
            ))}
            {orders.length > 5 && (
              <Link href="/dashboard/orders" className="block rounded-xl border border-dashed border-line2 py-3 text-center text-sm font-medium text-accent-text hover:border-accent">
                See all {orders.length} orders
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15"><Package className="h-8 w-8 text-accent-text" aria-hidden="true" /></span>
            <p className="mt-4 font-semibold text-white">No accounts yet</p>
            <p className="mt-1 text-muted">Everything you buy shows up here, ready to copy.</p>
            <Link href="/dashboard/marketplace" className="btn btn-primary mt-5">Browse the marketplace <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        )}
      </section>

      {/* ── Activity + help ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="activity" className="card p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="activity" className="text-lg font-semibold text-white">Recent activity</h2>
            <Link href="/dashboard/wallet" className="text-sm font-medium text-accent-text">See all</Link>
          </div>
          {tx.length ? (
            <ul>
              {tx.map((t) => {
                const inflow = t.amount >= 0;
                return (
                  <li key={t.id} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${inflow ? 'bg-[#0F3B2C] text-success' : 'bg-accent/15 text-accent-text'}`}>
                      {inflow ? <ArrowDownLeft className="h-5 w-5" aria-hidden="true" /> : <ArrowUpRight className="h-5 w-5" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-white">{t.description}</div>
                      <div className="text-[13px] text-muted">{formatDate(t.createdAt)}</div>
                    </div>
                    <div className={`shrink-0 font-semibold ${inflow ? 'text-success' : 'text-text'}`}>{signedNaira(t.amount)}</div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-muted">No activity yet. Your deposits and purchases will show here.</p>
          )}
        </section>

        <aside className="space-y-3">
          <Link href="/dashboard/support" className="card flex items-center gap-4 p-5 transition hover:border-line2">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15"><Headphones className="h-6 w-6 text-accent-text" aria-hidden="true" /></span>
            <span className="min-w-0">
              <span className="block font-semibold text-white">Need help?</span>
              <span className="block text-[13px] text-muted">Real people on WhatsApp, any time</span>
            </span>
          </Link>
          {telegram.channel && (
            <a href={tgLink(telegram.channel)} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-5 transition hover:border-[#229ED9]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#229ED9]"><SiTelegram className="h-6 w-6 text-white" aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="block font-semibold text-white">Telegram channel</span>
                <span className="block text-[13px] text-muted">New stock and deals first</span>
              </span>
            </a>
          )}
          <Link href="/dashboard/referrals" className="card flex items-center gap-4 p-5 transition hover:border-line2">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#3A1530]"><Gift className="h-6 w-6 text-[#F9A8D4]" aria-hidden="true" /></span>
            <span className="min-w-0">
              <span className="block font-semibold text-white">Invite a friend</span>
              <span className="block text-[13px] text-muted">Earn a bonus when they fund</span>
            </span>
          </Link>
        </aside>
      </div>
    </>
  );
}
