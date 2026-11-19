'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { login } from '@/app/actions/auth';
import FormMessage from '@/components/FormMessage';
import PasswordInput from '@/components/PasswordInput';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

export default function LoginForm({ next }: { next: string }) {
  const { state, pending, onSubmit } = useActionForm(login);
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="identifier" className="label">Email or phone number</label>
        <input id="identifier" name="identifier" autoComplete="username" required placeholder="you@example.com" className="input" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="label">Password</label>
          <Link href="/forgot-password" className="text-sm font-medium text-accent-text">Forgot password?</Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-soft">
        <input type="checkbox" name="remember" defaultChecked className="h-[18px] w-[18px] accent-accent" />
        Keep me logged in for 30 days
      </label>
      <FormMessage state={state} />
      <SubmitButton pending={pending} className="btn btn-primary w-full py-3.5 text-base" pendingText="Logging in…">Log in</SubmitButton>
      <p className="flex items-center gap-2 pt-2 text-[13px] text-[#8A90AB]">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Your connection is encrypted. We never share your details.
      </p>
    </form>
  );
}
