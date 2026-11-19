import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import Logo from './Logo';
import SideNav, { type NavItem } from './SideNav';
import { logout } from '@/app/actions/auth';
import { site, whatsappLink } from '@/lib/site';
import { initials } from '@/lib/format';

/** Sidebar + header layout shared by the customer and admin dashboards. */
export default function AppShell({
  items,
  user,
  badge,
  homeHref,
  children,
}: {
  items: NavItem[];
  user: { name: string; email: string };
  badge: string;
  homeHref: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex flex-col gap-6 border-b border-line bg-panel2 p-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:gap-8 lg:border-b-0 lg:border-r lg:p-5">
        <div className="flex items-center justify-between px-2">
          <Logo short href={homeHref} />
          <span className="badge bg-line text-soft lg:hidden">{badge}</span>
        </div>
        <SideNav items={items} />
        <div className="mt-auto hidden space-y-3 lg:block">
          <div className="rounded-xl border border-line p-4 text-sm text-muted">
            <div className="mb-1.5 font-semibold text-white">Need help?</div>
            <a href={whatsappLink()} className="block hover:text-white">WhatsApp: {site.whatsappDisplay}</a>
            <a href={`tel:${site.phone}`} className="block hover:text-white">Call: {site.phoneDisplay}</a>
          </div>
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-[15px] font-medium text-danger hover:bg-line">
              <LogOut className="h-[18px] w-[18px]" aria-hidden="true" /> Log out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-end gap-3 border-b border-line px-5 py-4 sm:px-8">
          <div className="text-right">
            <div className="font-semibold text-white">{user.name}</div>
            <div className="text-[13px] text-muted">{user.email}</div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-line2 font-bold text-white" aria-hidden="true">
            {initials(user.name)}
          </div>
          <form action={logout} className="lg:hidden">
            <button type="submit" aria-label="Log out" className="flex h-11 w-11 items-center justify-center rounded-xl text-danger hover:bg-line">
              <LogOut className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </header>
        <main className="space-y-7 px-5 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
