import type { ReactNode } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import VisitTracker from '@/components/VisitTracker';
import GoodbyeModal from '@/components/GoodbyeModal';
import AnnouncementBar from '@/components/AnnouncementBar';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <VisitTracker />
      <GoodbyeModal />
      <AnnouncementBar />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
