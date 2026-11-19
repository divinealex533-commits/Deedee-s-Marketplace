'use client';

import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';

export default function SubmitButton({
  children,
  className = 'btn btn-primary',
  pendingText = 'Please wait…',
  disabled,
  pending: pendingProp,
}: {
  children: ReactNode;
  className?: string;
  pendingText?: string;
  disabled?: boolean;
  /** Pass when the form uses useActionForm (onSubmit) instead of a form action. */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" disabled={pending || disabled} className={className}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
