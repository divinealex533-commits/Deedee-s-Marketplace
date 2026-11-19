'use client';

import { useActionState } from 'react';
import { logout, resendCode, verifyPhone } from '@/app/actions/auth';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';

export default function VerifyForm() {
  const [state, action] = useActionState(verifyPhone, undefined);
  const [resent, resend] = useActionState(resendCode, undefined);

  return (
    <div className="mt-7 space-y-4">
      <form action={action} className="space-y-4">
        <label htmlFor="code" className="label">Verification code</label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          pattern="\d{6}"
          required
          autoFocus
          placeholder="••••••"
          className="input text-center font-mono text-3xl tracking-[0.5em]"
        />
        <FormMessage state={state} />
        <SubmitButton className="btn btn-primary w-full py-3.5 text-base" pendingText="Checking…">Verify and continue</SubmitButton>
      </form>
      <form action={resend} className="flex flex-wrap items-center gap-2 text-sm text-muted">
        Didn’t get it?
        <SubmitButton className="font-semibold text-accent-text" pendingText="Sending…">Resend code</SubmitButton>
      </form>
      <FormMessage state={resent} />
      <form action={logout}>
        <button type="submit" className="text-sm text-muted underline-offset-4 hover:underline">Use a different account</button>
      </form>
    </div>
  );
}
