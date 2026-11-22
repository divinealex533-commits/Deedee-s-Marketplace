'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Modal from './Modal';
import ContactButtons from './ContactButtons';
import TelegramJoin from './TelegramJoin';

/** "Thank you for shopping with us" after logging out (the page is opened with ?bye=1). */
export default function GoodbyeModal({ channel = '' }: { channel?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('bye') === '1') {
      setOpen(true);
      url.searchParams.delete('bye');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  }, []);

  return (
    <Modal open={open} onClose={() => setOpen(false)} label="Logged out">
      <div aria-hidden="true" className="emoji mx-auto mb-3 text-5xl leading-none">💜</div>
      <h2 className="font-display text-2xl font-bold text-white">Thank you for shopping with us!</h2>
      <p className="mt-2 text-[15px] text-muted">You’ve been logged out safely. See you again soon at DeeDee’s Marketplace.</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link href="/login" onClick={() => setOpen(false)} className="btn btn-primary py-3">Log in again</Link>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost py-3">Close</button>
      </div>
      {channel && (
        <div className="mt-5">
          <TelegramJoin channel={channel} compact />
        </div>
      )}
      <p className="mb-2 mt-5 text-[13px] font-medium text-muted">Questions? Contact us on</p>
      <ContactButtons />
    </Modal>
  );
}
