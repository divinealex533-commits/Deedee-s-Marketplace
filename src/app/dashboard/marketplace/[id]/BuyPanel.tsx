'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Eye, Minus, Plus } from 'lucide-react';
import { beginCheckout } from '@/app/actions/checkout';
import CopyButton from '@/components/CopyButton';
import SubmitButton from '@/components/SubmitButton';
import { naira } from '@/lib/format';

const MAX = 50;

export default function BuyPanel({
  listingId,
  price,
  balance,
  stock,
  showLogin,
  items,
}: {
  listingId: string;
  price: number;
  balance: number;
  stock: number;
  showLogin: boolean;
  items: { id: string; preview: string; url: string | null }[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [qty, setQty] = useState(1);
  const limit = Math.min(MAX, stock);

  const count = selected.size || qty;
  const total = count * price;
  const allShownSelected = items.length > 0 && items.slice(0, limit).every((i) => selected.has(i.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX) next.add(id);
      return next;
    });

  const selectAll = () =>
    setSelected(allShownSelected ? new Set() : new Set(items.slice(0, limit).map((i) => i.id)));

  const ids = useMemo(() => [...selected], [selected]);

  if (!stock) {
    return <p className="mt-6 rounded-xl bg-panel2 p-6 text-center text-muted">Sold out for now. Check back soon or message support.</p>;
  }

  return (
    <form action={beginCheckout} className="mt-5 space-y-5">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="qty" value={count} />
      {ids.map((id) => <input key={id} type="hidden" name="ids" value={id} />)}

      {/* Item list */}
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">Available ({stock})</span>
          <button type="button" onClick={selectAll} className="font-medium text-accent-text hover:text-white">
            {allShownSelected ? 'Clear' : `Select ${limit === stock ? 'all' : `first ${limit}`}`}
          </button>
        </div>
        <ul className="max-h-80 space-y-2 overflow-y-auto rounded-2xl border border-line bg-ink/60 p-2" aria-label="Available items">
          {items.map((item) => {
            const on = selected.has(item.id);
            return (
              <li key={item.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition ${
                    on ? 'border-accent bg-accent/15' : 'border-line bg-panel2 hover:border-line2'
                  }`}
                >
                  <input type="checkbox" checked={on} onChange={() => toggle(item.id)} className="h-5 w-5 shrink-0 accent-accent" />
                  <span className="min-w-0 flex-1 truncate font-mono text-[15px] tracking-wide text-white">{item.preview}</span>
                  {item.url && !/^https?:\/\//i.test(item.url) && (
                    <span className="shrink-0 rounded-lg bg-line px-2.5 py-1.5 font-mono text-xs text-soft">{item.url}</span>
                  )}
                  {item.url && /^https?:\/\//i.test(item.url) && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Open preview for ${item.preview}`}
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-accent/15 px-2.5 text-xs font-semibold text-accent-text hover:bg-accent hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Preview
                    </a>
                  )}
                  {showLogin && (
                    <span onClick={(e) => e.preventDefault()}>
                      <CopyButton value={item.preview} label="Preview" />
                    </span>
                  )}
                </label>
              </li>
            );
          })}
          {stock > items.length && (
            <li className="px-3 py-2 text-center text-[13px] text-muted">+ {stock - items.length} more (use quantity to buy them)</li>
          )}
        </ul>
      </div>

      {/* Quantity */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-soft">{selected.size ? 'Selected' : 'Quantity'}</span>
        {selected.size ? (
          <span className="font-semibold text-white">
            {selected.size} item{selected.size === 1 ? '' : 's'}{' '}
            <button type="button" onClick={() => setSelected(new Set())} className="ml-2 text-sm font-medium text-accent-text">Clear</button>
          </span>
        ) : (
          <div className="flex items-center rounded-xl border border-line2 bg-panel2">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center text-soft hover:text-white">
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <label htmlFor="qty-input" className="sr-only">Quantity</label>
            <input
              id="qty-input"
              type="number"
              min={1}
              max={limit}
              value={qty}
              onChange={(e) => setQty(Math.min(limit, Math.max(1, Math.floor(Number(e.target.value) || 1))))}
              className="w-14 bg-transparent text-center text-lg font-semibold text-white focus:outline-none"
            />
            <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(limit, q + 1))} className="flex h-11 w-11 items-center justify-center text-soft hover:text-white">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Total + buy */}
      <div className="rounded-2xl border border-line2 bg-panel2 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Total</span>
          <span className="font-display text-3xl font-bold text-white">{naira(total)}</span>
        </div>
        <div className="mt-1 flex justify-between text-[13px] text-muted">
          <span>{count} × {naira(price)}</span>
          <span>Wallet: {naira(balance)}</span>
        </div>
      </div>

      <SubmitButton className="btn btn-primary w-full py-4 text-base shadow-lg shadow-accent/30" pendingText="Reserving your items…">
        Checkout · {naira(total)}
      </SubmitButton>
      <p className="text-center text-[13px] text-muted">Pay by bank transfer or from your wallet on the next step. Items are held for you for 60 minutes.</p>
    </form>
  );
}
