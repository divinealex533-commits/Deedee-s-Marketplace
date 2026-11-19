import type { ReactNode } from 'react';
import AppShell from '@/components/AppShell';
import type { NavItem } from '@/components/SideNav';
import { requireUser } from '@/lib/auth';

const items: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', exact: true },
  { href: '/dashboard/marketplace', label: 'Marketplace', icon: 'market' },
  { href: '/dashboard/wallet', label: 'Wallet', icon: 'wallet' },
  { href: '/dashboard/support', label: 'Support', icon: 'support' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'settings' },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const nav = user.role === 'ADMIN' ? [...items, { href: '/admin', label: 'Admin', icon: 'pool' } as NavItem] : items;
  return (
    <AppShell items={nav} user={user} badge={user.accountType === 'SELLER' ? 'Seller' : 'Buyer'} homeHref="/dashboard">
      {children}
    </AppShell>
  );
}
