import type { ReactNode } from 'react';
import { MessageCircle, ShieldCheck, Zap } from 'lucide-react';
import Logo from '@/components/Logo';
import VisitTracker from '@/components/VisitTracker';
import { site } from '@/lib/site';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap">
      <VisitTracker />
      <section className="flex min-w-0 flex-[1_1_420px] flex-col gap-10 border-line bg-panel p-8 sm:p-14 lg:border-r">
        <Logo />
        <div className="mt-auto hidden sm:block">
          <h2 className="font-display text-[clamp(30px,3.6vw,44px)] font-bold leading-tight text-white">
            The safe way to buy premium accounts
          </h2>
          <p className="mt-4 max-w-md text-[17px] text-muted">
            Checked listings, wallet payments and your login details delivered instantly.
          </p>
        </div>
        <ul className="mb-auto hidden space-y-3.5 text-[15px] text-soft sm:block">
          <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-accent-text" aria-hidden="true" />Refunds if something isn’t right</li>
          <li className="flex items-center gap-3"><Zap className="h-5 w-5 text-accent-text" aria-hidden="true" />Instant delivery to your dashboard</li>
          <li className="flex items-center gap-3"><MessageCircle className="h-5 w-5 text-accent-text" aria-hidden="true" />24/7 WhatsApp support: {site.whatsappDisplay}</li>
        </ul>
      </section>
      <section className="flex min-w-0 flex-[1_1_420px] items-center justify-center p-6 py-12 sm:p-14">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
