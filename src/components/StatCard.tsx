import type { ReactNode } from 'react';

export default function StatCard({ label, value, sub, icon }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between text-sm text-muted">
        {label}
        {icon}
      </div>
      <div className="mt-2 font-display text-[32px] font-bold leading-tight text-white">{value}</div>
      {sub ? <div className="mt-0.5 text-[13px] text-muted">{sub}</div> : null}
    </div>
  );
}
