'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const KEY = 'dd-theme';

/** Switches the whole site between dark and light; the choice is saved on this device. */
export default function ThemeToggle({ variant = 'icon' }: { variant?: 'icon' | 'row' }) {
  const [light, setLight] = useState(false);
  useEffect(() => setLight(document.documentElement.classList.contains('light')), []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle('light', next);
    try {
      localStorage.setItem(KEY, next ? 'light' : 'dark');
    } catch {}
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#F5F6FB' : '#0B1020');
  };

  const label = light ? 'Switch to dark mode' : 'Switch to light mode';
  if (variant === 'row') {
    return (
      <button type="button" onClick={toggle} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] text-soft hover:bg-line hover:text-white">
        {light ? <Moon className="h-5 w-5" aria-hidden="true" /> : <Sun className="h-5 w-5" aria-hidden="true" />}
        {light ? 'Dark mode' : 'Light mode'}
      </button>
    );
  }
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line2 text-soft transition hover:bg-panel hover:text-white">
      {light ? <Moon className="h-5 w-5" aria-hidden="true" /> : <Sun className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
