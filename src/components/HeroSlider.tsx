'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Code2, Eye, ShieldCheck, Wallet, Zap } from 'lucide-react';

type Slide = {
  eyebrow: string;
  icon: typeof Zap;
  title: ReactNode;
  text: string;
  cta: { href: string; label: string };
  secondary?: { href: string; label: string };
};

const SLIDES: Slide[] = [
  {
    eyebrow: 'Fast delivery',
    icon: Zap,
    title: (<>Premium accounts,<br /><span className="text-gradient">delivered fast.</span></>),
    text: 'Preview exactly what you’re buying, pay by bank transfer or wallet, and get your logins right in your dashboard.',
    cta: { href: '/signup', label: 'Create free account' },
    secondary: { href: '/#stock', label: 'Browse what’s in stock' },
  },
  {
    eyebrow: 'Preview first',
    icon: Eye,
    title: (<>See every item<br /><span className="text-gradient">before you pay.</span></>),
    text: 'Each listing shows a photo, instructions and a preview of what’s in stock. Tick the exact ones you want, or buy up to 50 at once.',
    cta: { href: '/#stock', label: 'See fresh stock' },
    secondary: { href: '/#how', label: 'How it works' },
  },
  {
    eyebrow: 'Easy wallet',
    icon: Wallet,
    title: (<>Fund with your<br /><span className="text-gradient">bank app.</span></>),
    text: 'Transfer to our 9PSB or PocketApp account, upload the receipt, and your wallet is credited, usually within minutes.',
    cta: { href: '/signup', label: 'Open my wallet' },
  },
  {
    eyebrow: 'Buyer protection',
    icon: ShieldCheck,
    title: (<>Not as described?<br /><span className="text-gradient">Money back.</span></>),
    text: 'Report a problem on any order and we’ll check it and refund your wallet. Real people on WhatsApp, every day.',
    cta: { href: '/signup', label: 'Get started' },
    secondary: { href: '/#faq', label: 'Read the FAQ' },
  },
  {
    eyebrow: 'For resellers',
    icon: Code2,
    title: (<>Sell on your own site<br /><span className="text-gradient">with our API.</span></>),
    text: 'Create an API key in your dashboard to check stock, buy and receive logins automatically from your own app or bot.',
    cta: { href: '/docs/api', label: 'Read the API docs' },
  },
];

const INTERVAL = 5500;

/** Auto-sliding headline carousel. Swipe on phones, arrows/dots on desktop, pauses on hover. */
export default function HeroSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = SLIDES.length;

  const go = useCallback((to: number) => setI(((to % n) + n) % n), [n]);

  useEffect(() => {
    if (paused) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => go(i + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [i, paused, go]);

  return (
    <div
      className="min-w-0 flex-[1_1_480px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0]!.clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start == null) return;
        const dx = e.changedTouches[0]!.clientX - start;
        if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Highlights"
    >
      {/* Slides stacked in one grid cell so the height never jumps */}
      <div className="grid">
        {SLIDES.map((s, idx) => {
          const on = idx === i;
          const Icon = s.icon;
          return (
            <div
              key={s.eyebrow}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${n}`}
              aria-hidden={!on}
              className={`col-start-1 row-start-1 transition-all duration-700 ease-out ${
                on ? 'translate-x-0 opacity-100' : idx < i ? 'pointer-events-none -translate-x-8 opacity-0' : 'pointer-events-none translate-x-8 opacity-0'
              }`}
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-line2 bg-panel/70 px-3.5 py-1.5 text-sm text-soft backdrop-blur">
                <Icon className="h-4 w-4 text-accent-text" aria-hidden="true" /> {s.eyebrow}
              </p>
              <h1 className="mt-6 font-display text-[clamp(40px,6.2vw,74px)] font-bold leading-[1.03] tracking-tight text-white">{s.title}</h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{s.text}</p>
              <div className="mt-9 flex flex-wrap gap-3.5">
                <Link href={s.cta.href} tabIndex={on ? 0 : -1} className="btn btn-primary group px-7 py-4 text-base shadow-xl shadow-accent/30">
                  {s.cta.label} <ArrowRight className="h-[18px] w-[18px] transition group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                {s.secondary && (
                  <Link href={s.secondary.href} tabIndex={on ? 0 : -1} className="btn btn-ghost bg-panel/50 px-7 py-4 text-base backdrop-blur">
                    {s.secondary.label}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-10 flex items-center gap-4">
        <div className="flex items-center gap-2">
          {SLIDES.map((s, idx) => (
            <button
              key={s.eyebrow}
              type="button"
              onClick={() => go(idx)}
              aria-label={`Show slide ${idx + 1}: ${s.eyebrow}`}
              aria-current={idx === i ? 'true' : undefined}
              className="group relative flex h-6 items-center"
            >
              <span className={`block h-1.5 overflow-hidden rounded-full transition-all duration-500 ${idx === i ? 'w-10 bg-line2' : 'w-4 bg-line2 group-hover:bg-placeholder'}`}>
                {idx === i && (
                  <span
                    key={`${i}-${paused}`}
                    className="block h-full rounded-full bg-accent"
                    style={{ animation: paused ? 'none' : `heroProgress ${INTERVAL}ms linear forwards`, width: paused ? '100%' : undefined }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="ml-auto hidden gap-2 sm:flex">
          <button type="button" onClick={() => go(i - 1)} aria-label="Previous slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-line2 text-soft transition hover:bg-panel hover:text-white">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go(i + 1)} aria-label="Next slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-line2 text-soft transition hover:bg-panel hover:text-white">
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
