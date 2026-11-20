'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X } from 'lucide-react';

/** Pop-up greeting after sign-up ("new") or login ("back"). Closes itself after a few seconds. */
export default function WelcomeToast({ kind, name }: { kind: 'new' | 'back'; name: string }) {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Remove ?welcome=… from the address so a refresh doesn't greet again
    router.replace(pathname, { scroll: false });
    const t = setTimeout(() => setOpen(false), kind === 'new' ? 9000 : 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;
  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
      <div className="relative w-full max-w-md animate-[sheetUp_.35s_ease-out] overflow-hidden rounded-2xl border border-accent/40 bg-panel p-5 pr-12 shadow-2xl shadow-black/50">
        <span aria-hidden="true" className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/30 blur-2xl" />
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-line hover:text-white">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="relative flex gap-4">
          <span aria-hidden="true" className="emoji text-4xl leading-none">{kind === 'new' ? '🎉' : '👋'}</span>
          <div>
            <p className="font-display text-lg font-bold text-white">
              {kind === 'new' ? `Welcome to DeeDee’s, ${name}!` : `Welcome back, ${name}!`}
            </p>
            <p className="mt-1 text-sm text-muted">
              {kind === 'new'
                ? 'Your account is ready. Browse the marketplace, pick what you need and pay by transfer or wallet.'
                : 'Good to see you again. Fresh stock is waiting in the marketplace.'}
            </p>
            <Link href="/dashboard/marketplace" onClick={() => setOpen(false)} className="btn btn-primary btn-sm mt-3">
              Go to marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
