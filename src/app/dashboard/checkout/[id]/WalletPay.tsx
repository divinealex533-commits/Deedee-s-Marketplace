'use client';

import { Wallet } from 'lucide-react';
import { payWithWallet } from '@/app/actions/checkout';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

export default function WalletPay({ checkoutId, label }: { checkoutId: string; label: string }) {
  const { state, pending, onSubmit } = useActionForm(payWithWallet);
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input type="hidden" name="checkoutId" value={checkoutId} />
      <SubmitButton pending={pending} className="btn btn-ghost w-full" pendingText="Paying…"><Wallet className="h-4 w-4" aria-hidden="true" /> {label}</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
