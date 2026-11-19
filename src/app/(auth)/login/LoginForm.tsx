'use client';

import Link from 'next/link';
import { ArrowRight, AtSign } from 'lucide-react';
import { login } from '@/app/actions/auth';
import FormMessage from '@/components/FormMessage';
import IconInput from '@/components/IconInput';
import PasswordInput from '@/components/PasswordInput';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

export default function LoginForm({ next }: { next: string }) {
  const { state, pending, onSubmit } = useActionForm(login);
  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-5">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="identifier" className="label">Email or phone number</label>
        <IconInput icon={AtSign} id="identifier" name="identifier" autoComplete="username" required placeholder="you@example.com" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="label">Password</label>
          <Link href="/forgot-password" className="text-sm font-medium text-accent-text hover:text-white">Forgot password?</Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required placeholder="Your password" />
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-soft">
        <input type="checkbox" name="remember" defaultChecked className="h-[18px] w-[18px] accent-accent" />
        Keep me logged in for 30 days
      </label>
      <FormMessage state={state} />
      <SubmitButton pending={pending} className="btn btn-primary group w-full py-3.5 text-base shadow-lg shadow-accent/30" pendingText="Logging in…">
        Log in <ArrowRight className="h-[18px] w-[18px] transition group-hover:translate-x-0.5" aria-hidden="true" />
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        Don’t have an account? <Link href="/signup" className="font-semibold text-accent-text hover:text-white">Sign up free</Link>
      </p>
    </form>
  );
}
