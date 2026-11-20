'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import Modal from './Modal';
import ContactButtons from './ContactButtons';

/** Welcome pop-up after sign-up ("new") or login ("back"). Stays until the customer closes it. */
export default function WelcomeToast({ kind, name, admin = false }: { kind: 'new' | 'back'; name: string; admin?: boolean }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Remove ?welcome=… from the address bar only (no page reload), so a refresh doesn't show it again
    const url = new URL(window.location.href);
    url.searchParams.delete('welcome');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }, []);

  return (
    <Modal open={open} onClose={() => setOpen(false)} label="Welcome">
      <div aria-hidden="true" className="emoji mx-auto mb-3 text-5xl leading-none">{kind === 'new' ? '🎉' : '👋'}</div>
      <h2 className="font-display text-2xl font-bold text-white">
        {kind === 'new' ? `Welcome to DeeDee’s Marketplace, ${name}!` : `Welcome back, ${name}!`}
      </h2>
      <p className="mt-2 text-[15px] text-muted">
        {admin ? 'Here’s your shop at a glance: payments to approve, stock and today’s sales.' : kind === 'new'
          ? 'Your account is ready. Browse accounts, pay by bank transfer or wallet, and your logins land in My orders.'
          : 'Good to see you again. Fresh stock is waiting for you in the marketplace.'}
      </p>
      {admin ? (
        <button type="button" onClick={() => setOpen(false)} className="btn btn-primary mt-5 w-full py-3.5">Go to dashboard</button>
      ) : (
        <>
          <Link href="/dashboard/marketplace" onClick={() => setOpen(false)} className="btn btn-primary mt-5 w-full py-3.5">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" /> Browse accounts
          </Link>
          <p className="mb-2 mt-5 text-[13px] font-medium text-muted">Need help? Contact us on</p>
          <ContactButtons />
        </>
      )}
    </Modal>
  );
}
