import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import {
  ArrowRight, ChevronDown, Eye, Landmark, Lock, LogIn, MessageCircle, Phone, ShieldCheck, ShoppingBag, Store, UserPlus, Zap,
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { reviewAuthor } from '@/lib/reviews';
import ReviewCarousel from '@/components/ReviewCarousel';
import Stars from '@/components/Stars';
import { PLATFORMS, site, whatsappLink } from '@/lib/site';
import CategoryTile from '@/components/CategoryTile';

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
  ['home-data-v4'],
  { revalidate: 60 },
);

const POPULAR = PLATFORMS.filter((p) => p !== 'Other');

const steps = [
  { icon: UserPlus, title: 'Create a free account', text: 'Sign up with your email and phone. It takes less than a minute.' },
  { icon: Landmark, title: 'Fund your wallet', text: 'Transfer from any Nigerian bank and upload your receipt. We credit you, usually within minutes.' },
  { icon: ShoppingBag, title: 'Buy and get your login', text: 'Pick what you want in the marketplace. Your login shows up in My orders straight away.' },
];

const reasons = [
  { icon: Eye, title: 'See it before you pay', text: 'Every listing shows a photo and a preview of each item in stock.' },
  { icon: Landmark, title: 'Pay with your bank app', text: 'No card needed. Simple bank transfer to our account.' },
  { icon: ShieldCheck, title: 'Refund protection', text: 'Not as described? Report it and get your money back to your wallet.' },
  { icon: MessageCircle, title: 'Real people on support', text: `WhatsApp ${site.whatsappDisplay}, any time you need help.` },
];

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

  return (
    <>
      {/* ───────────── 1. HERO: one message, two clear buttons ───────────── */}
      <section id="home" className="relative overflow-hidden">
        <div aria-hidden="true" className="auth-glow pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="auth-grid pointer-events-none absolute inset-0" />

        <div className="container-x relative flex flex-wrap items-center gap-12 pb-16 pt-12 sm:pt-20 lg:pb-24">
          <div className="min-w-0 flex-[1_1_480px]">
            <p className="inline-flex items-center gap-2 rounded-full border border-line2 bg-panel/70 px-3.5 py-1.5 text-sm text-soft backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-success" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              {inStock > 0 ? `${inStock.toLocaleString()} items in stock now` : 'New stock added regularly'}
            </p>
            <h1 className="mt-6 font-display text-[clamp(40px,6vw,70px)] font-bold leading-[1.04] tracking-tight text-white">
              Premium accounts,
              <br />
              <span className="text-gradient">delivered fast.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Create a free account, fund your wallet by bank transfer, and buy. Your login appears in your dashboard.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="btn btn-primary group px-7 py-4 text-base shadow-xl shadow-accent/30">
                Create free account <ArrowRight className="h-[18px] w-[18px] transition group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link href="/login" className="btn btn-ghost px-7 py-4 text-base">
                <LogIn className="h-[18px] w-[18px]" aria-hidden="true" /> I already have an account
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-soft">
              <li className="flex items-center gap-2"><ShieldCheck className="h-[18px] w-[18px] text-accent-text" aria-hidden="true" /> Refund protection</li>
              <li className="flex items-center gap-2"><Lock className="h-[18px] w-[18px] text-accent-text" aria-hidden="true" /> Private &amp; encrypted</li>
              <li className="flex items-center gap-2"><MessageCircle className="h-[18px] w-[18px] text-accent-text" aria-hidden="true" /> WhatsApp support</li>
            </ul>
          </div>

          {/* What you can buy */}
          <div className="mx-auto w-full max-w-md flex-[1_1_360px]">
            <div className="rounded-[28px] border border-line2 bg-panel/90 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <div className="flex items-center justify-between px-1">
                <span className="font-semibold text-white">What you can buy</span>
                <Link href="#stock" className="text-sm font-medium text-accent-text">See all</Link>
              </div>
              <ul className="mt-4 space-y-2.5">
                {shown.slice(0, 4).map(({ name, emoji, stock }) => (
                  <li key={name} className="flex items-center gap-3 rounded-2xl border border-line bg-panel2 p-3">
                    <CategoryTile name={name} emoji={emoji} size={44} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-white">{name}</div>
                      <div className="text-[13px] text-muted">{stock ? `${stock.toLocaleString()} in stock` : 'New stock soon'}</div>
                    </div>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-primary mt-4 w-full py-3.5">Sign up to shop</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── 2. HOW IT WORKS: 3 steps ───────────── */}
      <section id="how" className="container-x scroll-mt-24 pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="h-section">Buy in 3 simple steps</h2>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="card relative p-7">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent font-display text-xl font-bold text-white">{i + 1}</span>
                <Icon className="h-6 w-6 text-accent-text" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 text-center">
          <Link href="/signup" className="btn btn-primary px-7 py-4 text-base">Start with step 1 <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" /></Link>
        </div>
      </section>

      {/* ───────────── 3. CATEGORIES (listings stay in the marketplace, after login) ───────────── */}
      <section id="stock" className="container-x scroll-mt-24 pt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Marketplace</p>
            <h2 className="h-section">Shop by category</h2>
            <p className="mt-3 max-w-xl text-[17px] text-muted">Sign up free to see every listing, with photos and a preview before you buy.</p>
          </div>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map(({ name, emoji, stock }) => (
            <li key={name}>
              <Link href="/signup" className="card flex h-full items-center gap-4 p-5 transition hover:border-accent">
                <CategoryTile name={name} emoji={emoji} size={44} className="shrink-0" />
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white">{name}</div>
                  <div className="text-[13px] text-muted">{stock ? `${stock.toLocaleString()} in stock` : 'New stock soon'}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── 4. WHY BUY HERE ───────────── */}
      <section id="why" className="container-x scroll-mt-24 pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">Why DeeDee’s</p>
          <h2 className="h-section">Simple, safe and fast</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-7">
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
        <div className="card flex flex-wrap items-center justify-between gap-6 p-7 sm:p-9">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15"><Store className="h-7 w-7 text-accent-text" aria-hidden="true" /></span>
            <div>
              <h2 className="text-xl font-semibold text-white">Have something to sell?</h2>
              <p className="mt-1 text-muted">Open your own shop on DeeDee’s and get paid straight to your bank.</p>
            </div>
          </div>
          <Link href="/signup" className="btn btn-ghost">Become a seller <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
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
            <Zap className="mx-auto h-9 w-9 text-accent-text" aria-hidden="true" />
            <h2 className="mt-4 font-display text-[clamp(30px,4.4vw,50px)] font-bold leading-tight text-white">Ready to start?</h2>
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
