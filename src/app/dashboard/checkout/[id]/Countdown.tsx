'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Timer } from 'lucide-react';

/** Time left to pay; refreshes the page when it runs out. */
export default function Countdown({ until }: { until: string }) {
  const router = useRouter();
  const end = new Date(until).getTime();
  const [left, setLeft] = useState(() => Math.max(0, end - Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      const l = Math.max(0, end - Date.now());
      setLeft(l);
      if (l === 0) {
        clearInterval(t);
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [end, router]);

  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const urgent = left < 10 * 60 * 1000;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-sm font-semibold ${urgent ? 'bg-[#3A1520] text-danger' : 'bg-[#3D2E0A] text-warn'}`} role="timer" aria-live="off">
      <Timer className="h-4 w-4" aria-hidden="true" /> {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')} left
    </span>
  );
}
