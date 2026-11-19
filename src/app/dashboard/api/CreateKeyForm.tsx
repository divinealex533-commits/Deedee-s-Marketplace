'use client';

import { AlertTriangle, Plus } from 'lucide-react';
import { createApiKey } from '@/app/actions/apikeys';
import CopyButton from '@/components/CopyButton';
import FormMessage from '@/components/FormMessage';
import SubmitButton from '@/components/SubmitButton';
import { useActionForm } from '@/components/useActionForm';

export default function CreateKeyForm() {
  const { state, pending, onSubmit, ref } = useActionForm(createApiKey, { resetOnOk: true });

  return (
    <div className="space-y-4">
      {state?.ok && (
        <div role="status" className="rounded-2xl border border-success/30 bg-[#0F3B2C]/60 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Copy your key now. You won’t see it again.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-ink px-3 py-2.5">
            <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-white">{state.ok}</code>
            <CopyButton value={state.ok} label="API key" />
          </div>
        </div>
      )}
      <form ref={ref} onSubmit={onSubmit} className="flex flex-wrap gap-3">
        <label htmlFor="key-name" className="sr-only">Key name</label>
        <input id="key-name" name="name" placeholder="e.g. My website" maxLength={40} className="input min-w-0 flex-1" />
        <SubmitButton pending={pending} pendingText="Creating…"><Plus className="h-4 w-4" aria-hidden="true" /> Create key</SubmitButton>
      </form>
      {state?.error && <FormMessage state={state} />}
    </div>
  );
}
