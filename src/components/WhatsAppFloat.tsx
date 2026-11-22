'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, ChevronRight, Megaphone, MessageCircle, X } from 'lucide-react';
import { SiTelegram, SiWhatsapp } from 'react-icons/si';
import { site, telegramLink, tgLink, whatsappLink } from '@/lib/site';

/**
 * Floating "Help" button. Opens a small menu: WhatsApp, or Telegram.
 * Telegram opens a second step: join the channel, chat with the bot, or message support.
 */
export default function WhatsAppFloat({ channel = '', bot = '' }: { channel?: string; bot?: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'main' | 'telegram'>('main');
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

  const toggle = () => {
    setOpen((o) => !o);
    setView('main');
  };

  const option =
    'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-white transition hover:bg-white/5 focus-visible:bg-white/5';
  const iconBox = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl';

  return (
    <div ref={box} className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div
          id="help-menu"
          role="menu"
          aria-label="Contact support"
          className="w-72 rounded-2xl border border-line2 bg-panel/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          {view === 'main' ? (
            <>
              <p className="px-3 pb-1 pt-2 text-[13px] font-medium text-muted">Chat with us on</p>
              <a
                role="menuitem"
                href={whatsappLink('Hello, I need help with DeeDee’s Marketplace')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={option}
              >
                <span className={`${iconBox} bg-[#25D366]`}><SiWhatsapp className="h-5 w-5 text-white" aria-hidden="true" /></span>
                <span>
                  <span className="block font-semibold">WhatsApp</span>
                  <span className="block text-[13px] text-muted">{site.whatsappDisplay}</span>
                </span>
              </a>
              <button type="button" role="menuitem" onClick={() => setView('telegram')} className={option}>
                <span className={`${iconBox} bg-[#229ED9]`}><SiTelegram className="h-5 w-5 text-white" aria-hidden="true" /></span>
                <span className="flex-1">
                  <span className="block font-semibold">Telegram</span>
                  <span className="block text-[13px] text-muted">Channel, bot and support</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setView('main')} className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[13px] font-medium text-muted hover:text-white">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Telegram
              </button>
              {channel && (
                <a role="menuitem" href={tgLink(channel)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={option}>
                  <span className={`${iconBox} bg-[#229ED9]`}><Megaphone className="h-5 w-5 text-white" aria-hidden="true" /></span>
                  <span className="min-w-0">
                    <span className="block font-semibold">Join our channel</span>
                    <span className="block truncate text-[13px] text-muted">t.me/{channel}</span>
                  </span>
                </a>
              )}
              {bot && (
                <a role="menuitem" href={tgLink(bot)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={option}>
                  <span className={`${iconBox} bg-accent`}><Bot className="h-5 w-5 text-white" aria-hidden="true" /></span>
                  <span className="min-w-0">
                    <span className="block font-semibold">Bot help</span>
                    <span className="block truncate text-[13px] text-muted">@{bot}</span>
                  </span>
                </a>
              )}
              <a role="menuitem" href={telegramLink} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={option}>
                <span className={`${iconBox} bg-panel2 border border-line2`}><SiTelegram className="h-5 w-5 text-[#229ED9]" aria-hidden="true" /></span>
                <span className="min-w-0">
                  <span className="block font-semibold">Message support</span>
                  <span className="block truncate text-[13px] text-muted">@{site.telegram}</span>
                </span>
              </a>
            </>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={toggle}
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
