import { LogoMark } from '@/components/Logo';

/** Shown while the marketplace loads. */
export default function LoadingMarketplace() {
  return (
    <div role="status" aria-live="polite">
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <span className="relative flex h-16 w-16 items-center justify-center">
          <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-2xl bg-accent/30" />
          <span aria-hidden="true" className="absolute -inset-2 animate-spin rounded-[22px] border-2 border-transparent border-t-accent border-r-accent/40" />
          <LogoMark size={48} />
        </span>
        <p className="font-display text-lg font-semibold text-white">Loading marketplace…</p>
        <p className="-mt-2 text-sm text-muted">Getting the latest stock for you</p>
      </div>
      <div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-[26px] border border-line bg-panel2">
            <div className="aspect-[16/10] animate-pulse bg-line/60" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-3/4 animate-pulse rounded bg-line/70" />
              <div className="h-4 w-full animate-pulse rounded bg-line/50" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-line/40" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-line/40" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading marketplace</span>
    </div>
  );
}
