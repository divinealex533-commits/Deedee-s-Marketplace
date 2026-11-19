'use client';

import { useState } from 'react';
import { approveDeposit, rejectDeposit } from '@/app/actions/admin';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

const REASONS = ['Payment not received', 'Amount doesn’t match', 'Screenshot unclear, please resend', 'Duplicate submission'];

export default function ReviewForms({ depositId, amount }: { depositId: string; amount: number }) {
  const approve = useActionForm(approveDeposit);
  const reject = useActionForm(rejectDeposit);
  const [mode, setMode] = useState<'approve' | 'reject'>('approve');

  if (approve.state?.ok) return <p role="status" className="alert-ok">{approve.state.ok}</p>;
  if (reject.state?.ok) return <p role="status" className="alert-error">{reject.state.ok}</p>;

  return mode === 'approve' ? (
    <form onSubmit={approve.onSubmit} className="space-y-3">
      <input type="hidden" name="depositId" value={depositId} />
      <div>
        <label htmlFor={`amt-${depositId}`} className="label">Amount received (₦)</label>
        <input id={`amt-${depositId}`} name="amount" type="number" min={1} step="any" defaultValue={amount} required className="input" />
        <p className="mt-1 text-xs text-muted">Change this if the amount on your statement is different.</p>
      </div>
      <FormMessage state={approve.state} />
      <SubmitButton pending={approve.pending} className="btn btn-primary w-full" pendingText="Crediting…">Approve and credit wallet</SubmitButton>
      <button type="button" onClick={() => setMode('reject')} className="btn btn-danger w-full">Reject</button>
    </form>
  ) : (
    <form onSubmit={reject.onSubmit} className="space-y-3">
      <input type="hidden" name="depositId" value={depositId} />
      <div>
        <label htmlFor={`reason-${depositId}`} className="label">Reason (the customer sees this)</label>
        <select id={`reason-${depositId}`} name="reason" className="input" defaultValue={REASONS[0]}>
          {REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>
      <FormMessage state={reject.state} />
      <SubmitButton pending={reject.pending} className="btn btn-danger w-full" pendingText="Rejecting…">Confirm reject</SubmitButton>
      <button type="button" onClick={() => setMode('approve')} className="btn btn-ghost w-full">Back</button>
    </form>
  );
}
