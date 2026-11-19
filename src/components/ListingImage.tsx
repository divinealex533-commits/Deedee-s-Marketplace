import { platformStyle } from './PlatformIcon';

/** Listing photo, or a branded cover using the platform's real icon and colours. */
export default function ListingImage({
  id,
  imageAt,
  platform,
  title,
  className = '',
}: {
  id: string;
  imageAt: Date | null;
  platform: string;
  title: string;
  className?: string;
}) {
  if (imageAt) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/listings/${id}/image?v=${imageAt.getTime()}`}
        alt={title}
        loading="lazy"
        className={`w-full bg-ink object-cover ${className}`}
      />
    );
  }

  const s = platformStyle(platform);
  return (
    <div className={`relative flex w-full items-center justify-center overflow-hidden ${className}`} style={{ background: s.bg }} aria-hidden="true">
      {/* soft light + faint pattern so plain covers still feel premium */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_55%)]" />
      <s.Icon className="absolute -bottom-[12%] -right-[8%] h-[75%] w-[75%] opacity-15" style={{ color: s.color }} />
      <div className="relative flex flex-col items-center gap-2">
        <s.Icon className="h-14 w-14 drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]" style={{ color: s.color }} />
        <span className="font-display text-base font-bold tracking-wide drop-shadow" style={{ color: s.color }}>{platform}</span>
      </div>
    </div>
  );
}
