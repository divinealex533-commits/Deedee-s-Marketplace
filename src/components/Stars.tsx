import { Star } from 'lucide-react';

/** Read-only star rating, e.g. 4.5 → ★★★★½ (half shown as filled when ≥ .5). */
export default function Stars({ value, size = 16, className = '' }: { value: number; size?: number; className?: string }) {
  const full = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          style={{ width: size, height: size }}
          className={i <= full ? 'fill-warn text-warn' : 'fill-transparent text-line2'}
        />
      ))}
    </span>
  );
}
