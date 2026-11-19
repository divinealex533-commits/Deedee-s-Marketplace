import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Checkout receipt image: visible to admins and the customer who uploaded it.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse('Not found', { status: 404 });
  const { id } = await params;
  const c = await prisma.checkout.findUnique({ where: { id }, select: { userId: true, proof: true, proofType: true } });
  if (!c?.proof || !c.proofType || (session.role !== 'ADMIN' && c.userId !== session.uid)) {
    return new NextResponse('Not found', { status: 404 });
  }
  return new NextResponse(new Uint8Array(c.proof), {
    headers: { 'Content-Type': c.proofType, 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" },
  });
}
