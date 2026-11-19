'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Minus, Plus, ShieldCheck, X, Zap } from 'lucide-react';
import { beginCheckout } from '@/app/actions/checkout';
import SubmitButton from './SubmitButton';
import { PlatformTile } from './PlatformIcon';
import { naira } from '@/lib/format';

const MAX = 50;

/** "Buy now" on a product card: pick a quantity with − / +, then Checkout. */
export default function QuickBuy({ id, title, platform, price, stock }: { id: string; title: string; platform: string; price: number; stock: number }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const limit = Math.min(MAX, stock);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQty(1); setOpen(true); }}
        className="relative z-[2] inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-[#8B5CF6] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/40 transition hover:shadow-accent/60"
      >
        Buy now <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={`Buy ${title}`}>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-md animate-[sheetUp_.25s_ease-out] rounded-t-3xl border border-line2 bg-panel p-6 shadow-2xl shadow-black/60 sm:rounded-3xl">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-line hover:text-white">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-3 pr-10">
              <PlatformTile platform={platform} size={48} />
              <div className="min-w-0">
                <div className="truncate font-semibold text-white">{title}</div>
                <div className="text-sm text-muted">{naira(price)} each · {stock} available</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="font-medium text-soft">How many?</span>
              <div className="flex items-center rounded-2xl border border-line2 bg-panel2">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="flex h-12 w-12 items-center justify-center text-soft hover:text-white disabled:opacity-40">
                  <Minus className="h-5 w-5" aria-hidden="true" />
                </button>
                <label htmlFor={`qb-${id}`} className="sr-only">Quantity</label>
                <input
                  id={`qb-${id}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={limit}
                  value={qty}
                  onChange={(e) => setQty(Math.min(limit, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
                  className="w-14 bg-transparent text-center font-display text-2xl font-bold text-white focus:outline-none"
                />
                <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(limit, q + 1))} disabled={qty >= limit} className="flex h-12 w-12 items-center justify-center text-soft hover:text-white disabled:opacity-40">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[1, 2, 5, 10].filter((n) => n <= limit).map((n) => (
                <button key={n} type="button" onClick={() => setQty(n)} className={`rounded-full border px-3 py-1 text-sm ${qty === n ? 'border-accent bg-accent/20 text-white' : 'border-line2 text-muted hover:text-white'}`}>
                  {n}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-line2 bg-panel2 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-muted">Total</span>
                <span className="font-display text-3xl font-bold text-white">{naira(qty * price)}</span>
              </div>
              <div className="mt-1 text-[13px] text-muted">{qty} × {naira(price)}</div>
            </div>

            <form action={beginCheckout} className="mt-5">
              <input type="hidden" name="listingId" value={id} />
              <input type="hidden" name="qty" value={qty} />
              <SubmitButton className="btn btn-primary w-full py-4 text-base shadow-lg shadow-accent/30" pendingText="Reserving your items…">
                Checkout · {naira(qty * price)}
              </SubmitButton>
            </form>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-warn" aria-hidden="true" /> Instant delivery</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" /> Protected</span>
              </span>
              <Link href={`/dashboard/marketplace/${id}`} className="font-medium text-accent-text hover:text-white">Pick specific items →</Link>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
