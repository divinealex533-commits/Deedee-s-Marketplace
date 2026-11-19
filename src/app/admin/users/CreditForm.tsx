'use client';

import { creditUser } from '@/app/actions/admin';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

export default function CreditForm({ userId }: { userId: string }) {
  const { state, pending, onSubmit, ref } = useActionForm(creditUser, { resetOnOk: true });
  return (
    <form ref={ref} onSubmit={onSubmit} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="note" value="Bank transfer (added by admin)" />
      <label htmlFor={`amt-${userId}`} className="sr-only">Amount in naira</label>
      <input id={`amt-${userId}`} name="amount" type="number" min={1} step="any" placeholder="₦" required className="input w-24 py-2 text-sm" />
      <SubmitButton pending={pending} className="btn btn-ghost btn-sm" pendingText="…">Add</SubmitButton>
      {state?.ok && <span role="status" className="text-xs text-success">{state.ok}</span>}
      {state?.error && <span role="alert" className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}
