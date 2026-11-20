'use client';

import { useState, useTransition } from 'react';
import type { OrderStatus as Status } from '@prisma/client';
import { Eye, EyeOff, Loader2, ReceiptText } from 'lucide-react';
import { confirmOrder, disputeOrder, revealOrder } from '@/app/actions/shop';
import CopyButton from '@/components/CopyButton';
import OrderStatus from '@/components/OrderStatus';
import SubmitButton from '@/components/SubmitButton';
import Stars from '@/components/Stars';
import { PlatformTile } from '@/components/PlatformIcon';
import ReviewForm from './ReviewForm';

type Creds = { login: string; password: string; notes: string };

export default function OrderCard(props: {
  id: string;
  listingId: string;
  title: string;
  platform: string;
  amount: string;
  date: string;
  status: Status;
  review: { rating: number; comment: string } | null;
}) {
  const [reviewing, setReviewing] = useState(false);
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
        <PlatformTile platform={props.platform} size={44} />
        <div className="min-w-0 flex-[1_1_200px]">
          <div className="font-semibold text-white">{props.title}</div>
          <div className="text-[13px] text-muted">{props.platform} · {props.amount} · {props.date}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatus status={props.status} />
          <a href={`/receipt/${props.id}`} className="btn btn-ghost btn-sm"><ReceiptText className="h-4 w-4" aria-hidden="true" /> Receipt</a>
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
            <div className="flex items-start gap-2 border-t border-line pt-2">
              <dt className="w-24 shrink-0 text-muted">Details</dt>
              <dd className="min-w-0 flex-1 whitespace-pre-wrap break-all text-white">{creds.notes}</dd>
              <CopyButton value={creds.notes} label="Details" />
            </div>
          )}
        </dl>
      )}

      {props.status === 'ESCROW' && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <span className="mr-auto text-sm text-muted">Checked the account? <span className="text-[12px] text-placeholder">(auto-confirms 24h after purchase)</span></span>
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
      {!refunded && props.status !== 'ESCROW' && (
        <div className="mt-4 border-t border-line pt-4">
          {reviewing ? (
            <ReviewForm listingId={props.listingId} existing={props.review} onDone={() => setReviewing(false)} />
          ) : props.review ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Stars value={props.review.rating} />
              <span className="text-muted">Your review</span>
              <button type="button" onClick={() => setReviewing(true)} className="font-medium text-accent-text hover:text-white">Edit</button>
            </div>
          ) : (
            <button type="button" onClick={() => setReviewing(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-accent-text hover:text-white">
              <Stars value={0} size={14} /> Rate this purchase
            </button>
          )}
        </div>
      )}
    </div>
  );
}
