import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

const TONES = {
  violet: { tile: 'bg-accent/15 text-accent-text', glow: 'bg-accent/30' },
  green: { tile: 'bg-[#0F3B2C] text-success', glow: 'bg-success/20' },
  amber: { tile: 'bg-[#3D2E0A] text-warn', glow: 'bg-warn/20' },
  blue: { tile: 'bg-[#10294A] text-[#7DB8FF]', glow: 'bg-[#3B82F6]/25' },
  pink: { tile: 'bg-[#3A1530] text-[#F9A8D4]', glow: 'bg-[#EC4899]/20' },
};

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = 'violet',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-panel to-panel2 p-5 transition hover:border-line2">
      <div aria-hidden="true" className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${t.glow}`} />
      <div className="relative flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-muted">{label}</span>
        {Icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.tile}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="relative mt-1 font-display text-[32px] font-bold leading-tight text-white">{value}</div>
      {sub ? <div className="relative mt-0.5 text-[13px] text-muted">{sub}</div> : null}
    </div>
  );
}
