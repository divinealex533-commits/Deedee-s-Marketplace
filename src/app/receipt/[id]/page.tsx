import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { naira } from '@/lib/format';
import { site } from '@/lib/site';
import { LogoMark } from '@/components/Logo';
import PrintButton from './PrintButton';

export const metadata = { title: 'Receipt', robots: { index: false } };

const STATUS: Record<string, string> = {
  ESCROW: 'Delivered',
  COMPLETED: 'Completed',
  DISPUTED: 'Under review',
  REFUNDED: 'Refunded',
};

/**
 * Printable receipt for an order. Customers see their own; admins can open any.
 * "Print / Save as PDF" uses the browser's print dialog.
 */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requireUser();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true, phone: true } }, listing: { select: { title: true, platform: true } } },
  });
  if (!order || (order.userId !== viewer.id && viewer.role !== 'ADMIN')) notFound();

  const number = `DD-${order.createdAt.getFullYear()}-${order.id.slice(-8).toUpperCase()}`;
  const issued = order.createdAt.toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'long', timeStyle: 'short' });
  const refunded = order.status === 'REFUNDED';
  const back = viewer.role === 'ADMIN' ? '/admin/orders' : '/dashboard';

  return (
    <div className="min-h-screen bg-ink px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-2xl items-center justify-between print:hidden">
        <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-text hover:text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Link>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white text-[#0B1020] shadow-2xl shadow-black/50 print:max-w-none print:rounded-none print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 bg-gradient-to-br from-[#2A1F6B] to-[#0B1020] p-8 text-white print:bg-none print:text-[#0B1020]">
          <div className="flex items-center gap-3">
            <LogoMark size={40} />
            <div>
              <div className="font-display text-xl font-bold">{site.name}</div>
              <div className="text-sm opacity-80">WhatsApp {site.whatsappDisplay} · {site.phoneDisplay}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm uppercase tracking-widest opacity-80">Receipt</div>
            <div className="font-mono text-lg font-bold">{number}</div>
          </div>
        </header>

        <div className="space-y-8 p-8">
          <div className="flex flex-wrap justify-between gap-6 text-sm">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#6B7194]">Billed to</div>
              <div className="font-semibold">{order.user.name}</div>
              <div className="text-[#4B5170]">{order.user.email}</div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#6B7194]">Date</div>
              <div className="font-semibold">{issued}</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#6B7194]">Status</div>
              <div className={`font-semibold ${refunded ? 'text-[#B42318]' : 'text-[#067647]'}`}>{STATUS[order.status]}</div>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#E4E6F0] text-left text-xs uppercase tracking-wider text-[#6B7194]">
                <th scope="col" className="pb-3 font-semibold">Item</th>
                <th scope="col" className="pb-3 text-center font-semibold">Qty</th>
                <th scope="col" className="pb-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#E4E6F0]">
                <td className="py-4">
                  <div className="font-semibold">{order.listing.title}</div>
                  <div className="text-[#6B7194]">{order.listing.platform} · Order {order.id}</div>
                </td>
                <td className="py-4 text-center">1</td>
                <td className="py-4 text-right font-semibold">{naira(order.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#6B7194]">Subtotal</span><span>{naira(order.amount)}</span></div>
            {refunded && <div className="flex justify-between text-[#B42318]"><span>Refunded to wallet</span><span>−{naira(order.amount)}</span></div>}
            <div className="flex justify-between border-t-2 border-[#0B1020] pt-2 text-base font-bold">
              <span>Total paid</span><span>{naira(refunded ? 0 : order.amount)}</span>
            </div>
            <div className="flex justify-between text-[#6B7194]"><span>Paid with</span><span>Wallet balance</span></div>
          </div>

          {!refunded && (
            <p className="flex items-center gap-2 rounded-2xl bg-[#ECFDF3] p-4 text-sm text-[#067647]">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              Payment received. Login details are in your dashboard under My accounts.
            </p>
          )}

          <footer className="border-t border-[#E4E6F0] pt-6 text-center text-xs text-[#6B7194]">
            Thank you for shopping with {site.name}. Questions about this order? WhatsApp {site.whatsappDisplay} with receipt number {number}.
          </footer>
        </div>
      </article>
    </div>
  );
}
