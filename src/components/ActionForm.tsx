'use client';

import type { ReactNode } from 'react';
import type { FormState } from '@/app/actions/types';
import FormMessage from './FormMessage';
import SubmitButton from './SubmitButton';
import { compressField, useActionForm } from './useActionForm';

/**
 * A form that runs a server action and shows its success/error message.
 * - compress: name of an image field to shrink before upload
 * - resetOnOk: clear the fields after success
 */
export default function ActionForm({
  action,
  children,
  submit,
  pendingText = 'Saving…',
  buttonClass = 'btn btn-primary w-full',
  compress,
  resetOnOk,
  className = 'space-y-4',
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children?: ReactNode;
  submit: ReactNode;
  pendingText?: string;
  buttonClass?: string;
  compress?: string;
  resetOnOk?: boolean;
  className?: string;
}) {
  const { state, pending, onSubmit, ref } = useActionForm(action, { resetOnOk, transform: compress ? compressField(compress) : undefined });
  return (
    <form ref={ref} onSubmit={onSubmit} className={className}>
      {children}
      <FormMessage state={state} />
      <SubmitButton pending={pending} className={buttonClass} pendingText={pendingText}>{submit}</SubmitButton>
    </form>
  );
}
