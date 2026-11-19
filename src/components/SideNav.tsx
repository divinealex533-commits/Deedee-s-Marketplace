'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ICONS = {
  dashboard: '🏠',
  market: '🛍️',
  wallet: '💰',
  support: '💬',
  settings: '⚙️',
  pool: '🔑',
  orders: '🧾',
  users: '👥',
  deposits: '💵',
  banks: '🏦',
  api: '🧩',
  gift: '🎁',
  payments: '💳',
  myorders: '📦',
  reviews: '⭐',
} as const;

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean };

export default function SideNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active = item.exact ? path === item.href : path === item.href || path.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition ${
              active ? 'bg-gradient-to-r from-accent/25 to-accent/5 text-white' : 'text-soft hover:bg-panel hover:text-white'
            }`}
          >
            {active && <span aria-hidden="true" className="absolute inset-y-2 left-0 hidden w-1 rounded-r-full bg-accent lg:block" />}
            <span
              aria-hidden="true"
              className={`emoji flex h-9 w-9 items-center justify-center rounded-xl text-[22px] leading-none transition ${
                active ? 'bg-white/15 shadow-lg shadow-accent/30 ring-1 ring-white/20' : 'bg-white/[0.04]'
              }`}
            >
              {ICONS[item.icon]}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
