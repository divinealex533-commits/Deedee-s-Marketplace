import { unstable_cache } from 'next/cache';
import { prisma } from './db';

export type Announcement = { enabled: boolean; text: string; link: string; tone: 'accent' | 'green' | 'amber' };

const DEFAULT_ANNOUNCEMENT: Announcement = { enabled: false, text: '', link: '', tone: 'accent' };

/** Cached for speed; saving in Admin → Settings refreshes it immediately (tag "settings"). */
export const getAnnouncement = unstable_cache(
  async (): Promise<Announcement> => {
    try {
      const row = await prisma.setting.findUnique({ where: { key: 'announcement' } });
      return row ? { ...DEFAULT_ANNOUNCEMENT, ...JSON.parse(row.value) } : DEFAULT_ANNOUNCEMENT;
    } catch {
      return DEFAULT_ANNOUNCEMENT;
    }
  },
  ['announcement'],
  { tags: ['settings'], revalidate: 300 },
);

export type ReferralConfig = { enabled: boolean; percent: number; maxBonus: number; minDeposit: number };

/** Amounts in naira. Default: 5% of a friend's first deposit, up to ₦2,000, for deposits of ₦1,000+. */
const DEFAULT_REFERRAL: ReferralConfig = { enabled: true, percent: 5, maxBonus: 2000, minDeposit: 1000 };

export const getReferralConfig = unstable_cache(
  async (): Promise<ReferralConfig> => {
    try {
      const row = await prisma.setting.findUnique({ where: { key: 'referral' } });
      return row ? { ...DEFAULT_REFERRAL, ...JSON.parse(row.value) } : DEFAULT_REFERRAL;
    } catch {
      return DEFAULT_REFERRAL;
    }
  },
  ['referral-config'],
  { tags: ['settings'], revalidate: 300 },
);
