import { PlatformTile } from './PlatformIcon';

/** Icon for a category: its emoji if it has one, otherwise the platform icon for its name. */
export default function CategoryTile({ name, emoji, size = 40, className = '' }: { name: string; emoji?: string; size?: number; className?: string }) {
  if (!emoji) return <PlatformTile platform={name} size={size} className={className} />;
  return (
    <span
      aria-hidden="true"
      className={`emoji inline-flex shrink-0 items-center justify-center rounded-[28%] bg-gradient-to-br from-accent/40 to-accent/15 shadow-lg shadow-black/30 ring-1 ring-white/10 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5, lineHeight: 1 }}
    >
      {emoji}
    </span>
  );
}
