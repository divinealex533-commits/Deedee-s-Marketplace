'use client';

import { useState } from 'react';
import { logout } from '@/app/actions/auth';
import Modal from './Modal';
import SubmitButton from './SubmitButton';

/** Log out with an "Are you sure?" step. */
export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {compact ? (
        <button type="button" onClick={() => setOpen(true)} aria-label="Log out" className="flex h-11 w-11 items-center justify-center rounded-xl text-danger hover:bg-line">
          <span aria-hidden="true" className="emoji text-[22px] leading-none">🚪</span>
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-[15px] font-medium text-danger hover:bg-line">
          <span aria-hidden="true" className="emoji flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-[22px] leading-none">🚪</span> Log out
        </button>
      )}
      <Modal open={open} onClose={() => setOpen(false)} label="Log out">
        <div aria-hidden="true" className="emoji mx-auto mb-3 text-5xl leading-none">🚪</div>
        <h2 className="font-display text-2xl font-bold text-white">Log out?</h2>
        <p className="mt-2 text-[15px] text-muted">You can log back in any time. Your orders and wallet stay safe.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost py-3">Cancel</button>
          <form action={logout}>
            <SubmitButton className="btn btn-danger w-full py-3" pendingText="Logging out…">Log out</SubmitButton>
          </form>
        </div>
      </Modal>
    </>
  );
}
