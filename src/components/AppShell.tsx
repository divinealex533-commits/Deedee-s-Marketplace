import type { ReactNode } from 'react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import SideNav, { type NavItem } from './SideNav';
import { logout } from '@/app/actions/auth';
import { site, telegramLink, whatsappLink } from '@/lib/site';
import Link from 'next/link';
import { initials, naira } from '@/lib/format';

/** Sidebar + header layout shared by the customer and admin dashboards. */
export default function AppShell({
  items,
  user,
  balance,
  badge,
  homeHref,
  banner,
  children,
}: {
  items: NavItem[];
  user: { name: string; email: string };
  balance?: number;
  badge: string;
  homeHref: string;
  banner?: ReactNode;
  children: ReactNode;
}) {
  const walletHref = '/dashboard/wallet';
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative flex flex-col gap-6 border-b border-line bg-gradient-to-b from-panel2 to-ink p-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:gap-8 lg:border-b-0 lg:border-r lg:p-5">
        <div className="flex items-center justify-between px-2">
          <Logo href={homeHref} />
          <span className="badge bg-accent/15 text-accent-text lg:hidden">{badge}</span>
        </div>
        <span className="hidden px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-placeholder lg:block">{badge} menu</span>
        <SideNav items={items} />
        <div className="mt-auto hidden space-y-3 lg:block">
          <div className="rounded-xl border border-line p-4 text-sm text-muted">
            <div className="mb-1.5 font-semibold text-white">Need help?</div>
            <a href={whatsappLink()} className="block hover:text-white">WhatsApp: {site.whatsappDisplay}</a>
            <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="block hover:text-white">Telegram: @{site.telegram}</a>
            <a href={`tel:${site.phone}`} className="block hover:text-white">Call: {site.phoneDisplay}</a>
          </div>
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-[15px] font-medium text-danger hover:bg-line">
              <span aria-hidden="true" className="emoji flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-[22px] leading-none">🚪</span> Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {banner}
        <header className="sticky top-0 z-30 flex items-center justify-end gap-3 border-b border-line bg-ink/80 px-5 py-3.5 backdrop-blur-xl sm:px-8">
          {balance !== undefined && (
            <Link href={walletHref} className="mr-auto flex items-center gap-2 rounded-xl border border-line2 bg-panel px-3 py-2 hover:border-accent/60">
              <span aria-hidden="true" className="emoji text-lg leading-none">💰</span>
              <span className="font-display text-[15px] font-bold text-white">{naira(balance)}</span>
            </Link>
          )}
          <ThemeToggle />
          <div className="min-w-0 text-right">
            <div className="truncate font-semibold text-white">{user.name}</div>
            <div className="hidden truncate text-[13px] text-muted sm:block">{user.email}</div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#8B72FF] font-bold text-white ring-2 ring-accent/30" aria-hidden="true">
            {initials(user.name)}
          </div>
          <form action={logout} className="lg:hidden">
            <button type="submit" aria-label="Log out" className="flex h-11 w-11 items-center justify-center rounded-xl text-danger hover:bg-line">
              <span aria-hidden="true" className="emoji text-[22px] leading-none">🚪</span>
            </button>
          </form>
        </header>
        <main className="relative space-y-7 px-5 py-8 sm:px-8 lg:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(600px_circle_at_80%_0%,rgba(98,70,234,0.12),transparent_70%)]" />
          <div className="relative space-y-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
