'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { revealCredential } from '@/app/actions/admin';
import CopyButton from '@/components/CopyButton';

export default function RevealCell({ id }: { id: string }) {
  const [secret, setSecret] = useState<{ password: string; notes: string } | null>(null);
  const [shown, setShown] = useState(false);
  const [pending, start] = useTransition();

  const toggle = () => {
    if (shown) return setShown(false);
    if (secret) return setShown(true);
    start(async () => {
      const s = await revealCredential(id);
      if (s) {
        setSecret(s);
        setShown(true);
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5 font-mono text-soft">
      <span className="break-all">{shown && secret ? secret.password : '••••••••'}</span>
      {shown && secret && <CopyButton value={secret.password} label="Password" />}
      <button type="button" onClick={toggle} className="rounded-md border border-line2 px-2 py-1 font-sans text-xs font-semibold text-accent-text hover:bg-line">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-label="Loading" /> : shown ? 'Hide' : 'Show'}
      </button>
      {shown && secret?.notes && <span className="ml-1 font-sans text-xs text-muted">Details: {secret.notes}</span>}
    </div>
  );
}
