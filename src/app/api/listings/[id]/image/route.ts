import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

// Public listing photo. The URL carries ?v=<upload time>, so it can be cached for a long time.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const img = await prisma.listingImage.findUnique({ where: { listingId: id } });
  if (!img) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(new Uint8Array(img.data), {
    headers: {
      'Content-Type': img.type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
