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
