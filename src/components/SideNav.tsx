'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Banknote, KeyRound, Landmark, LayoutDashboard, LifeBuoy, Settings, ShoppingBag, ShoppingCart, Users, Wallet,
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
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition ${
              active ? 'bg-line text-white' : 'text-soft hover:bg-panel hover:text-white'
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
