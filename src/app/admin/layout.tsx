import type { ReactNode } from 'react';
import AppShell from '@/components/AppShell';
import type { NavItem } from '@/components/SideNav';
import { displayBalance } from '@/lib/displayBalance';
import { requireAdmin } from '@/lib/auth';

export const metadata = { title: { default: 'Admin', template: '%s · Admin' } };

const items: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: 'dashboard', exact: true },
  { href: '/admin/payments', label: 'Payments', icon: 'payments' },
  { href: '/admin/deposits', label: 'Deposits', icon: 'deposits' },
  { href: '/admin/credentials', label: 'Credentials pool', icon: 'pool' },
  { href: '/admin/orders', label: 'Orders', icon: 'orders' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'reviews' },
  { href: '/admin/bank-accounts', label: 'Bank accounts', icon: 'banks' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AppShell items={items} user={admin} balance={displayBalance(admin)} badge="Admin" homeHref="/admin">
      {children}
    </AppShell>
  );
}
