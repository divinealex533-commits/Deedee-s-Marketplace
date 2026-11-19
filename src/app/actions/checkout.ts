'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, requireUser } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';
import { imageType } from '@/lib/image';
import { approveCheckout, attachReceipt, cancelCheckout, payCheckoutWithWallet, rejectCheckout, startCheckout } from '@/lib/checkout';
import type { FormState } from './types';

/** "Checkout" button: reserve the items and open the checkout page. */
export async function beginCheckout(fd: FormData) {
  const user = await requireUser();
  const listingId = String(fd.get('listingId') ?? '');
  const back = `/dashboard/marketplace/${listingId}`;
  if (user.role === 'ADMIN') redirect(`${back}?error=admin`);
  if (!rateLimit(`checkout:${user.id}`, 15, 60 * 1000)) redirect(`${back}?error=slow`);

  const result = await startCheckout({
    userId: user.id,
    listingId,
    quantity: Number(fd.get('qty')) || 1,
    ids: fd.getAll('ids').map(String),
  });
  if (!result.ok) redirect(`${back}?error=${result.error === 'invalid' ? 'stock' : result.error}`);
  revalidatePath('/dashboard', 'layout');
  redirect(`/dashboard/checkout/${result.id}`);
}

export async function submitCheckoutProof(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = String(fd.get('checkoutId') ?? '');
  const bankAccountId = String(fd.get('bankAccountId') ?? '') || null;
  const senderName = String(fd.get('senderName') ?? '').trim().slice(0, 100);
  const file = fd.get('proof');

  if (!senderName) return { error: 'Enter the name on the account you paid from.' };
  if (!(file instanceof File) || file.size === 0) return { error: 'Attach a screenshot of your transfer receipt.' };
  if (file.size > 4 * 1024 * 1024) return { error: 'That image is too large. Use a screenshot under 4 MB.' };
  const buf = Buffer.from(await file.arrayBuffer());
  const type = imageType(buf);
  if (!type) return { error: 'The receipt must be a JPG, PNG or WebP image.' };

  if (!rateLimit(`receipt:${user.id}`, 10, 10 * 60 * 1000)) return { error: 'Too many uploads. Wait a few minutes and try again.' };
  const r = await attachReceipt(user.id, id, { bankAccountId, senderName, proof: new Uint8Array(buf), proofType: type });
  if (!r.ok) return { error: r.error };
  revalidatePath(`/dashboard/checkout/${id}`);
  revalidatePath('/dashboard/orders');
  return { ok: 'Receipt received! We’re confirming your payment. Your logins will appear here and in My orders once approved.' };
}

export async function payWithWallet(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (user.role === 'ADMIN') return { error: 'Admin accounts can’t buy products.' };
  const id = String(fd.get('checkoutId') ?? '');
  const r = await payCheckoutWithWallet(user.id, id);
  if (!r.ok) return { error: r.error };
  revalidatePath('/dashboard', 'layout');
  redirect(`/dashboard/checkout/${id}`);
}

export async function cancelMyCheckout(fd: FormData) {
  const user = await requireUser();
  const id = String(fd.get('checkoutId') ?? '');
  await cancelCheckout(user.id, id);
  revalidatePath('/dashboard', 'layout');
  redirect('/dashboard/orders');
}

// ── Admin ────────────────────────────────────────────

export async function adminApproveCheckout(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    const r = await approveCheckout(String(fd.get('checkoutId') ?? ''));
    revalidatePath('/admin', 'layout');
    return r.ok ? { ok: `Approved. ${r.delivered} login${r.delivered === 1 ? '' : 's'} delivered to the customer.` } : { error: r.error };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not approve.' };
  }
}

export async function adminRejectCheckout(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const reason = String(fd.get('reason') ?? '').trim().slice(0, 300) || 'We couldn’t find this payment.';
  const ok = await rejectCheckout(String(fd.get('checkoutId') ?? ''), reason);
  revalidatePath('/admin', 'layout');
  return ok ? { ok: 'Rejected. The items are back in stock and the customer sees your reason.' } : { error: 'This payment was already handled.' };
}
