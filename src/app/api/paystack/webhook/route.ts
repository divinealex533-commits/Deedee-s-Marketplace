import { NextResponse, type NextRequest } from 'next/server';
import { creditFunding, validWebhookSignature } from '@/lib/paystack';

// Set this URL in Paystack: Settings → API Keys & Webhooks → Webhook URL
//   https://YOUR-DOMAIN/api/paystack/webhook
// It credits wallets even if the customer closes the page before returning.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!validWebhookSignature(raw, req.headers.get('x-paystack-signature'))) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(raw) as { event: string; data: { reference: string; amount: number; status: string } };
  if (event.event === 'charge.success' && event.data.status === 'success') {
    await creditFunding(event.data.reference, event.data.amount);
  }
  return NextResponse.json({ received: true });
}
