import { prisma } from './db';

export type RatingSummary = { avg: number; count: number };

/** Average rating and count per listing (visible reviews only). */
export async function ratingsByListing(listingIds: string[]): Promise<Record<string, RatingSummary>> {
  if (!listingIds.length) return {};
  const rows = await prisma.review.groupBy({
    by: ['listingId'],
    where: { listingId: { in: listingIds }, hidden: false },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((r) => [r.listingId, { avg: r._avg.rating ?? 0, count: r._count._all }]));
}

/** "Ada O." — first name and last initial, so reviewers stay private. */
export function reviewerName(name: string) {
  const [first, second] = name.trim().split(/\s+/);
  return `${first}${second ? ` ${second[0]!.toUpperCase()}.` : ''}`;
}
