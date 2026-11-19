import Link from 'next/link';
import { site } from '@/lib/site';

/** The brand badge: a glossy violet tile with a white tick. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="dd-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8B73FF" />
          <stop offset="1" stopColor="#4A2FD6" />
        </linearGradient>
        <linearGradient id="dd-shine" x1="16" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#dd-mark)" />
      <rect x="1" y="1" width="30" height="15" rx="8" fill="url(#dd-shine)" />
      <path d="M10 16.5l4 4 8-9" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const WORDMARK_FONT = { fontFamily: "Inter, -apple-system, 'SF Pro Display', 'Segoe UI', system-ui, sans-serif" };

export default function Logo({ short = false, href = '/' }: { short?: boolean; href?: string }) {
  return (
    <Link href={href} aria-label={`${site.name}: home`} className="group flex shrink-0 items-center gap-3 whitespace-nowrap">
      <span className="relative flex">
        <span aria-hidden="true" className="absolute inset-0 rounded-[11px] bg-accent/60 blur-md transition group-hover:bg-accent/80" />
        <span className="relative"><LogoMark size={38} /></span>
      </span>
      <span className="flex flex-col leading-none" style={WORDMARK_FONT}>
        <span className="text-[19px] font-extrabold tracking-[-0.02em] text-white">DeeDee’s</span>
        {!short && (
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-accent-text">Marketplace</span>
        )}
      </span>
    </Link>
  );
}
