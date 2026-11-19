'use client';

import Link from 'next/link';
import { forgotPassword } from '@/app/actions/auth';
import FormMessage from '@/components/FormMessage';
import PasswordInput from '@/components/PasswordInput';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

export default function ForgotPasswordPage() {
  const { state, pending, onSubmit } = useActionForm(forgotPassword);
  const step = state?.step ?? 'request';

  if (step === 'done') {
    return (
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-white">Password updated</h1>
        <p className="mt-2 text-muted">{state?.ok}</p>
        <Link href="/login" className="btn btn-primary mt-7">Log in</Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/login" className="text-sm font-semibold text-accent-text">← Back to log in</Link>
      <h1 className="mt-4 font-display text-3xl font-bold text-white">Reset your password</h1>
      <p className="mt-1.5 text-muted">
        {step === 'request'
          ? 'Enter the phone number on your account and we’ll text you a code.'
          : 'Enter the code we sent and choose a new password.'}
      </p>

      <form key={step} onSubmit={onSubmit} className="mt-7 space-y-4">
        <input type="hidden" name="step" value={step} />
        {step === 'request' ? (
          <div>
            <label htmlFor="phone" className="label">Phone number</label>
            <input id="phone" name="phone" type="tel" autoComplete="tel" required placeholder="080 0000 0000" className="input" />
          </div>
        ) : (
          <>
            <input type="hidden" name="phone" value={state?.phone ?? ''} />
            <div>
              <label htmlFor="code" className="label">6-digit code</label>
              <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required className="input font-mono tracking-[0.3em]" />
            </div>
            <div>
              <label htmlFor="password" className="label">New password</label>
              <PasswordInput id="password" name="password" autoComplete="new-password" required />
            </div>
            <div>
              <label htmlFor="confirm" className="label">Confirm new password</label>
              <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
            </div>
          </>
        )}
        <FormMessage state={state} />
        <SubmitButton pending={pending} className="btn btn-primary w-full py-3.5 text-base">
          {step === 'request' ? 'Send code' : 'Update password'}
        </SubmitButton>
      </form>
    </>
  );
}
