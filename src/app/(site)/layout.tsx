import type { ReactNode } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import VisitTracker from '@/components/VisitTracker';
import GoodbyeModal from '@/components/GoodbyeModal';
import AnnouncementBar from '@/components/AnnouncementBar';
import { getTelegramConfig } from '@/lib/settings';

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const telegram = await getTelegramConfig();
  return (
    <>
      <VisitTracker />
      <GoodbyeModal channel={telegram.channel} />
      <AnnouncementBar />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
