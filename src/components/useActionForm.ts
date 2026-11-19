'use client';

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from 'react';
import type { FormState } from '@/app/actions/types';

/**
 * Like useActionState, but keeps what the user typed when the server returns an error
 * (React 19 otherwise clears form fields after every submit).
 * - resetOnOk: clear the form after a successful save
 * - transform: change the FormData before sending (e.g. compress an image)
 */
export function useActionForm(
  fn: (prev: FormState, fd: FormData) => Promise<FormState>,
  opts?: { resetOnOk?: boolean; transform?: (fd: FormData) => Promise<FormData> | FormData },
) {
  const [state, action, pending] = useActionState(fn, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (opts?.resetOnOk && state?.ok) ref.current?.reset();
  }, [state, opts?.resetOnOk]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Include the clicked button's name/value (e.g. a "Remove" button).
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    let fd = new FormData(e.currentTarget, submitter);
    if (opts?.transform) fd = await opts.transform(fd);
    startTransition(() => action(fd));
  };

  return { state, pending, onSubmit, ref };
}

/** transform helper: compresses the image in the given field before upload. */
export function compressField(field: string) {
  return async (fd: FormData) => {
    const f = fd.get(field);
    if (f instanceof File && f.size > 0) {
      const { compressImage } = await import('@/lib/compressImage');
      fd.set(field, await compressImage(f, 1400), 'image.jpg');
    }
    return fd;
  };
}
