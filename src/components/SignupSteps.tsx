import { Check } from 'lucide-react';

const STEPS = ['Details', 'Verify phone', 'Start buying'];

export default function SignupSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol aria-label="Sign-up progress" className="mb-6 flex items-center gap-2">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const on = n === current;
        return (
          <li key={label} aria-current={on ? 'step' : undefined} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done ? 'bg-success text-ink' : on ? 'bg-accent text-white ring-4 ring-accent/25' : 'bg-line text-muted'
              }`}
            >
              {done ? <Check className="h-4 w-4" aria-hidden="true" /> : n}
            </span>
            <span className={`hidden text-[13px] sm:inline ${on ? 'font-semibold text-white' : 'text-muted'}`}>{label}</span>
            {n < STEPS.length && <span className={`h-px flex-1 ${done ? 'bg-success' : 'bg-line2'}`} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
