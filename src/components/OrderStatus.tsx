import type { OrderStatus as Status } from '@prisma/client';

const STYLES: Record<Status, [string, string]> = {
  ESCROW: ['bg-[#3D2E0A] text-warn', 'Awaiting confirmation'],
  COMPLETED: ['bg-[#0F3B2C] text-success', 'Completed'],
  DISPUTED: ['bg-[#3A1520] text-danger', 'Problem reported'],
  REFUNDED: ['bg-line text-soft', 'Refunded'],
};

export default function OrderStatus({ status }: { status: Status }) {
  const [cls, label] = STYLES[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}
