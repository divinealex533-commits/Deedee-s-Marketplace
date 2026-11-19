'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Pings /api/visit once per page so the admin can see visitors today. */
export default function VisitTracker() {
  const path = usePathname();
  useEffect(() => {
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => {});
  }, [path]);
  return null;
}
