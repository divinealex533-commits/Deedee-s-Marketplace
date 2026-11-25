import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import {
  ArrowRight, BadgeCheck, Check, ChevronDown, Clock, Eye, Landmark, Lock, LogIn, MessageCircle, Phone, ReceiptText,
  ShieldCheck, ShoppingBag, Sparkles, Store, UserPlus, Wallet, Zap,
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { reviewAuthor } from '@/lib/reviews';
import ReviewCarousel from '@/components/ReviewCarousel';
import Stars from '@/components/Stars';
import { PLATFORMS, site, whatsappLink } from '@/lib/site';
import CategoryTile from '@/components/CategoryTile';
import { PlatformTile } from '@/components/PlatformIcon';
import { LogoMark } from '@/components/Logo';

// Numbers and stock refresh every 60 seconds: fast pages, quiet database.
const getHomeData = unstable_cache(
  async () => {
    try {
      const [users, delivered, inStock, listings] = await Promise.all([
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.order.count({ where: { status: { not: 'REFUNDED' } } }),
        prisma.credential.count({ where: { status: 'AVAILABLE', listing: { active: true } } }),
        prisma.listing.findMany({
          where: { active: true, credentials: { some: { status: 'AVAILABLE' } } },
          select: { platform: true, category: { select: { name: true, emoji: true, order: true } }, _count: { select: { credentials: { where: { status: 'AVAILABLE' } } } } },
        }),
      ]);
      // Homepage shows categories only; the listings themselves are in the marketplace after login
      // Grouped by category (Admin → Categories); listings without one are grouped by platform
      const byCategory = new Map<string, { name: string; emoji: string; order: number; stock: number }>();
      for (const l of listings) {
        const name = l.category?.name ?? l.platform;
        const g = byCategory.get(name) ?? { name, emoji: l.category?.emoji ?? '', order: l.category?.order ?? 1000, stock: 0 };
        g.stock += l._count.credentials;
        byCategory.set(name, g);
      }
      const categories = [...byCategory.values()].sort((a, b) => a.order - b.order || b.stock - a.stock);
      const [latest, overall] = await Promise.all([
        prisma.review.findMany({
          where: { hidden: false, comment: { not: '' }, rating: { gte: 4 } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { name: true } }, listing: { select: { title: true } } },
        }),
        prisma.review.aggregate({ where: { hidden: false }, _avg: { rating: true }, _count: { _all: true } }),
      ]);
      return {
        users,
        delivered,
        inStock,
        reviews: latest.map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, name: reviewAuthor(r), item: r.listing?.title ?? null, source: r.source })),
        overall: { avg: overall._avg.rating ?? 0, count: overall._count._all },
        categories,
      };
    } catch {
      return { users: 0, delivered: 0, inStock: 0, categories: [] as { name: string; emoji: string; order: number; stock: number }[], reviews: [], overall: { avg: 0, count: 0 } };
    }
  },
  ['home-data-v5'],
  { revalidate: 60 },
);

const POPULAR = PLATFORMS.filter((p) => p !== 'Other');

const faqs = [
  ['Is it free to create an account?', 'Yes. Signing up is free. You only pay for what you buy.'],
  ['How do I pay?', 'Open Wallet after you sign up, transfer to the account shown there from any Nigerian bank, and upload a screenshot of the receipt. We confirm it and credit your wallet, usually within minutes.'],
  ['How fast do I get my login?', 'Paying from your wallet? Instantly, in My orders. Paying by transfer at checkout? As soon as we confirm your payment.'],
  ['What if it doesn’t work?', 'Open the order and tap “Report a problem”. We check it and refund your wallet if it isn’t as described.'],
  ['Can I sell on DeeDee’s?', 'Yes. Sign up and choose “Sell” to open your own shop and get paid to your bank.'],
];

