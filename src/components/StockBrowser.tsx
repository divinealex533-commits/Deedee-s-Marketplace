'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import ProductCard, { type ProductCardData } from './ProductCard';
import { PlatformTile } from './PlatformIcon';

/** Category icons + instant search over the listings. Filters as you type, no page reload. */
export default function StockBrowser({
  cards,
  hrefBase,
  initialPlatform = '',
  initialQuery = '',
  emptyText = 'Nothing matches that. Try another word or category.',
}: {
  cards: ProductCardData[];
  hrefBase: string;
  initialPlatform?: string;
  initialQuery?: string;
  emptyText?: string;
}) {
  const [platform, setPlatform] = useState(initialPlatform);
  const [q, setQ] = useState(initialQuery);

  // Categories that have listings, with how many are in stock
  const cats = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cards) m.set(c.platform, (m.get(c.platform) ?? 0) + (c.stock > 0 ? 1 : 0));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [cards]);

  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return cards.filter((c) => {
      if (platform && c.platform !== platform) return false;
      if (!words.length) return true;
      const hay = `${c.title} ${c.platform} ${c.description ?? ''}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [cards, platform, q]);

  const chip = (active: boolean) =>
    `flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-3 py-2.5 text-[13px] font-medium transition min-w-[76px] ${
      active ? 'border-accent bg-accent/15 text-white ring-1 ring-accent' : 'border-line2 bg-panel text-soft hover:text-white'
    }`;

  return (
    <div className="space-y-5">
      {/* Search */}
      <div role="search" className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-placeholder" />
        <label htmlFor="stock-search" className="sr-only">Search accounts</label>
        <input
          id="stock-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search accounts, e.g. Facebook USA, Textplus, aged…"
          autoComplete="off"
          className="input h-14 rounded-2xl pl-12 pr-12 text-[16px]"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-line hover:text-white">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Category icons */}
      {cats.length > 1 && (
        <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Categories">
          <button type="button" onClick={() => setPlatform('')} aria-pressed={!platform} className={chip(!platform)}>
            <span aria-hidden="true" className="emoji flex h-9 w-9 items-center justify-center rounded-xl bg-line text-xl leading-none">🛍️</span>
            All
          </button>
          {cats.map(([p, n]) => (
            <button key={p} type="button" onClick={() => setPlatform(platform === p ? '' : p)} aria-pressed={platform === p} className={chip(platform === p)}>
              <span className="relative">
                <PlatformTile platform={p} size={36} />
                {n > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{n}</span>}
              </span>
              <span className="max-w-[84px] truncate">{p}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-muted" aria-live="polite">
        {shown.length} listing{shown.length === 1 ? '' : 's'}
        {platform ? ` in ${platform}` : ''}
        {q ? ` for “${q}”` : ''}
      </p>

      {shown.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => <ProductCard key={p.id} p={p} href={`${hrefBase}/${p.id}`} />)}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="font-semibold text-white">No results</p>
          <p className="mt-1 text-muted">{emptyText}</p>
          {(q || platform) && (
            <button type="button" onClick={() => { setQ(''); setPlatform(''); }} className="btn btn-ghost btn-sm mt-4">Show everything</button>
          )}
        </div>
      )}
    </div>
  );
}
