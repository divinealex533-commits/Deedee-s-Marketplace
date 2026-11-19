'use client';

import { KeyRound } from 'lucide-react';
import { resetUserPassword } from '@/app/actions/admin';
import CopyButton from '@/components/CopyButton';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

export default function ResetPassword({ userId, phone }: { userId: string; phone: string }) {
  const { state, pending, onSubmit } = useActionForm(resetUserPassword);

  if (state?.ok) {
    const msg = `Hi! Your new DeeDee’s Marketplace password is: ${state.ok}\nPlease log in and change it in Settings.`;
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <code className="rounded bg-ink px-2 py-1 font-mono text-success">{state.ok}</code>
        <CopyButton value={state.ok} label="New password" />
        <a href={`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="font-medium text-accent-text">
          Send on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        if (!confirm('Give this customer a new password? Their old one will stop working.')) e.preventDefault();
        else onSubmit(e);
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton pending={pending} className="btn btn-ghost btn-sm whitespace-nowrap" pendingText="…">
        <KeyRound className="h-4 w-4" aria-hidden="true" /> Reset password
      </SubmitButton>
      {state?.error && <span role="alert" className="ml-2 text-xs text-danger">{state.error}</span>}
    </form>
  );
}