export default async function HomePage() {
  const { inStock, categories, reviews, overall } = await getHomeData();
  const shown: { name: string; emoji: string; stock: number }[] = categories.length
    ? categories
    : POPULAR.slice(0, 8).map((name) => ({ name, emoji: '', stock: 0 }));
  const top = shown.slice(0, 3);

  return (
    <>
      {/* ───────────── 1. HERO ───────────── */}
      <section id="home" className="relative overflow-hidden">
        <div aria-hidden="true" className="auth-grid pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="hero-blob pointer-events-none absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-accent/40" />
        <div aria-hidden="true" className="hero-blob pointer-events-none absolute -right-24 top-40 h-[380px] w-[380px] rounded-full bg-success/20 [animation-delay:-7s]" />

        <div className="container-x relative flex flex-wrap items-center gap-14 pb-16 pt-12 sm:pt-20 lg:pb-24">
          <div className="min-w-0 flex-[1_1_480px]">
            <p className="inline-flex items-center gap-2 rounded-full border border-line2 bg-panel/70 px-3.5 py-1.5 text-sm text-soft backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-success" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              {inStock > 0 ? `${inStock.toLocaleString()} items in stock now` : 'New stock added regularly'}
            </p>
            <h1 className="mt-6 font-display text-[clamp(42px,6.4vw,76px)] font-bold leading-[1.02] tracking-tight text-white">
              Premium accounts,
              <br />
              <span className="text-gradient">delivered fast.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Preview every item before you pay, fund your wallet from your bank app, and get your login straight in your dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn btn-primary group px-7 py-4 text-base shadow-xl shadow-accent/40">
                Create free account <ArrowRight className="h-[18px] w-[18px] transition group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link href="/login" className="btn btn-ghost px-7 py-4 text-base">
                <LogIn className="h-[18px] w-[18px]" aria-hidden="true" /> I already have an account
              </Link>
            </div>
            <ul className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-center">
              {[
                { icon: ShieldCheck, label: 'Refund protection' },
                { icon: Lock, label: 'Private & encrypted' },
                { icon: MessageCircle, label: '24/7 support' },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="rounded-2xl border border-line bg-panel/60 px-2 py-3 text-[13px] text-soft backdrop-blur sm:text-sm">
                  <Icon className="mx-auto mb-1.5 h-5 w-5 text-accent-text" aria-hidden="true" /> {label}
                </li>
              ))}
            </ul>
          </div>

          {/* App preview */}
          <div className="relative mx-auto w-full max-w-[400px] flex-[1_1_340px]">
            <div aria-hidden="true" className="absolute inset-8 rounded-[48px] bg-accent/40 blur-3xl" />
            <div className="glow-card relative rounded-[40px] border border-line2 bg-panel/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <div className="mx-auto mb-4 h-1.5 w-20 rounded-full bg-line2" />
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 font-semibold text-white"><LogoMark size={26} /> Marketplace</div>
                <span className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-text"><Wallet className="h-3.5 w-3.5" aria-hidden="true" /> Wallet</span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {top.map(({ name, emoji, stock }, i) => (
                  <li key={name} className={`flex items-center gap-3 rounded-2xl border p-3 ${i === 0 ? 'border-accent bg-accent/10' : 'border-line bg-panel2'}`}>
                    <CategoryTile name={name} emoji={emoji} size={46} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-white">{name}</div>
                      <div className="flex items-center gap-1.5 text-[13px] text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" /> {stock ? `${stock.toLocaleString()} in stock` : 'Restocking'}
                      </div>
                    </div>
                    <span className={`rounded-xl px-3 py-2 text-xs font-semibold ${i === 0 ? 'bg-accent text-white' : 'bg-line text-soft'}`}>Buy</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-2xl border border-line bg-ink/60 p-4 font-mono text-[13px]">
                <div className="flex justify-between text-muted"><span>Login</span><span className="text-white">page•••@gmail.com</span></div>
                <div className="mt-1.5 flex justify-between text-muted"><span>Password</span><span className="text-white">••••••••</span></div>
                <div className="mt-2.5 flex items-center gap-1.5 font-sans text-sm font-semibold text-success"><Check className="h-4 w-4" aria-hidden="true" /> Delivered to My orders</div>
              </div>
            </div>

            <div className="absolute -left-6 top-20 hidden animate-float items-center gap-2 rounded-2xl border border-line2 bg-panel/95 px-4 py-3 text-sm shadow-xl shadow-black/40 backdrop-blur sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F3B2C] text-success"><Zap className="h-4 w-4" aria-hidden="true" /></span>
              <span><span className="block font-semibold text-white">Instant delivery</span><span className="text-muted">from your wallet</span></span>
            </div>
            <div className="absolute -right-6 bottom-28 hidden animate-float items-center gap-2 rounded-2xl border border-line2 bg-panel/95 px-4 py-3 text-sm shadow-xl shadow-black/40 backdrop-blur [animation-delay:-3s] sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-accent-text"><ShieldCheck className="h-4 w-4" aria-hidden="true" /></span>
              <span><span className="block font-semibold text-white">Refund protected</span><span className="text-muted">report any issue</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── PLATFORM STRIP ───────────── */}
      <section aria-label="Platforms" className="border-y border-line bg-panel2/60 py-6">
        <p className="mb-4 text-center text-sm font-medium uppercase tracking-[0.12em] text-muted">Accounts for every platform</p>
        <div className="fade-x overflow-hidden">
          <ul className="flex w-max animate-marquee gap-3">
            {[...POPULAR, ...POPULAR].map((p, i) => (
              <li key={i} aria-hidden={i >= POPULAR.length ? 'true' : undefined} className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-line2 bg-panel py-1.5 pl-1.5 pr-5 text-[15px] font-semibold text-soft">
                <PlatformTile platform={p} size={30} className="!rounded-full" /> {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────── 2. HOW IT WORKS ───────────── */}
      <section id="how" className="container-x scroll-mt-24 pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="h-section">Buy in 3 simple steps</h2>
          <p className="mt-3 text-[17px] text-muted">From sign-up to your login in a few minutes.</p>
        </div>
        <ol className="relative mt-12 grid gap-5 md:grid-cols-3">
          <span aria-hidden="true" className="absolute left-[16%] right-[16%] top-[52px] hidden h-0.5 bg-gradient-to-r from-accent/0 via-accent to-accent/0 md:block" />
          {/* Step 1 */}
          <li className="card relative p-6">
            <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent font-display text-2xl font-bold text-white shadow-lg shadow-accent/40">1</span>
            <h3 className="mt-5 text-xl font-semibold text-white">Create a free account</h3>
            <p className="mt-2 text-muted">Sign up with your email and phone. Takes under a minute.</p>
            <div className="mt-5 space-y-2 rounded-2xl border border-line bg-ink/50 p-4 text-sm">
              <div className="flex items-center gap-2 rounded-xl border border-line2 bg-panel px-3 py-2.5 text-muted"><UserPlus className="h-4 w-4 text-accent-text" aria-hidden="true" /> Your full name</div>
              <div className="rounded-xl bg-accent py-2.5 text-center font-semibold text-white">Create account</div>
            </div>
          </li>
          {/* Step 2 */}
          <li className="card relative p-6">
            <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent font-display text-2xl font-bold text-white shadow-lg shadow-accent/40">2</span>
            <h3 className="mt-5 text-xl font-semibold text-white">Fund your wallet</h3>
            <p className="mt-2 text-muted">Transfer from any Nigerian bank and upload the receipt.</p>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-ink/50 p-4 text-sm">
              <ReceiptText className="h-8 w-8 shrink-0 text-accent-text" aria-hidden="true" />
              <div className="flex-1"><div className="font-semibold text-white">Bank transfer</div><div className="text-[13px] text-muted">Receipt uploaded</div></div>
              <span className="badge bg-[#0F3B2C] text-success">Credited</span>
            </div>
          </li>
          {/* Step 3 */}
          <li className="card relative p-6">
            <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent font-display text-2xl font-bold text-white shadow-lg shadow-accent/40">3</span>
            <h3 className="mt-5 text-xl font-semibold text-white">Buy and get your login</h3>
            <p className="mt-2 text-muted">Pick what you want. Your login appears in My orders.</p>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-ink/50 p-4 text-sm">
              <ShoppingBag className="h-8 w-8 shrink-0 text-accent-text" aria-hidden="true" />
              <div className="flex-1"><div className="font-semibold text-white">Order complete</div><div className="text-[13px] text-muted">Login ready to copy</div></div>
              <Check className="h-6 w-6 text-success" aria-hidden="true" />
            </div>
          </li>
        </ol>
      </section>

      {/* ───────────── HIGHLIGHTS ───────────── */}
      <section aria-label="Highlights" className="container-x pt-16">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Zap, value: 'Instant', label: 'Delivery from wallet' },
            { icon: ShieldCheck, value: '100%', label: 'Refund if not as described' },
            { icon: Sparkles, value: inStock ? inStock.toLocaleString() : 'New', label: inStock ? 'In stock now' : 'Stock added daily' },
            { icon: Clock, value: '24/7', label: 'WhatsApp support' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="glow-card card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15"><Icon className="h-5 w-5 text-accent-text" aria-hidden="true" /></span>
              <div className="mt-4 font-display text-[clamp(28px,3.4vw,40px)] font-bold leading-none text-white">{value}</div>
              <div className="mt-2 text-[15px] text-muted">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── 3. CATEGORIES ───────────── */}
      <section id="stock" className="container-x scroll-mt-24 pt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Marketplace</p>
            <h2 className="h-section">Shop by category</h2>
            <p className="mt-3 max-w-xl text-[17px] text-muted">Sign up free to see every listing, with photos and a preview before you buy.</p>
          </div>
          <Link href="/signup" className="btn btn-ghost">Open the marketplace <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map(({ name, emoji, stock }) => (
            <li key={name}>
              <Link href="/signup" className="card group relative flex h-full items-center gap-4 overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-xl hover:shadow-accent/20">
                <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-accent/0 blur-2xl transition group-hover:bg-accent/30" />
                <CategoryTile name={name} emoji={emoji} size={48} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white">{name}</div>
                  <div className="text-[13px] text-muted">{stock ? `${stock.toLocaleString()} in stock` : 'New stock soon'}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent-text" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 4. WHY (bento) ───────────── */}
      <section id="why" className="container-x scroll-mt-24 pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">Why DeeDee’s</p>
          <h2 className="h-section">Built so buying is the easy part</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="glow-card card relative overflow-hidden p-8 md:col-span-2 md:row-span-2">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
            <Eye className="relative h-8 w-8 text-accent-text" aria-hidden="true" />
            <h3 className="relative mt-5 font-display text-2xl font-bold text-white">See exactly what you’re buying</h3>
            <p className="relative mt-2 max-w-md text-[16px] text-muted">Every listing shows a photo, instructions and a preview of each item in stock. Tick the exact ones you want, or buy up to 50 at once.</p>
            <div className="relative mt-6 grid max-w-md gap-2">
              {['Item 1', 'Item 2', 'Item 3'].map((t, i) => (
                <div key={t} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${i < 2 ? 'border-accent bg-accent/10 text-white' : 'border-line bg-ink/50 text-muted'}`}>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${i < 2 ? 'border-accent bg-accent' : 'border-line2'}`}>{i < 2 && <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />}</span>
                  <span className="font-mono">{['1714•••5378', '1903•••2214', '1626•••8890'][i]}</span>
                  <BadgeCheck className="ml-auto h-4 w-4 text-success" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
          {[
            { icon: Landmark, title: 'Pay with your bank app', text: 'No card needed. Transfer, upload the receipt, done.' },
            { icon: ShieldCheck, title: 'Refund protection', text: 'Not as described? Report it and get your money back.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-7 transition hover:border-line2">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15"><Icon className="h-6 w-6 text-accent-text" aria-hidden="true" /></span>
              <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-[15px] text-muted">{text}</p>
            </div>
          ))}
          {[
            { icon: Lock, title: 'Private & encrypted', text: 'Account details are encrypted. Only you see what you bought.' },
            { icon: MessageCircle, title: 'Real people on support', text: `WhatsApp ${site.whatsappDisplay}, any time you need help.` },
            { icon: Zap, title: 'Instant from wallet', text: 'Pay from your wallet and your login is ready straight away.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-7 transition hover:border-line2">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15"><Icon className="h-6 w-6 text-accent-text" aria-hidden="true" /></span>
              <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-[15px] text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── 5. REVIEWS (real buyers only; hidden until there are some) ───────────── */}
      {reviews.length > 0 && (
        <section className="container-x pt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">Reviews</p>
              <h2 className="h-section">What buyers say</h2>
              <p className="mt-3 flex items-center gap-2 text-[17px] text-muted">
                <Stars value={overall.avg} size={18} /> <strong className="text-white">{overall.avg.toFixed(1)}</strong> from {overall.count} review{overall.count === 1 ? '' : 's'}
              </p>
            </div>
            <Link href="/reviews" className="btn btn-ghost">All reviews <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <div className="mt-10">
            <ReviewCarousel reviews={reviews} />
          </div>
        </section>
      )}

      {/* ───────────── 6. SELLERS ───────────── */}
      <section id="sell" className="container-x scroll-mt-24 pt-24">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-accent to-[#3A22B8] p-8 text-white shadow-2xl shadow-accent/30 sm:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-success/25 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold"><Store className="h-4 w-4" aria-hidden="true" /> For sellers</span>
              <h2 className="mt-4 font-display text-[clamp(28px,3.6vw,42px)] font-bold leading-tight">Have something to sell? Open your own shop.</h2>
              <p className="mt-3 text-[17px] text-white/85">List your products, customers buy them 24/7, and you get paid straight to your bank.</p>
            </div>
            <Link href="/signup" className="btn bg-white px-7 py-4 text-base font-semibold text-[#3A22B8] hover:bg-white/90">
              Become a seller <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────── 7. FAQ ───────────── */}
      <section id="faq" className="container-x scroll-mt-24 pt-24">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="eyebrow mb-3">FAQ</p>
            <h2 className="h-section">Common questions</h2>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map(([q, a]) => (
              <details key={q} className="card group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[17px] font-semibold text-white">
                  {q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted transition group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="px-6 pb-5 text-[15px] leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── 8. FINAL CTA + SUPPORT ───────────── */}
      <section id="support" className="container-x scroll-mt-24 py-24">
        <div className="relative overflow-hidden rounded-[32px] border border-line2 bg-panel p-8 text-center sm:p-14">
          <div aria-hidden="true" className="auth-glow pointer-events-none absolute inset-0 opacity-80" />
          <div className="relative">
            <LogoMark size={56} />
            <h2 className="mt-5 font-display text-[clamp(30px,4.4vw,52px)] font-bold leading-tight text-white">Ready when you are.</h2>
            <p className="mx-auto mt-3 max-w-xl text-[17px] text-muted">
              Create your free account in under a minute. Questions first? Message us any time.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="btn btn-primary px-7 py-4 text-base shadow-xl shadow-accent/30">
                Create free account <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </Link>
              <a href={whatsappLink('Hello, I have a question about DeeDee’s Marketplace')} target="_blank" rel="noopener noreferrer" className="btn bg-whatsapp px-7 py-4 text-base text-white hover:brightness-110">
                <MessageCircle className="h-5 w-5" aria-hidden="true" /> WhatsApp {site.whatsappDisplay}
              </a>
              <a href={`tel:${site.phone}`} className="btn btn-ghost px-7 py-4 text-base">
                <Phone className="h-5 w-5" aria-hidden="true" /> {site.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
