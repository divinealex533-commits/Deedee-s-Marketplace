import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import {
  ArrowRight, BadgeCheck, Check, ChevronDown, Clock, Eye, Landmark, Lock, MessageCircle, MousePointerClick,
  Phone, ReceiptText, ShieldCheck, Sparkles, Upload, UserPlus, Wallet, Zap,
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { naira } from '@/lib/format';
import { PLATFORMS, site, whatsappLink } from '@/lib/site';
import ListingImage from '@/components/ListingImage';
import ProductCard from '@/components/ProductCard';
import HeroSlider from '@/components/HeroSlider';

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
          include: { _count: { select: { credentials: { where: { status: 'AVAILABLE' } } } } },
          orderBy: { createdAt: 'desc' },
          take: 6,
        }),
      ]);
      return {
        users,
        delivered,
        inStock,
        // Dates don't survive the cache, so store the image time as a number
        listings: listings.map((l) => ({
          id: l.id,
          title: l.title,
          platform: l.platform,
          description: l.description,
          price: l.price,
          stock: l._count.credentials,
          imageAt: l.imageAt ? l.imageAt.getTime() : null,
        })),
      };
    } catch {
      return { users: 0, delivered: 0, inStock: 0, listings: [] };
    }
  },
  ['home-data'],
  { revalidate: 60 },
);

const faqs = [
  ['How fast do I get my account?', 'Instantly. The moment you pay from your wallet, the login details appear in your dashboard. No waiting for anyone to reply.'],
  ['How do I fund my wallet?', 'Transfer to our 9PSB or PocketApp account shown in your Wallet, then upload a screenshot of the receipt. We confirm it and credit you, usually within minutes.'],
  ['What if an account doesn’t work?', 'Tap “Report a problem” on the order. We check it and refund the money to your wallet if it isn’t as described.'],
  ['Can I see what I’m buying first?', 'Yes. Every listing shows a photo, instructions and a preview of each item in stock, so you can pick exactly the ones you want.'],
  ['Can I buy more than one at a time?', 'Yes. Tick several items or set a quantity and buy up to 50 in one go.'],
  ['Is my information safe?', 'Your password is stored as a one-way hash, account details are encrypted, and receipts are only visible to you and our team.'],
];

const features = [
  { icon: ShieldCheck, title: 'Refund protection', text: 'Not as described? Report it from your order and get your money back to your wallet.' },
  { icon: Eye, title: 'Preview before you buy', text: 'See a photo, instructions and each item in stock. Pick the exact ones you want.' },
  { icon: MousePointerClick, title: 'Buy in bulk', text: 'Tick several or set a quantity. Up to 50 in one tap, one simple total.' },
  { icon: Lock, title: 'Private & encrypted', text: 'Account details are encrypted and only you can see what you bought.' },
];

