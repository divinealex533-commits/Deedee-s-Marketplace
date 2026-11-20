'use client';

import { useState } from 'react';
import { Check, Copy, Eye } from 'lucide-react';
import QuickBuy from './QuickBuy';
import { naira } from '@/lib/format';

export type CardItem = { id: string; preview: string; url: string | null; copy?: boolean };

/** One item on a product card: tick to pick it, copy it, and open its preview link / number. */
function ItemRow({ item, on, toggle }: { item: CardItem; on: boolean; toggle: () => void }) {
  const [copied, setCopied] = useState(false);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <li className="relative z-[2]">
      <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${on ? 'border-accent bg-accent/15' : 'border-line bg-white/[0.03]'}`}>
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={on} onChange={toggle} onClick={stop} className="h-5 w-5 shrink-0 accent-accent" aria-label={`Pick ${item.preview}`} />
          <span className="min-w-0 flex-1 truncate font-mono text-[15px] tracking-wide text-white">{item.preview}</span>
        </label>
        {item.copy && (
          <button
            type="button"
            onClick={async (e) => {
              stop(e);
              try {
                await navigator.clipboard.writeText(item.preview);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {}
            }}
            aria-label={`Copy ${item.preview}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent-text hover:bg-accent/15"
          >
            {copied ? <Check className="h-4 w-4 text-success" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" onClick={stop} aria-label={`Open preview ${item.preview}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-accent-text hover:bg-accent/15">
            <Eye className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </li>
  );
}

export default function CardBuy({
  id, title, platform, price, stock, items,
}: { id: string; title: string; platform: string; price: number; stock: number; items: CardItem[] }) {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (itemId: string) => setPicked((p) => (p.includes(itemId) ? p.filter((x) => x !== itemId) : [...p, itemId]));
  const selected = items.filter((i) => picked.includes(i.id));

  return (
    <>
      {items.length > 0 && (
        <div className="pt-1">
          <div className="mb-2 flex items-center justify-between text-[12px] font-medium text-muted">
            <span>Available: {stock}</span>
            {picked.length > 0 && <button type="button" onClick={() => setPicked([])} className="relative z-[2] text-accent-text hover:underline">Clear ({picked.length})</button>}
          </div>
          <ul className="space-y-2">
            {items.map((it) => <ItemRow key={it.id} item={it} on={picked.includes(it.id)} toggle={() => toggle(it.id)} />)}
          </ul>
        </div>
      )}
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/5 pt-4">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted">Price</div>
          <div className="font-display text-[26px] font-bold leading-none text-white">{naira(price)}</div>
        </div>
        <QuickBuy id={id} title={title} platform={platform} price={price} stock={stock} selected={selected} />
      </div>
    </>
  );
}
