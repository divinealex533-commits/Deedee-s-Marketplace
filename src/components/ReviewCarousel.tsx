'use client';

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, MessageCircle, Quote } from 'lucide-react';
import Stars from './Stars';

export type CarouselReview = { id: string; rating: number; comment: string; name: string; item: string | null; source: string };

const INTERVAL = 5000;

/** Real reviews sliding in and out, one at a time. Swipe on phones; pauses on hover/touch. */
export default function ReviewCarousel({ reviews }: { reviews: CarouselReview[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = reviews.length;

  useEffect(() => {
    if (paused || n < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), INTERVAL);
    return () => clearTimeout(t);
  }, [i, paused, n]);

  if (!n) return null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-line2 bg-gradient-to-br from-[#1B1747] via-panel to-panel2 p-6 sm:p-10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0]!.clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start == null) return;
        const dx = e.changedTouches[0]!.clientX - start;
        if (Math.abs(dx) > 40) setI((x) => (x + (dx < 0 ? 1 : -1) + n) % n);
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Customer reviews"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" />
      <Quote className="absolute right-6 top-6 h-16 w-16 text-white/5 sm:h-24 sm:w-24" aria-hidden="true" />

      <div className="relative grid">
        {reviews.map((r, idx) => {
          const on = idx === i;
          return (
            <figure
              key={r.id}
              aria-hidden={!on}
              className={`col-start-1 row-start-1 transition-all duration-700 ease-out ${on ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
            >
              <Stars value={r.rating} size={20} />
              <blockquote className="mt-5 max-w-3xl font-display text-[clamp(20px,2.6vw,30px)] font-medium leading-snug text-white">
                “{r.comment}”
              </blockquote>
              <figcaption className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-[#8B72FF] font-bold text-white">
                  {r.name.charAt(0)}
                </span>
                <span className="font-semibold text-white">{r.name}</span>
                {r.source === 'whatsapp' ? (
                  <span className="inline-flex items-center gap-1 text-[#4ADE80]"><MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> via WhatsApp</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-success"><BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> verified buyer</span>
                )}
                {r.item && <span className="text-muted">· {r.item}</span>}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {n > 1 && (
        <div className="relative mt-8 flex items-center gap-2">
          {reviews.map((r, idx) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Show review ${idx + 1}`}
              aria-current={idx === i ? 'true' : undefined}
              className="flex h-6 items-center"
            >
              <span className={`block h-1.5 rounded-full transition-all duration-500 ${idx === i ? 'w-8 bg-accent' : 'w-3 bg-line2 hover:bg-placeholder'}`} />
            </button>
          ))}
          <span className="ml-auto text-xs text-muted">{i + 1} / {n}</span>
        </div>
      )}
    </div>
  );
}
