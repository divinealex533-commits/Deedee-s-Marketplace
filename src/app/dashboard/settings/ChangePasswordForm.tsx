'use client';

import { changePassword } from '@/app/actions/auth';
import FormMessage from '@/components/FormMessage';
import PasswordInput from '@/components/PasswordInput';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

export default function ChangePasswordForm() {
  const { state, pending, onSubmit, ref } = useActionForm(changePassword, { resetOnOk: true });
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="current" className="label">Current password</label>
        <PasswordInput id="current" name="current" autoComplete="current-password" required />
      </div>
      <div>
        <label htmlFor="password" className="label">New password</label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required />
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirm new password</label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton pending={pending} pendingText="Saving…">Update password</SubmitButton>
    </form>
  );
}
