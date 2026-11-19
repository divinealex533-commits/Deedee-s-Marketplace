'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { SiTelegram, SiWhatsapp } from 'react-icons/si';
import { site, telegramLink, whatsappLink } from '@/lib/site';

/** Floating "Help" button: opens a small menu so the customer picks WhatsApp or Telegram. */
export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const option =
    'flex items-center gap-3 rounded-xl px-3 py-3 text-left text-white transition hover:bg-white/5 focus-visible:bg-white/5';

  return (
    <div ref={box} className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div
          id="help-menu"
          role="menu"
          aria-label="Contact support"
          className="w-64 rounded-2xl border border-line2 bg-panel/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <p className="px-3 pb-1 pt-2 text-[13px] font-medium text-muted">Chat with us on</p>
          <a
            role="menuitem"
            href={whatsappLink('Hello, I need help with DeeDee’s Marketplace')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={option}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]">
              <SiWhatsapp className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-semibold">WhatsApp</span>
              <span className="block text-[13px] text-muted">{site.whatsappDisplay}</span>
            </span>
          </a>
          <a
            role="menuitem"
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={option}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#229ED9]">
              <SiTelegram className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-semibold">Telegram</span>
              <span className="block text-[13px] text-muted">@{site.telegram}</span>
            </span>
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="help-menu"
        className="flex h-14 items-center gap-2 rounded-full bg-accent px-5 font-semibold text-white shadow-lg shadow-black/40 transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <MessageCircle className="h-6 w-6" aria-hidden="true" />}
        {open ? 'Close' : 'Help'}
      </button>
    </div>
  );
}
