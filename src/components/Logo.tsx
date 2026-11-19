import Link from 'next/link';
import { site } from '@/lib/site';

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#6246EA" />
      <path d="M10 16.5l4 4 8-9" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ short = false, href = '/' }: { short?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 font-display text-xl font-bold text-white">
      <LogoMark />
      {short ? site.shortName : site.name}
    </Link>
  );
}
