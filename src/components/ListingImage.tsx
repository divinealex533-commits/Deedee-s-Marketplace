import { BadgeCheck } from 'lucide-react';

/** Listing photo, or a branded placeholder showing the platform name. */
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
  return (
    <div className={`flex w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#2A2160] to-panel2 ${className}`} aria-hidden="true">
      <BadgeCheck className="h-9 w-9 text-accent-text" />
      <span className="font-display text-lg font-bold text-white">{platform}</span>
    </div>
  );
}
