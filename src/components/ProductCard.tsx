import Link from 'next/link';
import { ArrowRight, Flame, ShieldCheck, Zap } from 'lucide-react';
import ListingImage from './ListingImage';
import Stars from './Stars';
import { PlatformBadge, platformStyle } from './PlatformIcon';
import { naira } from '@/lib/format';
import QuickBuy from './QuickBuy';

export type ProductCardData = {
  id: string;
  title: string;
  platform: string;
  description: string;
  price: number;
  stock: number;
  imageAt: Date | null;
  rating?: { avg: number; count: number };
};

/** Product tile used on the homepage and in the customer marketplace. */
export default function ProductCard({ p, href }: { p: ProductCardData; href: string }) {
  const soldOut = p.stock === 0;
  const low = !soldOut && p.stock < 5;
  const brand = platformStyle(p.platform);

  return (
    <div className={`card-shine group relative block rounded-[26px] p-px transition duration-300 hover:-translate-y-1.5 ${soldOut ? 'opacity-60' : ''}`}>
      {/* Border that lights up in the platform's colour on hover */}
      <span aria-hidden="true" className="absolute inset-0 rounded-[26px] bg-gradient-to-b from-white/15 via-line to-line transition duration-300 group-hover:opacity-0" />
      <span aria-hidden="true" className="absolute inset-0 rounded-[26px] opacity-0 transition duration-300 group-hover:opacity-100" style={{ background: `linear-gradient(160deg, ${brand.glow}, #6246EA 60%, transparent)` }} />
      {/* Brand glow under the card */}
      <span aria-hidden="true" className="absolute inset-x-6 -bottom-2 h-10 rounded-full opacity-0 blur-2xl transition duration-300 group-hover:opacity-60" style={{ background: brand.glow }} />

      <div className="relative flex h-full flex-col overflow-hidden rounded-[25px] bg-gradient-to-b from-[#151B3A] to-panel2">
        {/* Image */}
        <div className="relative overflow-hidden">
          <ListingImage id={p.id} imageAt={p.imageAt} platform={p.platform} title={p.title} className="aspect-[16/10] transition duration-700 group-hover:scale-[1.06]" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#151B3A] to-transparent" />
          <span aria-hidden="true" className="shine-sweep pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <PlatformBadge platform={p.platform} className="absolute left-3 top-3" />
          <span
            className={`badge absolute right-3 top-3 gap-1.5 border backdrop-blur-md ${
              soldOut ? 'border-danger/30 bg-[#3A1520]/85 text-danger' : low ? 'border-warn/30 bg-[#3D2E0A]/85 text-warn' : 'border-success/30 bg-[#0F3B2C]/85 text-success'
            }`}
          >
            {soldOut ? 'Sold out' : low ? (<><Flame className="h-3 w-3" aria-hidden="true" /> Only {p.stock} left</>) : (<><span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-success" /> {p.stock} in stock</>)}
          </span>
        </div>

        {/* Body */}
        <div className="-mt-4 flex flex-1 flex-col gap-2.5 px-5 pb-5">
          <h3 className="relative text-[17px] font-semibold leading-snug text-white">{p.title}</h3>
          {p.rating && p.rating.count > 0 ? (
            <div className="flex items-center gap-1.5 text-[13px] text-muted">
              <Stars value={p.rating.avg} size={14} />
              <span className="font-semibold text-white">{p.rating.avg.toFixed(1)}</span>
              <span>({p.rating.count} review{p.rating.count === 1 ? '' : 's'})</span>
            </div>
          ) : null}
          {p.description && <p className="line-clamp-2 text-sm leading-relaxed text-muted">{p.description}</p>}

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-soft"><Zap className="h-3 w-3 text-warn" aria-hidden="true" /> Fast delivery</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-soft"><ShieldCheck className="h-3 w-3 text-success" aria-hidden="true" /> Protected</span>
          </div>

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-white/5 pt-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted">Price</div>
              <div className="font-display text-[26px] font-bold leading-none text-white">{naira(p.price)}</div>
            </div>
            {soldOut ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-line2 px-4 py-2.5 text-sm font-semibold text-soft">
                View <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            ) : (
              <QuickBuy id={p.id} title={p.title} platform={p.platform} price={p.price} stock={p.stock} />
            )}
          </div>
        </div>
      </div>
      {/* The whole card opens the product page; the Buy now button sits above this link */}
      <Link href={href} aria-label={`View ${p.title}`} className="absolute inset-0 z-[1] rounded-[26px]" />
    </div>
  );
}
