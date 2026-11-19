'use client';

import { useState } from 'react';
import { startFunding } from '@/app/actions/wallet';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

const QUICK = [2000, 5000, 10000, 20000, 50000];

export default function FundForm() {
  const { state, pending, onSubmit } = useActionForm(startFunding);
  const [amount, setAmount] = useState('');

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {QUICK.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAmount(String(a))}
            className={`rounded-full border px-3.5 py-2 text-sm transition ${amount === String(a) ? 'border-accent bg-accent text-white' : 'border-line2 text-text hover:bg-line'}`}
          >
            ₦{a.toLocaleString()}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="amount" className="label">Amount (₦)</label>
        <input
          id="amount"
          name="amount"
          type="number"
          min={100}
          step={1}
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input"
        />
      </div>
      <FormMessage state={state} />
      <SubmitButton pending={pending} className="btn btn-primary w-full py-3.5 text-base" pendingText="Opening Paystack…">
        Pay with card, transfer or USSD
      </SubmitButton>
      <p className="text-center text-[13px] text-muted">Secured by Paystack</p>
    </form>
  );
}
