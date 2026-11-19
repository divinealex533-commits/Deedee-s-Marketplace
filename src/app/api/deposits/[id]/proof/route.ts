import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Serves a deposit screenshot to admins and to the customer who uploaded it. Nobody else.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse('Not found', { status: 404 });

  const { id } = await params;
  const d = await prisma.deposit.findUnique({ where: { id }, select: { userId: true, proof: true, proofType: true } });
  if (!d || (session.role !== 'ADMIN' && d.userId !== session.uid)) return new NextResponse('Not found', { status: 404 });

  return new NextResponse(new Uint8Array(d.proof), {
    headers: {
      'Content-Type': d.proofType,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}
