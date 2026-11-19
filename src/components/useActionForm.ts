'use client';

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from 'react';
import type { FormState } from '@/app/actions/types';

/**
 * Like useActionState, but keeps what the user typed when the server returns an error
 * (React 19 otherwise clears form fields after every submit).
 * Pass resetOnOk to clear the form after a successful save.
 */
export function useActionForm(
  fn: (prev: FormState, fd: FormData) => Promise<FormState>,
  opts?: { resetOnOk?: boolean },
) {
  const [state, action, pending] = useActionState(fn, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (opts?.resetOnOk && state?.ok) ref.current?.reset();
  }, [state, opts?.resetOnOk]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  return { state, pending, onSubmit, ref };
}
