'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signup } from '@/app/actions/auth';
import FormMessage from '@/components/FormMessage';
import PasswordInput from '@/components/PasswordInput';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

function score(pw: string) {
  let n = 0;
  if (pw.length >= 8) n++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) n++;
  if (/\d/.test(pw)) n++;
  if (/[^A-Za-z0-9]/.test(pw)) n++;
  return n;
}
const LABELS = ['Use 8+ characters with letters and numbers', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = ['bg-line', 'bg-danger', 'bg-warn', 'bg-success', 'bg-success'];
const TEXT = ['text-muted', 'text-danger', 'text-warn', 'text-success', 'text-success'];

export default function SignupForm({ referral }: { referral: string }) {
  const { state, pending, onSubmit } = useActionForm(signup);
  const [type, setType] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [pw, setPw] = useState('');
  const s = pw ? score(pw) : 0;

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4">
      <fieldset>
        <legend className="label">I want to</legend>
        <input type="hidden" name="accountType" value={type} />
        <div className="grid grid-cols-2 gap-2.5">
          {([
            ['BUYER', 'Buy accounts', 'Browse and purchase'],
            ['SELLER', 'Sell accounts', 'List and get paid'],
          ] as const).map(([value, title, sub]) => (
            <button
              key={value}
              type="button"
              aria-pressed={type === value}
              onClick={() => setType(value)}
              className={`rounded-xl border-2 bg-panel2 p-3.5 text-left transition ${type === value ? 'border-accent' : 'border-line2 hover:border-placeholder'}`}
            >
              <span className="block text-[15px] font-semibold text-white">{title}</span>
              <span className="text-[13px] text-muted">{sub}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="name" className="label">Full name</label>
        <input id="name" name="name" autoComplete="name" required className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="input" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Phone number</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" required placeholder="080 0000 0000" className="input" />
        </div>
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-1.5 rounded-full ${pw && i <= s ? COLORS[s] : 'bg-line'}`} />
          ))}
        </div>
        <p className={`mt-1.5 text-[13px] ${pw ? TEXT[s] : 'text-muted'}`}>
          {pw ? `${LABELS[s]} password` : LABELS[0]}
        </p>
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirm password</label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
      </div>
      <div>
        <label htmlFor="referral" className="label">Referral code (optional)</label>
        <input id="referral" name="referral" defaultValue={referral} className="input uppercase" />
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-soft">
        <input type="checkbox" name="agree" className="mt-0.5 h-[18px] w-[18px] accent-accent" />
        <span>
          I agree to the <Link href="/terms" className="text-accent-text">Terms of service</Link> and{' '}
          <Link href="/privacy" className="text-accent-text">Privacy policy</Link>
        </span>
      </label>
      <FormMessage state={state} />
      <SubmitButton pending={pending} className="btn btn-primary w-full py-3.5 text-base" pendingText="Creating your account…">
        Create account
      </SubmitButton>
    </form>
  );
}
