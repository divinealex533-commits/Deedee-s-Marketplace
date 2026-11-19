'use client';

import { useState } from 'react';
import { adminApproveCheckout, adminRejectCheckout } from '@/app/actions/checkout';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

const REASONS = ['Payment not received', 'Amount doesn’t match', 'Screenshot unclear, please resend', 'Duplicate submission'];

export default function PaymentReview({ checkoutId, amount, quantity }: { checkoutId: string; amount: string; quantity: number }) {
  const approve = useActionForm(adminApproveCheckout);
  const reject = useActionForm(adminRejectCheckout);
  const [mode, setMode] = useState<'approve' | 'reject'>('approve');

  if (approve.state?.ok) return <p role="status" className="alert-ok">{approve.state.ok}</p>;
  if (reject.state?.ok) return <p role="status" className="alert-error">{reject.state.ok}</p>;

  return mode === 'approve' ? (
    <form onSubmit={approve.onSubmit} className="space-y-3">
      <input type="hidden" name="checkoutId" value={checkoutId} />
      <p className="text-sm text-muted">Received <strong className="text-white">{amount}</strong>? Approving delivers {quantity} login{quantity === 1 ? '' : 's'} straight away.</p>
      <FormMessage state={approve.state} />
      <SubmitButton pending={approve.pending} className="btn btn-primary w-full" pendingText="Delivering…">Approve &amp; deliver</SubmitButton>
      <button type="button" onClick={() => setMode('reject')} className="btn btn-danger w-full">Reject</button>
    </form>
  ) : (
    <form onSubmit={reject.onSubmit} className="space-y-3">
      <input type="hidden" name="checkoutId" value={checkoutId} />
      <label htmlFor={`r-${checkoutId}`} className="label">Reason (the customer sees this)</label>
      <select id={`r-${checkoutId}`} name="reason" className="input" defaultValue={REASONS[0]}>
        {REASONS.map((r) => <option key={r}>{r}</option>)}
      </select>
      <FormMessage state={reject.state} />
      <SubmitButton pending={reject.pending} className="btn btn-danger w-full" pendingText="Rejecting…">Confirm reject</SubmitButton>
      <button type="button" onClick={() => setMode('approve')} className="btn btn-ghost w-full">Back</button>
    </form>
  );
}
