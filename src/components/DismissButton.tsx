'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

/** Hides the announcement bar and remembers it in this browser (until the message changes). */
export default function DismissButton({ id }: { id: string }) {
  useEffect(() => {
    try {
      if (localStorage.getItem('dismissed') === id) hide(id);
    } catch {}
  }, [id]);

  return (
    <button
      type="button"
      aria-label="Close announcement"
      onClick={() => {
        hide(id);
        try {
          localStorage.setItem('dismissed', id);
        } catch {}
      }}
      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/80 hover:bg-white/15 hover:text-white"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function hide(id: string) {
  document.querySelectorAll<HTMLElement>(`[data-announcement="${CSS.escape(id)}"]`).forEach((el) => (el.style.display = 'none'));
}
