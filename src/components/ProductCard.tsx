import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import ListingImage from './ListingImage';
import { naira } from '@/lib/format';

export type ProductCardData = {
  id: string;
  title: string;
  platform: string;
  description: string;
  price: number;
  stock: number;
  imageAt: Date | null;
};

/** The product tile used on the homepage and in the customer marketplace. */
export default function ProductCard({ p, href }: { p: ProductCardData; href: string }) {
  const soldOut = p.stock === 0;
  const low = !soldOut && p.stock < 5;

  return (
    <Link
      href={href}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-panel to-panel2 transition duration-300 hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_20px_60px_-15px_rgba(98,70,234,0.45)] ${
        soldOut ? 'opacity-60' : ''
      }`}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <ListingImage
          id={p.id}
          imageAt={p.imageAt}
          platform={p.platform}
          title={p.title}
          className="aspect-[4/3] transition duration-500 group-hover:scale-105"
        />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-panel to-transparent" />
        <span className="badge absolute left-3 top-3 border border-white/10 bg-ink/70 text-white backdrop-blur-md">{p.platform}</span>
        <span
          className={`badge absolute right-3 top-3 gap-1.5 border backdrop-blur-md ${
            soldOut
              ? 'border-danger/30 bg-[#3A1520]/80 text-danger'
              : low
                ? 'border-warn/30 bg-[#3D2E0A]/80 text-warn'
                : 'border-success/30 bg-[#0F3B2C]/80 text-success'
          }`}
        >
          {soldOut ? (
            'Sold out'
          ) : low ? (
            <><Flame className="h-3 w-3" aria-hidden="true" /> Only {p.stock} left</>
          ) : (
            <><span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-success" /> {p.stock} in stock</>
          )}
        </span>
      </div>

      {/* Body */}
      <div className="-mt-6 flex flex-1 flex-col gap-2 px-5 pb-5">
        <h3 className="relative text-[17px] font-semibold leading-snug text-white">{p.title}</h3>
        {p.description && <p className="line-clamp-2 text-sm leading-relaxed text-muted">{p.description}</p>}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted">Price</div>
            <div className="font-display text-[26px] font-bold leading-none text-white">{naira(p.price)}</div>
          </div>
          <span className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition group-hover:bg-accent-hover">
            {soldOut ? 'View' : 'Buy'} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
