'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import Modal from './Modal';
import ContactButtons from './ContactButtons';

/** Welcome pop-up after sign-up ("new") or login ("back"). Stays until the customer closes it. */
export default function WelcomeToast({ kind, name }: { kind: 'new' | 'back'; name: string }) {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Remove ?welcome=… so a refresh doesn't show it again
    router.replace(pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal open={open} onClose={() => setOpen(false)} label="Welcome">
      <div aria-hidden="true" className="emoji mx-auto mb-3 text-5xl leading-none">{kind === 'new' ? '🎉' : '👋'}</div>
      <h2 className="font-display text-2xl font-bold text-white">
        {kind === 'new' ? `Welcome to DeeDee’s Marketplace, ${name}!` : `Welcome back, ${name}!`}
      </h2>
      <p className="mt-2 text-[15px] text-muted">
        {kind === 'new'
          ? 'Your account is ready. Browse accounts, pay by bank transfer or wallet, and your logins land in My orders.'
          : 'Good to see you again. Fresh stock is waiting for you in the marketplace.'}
      </p>
      <Link href="/dashboard/marketplace" onClick={() => setOpen(false)} className="btn btn-primary mt-5 w-full py-3.5">
        <ShoppingBag className="h-5 w-5" aria-hidden="true" /> Browse accounts
      </Link>
      <p className="mb-2 mt-5 text-[13px] font-medium text-muted">Need help? Contact us on</p>
      <ContactButtons />
    </Modal>
  );
}
