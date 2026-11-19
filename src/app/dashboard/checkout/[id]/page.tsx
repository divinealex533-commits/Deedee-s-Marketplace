import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Clock, Hourglass, Landmark, XCircle } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { expireCheckouts, PAY_WINDOW_MINUTES } from '@/lib/checkout';
import { formatDate, naira } from '@/lib/format';
import { site, whatsappLink } from '@/lib/site';
import CopyButton from '@/components/CopyButton';
import SubmitButton from '@/components/SubmitButton';
import { PlatformTile } from '@/components/PlatformIcon';
import { cancelMyCheckout } from '@/app/actions/checkout';
import OrderCard from '../../OrderCard';
import Countdown from './Countdown';
import ProofForm from './ProofForm';
import WalletPay from './WalletPay';

export const metadata = { title: 'Checkout' };

const STEPS = ['Pay', 'Upload receipt', 'Get your logins'];

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  await expireCheckouts().catch(() => 0);

  const c = await prisma.checkout.findFirst({
    where: { id, userId: user.id },
    include: {
      listing: { select: { id: true, title: true, platform: true } },
      orders: { include: { listing: { select: { id: true, title: true, platform: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!c) notFound();

  const banks = c.status === 'AWAITING_PAYMENT' ? await prisma.bankAccount.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } }) : [];
  const reviews = c.status === 'COMPLETED'
    ? new Map((await prisma.review.findMany({ where: { userId: user.id, listingId: c.listingId }, select: { listingId: true, rating: true, comment: true } })).map((r) => [r.listingId, r]))
    : new Map();
  const step = c.status === 'AWAITING_PAYMENT' ? 1 : c.status === 'UNDER_REVIEW' ? 2 : c.status === 'COMPLETED' ? 3 : 0;

  return (
    <>
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-text hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> My orders
      </Link>

      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-line2 bg-gradient-to-br from-[#1B1747] via-panel to-panel2 p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <PlatformTile platform={c.listing.platform} size={56} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">Checkout · <span className="font-mono text-white">{c.reference}</span></p>
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{c.quantity} × {c.listing.title}</h1>
            <p className="text-sm text-muted">{naira(c.unitPrice)} each · started {formatDate(c.createdAt)}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted">Total</div>
            <div className="font-display text-3xl font-bold text-white">{naira(c.amount)}</div>
          </div>
        </div>

        {step > 0 && (
          <ol className="relative mt-6 flex items-center gap-2" aria-label="Checkout progress">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const done = n < step || (n === 3 && step === 3);
              const on = n === step && step !== 3;
              return (
                <li key={label} aria-current={on ? 'step' : undefined} className="flex flex-1 items-center gap-2">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-success text-ink' : on ? 'bg-accent text-white ring-4 ring-accent/25' : 'bg-line text-muted'}`}>
                    {done ? <Check className="h-4 w-4" aria-hidden="true" /> : n}
                  </span>
                  <span className={`hidden text-[13px] sm:inline ${on ? 'font-semibold text-white' : 'text-muted'}`}>{label}</span>
                  {n < 3 && <span className={`h-px flex-1 ${done ? 'bg-success' : 'bg-line2'}`} aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ── 1. Awaiting payment ── */}
      {c.status === 'AWAITING_PAYMENT' && (
        <div className="flex flex-wrap gap-5">
          <section aria-labelledby="pay" className="card min-w-0 flex-[1_1_360px] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="pay" className="text-lg font-semibold text-white">1. Transfer {naira(c.amount)}</h2>
              <Countdown until={c.expiresAt.toISOString()} />
            </div>
            <p className="mt-1 text-sm text-muted">Your items are reserved for {PAY_WINDOW_MINUTES} minutes. Pay the exact amount to:</p>

            {banks.length ? (
              <div className="mt-4 space-y-3">
                {banks.map((b) => (
                  <div key={b.id} className="rounded-2xl border border-line2 bg-panel2 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-accent-text"><Landmark className="h-4 w-4" aria-hidden="true" /> {b.bankName}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-mono text-2xl font-bold tracking-wider text-white">{b.accountNumber}</span>
                      <CopyButton value={b.accountNumber} label={`${b.bankName} account number`} />
                    </div>
                    <div className="text-[15px] text-soft">{b.accountName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="alert-error mt-4">
                Payment details are being updated. Message us on <a href={whatsappLink(`Hi, I want to pay for checkout ${c.reference}`)} className="underline">WhatsApp ({site.whatsappDisplay})</a>.
              </p>
            )}

            <dl className="mt-4 grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-ink/60 p-4 text-sm">
              <dt className="text-muted">Amount</dt>
              <dd className="font-mono font-semibold text-white">{naira(c.amount)}</dd>
              <CopyButton value={String(c.amount / 100)} label="Amount" />
              <dt className="text-muted">Narration</dt>
              <dd className="font-mono font-semibold text-white">{c.reference}</dd>
              <CopyButton value={c.reference} label="Reference" />
            </dl>
            <p className="mt-2 text-[13px] text-muted">Put <strong className="text-white">{c.reference}</strong> in the transfer description so we can match your payment quickly.</p>

            {user.balance >= c.amount && (
              <div className="mt-5 border-t border-line pt-5">
                <p className="mb-2 text-sm text-muted">Or pay instantly from your wallet ({naira(user.balance)}):</p>
                <WalletPay checkoutId={c.id} label={`Pay ${naira(c.amount)} from wallet`} />
              </div>
            )}
          </section>

          <section aria-labelledby="upload" className="card min-w-0 flex-[1_1_360px] p-6">
            <h2 id="upload" className="mb-4 text-lg font-semibold text-white">2. Upload your receipt</h2>
            <ProofForm checkoutId={c.id} banks={banks.map((b) => ({ id: b.id, label: `${b.bankName} · ${b.accountNumber}` }))} defaultName={user.name} />
            <form action={cancelMyCheckout} className="mt-4 text-center">
              <input type="hidden" name="checkoutId" value={c.id} />
              <SubmitButton className="text-sm text-muted underline-offset-4 hover:text-danger hover:underline" pendingText="Cancelling…">Cancel this checkout</SubmitButton>
            </form>
          </section>
        </div>
      )}

      {/* ── 2. Under review ── */}
      {c.status === 'UNDER_REVIEW' && (
        <section className="card flex flex-wrap items-center gap-6 p-6 sm:p-8">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#3D2E0A] text-warn"><Hourglass className="h-8 w-8 animate-pulse" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-bold text-white">Payment under review</h2>
            <p className="mt-1 text-muted">
              We received your receipt {c.paidAt ? formatDate(c.paidAt) : ''}. Your {c.quantity} login{c.quantity === 1 ? '' : 's'} will appear here and in My orders as soon as we confirm it, usually within minutes.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <a href={`/api/checkouts/${c.id}/proof`} target="_blank" className="font-medium text-accent-text">View my receipt</a>
              <a href={whatsappLink(`Hi, I paid for checkout ${c.reference} (${naira(c.amount)})`)} target="_blank" rel="noopener noreferrer" className="font-medium text-accent-text">Taking long? WhatsApp us</a>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. Completed ── */}
      {c.status === 'COMPLETED' && (
        <>
          <section className="flex items-center gap-4 rounded-2xl border border-success/30 bg-[#0F3B2C]/60 p-5">
            <CheckCircle2 className="h-8 w-8 shrink-0 text-success" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-white">Payment confirmed: your logins are ready</h2>
              <p className="text-sm text-success">Tap “Show login” on each item below. They’re also saved in My orders.</p>
            </div>
          </section>
          <div className="space-y-3">
            {c.orders.map((o) => (
              <OrderCard
                key={o.id}
                id={o.id}
                listingId={o.listing.id}
                review={reviews.get(o.listing.id) ?? null}
                title={o.listing.title}
                platform={o.listing.platform}
                amount={naira(o.amount)}
                date={formatDate(o.createdAt)}
                status={o.status}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Ended ── */}
      {(c.status === 'REJECTED' || c.status === 'EXPIRED' || c.status === 'CANCELLED') && (
        <section className="card flex flex-wrap items-center gap-6 p-6 sm:p-8">
          <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${c.status === 'REJECTED' ? 'bg-[#3A1520] text-danger' : 'bg-line text-soft'}`}>
            {c.status === 'REJECTED' ? <XCircle className="h-8 w-8" aria-hidden="true" /> : c.status === 'EXPIRED' ? <Clock className="h-8 w-8" aria-hidden="true" /> : <AlertTriangle className="h-8 w-8" aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-bold text-white">
              {c.status === 'REJECTED' ? 'Payment not confirmed' : c.status === 'EXPIRED' ? 'This checkout expired' : 'Checkout cancelled'}
            </h2>
            <p className="mt-1 text-muted">
              {c.status === 'REJECTED'
                ? `Reason: ${c.rejectReason}. If you did pay, message us with reference ${c.reference}.`
                : c.status === 'EXPIRED'
                  ? `No receipt was uploaded within ${PAY_WINDOW_MINUTES} minutes, so the items went back on sale. If you already paid, message us with reference ${c.reference}.`
                  : 'Nothing was charged.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/dashboard/marketplace/${c.listing.id}`} className="btn btn-primary btn-sm">Buy again</Link>
              <a href={whatsappLink(`Hi, about checkout ${c.reference}`)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">WhatsApp support</a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
