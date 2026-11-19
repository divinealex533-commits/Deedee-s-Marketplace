import { prisma } from './db';

export const AUTO_CONFIRM_HOURS = 24;

/** Orders still awaiting confirmation after 24 hours are marked completed automatically. */
export async function autoCompleteOrders() {
  const cutoff = new Date(Date.now() - AUTO_CONFIRM_HOURS * 60 * 60 * 1000);
  const r = await prisma.order.updateMany({
    where: { status: 'ESCROW', createdAt: { lt: cutoff } },
    data: { status: 'COMPLETED', confirmedAt: new Date() },
  });
  return r.count;
}
