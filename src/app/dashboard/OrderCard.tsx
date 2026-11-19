'use client';

import { useState, useTransition } from 'react';
import type { OrderStatus as Status } from '@prisma/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { confirmOrder, disputeOrder, revealOrder } from '@/app/actions/shop';
import CopyButton from '@/components/CopyButton';
import OrderStatus from '@/components/OrderStatus';
import SubmitButton from '@/components/SubmitButton';

type Creds = { login: string; password: string; notes: string };

export default function OrderCard(props: { id: string; title: string; platform: string; amount: string; date: string; status: Status }) {
  const [creds, setCreds] = useState<Creds | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const refunded = props.status === 'REFUNDED';

  const toggle = () => {
    if (open) return setOpen(false);
    if (creds) return setOpen(true);
    start(async () => {
      const c = await revealOrder(props.id);
      if (c) {
        setCreds(c);
        setOpen(true);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-line bg-panel2 p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-[1_1_220px]">
          <div className="font-semibold text-white">{props.title}</div>
          <div className="text-[13px] text-muted">{props.platform} · {props.amount} · {props.date}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatus status={props.status} />
          {!refunded && (
            <button type="button" onClick={toggle} className="btn btn-ghost btn-sm" aria-expanded={open}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : open ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              {open ? 'Hide login' : 'Show login'}
            </button>
          )}
        </div>
      </div>

      {open && creds && (
        <dl className="mt-4 grid gap-2 rounded-xl border border-line bg-ink p-4 font-mono text-sm">
          <div className="flex items-center gap-2">
            <dt className="w-24 shrink-0 text-muted">Login</dt>
            <dd className="min-w-0 flex-1 break-all text-white">{creds.login}</dd>
            <CopyButton value={creds.login} label="Login" />
          </div>
          <div className="flex items-center gap-2">
            <dt className="w-24 shrink-0 text-muted">Password</dt>
            <dd className="min-w-0 flex-1 break-all text-white">{creds.password}</dd>
            <CopyButton value={creds.password} label="Password" />
          </div>
          {creds.notes && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted">Notes</dt>
              <dd className="min-w-0 flex-1 break-words font-sans text-soft">{creds.notes}</dd>
            </div>
          )}
        </dl>
      )}

      {props.status === 'ESCROW' && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="mr-auto text-sm text-muted">Checked the account?</span>
          <form action={confirmOrder}>
            <input type="hidden" name="orderId" value={props.id} />
            <SubmitButton className="btn btn-primary btn-sm" pendingText="Saving…">It works</SubmitButton>
          </form>
          <form action={disputeOrder}>
            <input type="hidden" name="orderId" value={props.id} />
            <SubmitButton className="btn btn-danger btn-sm" pendingText="Sending…">Report a problem</SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
