'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote, Code2, Gift, KeyRound, Landmark, Star, LayoutDashboard, LifeBuoy, Settings, ShoppingBag, ShoppingCart, Users, Wallet,
} from 'lucide-react';

const ICONS = {
  dashboard: LayoutDashboard,
  market: ShoppingCart,
  wallet: Wallet,
  support: LifeBuoy,
  settings: Settings,
  pool: KeyRound,
  orders: ShoppingBag,
  users: Users,
  deposits: Banknote,
  banks: Landmark,
  api: Code2,
  gift: Gift,
  reviews: Star,
};

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean };

export default function SideNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
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
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-accent text-white shadow-lg shadow-accent/40' : 'bg-line/60'}`}>
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
