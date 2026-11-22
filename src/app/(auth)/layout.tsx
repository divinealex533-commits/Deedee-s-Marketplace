import type { ReactNode } from 'react';
import { Lock, MessageCircle, ShieldCheck, Wallet, Zap } from 'lucide-react';
import Logo from '@/components/Logo';
import VisitTracker from '@/components/VisitTracker';
import { site, whatsappLink } from '@/lib/site';
import { getTelegramConfig } from '@/lib/settings';
import TelegramJoin from '@/components/TelegramJoin';

const perks = [
  { icon: Zap, title: 'Fast delivery', text: 'Login details land in your dashboard as soon as your payment is confirmed.' },
  { icon: ShieldCheck, title: 'Buyer protection', text: 'Something wrong? Report it and get refunded to your wallet.' },
  { icon: Wallet, title: 'Simple wallet', text: 'Fund once by bank transfer, then buy in one tap.' },
];

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const telegram = await getTelegramConfig();
  return (
    <div className="relative min-h-screen overflow-hidden">
      <VisitTracker />
      <div aria-hidden="true" className="auth-glow pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="auth-grid pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-5 py-6 sm:py-10 lg:flex-row lg:items-center lg:gap-16">
        {/* Brand side */}
        <section className="lg:flex-1">
          <Logo />
          <h2 className="mt-8 hidden font-display text-[clamp(34px,4vw,52px)] font-bold leading-[1.05] tracking-tight text-white lg:block">
            Premium accounts.
            <br />
            <span className="text-accent-text">Delivered fast.</span>
          </h2>
          <p className="mt-4 hidden max-w-md text-[17px] text-muted lg:block">
            Join buyers who get checked accounts, wallet payments and real support on WhatsApp.
          </p>

          {/* Mobile: compact perk chips */}
          <ul className="mt-5 flex flex-wrap gap-2 lg:hidden">
            {perks.map(({ icon: Icon, title }) => (
              <li key={title} className="flex items-center gap-1.5 rounded-full border border-line2 bg-panel/70 px-3 py-1.5 text-[13px] text-soft">
                <Icon className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" /> {title}
              </li>
            ))}
          </ul>

          {/* Desktop: full perk list */}
          <ul className="mt-10 hidden space-y-5 lg:block">
            {perks.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line2 bg-panel">
                  <Icon className="h-5 w-5 text-accent-text" aria-hidden="true" />
                </div>
                <div>
                  <div className="font-semibold text-white">{title}</div>
                  <div className="text-[15px] text-muted">{text}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Form side */}
        <section className="w-full lg:max-w-[480px]">
          <div className="rounded-3xl border border-line2 bg-panel/85 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
            {children}
          </div>
          {telegram.channel && (
            <div className="mt-4">
              <TelegramJoin channel={telegram.channel} />
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-muted">
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" aria-hidden="true" /> Encrypted &amp; secure</span>
            <a href={whatsappLink('Hi, I need help logging in')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> Help: {site.whatsappDisplay}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
