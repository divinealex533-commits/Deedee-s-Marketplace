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
  return Object.fromEntries(rows.filter((r) => r.listingId).map((r) => [r.listingId as string, { avg: r._avg.rating ?? 0, count: r._count._all }]));
}

/** Display name for any review: account name for site reviews, given name for WhatsApp feedback. */
export function reviewAuthor(r: { user: { name: string } | null; authorName: string | null }) {
  return reviewerName(r.user?.name ?? r.authorName ?? 'Customer');
}

/** Label under the name: where the review came from. */
export function reviewSourceLabel(source: string) {
  return source === 'whatsapp' ? 'via WhatsApp' : 'verified buyer';
}

/** "Ada O." — first name and last initial, so reviewers stay private. */
export function reviewerName(name: string) {
  const [first, second] = name.trim().split(/\s+/);
  return `${first}${second ? ` ${second[0]!.toUpperCase()}.` : ''}`;
}
