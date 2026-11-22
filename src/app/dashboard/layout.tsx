import type { ReactNode } from 'react';
import AppShell from '@/components/AppShell';
import type { NavItem } from '@/components/SideNav';
import { requireUser } from '@/lib/auth';
import { displayBalance } from '@/lib/displayBalance';
import AnnouncementBar from '@/components/AnnouncementBar';

const items: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', exact: true },
  { href: '/dashboard/marketplace', label: 'Marketplace', icon: 'market' },
  { href: '/dashboard/orders', label: 'My orders', icon: 'myorders' },
  { href: '/dashboard/wallet', label: 'Wallet', icon: 'wallet' },
  { href: '/dashboard/referrals', label: 'Referrals', icon: 'gift' },
  { href: '/dashboard/api', label: 'API', icon: 'api' },
  { href: '/dashboard/support', label: 'Support', icon: 'support' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'settings' },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const sellerItems: NavItem[] =
    user.accountType === 'SELLER'
      ? [
          { href: '/dashboard/seller', label: 'Seller hub', icon: 'shop', exact: true },
          { href: '/dashboard/seller/listings', label: 'My listings', icon: 'tag' },
        ]
      : [];
  const base = [items[0]!, ...sellerItems, ...items.slice(1)];
  const nav = user.role === 'ADMIN' ? [...base, { href: '/admin', label: 'Admin', icon: 'pool' } as NavItem] : base;
  return (
    <AppShell items={nav} user={user} balance={displayBalance(user)} badge={user.accountType === 'SELLER' ? 'Seller' : 'Buyer'} homeHref="/dashboard" banner={<AnnouncementBar />}>
      {children}
    </AppShell>
  );
}
