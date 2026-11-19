import { NextResponse, type NextRequest } from 'next/server';
import { verifyAndCredit } from '@/lib/paystack';

// Paystack sends the customer back here after they pay.
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference') ?? req.nextUrl.searchParams.get('trxref');
  let ok = false;
  if (reference) {
    try {
      ok = await verifyAndCredit(reference);
    } catch (e) {
      console.error('Paystack verify failed', e);
    }
  }
  return NextResponse.redirect(new URL(`/dashboard/wallet?${ok ? 'funded=1' : 'failed=1'}`, req.url));
}