export default async function HomePage() {
  const { users, delivered, inStock, listings } = await getHomeData();
  const cards = listings.map((l) => ({ ...l, imageAt: l.imageAt ? new Date(l.imageAt) : null }));

  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section id="home" className="relative overflow-hidden">
        <div aria-hidden="true" className="auth-glow pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="auth-grid pointer-events-none absolute inset-0" />

        <div className="container-x relative flex flex-wrap items-center gap-14 pb-20 pt-14 sm:pt-20 lg:pb-28">
          <div className="min-w-0 flex-[1_1_480px]">
            <HeroSlider />
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6 text-[15px] text-soft">
              <span className="inline-flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-success" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                {inStock > 0 ? `${inStock.toLocaleString()} in stock now` : 'New stock added regularly'}
              </span>
              <span className="flex items-center gap-2"><ShieldCheck className="h-[18px] w-[18px] text-accent-text" aria-hidden="true" /> Refund protection</span>
              <span className="flex items-center gap-2"><MessageCircle className="h-[18px] w-[18px] text-accent-text" aria-hidden="true" /> 24/7 WhatsApp</span>
            </div>
          </div>

          {/* App preview mock-up */}
          <div className="relative mx-auto w-full max-w-md flex-[1_1_380px]">
            <div className="relative rounded-[28px] border border-line2 bg-panel/90 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-accent to-[#4A30C9] p-5 text-white">
                <div>
                  <div className="text-sm text-white/80">Wallet balance</div>
                  <div className="font-display text-3xl font-bold">₦25,000</div>
                </div>
                <Wallet className="h-9 w-9 text-white/80" aria-hidden="true" />
              </div>
              <div className="mt-4 flex items-center justify-between px-1 text-sm">
                <span className="font-semibold text-white">Fresh in stock</span>
                <span className="text-muted">Tap to preview</span>
              </div>
              <ul className="mt-3 space-y-2.5">
                {(cards.length
                  ? cards.slice(0, 3)
                  : PLATFORMS.slice(0, 3).map((p) => ({ id: p, title: `${p} accounts`, platform: p, price: 0, stock: 0, imageAt: null, description: '' }))
                ).map((l) => (
                  <li key={l.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel2 p-3">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                      <ListingImage id={l.id} imageAt={l.imageAt} platform={l.platform} title={l.title} className="h-full [&_span]:hidden [&_svg]:h-5 [&_svg]:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-white">{l.title}</div>
                      <div className="text-[13px] text-muted">{l.stock ? `${l.stock} available` : l.platform}</div>
                    </div>
                    {l.price ? <div className="font-display font-bold text-white">{naira(l.price)}</div> : <BadgeCheck className="h-5 w-5 text-accent-text" aria-hidden="true" />}
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-accent/15 py-3.5 text-center font-semibold text-accent-text">Buy now · instant delivery</div>
            </div>

            <div className="absolute -left-4 top-24 hidden animate-float items-center gap-2 rounded-2xl border border-line2 bg-panel/95 px-4 py-3 text-sm shadow-xl shadow-black/40 backdrop-blur sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F3B2C] text-success"><Check className="h-4 w-4" aria-hidden="true" /></span>
              <span><span className="block font-semibold text-white">Login delivered</span><span className="text-muted">right after payment</span></span>
            </div>
            <div className="absolute -right-4 bottom-20 hidden animate-float items-center gap-2 rounded-2xl border border-line2 bg-panel/95 px-4 py-3 text-sm shadow-xl shadow-black/40 backdrop-blur [animation-delay:1.5s] sm:flex">
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
            {[...PLATFORMS, ...PLATFORMS, ...PLATFORMS, ...PLATFORMS].map((p, i) => (
              <li key={i} aria-hidden={i >= PLATFORMS.length ? 'true' : undefined} className="flex items-center gap-2 whitespace-nowrap rounded-full border border-line2 bg-panel px-5 py-2.5 text-[15px] font-medium text-soft">
                <BadgeCheck className="h-4 w-4 text-accent-text" aria-hidden="true" /> {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────── STATS (real numbers) ───────────── */}
      <section aria-label="Key numbers" className="container-x pt-20">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: UserPlus, value: users.toLocaleString(), label: 'Registered users' },
            { icon: Check, value: delivered.toLocaleString(), label: 'Accounts delivered' },
            { icon: Sparkles, value: inStock.toLocaleString(), label: 'In stock now' },
            { icon: Clock, value: '24/7', label: 'WhatsApp support' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15"><Icon className="h-5 w-5 text-accent-text" aria-hidden="true" /></span>
              <div className="mt-4 font-display text-[clamp(28px,3.4vw,40px)] font-bold leading-none text-white">{value}</div>
              <div className="mt-2 text-[15px] text-muted">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── LIVE STOCK ───────────── */}
      <section id="stock" className="container-x scroll-mt-24 pt-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Marketplace</p>
            <h2 className="h-section">Fresh in stock</h2>
            <p className="mt-3 max-w-xl text-[17px] text-muted">Every listing shows a photo and a preview of each item, so you know exactly what you’re getting.</p>
          </div>
          <Link href="/signup" className="btn btn-ghost">See everything <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        {cards.length ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((p) => <ProductCard key={p.id} p={p} href={`/dashboard/marketplace/${p.id}`} />)}
          </div>
        ) : (
          <div className="card mt-10 p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-accent-text" aria-hidden="true" />
            <p className="mt-3 text-lg font-semibold text-white">New stock is on the way</p>
            <p className="mt-1 text-muted">Create your account now and you’ll be ready the moment it drops.</p>
          </div>
        )}
      </section>

      {/* ───────────── FEATURES (bento) ───────────── */}
      <section id="features" className="container-x scroll-mt-24 pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">Why DeeDee’s</p>
          <h2 className="h-section">Built so buying is the easy part</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="card relative overflow-hidden p-8 md:col-span-2">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/25 blur-3xl" />
            <Zap className="relative h-8 w-8 text-accent-text" aria-hidden="true" />
            <h3 className="relative mt-5 font-display text-2xl font-bold text-white">Instant, automatic delivery</h3>
            <p className="relative mt-2 max-w-md text-[16px] text-muted">No chasing anyone. Pay from your wallet and the login is in your dashboard immediately, ready to copy.</p>
            <div className="relative mt-6 max-w-sm rounded-2xl border border-line2 bg-ink/70 p-4 font-mono text-sm">
              <div className="flex justify-between text-muted"><span>Login</span><span className="text-white">page•••@gmail.com</span></div>
              <div className="mt-2 flex justify-between text-muted"><span>Password</span><span className="text-white">••••••••••</span></div>
              <div className="mt-3 flex items-center gap-2 text-success"><Check className="h-4 w-4" aria-hidden="true" /> Delivered</div>
            </div>
          </div>
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-8 transition hover:border-line2">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15"><Icon className="h-6 w-6 text-accent-text" aria-hidden="true" /></span>
              <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── HOW IT WORKS ───────────── */}
      <section id="how" className="container-x scroll-mt-24 pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="h-section">From sign-up to login in 4 steps</h2>
        </div>
        <ol className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <span aria-hidden="true" className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-gradient-to-r from-transparent via-line2 to-transparent lg:block" />
          {[
            { icon: UserPlus, title: 'Create an account', text: 'Free, and takes under a minute.' },
            { icon: Landmark, title: 'Fund your wallet', text: 'Transfer and upload your receipt.' },
            { icon: Eye, title: 'Preview & pick', text: 'Choose exactly what you want.' },
            { icon: Zap, title: 'Get your login', text: 'Delivered instantly to your dashboard.' },
          ].map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative text-center">
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-line2 bg-panel shadow-lg shadow-black/30">
                <Icon className="h-6 w-6 text-accent-text" aria-hidden="true" />
                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-1 text-[15px] text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────────── WALLET ───────────── */}
      <section className="container-x pt-28">
        <div className="card relative flex flex-wrap items-center gap-12 overflow-hidden p-8 sm:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-whatsapp/25 blur-3xl" />
          <div className="relative min-w-0 flex-[1_1_380px]">
            <p className="eyebrow mb-3">Wallet</p>
            <h2 className="font-display text-[clamp(28px,3.6vw,40px)] font-bold leading-tight text-white">Fund with the bank app you already use</h2>
            <p className="mt-4 text-[17px] text-muted">No cards needed. Send money to our 9PSB or PocketApp account and upload the receipt. Once it’s confirmed, your balance is ready to spend.</p>
            <ul className="mt-6 space-y-3 text-[15px] text-soft">
              <li className="flex items-center gap-3"><Landmark className="h-5 w-5 text-accent-text" aria-hidden="true" /> Transfer from any Nigerian bank</li>
              <li className="flex items-center gap-3"><Upload className="h-5 w-5 text-accent-text" aria-hidden="true" /> Upload a screenshot of the receipt</li>
              <li className="flex items-center gap-3"><Check className="h-5 w-5 text-accent-text" aria-hidden="true" /> Wallet credited, usually within minutes</li>
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-sm flex-[1_1_300px] space-y-3">
            <div className="rounded-2xl border border-line2 bg-panel2 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-accent-text"><Landmark className="h-4 w-4" aria-hidden="true" /> 9PSB · PocketApp</div>
              <div className="mt-2 font-mono text-2xl font-bold tracking-wider text-white">•••• ••• •••</div>
              <div className="text-sm text-muted">Shown in your Wallet after sign-up</div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-line2 bg-panel2 p-4">
              <ReceiptText className="h-8 w-8 shrink-0 text-accent-text" aria-hidden="true" />
              <div className="flex-1">
                <div className="font-semibold text-white">Deposit ₦10,000</div>
                <div className="text-[13px] text-muted">Receipt uploaded</div>
              </div>
              <span className="badge bg-[#0F3B2C] text-success">Credited</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section id="faq" className="container-x scroll-mt-24 pt-28">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="eyebrow mb-3">FAQ</p>
            <h2 className="h-section">Questions, answered</h2>
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

      {/* ───────────── SUPPORT + CTA ───────────── */}
      <section id="support" className="container-x scroll-mt-24 py-28">
        <div className="relative overflow-hidden rounded-[32px] border border-line2 bg-panel p-8 text-center sm:p-14">
          <div aria-hidden="true" className="auth-glow pointer-events-none absolute inset-0 opacity-80" />
          <div className="relative">
            <h2 className="font-display text-[clamp(30px,4.4vw,52px)] font-bold leading-tight text-white">Ready when you are.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[17px] text-muted">
              Create your free account in under a minute. Questions first? We’re on WhatsApp and phone, any time.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/signup" className="btn btn-primary group px-7 py-4 text-base shadow-xl shadow-accent/30">
                Create free account <ArrowRight className="h-[18px] w-[18px] transition group-hover:translate-x-0.5" aria-hidden="true" />
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
