import Link from 'next/link';
import {
  ArrowRight, BadgeCheck, Grid2x2, Lock, MessageCircle, Phone, ShieldCheck, Star, Wallet, Zap,
} from 'lucide-react';
import { prisma } from '@/lib/db';
import { naira } from '@/lib/format';
import { site, whatsappLink } from '@/lib/site';

export const dynamic = 'force-dynamic';

async function getHomeData() {
  try {
    const [users, sold, listings] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.order.count({ where: { status: { not: 'REFUNDED' } } }),
      prisma.listing.findMany({
        where: { active: true, credentials: { some: { status: 'AVAILABLE' } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);
    return { users, sold, listings };
  } catch {
    return { users: 0, sold: 0, listings: [] };
  }
}

const features = [
  { icon: ShieldCheck, title: 'Safe and secure', text: 'Encrypted storage and fraud checks on every order.' },
  { icon: MessageCircle, title: '24/7 support', text: 'Real people on WhatsApp and phone, any time.' },
  { icon: Grid2x2, title: 'Smart categories', text: 'Filter by platform to find exactly what you need.' },
  { icon: Lock, title: 'Escrow protection', text: 'Report a problem and get refunded if it doesn’t work.' },
  { icon: Star, title: 'Quality checked', text: 'Every account is checked before it goes on sale.' },
  { icon: Wallet, title: 'Smart wallet', text: 'Fund by bank transfer once and buy instantly.' },
];

const steps = [
  { title: 'Create an account', text: 'Sign up and verify your phone in under a minute.' },
  { title: 'Fund your wallet', text: 'Transfer to our bank account and upload your receipt.' },
  { title: 'Buy instantly', text: 'Pick a listing and pay from your wallet in one tap.' },
  { title: 'Get your login', text: 'Details appear in your dashboard straight away.' },
];

export default async function HomePage() {
  const { users, sold, listings } = await getHomeData();

  return (
    <>
      {/* HERO */}
      <section id="home" className="container-x flex flex-wrap items-center gap-14 py-20 sm:py-24">
        <div className="min-w-0 flex-[1_1_480px]">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line2 px-3.5 py-1.5 text-sm text-soft">
            <ShieldCheck className="h-4 w-4 text-accent-text" aria-hidden="true" />
            Protected on every order
          </p>
          <h1 className="font-display text-[clamp(40px,6vw,68px)] font-bold leading-[1.05] tracking-tight text-white">
            Buy and sell premium accounts with confidence
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            A marketplace for digital accounts with checked listings, wallet payments and instant delivery the moment you pay.
          </p>
          <div className="mt-9 flex flex-wrap gap-3.5">
            <Link href="/signup" className="btn btn-primary px-6 py-3.5 text-base">
              Explore marketplace <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
            </Link>
            <Link href="/#how" className="btn btn-ghost px-6 py-3.5 text-base">How it works</Link>
          </div>
        </div>

        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-3.5">
          {(listings.length ? listings : null)?.map((l) => (
            <div key={l.id} className="card flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-line">
                <BadgeCheck className="h-6 w-6 text-accent-text" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-white">{l.title}</div>
                <div className="text-sm text-muted">{l.platform} · In stock</div>
              </div>
              <div className="font-display text-lg font-semibold text-white">{naira(l.price)}</div>
            </div>
          )) ??
            ['Instagram', 'TikTok', 'YouTube'].map((p) => (
              <div key={p} className="card flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-line">
                  <BadgeCheck className="h-6 w-6 text-accent-text" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">{p} accounts</div>
                  <div className="text-sm text-muted">New stock added regularly</div>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* STATS (real numbers from the database) */}
      <section aria-label="Key numbers" className="container-x">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
          {[
            [users.toLocaleString(), 'Registered users'],
            [sold.toLocaleString(), 'Accounts delivered'],
            ['Instant', 'Delivery after payment'],
            ['24/7', 'Support'],
          ].map(([value, label]) => (
            <div key={label} className="bg-panel2 p-7 text-center">
              <div className="font-display text-4xl font-bold text-white">{value}</div>
              <div className="text-[15px] text-muted">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="container-x flex scroll-mt-24 flex-wrap items-start gap-12 pt-28">
        <div className="min-w-0 flex-[1_1_400px]">
          <p className="eyebrow mb-3">About us</p>
          <h2 className="h-section">A safer way to trade digital accounts</h2>
          <p className="mt-5 text-[17px] text-muted">
            We built {site.name} so buyers never have to send money to a stranger and hope. Every listing is checked,
            payments go through your wallet, and our team is on hand if anything goes wrong.
          </p>
        </div>
        <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-4">
          {[
            { icon: Lock, title: 'Strong security', text: 'Account details are encrypted and only shown to the buyer.' },
            { icon: BadgeCheck, title: 'Checked listings', text: 'Every account is checked before it goes on sale.' },
            { icon: Zap, title: 'Instant delivery', text: 'Login details arrive in your dashboard as soon as you pay.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="card flex gap-4 p-5">
              <Icon className="h-6 w-6 shrink-0 text-accent-text" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-1 text-[15px] text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container-x scroll-mt-24 pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">Features</p>
          <h2 className="h-section">Everything you need to trade safely</h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-7">
              <Icon className="h-7 w-7 text-accent-text" aria-hidden="true" />
              <h3 className="mb-1.5 mt-4 text-lg font-semibold text-white">{title}</h3>
              <p className="text-[15px] text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="container-x scroll-mt-24 pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="h-section">From sign-up to login in four steps</h2>
        </div>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent font-display text-xl font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mb-1.5 mt-5 text-lg font-semibold text-white">{s.title}</h3>
              <p className="text-[15px] text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* SELL */}
      <section id="sell" className="container-x pt-28">
        <div className="card flex flex-wrap items-center justify-between gap-7 border-line2 p-8 sm:p-12">
          <div className="min-w-0 flex-[1_1_420px]">
            <h2 className="font-display text-[clamp(26px,3.4vw,36px)] font-bold text-white">Have accounts to sell?</h2>
            <p className="mt-3 text-[17px] text-muted">
              Create a seller account and message us on WhatsApp. We’ll check your accounts and list them for you.
            </p>
          </div>
          <Link href="/signup" className="btn btn-primary px-6 py-3.5 text-base">Become a seller</Link>
        </div>
      </section>

      {/* SUPPORT */}
      <section id="support" className="container-x scroll-mt-24 pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow mb-3">Support</p>
          <h2 className="h-section">Need help? Talk to us</h2>
          <p className="mt-4 text-[17px] text-muted">Our team is available 24/7 for questions about orders, payments or selling.</p>
        </div>
        <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-7 hover:border-line2">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-whatsapp">
              <MessageCircle className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Chat on WhatsApp</div>
              <div className="text-muted">{site.whatsappDisplay}</div>
            </div>
          </a>
          <a href={`tel:${site.phone}`} className="card flex items-center gap-4 p-7 hover:border-line2">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent">
              <Phone className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="text-lg font-semibold text-white">Call us</div>
              <div className="text-muted">{site.phoneDisplay}</div>
            </div>
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-28 text-center">
        <h2 className="font-display text-[clamp(26px,3.4vw,36px)] font-bold text-white">Ready to get started?</h2>
        <p className="mt-3 text-[17px] text-muted">Create your free account in under a minute.</p>
        <Link href="/signup" className="btn btn-primary mt-7 px-7 py-3.5 text-base">Create account</Link>
      </section>
    </>
  );
}
