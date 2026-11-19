import type { FormState } from '@/app/actions/types';

export default function FormMessage({ state }: { state: FormState }) {
  if (state?.error) return <p role="alert" className="alert-error">{state.error}</p>;
  if (state?.ok) return <p role="status" className="alert-ok">{state.ok}</p>;
  return null;
}
