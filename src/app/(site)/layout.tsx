import type { ReactNode } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import VisitTracker from '@/components/VisitTracker';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <VisitTracker />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
