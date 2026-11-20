'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Centered pop-up with a dark backdrop and a close (×) button at the top. */
export default function Modal({ open, onClose, label, children, wide = false }: { open: boolean; onClose: () => void; label: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={label}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className={`relative max-h-[90vh] w-full animate-[sheetUp_.3s_ease-out] overflow-y-auto rounded-3xl border border-line2 bg-panel p-6 shadow-2xl shadow-black/60 ${wide ? 'max-w-lg text-left' : 'max-w-sm text-center'}`}>
        <span aria-hidden="true" className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-line hover:text-white">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="relative">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
